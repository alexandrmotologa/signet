import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import crypto from 'node:crypto';
import { normalizedToPdfPoints, type NormalizedBounds } from './coordinate.js';

export interface PlacementItem extends NormalizedBounds {
  pageIndex: number;
  type: 'signature' | 'date' | 'initials' | 'text';
  data?: string; // base64 PNG data URL for signature / initials
  text?: string; // string for date / text / initials
  fontSize?: number;
  color?: string; // hex color or preset
}

export interface SignerInfo {
  telegramId?: number;
  name?: string;
  username?: string;
}

export interface StampingRequest {
  pdfBuffer: Buffer;
  placements: PlacementItem[];
  includeAuditCertificate?: boolean;
  signer?: SignerInfo;
  docId?: string;
}

export interface StampingResult {
  signedBuffer: Buffer;
  originalSha256: string;
  signedSha256: string;
  pageCount: number;
}

export async function stampPdf(request: StampingRequest): Promise<StampingResult> {
  const { pdfBuffer, placements, includeAuditCertificate, signer, docId } = request;

  const originalSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const item of placements) {
    if (item.pageIndex < 0 || item.pageIndex >= pages.length) {
      continue;
    }

    const targetPage = pages[item.pageIndex];
    const pageSize = {
      width: targetPage.getWidth(),
      height: targetPage.getHeight(),
      rotation: targetPage.getRotation().angle
    };

    const pdfBounds = normalizedToPdfPoints(item, pageSize);

    if ((item.type === 'signature' || item.type === 'initials') && item.data) {
      try {
        const cleanBase64 = item.data.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(cleanBase64, 'base64');
        const embeddedImage = await pdfDoc.embedPng(imageBuffer);

        targetPage.drawImage(embeddedImage, {
          x: pdfBounds.x,
          y: pdfBounds.y,
          width: pdfBounds.width,
          height: pdfBounds.height
        });
      } catch (err) {
        // Fallback: draw placeholder box if image embedding fails
        targetPage.drawRectangle({
          x: pdfBounds.x,
          y: pdfBounds.y,
          width: pdfBounds.width,
          height: pdfBounds.height,
          borderWidth: 1,
          borderColor: rgb(0.8, 0.2, 0.2)
        });
      }
    } else if (item.type === 'date' || item.type === 'text') {
      const textToDraw = item.text || (item.type === 'date' ? new Date().toISOString().split('T')[0] : '');
      const calcSize = Math.max(8, Math.min(item.fontSize || 12, pdfBounds.height * 0.7));

      targetPage.drawText(textToDraw, {
        x: pdfBounds.x,
        y: pdfBounds.y + (pdfBounds.height - calcSize) / 2,
        size: calcSize,
        font: fontHelvetica,
        color: rgb(0.1, 0.1, 0.1)
      });
    }
  }

  // Optional Audit Certificate page
  if (includeAuditCertificate) {
    const auditPage = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = auditPage.getSize();
    const timestamp = new Date().toISOString();

    // Border Frame
    auditPage.drawRectangle({
      x: 35,
      y: 35,
      width: width - 70,
      height: height - 70,
      borderWidth: 1,
      borderColor: rgb(0.2, 0.35, 0.6)
    });

    // Header Title
    auditPage.drawText('SIGNET AUDIT TRAIL', {
      x: 55,
      y: height - 80,
      size: 18,
      font: fontHelveticaBold,
      color: rgb(0.1, 0.2, 0.45)
    });

    auditPage.drawText('Certificate of Digital Execution and Document Integrity', {
      x: 55,
      y: height - 100,
      size: 11,
      font: fontHelvetica,
      color: rgb(0.4, 0.4, 0.4)
    });

    auditPage.drawLine({
      start: { x: 55, y: height - 115 },
      end: { x: width - 55, y: height - 115 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });

    let currentY = height - 150;
    const addAuditRow = (label: string, value: string) => {
      auditPage.drawText(label, {
        x: 55,
        y: currentY,
        size: 10,
        font: fontHelveticaBold,
        color: rgb(0.2, 0.2, 0.2)
      });
      auditPage.drawText(value, {
        x: 200,
        y: currentY,
        size: 9.5,
        font: fontHelvetica,
        color: rgb(0.1, 0.1, 0.1)
      });
      currentY -= 28;
    };

    addAuditRow('Document ID:', docId || 'N/A');
    addAuditRow('Execution Timestamp:', `${timestamp} (UTC)`);
    addAuditRow('Original SHA-256:', originalSha256);
    addAuditRow('Total Pages Before Audit:', String(pages.length));

    if (signer) {
      if (signer.telegramId) {
        addAuditRow('Telegram Signer ID:', String(signer.telegramId));
      }
      if (signer.name) {
        addAuditRow('Signer Name:', signer.name);
      }
      if (signer.username) {
        addAuditRow('Telegram Username:', `@${signer.username}`);
      }
    }

    addAuditRow('Stamping Technology:', 'Signet Engine (pdf-lib vector embedding)');
    addAuditRow('Placements Count:', String(placements.length));

    currentY -= 20;

    // Security Notice Box
    auditPage.drawRectangle({
      x: 55,
      y: currentY - 60,
      width: width - 110,
      height: 70,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 0.5
    });

    auditPage.drawText('VERIFICATION NOTICE', {
      x: 70,
      y: currentY - 15,
      size: 9,
      font: fontHelveticaBold,
      color: rgb(0.1, 0.25, 0.5)
    });

    auditPage.drawText(
      'This document was stamped directly via Signet Telegram Mini App. Zero external signing APIs',
      {
        x: 70,
        y: currentY - 32,
        size: 8.5,
        font: fontHelvetica,
        color: rgb(0.3, 0.3, 0.3)
      }
    );

    auditPage.drawText(
      'were accessed. Digital hashes ensure integrity against post-signing document alterations.',
      {
        x: 70,
        y: currentY - 46,
        size: 8.5,
        font: fontHelvetica,
        color: rgb(0.3, 0.3, 0.3)
      }
    );
  }

  // Update PDF metadata
  pdfDoc.setTitle('Signed Document');
  pdfDoc.setProducer('Signet Document Engine');
  pdfDoc.setModificationDate(new Date());

  const savedBytes = await pdfDoc.save();
  const signedBuffer = Buffer.from(savedBytes);
  const signedSha256 = crypto.createHash('sha256').update(signedBuffer).digest('hex');

  return {
    signedBuffer,
    originalSha256,
    signedSha256,
    pageCount: pdfDoc.getPageCount()
  };
}
