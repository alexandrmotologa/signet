import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { tempStore } from '../storage/tempStore.js';
import { stampPdf, type PlacementItem } from '../pdf/embedder.js';
import { SAMPLES_LIST, generateSamplePdf } from '../pdf/samples.js';
import { signetBot } from '../bot/bot.js';
import { validateTelegramInitData } from '../security/auth.js';

const placementSchema = z.object({
  pageIndex: z.number().int().min(0),
  normalizedX: z.number().min(0).max(1),
  normalizedY: z.number().min(0).max(1),
  normalizedWidth: z.number().min(0).max(1),
  normalizedHeight: z.number().min(0).max(1),
  type: z.enum(['signature', 'date', 'initials', 'text', 'checkmark', 'crossmark', 'stamp']),
  data: z.string().optional(),
  text: z.string().optional(),
  fontSize: z.number().optional(),
  color: z.string().optional()
});

const signRequestSchema = z.object({
  docId: z.string().uuid(),
  placements: z.array(placementSchema),
  includeAuditCertificate: z.boolean().optional().default(false),
  initData: z.string().optional(),
  signer: z
    .object({
      telegramId: z.number().optional(),
      name: z.string().optional(),
      username: z.string().optional()
    })
    .optional()
});

const exportRequestSchema = z.object({
  signedDocId: z.string().uuid(),
  chatId: z.number(),
  caption: z.string().optional()
});

