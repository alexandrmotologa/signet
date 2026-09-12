import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { normalizedToPdfPoints } from '../src/pdf/coordinate.js';
import { generateSamplePdf } from '../src/pdf/samples.js';
import { stampPdf } from '../src/pdf/embedder.js';

describe('Coordinate Transformer', () => {
  it('converts normalized coordinates into bottom-left PDF point space', () => {
    const pageSize = { width: 600, height: 800 };
    const bounds = {
      normalizedX: 0.1, // 60 pt
      normalizedY: 0.2, // 160 pt from top
      normalizedWidth: 0.3, // 180 pt
      normalizedHeight: 0.1 // 80 pt
    };

    const points = normalizedToPdfPoints(bounds, pageSize);

    expect(points.x).toBeCloseTo(60);
    expect(points.width).toBeCloseTo(180);
    expect(points.height).toBeCloseTo(80);
    // y should be 800 - 160 - 80 = 560
    expect(points.y).toBeCloseTo(560);
  });

  it('clamps coordinates to boundary limits', () => {
    const pageSize = { width: 500, height: 500 };
    const overflowBounds = {
      normalizedX: -0.5,
      normalizedY: 1.5,
      normalizedWidth: 2.0,
      normalizedHeight: 0.5
    };

    const points = normalizedToPdfPoints(overflowBounds, pageSize);
    expect(points.x).toBeGreaterThanOrEqual(0);
    expect(points.y).toBeGreaterThanOrEqual(0);
    expect(points.x + points.width).toBeLessThanOrEqual(500);
  });
});

describe('Sample PDF Generation', () => {
  it('generates a valid 2-page NDA contract', async () => {
    const buffer = await generateSamplePdf('nda');
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');

    const doc = await PDFDocument.load(buffer);
    expect(doc.getPageCount()).toBe(2);
  });

  it('generates a valid 2-page Consulting Agreement', async () => {
    const buffer = await generateSamplePdf('consulting');
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');

    const doc = await PDFDocument.load(buffer);
    expect(doc.getPageCount()).toBe(2);
  });
});

describe('PDF Stamping Engine', () => {
  // Minimal 1x1 transparent PNG encoded in base64
  const samplePngBase64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  it('bakes signature and date stamps into PDF document', async () => {
    const sampleBuffer = await generateSamplePdf('nda');

    const result = await stampPdf({
      pdfBuffer: sampleBuffer,
      placements: [
        {
          pageIndex: 1,
          normalizedX: 0.55,
          normalizedY: 0.65,
          normalizedWidth: 0.25,
          normalizedHeight: 0.08,
          type: 'signature',
          data: samplePngBase64
        },
        {
          pageIndex: 1,
          normalizedX: 0.55,
          normalizedY: 0.78,
          normalizedWidth: 0.2,
          normalizedHeight: 0.04,
          type: 'date',
          text: '2026-09-12'
        }
      ],
      includeAuditCertificate: false
    });

    expect(result.signedBuffer.length).toBeGreaterThan(0);
    expect(result.originalSha256).not.toBe(result.signedSha256);
    expect(result.pageCount).toBe(2);

    const reloaded = await PDFDocument.load(result.signedBuffer);
    expect(reloaded.getPageCount()).toBe(2);
    expect(reloaded.getTitle()).toBe('Signed Document');
  });

  it('appends an audit trail certificate page with QR code when requested', async () => {
    const sampleBuffer = await generateSamplePdf('consulting');

    const result = await stampPdf({
      pdfBuffer: sampleBuffer,
      placements: [
        {
          pageIndex: 1,
          normalizedX: 0.55,
          normalizedY: 0.65,
          normalizedWidth: 0.25,
          normalizedHeight: 0.08,
          type: 'signature',
          data: samplePngBase64
        }
      ],
      includeAuditCertificate: true,
      signer: {
        telegramId: 10001,
        name: 'Alex Motologa',
        username: 'alex'
      },
      docId: 'test-doc-123'
    });

    // Original had 2 pages, audit page makes it 3 pages
    expect(result.pageCount).toBe(3);

    const reloaded = await PDFDocument.load(result.signedBuffer);
    expect(reloaded.getPageCount()).toBe(3);
  });

  it('draws vector checkmarks, crossmarks, and custom text badges', async () => {
    const sampleBuffer = await generateSamplePdf('nda');

    const result = await stampPdf({
      pdfBuffer: sampleBuffer,
      placements: [
        {
          pageIndex: 0,
          normalizedX: 0.1,
          normalizedY: 0.5,
          normalizedWidth: 0.05,
          normalizedHeight: 0.03,
          type: 'checkmark'
        },
        {
          pageIndex: 0,
          normalizedX: 0.1,
          normalizedY: 0.55,
          normalizedWidth: 0.05,
          normalizedHeight: 0.03,
          type: 'crossmark'
        },
        {
          pageIndex: 0,
          normalizedX: 0.2,
          normalizedY: 0.5,
          normalizedWidth: 0.3,
          normalizedHeight: 0.04,
          type: 'text',
          text: 'Acme Corp Verified Signer'
        }
      ],
      includeAuditCertificate: false
    });

    expect(result.signedBuffer.length).toBeGreaterThan(0);
    const reloaded = await PDFDocument.load(result.signedBuffer);
    expect(reloaded.getPageCount()).toBe(2);
  });
});
