import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface SampleDocInfo {
  id: string;
  title: string;
  filename: string;
  pageCount: number;
}

export const SAMPLES_LIST: SampleDocInfo[] = [
  {
    id: 'nda',
    title: 'Mutual Non-Disclosure Agreement',
    filename: 'mutual_nda_sample.pdf',
    pageCount: 2
  },
  {
    id: 'consulting',
    title: 'Independent Consulting Agreement',
    filename: 'consulting_agreement_sample.pdf',
    pageCount: 2
  }
];

export async function generateSamplePdf(sampleId: string): Promise<Buffer> {
  if (sampleId === 'consulting') {
    return await generateConsultingAgreementPdf();
  }
  return await generateNdaPdf();
}

async function generateNdaPdf(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Page 1
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page1.getSize();

  // Header Title
  page1.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
    x: 100,
    y: height - 80,
    size: 16,
    font: timesBold,
    color: rgb(0.1, 0.1, 0.1)
  });

  page1.drawLine({
    start: { x: 50, y: height - 95 },
    end: { x: width - 50, y: height - 95 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7)
  });

  let currentY = height - 130;
  const writeParagraph = (page: typeof page1, text: string, isBold = false, indent = 50, size = 11) => {
    page.drawText(text, {
      x: indent,
      y: currentY,
      size,
      font: isBold ? timesBold : timesRoman,
      color: rgb(0.15, 0.15, 0.15)
    });
    currentY -= 20;
  };

  writeParagraph(page1, 'This Mutual Non-Disclosure Agreement ("Agreement") is made effective as of the date signed.', false);
  currentY -= 10;
  writeParagraph(page1, '1. PARTIES', true);
  writeParagraph(page1, 'Between: ACME Technologies Corp. ("Disclosing Party"), and', false, 70);
  writeParagraph(page1, 'Signer / Contractor ("Receiving Party").', false, 70);
  currentY -= 10;
  writeParagraph(page1, '2. DEFINITION OF CONFIDENTIAL INFORMATION', true);
  writeParagraph(page1, 'Confidential Information includes all non-public technical, business, commercial, financial, and', false);
  writeParagraph(page1, 'operational data disclosed by either party, whether in oral, visual, or written form, including', false);
  writeParagraph(page1, 'source code, API designs, customer lists, architecture diagrams, and product roadmaps.', false);
  currentY -= 10;
  writeParagraph(page1, '3. OBLIGATIONS OF RECEIVING PARTY', true);
  writeParagraph(page1, 'The Receiving Party shall maintain Confidential Information in strict confidence and shall not', false);
  writeParagraph(page1, 'disclose, publish, or copy any portion thereof to third parties without prior written consent.', false);
  writeParagraph(page1, 'The Receiving Party agrees to use reasonable care, at least equal to the degree of care it employs', false);
  writeParagraph(page1, 'to protect its own confidential materials of similar nature.', false);
  currentY -= 10;
  writeParagraph(page1, '4. EXCLUSIONS FROM CONFIDENTIALITY', true);
  writeParagraph(page1, 'Confidential Information does not include information that: (a) is or becomes publicly available', false);
  writeParagraph(page1, 'without breach of this Agreement; (b) is received lawfully from an independent third party; or', false);
  writeParagraph(page1, '(c) is independently developed without reference to the Disclosing Party\'s information.', false);

  page1.drawText('Page 1 of 2', {
    x: width / 2 - 25,
    y: 30,
    size: 10,
    font: timesRoman,
    color: rgb(0.5, 0.5, 0.5)
  });

  // Page 2
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  currentY = height - 80;

  writeParagraph(page2, '5. TERM AND TERMINATION', true);
  writeParagraph(page2, 'This Agreement and the obligations regarding confidentiality remain in effect for a period of', false);
  writeParagraph(page2, 'two (2) years from the date of final signature, or until the information enters the public domain.', false);
  currentY -= 15;
  writeParagraph(page2, '6. GOVERNING LAW AND JURISDICTION', true);
  writeParagraph(page2, 'This Agreement is construed in accordance with and governed by applicable commercial laws.', false);
  writeParagraph(page2, 'Any disputes arising hereunder shall be settled in competent arbitration.', false);
  currentY -= 30;

  writeParagraph(page2, '7. EXECUTION AND SIGNATURES', true);
  writeParagraph(page2, 'IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date', false);
  writeParagraph(page2, 'indicated next to their respective signatures below.', false);

  currentY -= 40;

  // Signature Blocks
  const leftX = 60;
  const rightX = 330;

  // Disclosing Party
  page2.drawText('DISCLOSING PARTY:', { x: leftX, y: currentY, size: 11, font: timesBold });
  page2.drawText('RECEIVING PARTY (SIGNER):', { x: rightX, y: currentY, size: 11, font: timesBold });

  currentY -= 30;
  page2.drawText('ACME Technologies Corp.', { x: leftX, y: currentY, size: 10, font: timesRoman });
  page2.drawText('Authorized Signer Name: _________________', { x: rightX, y: currentY, size: 10, font: timesRoman });

  currentY -= 50;
  page2.drawText('By: _______________________________', { x: leftX, y: currentY, size: 10, font: timesRoman });
  page2.drawText('Signature: ______________________________', { x: rightX, y: currentY, size: 10, font: timesRoman });

  currentY -= 40;
  page2.drawText('Date: _____________________________', { x: leftX, y: currentY, size: 10, font: timesRoman });
  page2.drawText('Date: ___________________________________', { x: rightX, y: currentY, size: 10, font: timesRoman });

  // Border helper for testing
  page2.drawRectangle({
    x: rightX - 10,
    y: currentY - 10,
    width: 215,
    height: 120,
    borderWidth: 0.5,
    borderColor: rgb(0.85, 0.85, 0.85)
  });

  page2.drawText('Page 2 of 2', {
    x: width / 2 - 25,
    y: 30,
    size: 10,
    font: timesRoman,
    color: rgb(0.5, 0.5, 0.5)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function generateConsultingAgreementPdf(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Page 1
  const page1 = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page1.getSize();

  page1.drawText('INDEPENDENT CONSULTING AGREEMENT', {
    x: 90,
    y: height - 80,
    size: 15,
    font: timesBold,
    color: rgb(0.1, 0.1, 0.1)
  });

  page1.drawLine({
    start: { x: 50, y: height - 95 },
    end: { x: width - 50, y: height - 95 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7)
  });

  let currentY = height - 130;
  const writeParagraph = (page: typeof page1, text: string, isBold = false, indent = 50, size = 11) => {
    page.drawText(text, {
      x: indent,
      y: currentY,
      size,
      font: isBold ? timesBold : timesRoman,
      color: rgb(0.15, 0.15, 0.15)
    });
    currentY -= 20;
  };

  writeParagraph(page1, 'This Consulting Agreement is entered into by and between the Client and the Consultant.', false);
  currentY -= 10;
  writeParagraph(page1, '1. SERVICES AND DELIVERABLES', true);
  writeParagraph(page1, 'The Consultant agrees to render software engineering and technical consulting services.', false);
  writeParagraph(page1, 'Deliverables include architecture documents, code implementations, and automated test suites.', false);
  currentY -= 10;
  writeParagraph(page1, '2. COMPENSATION AND EXPENSES', true);
  writeParagraph(page1, 'Client agrees to compensate Consultant according to the agreed hourly or milestone rate.', false);
  writeParagraph(page1, 'Invoices are payable within 14 calendar days upon delivery of invoice.', false);
  currentY -= 10;
  writeParagraph(page1, '3. INTELLECTUAL PROPERTY', true);
  writeParagraph(page1, 'All work product, documentation, and inventions developed under this Agreement become the', false);
  writeParagraph(page1, 'exclusive property of the Client upon receipt of full payment by Consultant.', false);

  page1.drawText('Page 1 of 2', {
    x: width / 2 - 25,
    y: 30,
    size: 10,
    font: timesRoman,
    color: rgb(0.5, 0.5, 0.5)
  });

  // Page 2
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  currentY = height - 80;

  writeParagraph(page2, '4. INDEPENDENT CONTRACTOR RELATIONSHIP', true);
  writeParagraph(page2, 'The relationship between Client and Consultant is strictly that of independent contractor.', false);
  writeParagraph(page2, 'Neither party is an agent, employee, or legal partner of the other.', false);
  currentY -= 15;
  writeParagraph(page2, '5. SIGNATURES AND ACKNOWLEDGEMENT', true);
  writeParagraph(page2, 'The parties agree to all terms stated above as attested by their signatures below.', false);
  currentY -= 50;

  const leftX = 60;
  const rightX = 330;

  page2.drawText('CLIENT:', { x: leftX, y: currentY, size: 11, font: timesBold });
  page2.drawText('CONSULTANT (SIGNER):', { x: rightX, y: currentY, size: 11, font: timesBold });

  currentY -= 30;
  page2.drawText('Client Organization', { x: leftX, y: currentY, size: 10, font: timesRoman });
  page2.drawText('Consultant Full Name: ___________________', { x: rightX, y: currentY, size: 10, font: timesRoman });

  currentY -= 50;
  page2.drawText('By: _______________________________', { x: leftX, y: currentY, size: 10, font: timesRoman });
  page2.drawText('Signature: ______________________________', { x: rightX, y: currentY, size: 10, font: timesRoman });

  currentY -= 40;
  page2.drawText('Date: _____________________________', { x: leftX, y: currentY, size: 10, font: timesRoman });
  page2.drawText('Date: ___________________________________', { x: rightX, y: currentY, size: 10, font: timesRoman });

  page2.drawText('Page 2 of 2', {
    x: width / 2 - 25,
    y: 30,
    size: 10,
    font: timesRoman,
    color: rgb(0.5, 0.5, 0.5)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
