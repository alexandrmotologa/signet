import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { config } from '../config.js';
import { normalizedToPdfPoints, type NormalizedBounds } from './coordinate.js';

export interface PlacementItem extends NormalizedBounds {
  pageIndex: number;
  type: 'signature' | 'date' | 'initials' | 'text' | 'checkmark' | 'crossmark' | 'stamp';
  data?: string; // base64 PNG data URL for signature / initials / stamp
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

    if ((item.type === 'signature' || item.type === 'initials' || item.type === 'stamp') && item.data) {
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
    } else if (item.type === 'checkmark') {
      // Vector checkmark (✓)
      const x1 = pdfBounds.x + pdfBounds.width * 0.15;
      const y1 = pdfBounds.y + pdfBounds.height * 0.45;
      const x2 = pdfBounds.x + pdfBounds.width * 0.42;
      const y2 = pdfBounds.y + pdfBounds.height * 0.18;
      const x3 = pdfBounds.x + pdfBounds.width * 0.85;
      const y3 = pdfBounds.y + pdfBounds.height * 0.85;

      const checkColor = item.color === 'blue' ? rgb(0.1, 0.3, 0.8) : rgb(0.05, 0.55, 0.25);
      const thickness = Math.max(1.5, pdfBounds.width * 0.08);

      targetPage.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness,
        color: checkColor
      });
      targetPage.drawLine({
        start: { x: x2, y: y2 },
        end: { x: x3, y: y3 },
        thickness,
        color: checkColor
      });
    } else if (item.type === 'crossmark') {
      // Vector crossmark (✗)
      const crossColor = item.color === 'black' ? rgb(0.15, 0.15, 0.15) : rgb(0.85, 0.2, 0.2);
      const thickness = Math.max(1.5, pdfBounds.width * 0.08);

      targetPage.drawLine({
        start: {
          x: pdfBounds.x + pdfBounds.width * 0.2,
          y: pdfBounds.y + pdfBounds.height * 0.2
        },
        end: {
          x: pdfBounds.x + pdfBounds.width * 0.8,
          y: pdfBounds.y + pdfBounds.height * 0.8
        },
        thickness,
        color: crossColor
      });
      targetPage.drawLine({
        start: {
          x: pdfBounds.x + pdfBounds.width * 0.2,
          y: pdfBounds.y + pdfBounds.height * 0.8
        },
        end: {
          x: pdfBounds.x + pdfBounds.width * 0.8,
          y: pdfBounds.y + pdfBounds.height * 0.2
        },
        thickness,
        color: crossColor
      });
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

    // Security Notice Box with QR Code
    const boxHeight = 85;
    auditPage.drawRectangle({
      x: 55,
      y: currentY - boxHeight,
      width: width - 110,
      height: boxHeight,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 0.5
    });

    // Generate Verification QR Code
    try {
      const verifyUrl = `${config.webAppUrl}/verify/${originalSha256}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 140,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      const cleanQr = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const qrImage = await pdfDoc.embedPng(Buffer.from(cleanQr, 'base64'));

      const qrSize = 65;
      const qrX = width - 55 - qrSize - 12;
      const qrY = currentY - boxHeight + 10;

      auditPage.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize
      });

      auditPage.drawText('SCAN TO VERIFY', {
        x: qrX - 2,
        y: qrY - 8,
        size: 6.5,
        font: fontHelveticaBold,
        color: rgb(0.3, 0.4, 0.6)
      });
    } catch (err) {
      console.warn('[embedder] Failed to generate QR code for audit page:', err);
    }

    auditPage.drawText('CRYPTOGRAPHIC VERIFICATION NOTICE', {
      x: 70,
      y: currentY - 18,
      size: 9,
      font: fontHelveticaBold,
      color: rgb(0.1, 0.25, 0.5)
    });

    auditPage.drawText(
      'This document was executed via Signet Telegram Mini App. Digital SHA-256 digests',
      {
        x: 70,
        y: currentY - 35,
        size: 8,
        font: fontHelvetica,
        color: rgb(0.3, 0.3, 0.3)
      }
    );

    auditPage.drawText(
      'ensure integrity against post-signing document alterations. Scan the QR code or visit',
      {
        x: 70,
        y: currentY - 48,
        size: 8,
        font: fontHelvetica,
        color: rgb(0.3, 0.3, 0.3)
      }
    );

    auditPage.drawText(
      `${config.webAppUrl}/verify/${originalSha256.substring(0, 16)}... to verify notarization details.`,
      {
        x: 70,
        y: currentY - 61,
        size: 7.5,
        font: fontHelveticaBold,
        color: rgb(0.15, 0.3, 0.6)
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
