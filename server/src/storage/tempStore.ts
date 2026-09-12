import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { config } from '../config.js';

export interface PageDimension {
  pageIndex: number;
  width: number;
  height: number;
}

export interface DocumentMeta {
  docId: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  pages: PageDimension[];
  sha256: string;
  createdAt: string;
  expiresAt: string;
}

export interface NotarizationRecord {
  originalSha256: string;
  signedSha256: string;
  docId: string;
  filename: string;
  pageCount: number;
  placementsCount: number;
  signer?: {
    telegramId?: number;
    name?: string;
    username?: string;
  };
  timestamp: string;
  hasAuditCertificate: boolean;
}

export interface MultiPartySigner {
  id: string;
  telegramId?: number;
  username?: string;
  name: string;
  status: 'pending' | 'signed';
  signedAt?: string;
  signedDocId?: string;
}

export interface MultiPartySession {
  sessionId: string;
  originalDocId: string;
  currentDocId: string;
  filename: string;
  signers: MultiPartySigner[];
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
  finalDocId?: string;
}

class TempStore {
  private metaIndex = new Map<string, DocumentMeta>();
  private notarizationIndex = new Map<string, NotarizationRecord>();
  private sessionsIndex = new Map<string, MultiPartySession>();
  private storageDir: string;
  private readonly ttlMs = 60 * 60 * 1000; // 1 hour TTL
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.storageDir = path.resolve(config.storageDir);
    if (!fsSync.existsSync(this.storageDir)) {
      fsSync.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public async saveDocument(buffer: Buffer, filename: string): Promise<DocumentMeta> {
    const docId = crypto.randomUUID();
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Parse PDF to extract page metrics
    let pageCount = 1;
    const pages: PageDimension[] = [];
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      pageCount = pdfDoc.getPageCount();
      for (let i = 0; i < pageCount; i++) {
        const page = pdfDoc.getPage(i);
        pages.push({
          pageIndex: i,
          width: page.getWidth(),
          height: page.getHeight()
        });
      }
    } catch {
      // Fallback defaults if parsing fails
      pages.push({ pageIndex: 0, width: 595.28, height: 841.89 });
    }

    const now = new Date();
    const expires = new Date(now.getTime() + this.ttlMs);

    const meta: DocumentMeta = {
      docId,
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      fileSize: buffer.length,
      pageCount,
      pages,
      sha256,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    };

    const filePath = this.getFilePath(docId);
    await fs.writeFile(filePath, buffer);
    this.metaIndex.set(docId, meta);

    return meta;
  }

  public async getDocument(docId: string): Promise<{ buffer: Buffer; meta: DocumentMeta } | null> {
    const meta = this.metaIndex.get(docId);
    if (!meta) {
      return null;
    }

    const filePath = this.getFilePath(docId);
    try {
      const buffer = await fs.readFile(filePath);
      return { buffer, meta };
    } catch {
      this.metaIndex.delete(docId);
      return null;
    }
  }

  public getDocumentMeta(docId: string): DocumentMeta | null {
    return this.metaIndex.get(docId) || null;
  }

  public hasDocument(docId: string): boolean {
    return this.metaIndex.has(docId);
  }

  public async deleteDocument(docId: string): Promise<boolean> {
    this.metaIndex.delete(docId);
    const filePath = this.getFilePath(docId);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  public async cleanExpired(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [docId, meta] of this.metaIndex.entries()) {
      if (new Date(meta.expiresAt).getTime() <= now) {
        await this.deleteDocument(docId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  public startCleanupScheduler(intervalMs = 10 * 60 * 1000): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanExpired().catch(() => {});
    }, intervalMs);
  }

  public stopCleanupScheduler(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  public saveNotarization(record: NotarizationRecord): void {
    this.notarizationIndex.set(record.signedSha256.toLowerCase(), record);
    this.notarizationIndex.set(record.originalSha256.toLowerCase(), record);
  }

  public getNotarization(sha256: string): NotarizationRecord | null {
    return this.notarizationIndex.get(sha256.toLowerCase()) || null;
  }

  public createMultiPartySession(
    originalDocId: string,
    filename: string,
    signersList: { telegramId?: number; username?: string; name: string }[]
  ): MultiPartySession {
    const sessionId = crypto.randomUUID();
    const signers: MultiPartySigner[] = signersList.map((s, idx) => ({
      id: crypto.randomUUID(),
      telegramId: s.telegramId,
      username: s.username?.replace(/^@/, ''),
      name: s.name || `Signer ${idx + 1}`,
      status: 'pending'
    }));

    const session: MultiPartySession = {
      sessionId,
      originalDocId,
      currentDocId: originalDocId,
      filename,
      signers,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.sessionsIndex.set(sessionId, session);
    return session;
  }

  public getMultiPartySession(sessionId: string): MultiPartySession | null {
    return this.sessionsIndex.get(sessionId) || null;
  }

  public advanceMultiPartySession(
    sessionId: string,
    signerIdentifier: string | number, // id, username, or telegramId
    newSignedDocId: string
  ): MultiPartySession | null {
    const session = this.sessionsIndex.get(sessionId);
    if (!session) return null;

    const signer = session.signers.find(
      (s) =>
        s.id === signerIdentifier ||
        (s.telegramId && s.telegramId === Number(signerIdentifier)) ||
        (s.username && s.username.toLowerCase() === String(signerIdentifier).toLowerCase().replace(/^@/, ''))
    );

    if (signer && signer.status !== 'signed') {
      signer.status = 'signed';
      signer.signedAt = new Date().toISOString();
      signer.signedDocId = newSignedDocId;
      session.currentDocId = newSignedDocId;

      const allSigned = session.signers.every((s) => s.status === 'signed');
      if (allSigned) {
        session.status = 'completed';
        session.completedAt = new Date().toISOString();
        session.finalDocId = newSignedDocId;
      } else {
        session.status = 'in_progress';
      }
    }

    return session;
  }

  public getMetrics(): { activeDocuments: number; activeSessions: number; storageDir: string } {
    return {
      activeDocuments: this.metaIndex.size,
      activeSessions: this.sessionsIndex.size,
      storageDir: this.storageDir
    };
  }

  private getFilePath(docId: string): string {
    return path.join(this.storageDir, `${docId}.pdf`);
  }
}

export const tempStore = new TempStore();