export const documentRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Health check
  server.get('/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      storage: tempStore.getMetrics(),
      timestamp: new Date().toISOString()
    };
  });

  // List bundled sample documents
  server.get('/api/samples', async () => {
    return SAMPLES_LIST;
  });

  // Prepare a sample document as an active signing session
  server.get('/api/samples/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const sample = SAMPLES_LIST.find((s) => s.id === id);
    if (!sample) {
      return reply.status(404).send({ error: 'Sample document not found' });
    }

    try {
      const buffer = await generateSamplePdf(sample.id);
      const meta = await tempStore.saveDocument(buffer, sample.filename);
      return meta;
    } catch (err) {
      server.log.error(err, 'Failed to generate sample PDF');
      return reply.status(500).send({ error: 'Failed to generate sample document' });
    }
  });

  // Retrieve document metadata
  server.get('/api/document/:id/meta', async (request, reply) => {
    const { id } = request.params as { id: string };
    const meta = tempStore.getDocumentMeta(id);
    if (!meta) {
      return reply.status(404).send({ error: 'Document not found or expired' });
    }
    return meta;
  });

  // Download raw PDF document
  server.get('/api/document/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const doc = await tempStore.getDocument(id);
    if (!doc) {
      return reply.status(404).send({ error: 'Document not found or expired' });
    }

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="${doc.meta.filename}"`);
    return reply.send(doc.buffer);
  });

  // Upload PDF document (multipart or JSON base64)
  server.post('/api/upload', async (request, reply) => {
    try {
      let buffer: Buffer;
      let filename = 'document.pdf';

      if (request.isMultipart()) {
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({ error: 'No file provided in multipart request' });
        }
        filename = data.filename || 'document.pdf';
        buffer = await data.toBuffer();
      } else {
        const body = request.body as { fileBase64?: string; filename?: string };
        if (!body || !body.fileBase64) {
          return reply.status(400).send({ error: 'Missing fileBase64 in request body' });
        }
        if (body.filename) {
          filename = body.filename;
        }
        const cleanBase64 = body.fileBase64.replace(/^data:application\/pdf;base64,/, '');
        buffer = Buffer.from(cleanBase64, 'base64');
      }

      // Validate PDF magic bytes (%PDF-)
      if (buffer.length < 5 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
        return reply.status(400).send({ error: 'The uploaded file is not a valid PDF document.' });
      }

      const meta = await tempStore.saveDocument(buffer, filename);
      return reply.status(201).send(meta);
    } catch (err) {
      server.log.error(err, 'Failed to process document upload');
      return reply.status(500).send({ error: 'Internal error processing document' });
    }
  });

  // Sign and stamp PDF
  server.post('/api/sign', async (request, reply) => {
    const parseResult = signRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid sign request format',
        details: parseResult.error.format()
      });
    }

    const { docId, placements, includeAuditCertificate, initData, signer } = parseResult.data;

    const sourceDoc = await tempStore.getDocument(docId);
    if (!sourceDoc) {
      return reply.status(404).send({ error: 'Source document not found or expired' });
    }

    // Resolve signer profile from validated Telegram initData if available
    let resolvedSigner = signer || {};
    if (initData) {
      const authResult = validateTelegramInitData(initData);
      if (authResult.isValid && authResult.user) {
        resolvedSigner = {
          telegramId: authResult.user.id,
          name: `${authResult.user.first_name} ${authResult.user.last_name || ''}`.trim(),
          username: authResult.user.username
        };
      }
    }

    try {
      const result = await stampPdf({
        pdfBuffer: sourceDoc.buffer,
        placements: placements as PlacementItem[],
        includeAuditCertificate,
        signer: resolvedSigner,
        docId
      });

      const baseName = sourceDoc.meta.filename.replace(/\.pdf$/i, '');
      const signedFilename = `${baseName}_signed.pdf`;
      const signedMeta = await tempStore.saveDocument(result.signedBuffer, signedFilename);

      // Record notarization for verification lookups
      tempStore.saveNotarization({
        originalSha256: result.originalSha256,
        signedSha256: result.signedSha256,
        docId: signedMeta.docId,
        filename: signedMeta.filename,
        pageCount: result.pageCount,
        placementsCount: placements.length,
        signer: resolvedSigner,
        timestamp: new Date().toISOString(),
        hasAuditCertificate: !!includeAuditCertificate
      });

      return {
        signedDocId: signedMeta.docId,
        filename: signedMeta.filename,
        originalSha256: result.originalSha256,
        signedSha256: result.signedSha256,
        pageCount: result.pageCount,
        downloadUrl: `/api/document/${signedMeta.docId}`
      };
    } catch (err) {
      server.log.error(err, 'Failed to stamp PDF document');
      return reply.status(500).send({ error: 'Failed to stamp and save PDF document' });
    }
  });

  // Verify document notarization via SHA-256 hash
  server.get('/api/verify/:hash', async (request, reply) => {
    const { hash } = request.params as { hash: string };
    const record = tempStore.getNotarization(hash);
    if (!record) {
      return reply.status(404).send({
        isVerified: false,
        error: 'No notarization record found for this cryptographic hash'
      });
    }

    return {
      isVerified: true,
      filename: record.filename,
      originalSha256: record.originalSha256,
      signedSha256: record.signedSha256,
      pageCount: record.pageCount,
      placementsCount: record.placementsCount,
      signer: record.signer,
      timestamp: record.timestamp,
      hasAuditCertificate: record.hasAuditCertificate
    };
  });

  // Multi-party signing session: Create
  server.post('/api/sessions/create', async (request, reply) => {
    const sessionCreateSchema = z.object({
      originalDocId: z.string().uuid(),
      filename: z.string().optional(),
      signers: z.array(
        z.object({
          telegramId: z.number().optional(),
          username: z.string().optional(),
          name: z.string()
        })
      ).min(1)
    });

    const parsed = sessionCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid session payload', details: parsed.error.format() });
    }

    const { originalDocId, filename = 'document.pdf', signers } = parsed.data;
    const doc = await tempStore.getDocument(originalDocId);
    if (!doc) {
      return reply.status(404).send({ error: 'Source document not found or expired' });
    }

    const session = tempStore.createMultiPartySession(originalDocId, filename, signers);
    return reply.status(201).send(session);
  });

  // Multi-party signing session: Retrieve status
  server.get('/api/sessions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = tempStore.getMultiPartySession(id);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    return session;
  });

  // Multi-party signing session: Advance with signed document
  server.post('/api/sessions/:id/sign', async (request, reply) => {
    const sessionAdvanceSchema = z.object({
      signedDocId: z.string().uuid(),
      signerIdentifier: z.union([z.string(), z.number()])
    });

    const parsed = sessionAdvanceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid session advance payload' });
    }

    const { signedDocId, signerIdentifier } = parsed.data;
    const session = tempStore.advanceMultiPartySession(
      (request.params as any).id,
      signerIdentifier,
      signedDocId
    );

    if (!session) {
      return reply.status(404).send({ error: 'Session not found or already completed' });
    }

    return session;
  });

  // Export signed document back to Telegram chat
  server.post('/api/export-to-telegram', async (request, reply) => {
    const parseResult = exportRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid export request payload',
        details: parseResult.error.format()
      });
    }

    const { signedDocId, chatId, caption } = parseResult.data;
    const doc = await tempStore.getDocument(signedDocId);
    if (!doc) {
      return reply.status(404).send({ error: 'Signed document not found or expired' });
    }

    try {
      const exportRes = await signetBot.sendSignedDocument(
        chatId,
        doc.buffer,
        doc.meta.filename,
        caption || 'Here is your completed and signed document.'
      );
      return { ok: true, messageId: exportRes.messageId };
    } catch (err: any) {
      server.log.error(err, 'Failed to dispatch document to Telegram');
      return reply.status(500).send({
        error: 'Could not send document to Telegram chat',
        details: err.message
      });
    }
  });
};
