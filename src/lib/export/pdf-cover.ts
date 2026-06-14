import type { Book } from '@/types/book';

export interface CoverOptions {
  trimSize: string;
  pageCount: number;
  coverImageUrl?: string;
  spineColor?: string;
  titleColor?: string;
  authorColor?: string;
}

const TRIM_SIZE_MAP: Record<string, { width: number; height: number }> = {
  '5x8': { width: 5, height: 8 },
  '5.25x8': { width: 5.25, height: 8 },
  '5.5x8.5': { width: 5.5, height: 8.5 },
  '6x9': { width: 6, height: 9 },
  '6.14x9.21': { width: 6.14, height: 9.21 },
  '7x10': { width: 7, height: 10 },
  '8x10': { width: 8, height: 10 },
  '8.5x11': { width: 8.5, height: 11 },
};

const PT_PER_INCH = 72;
const BLEED_PT = 0.125 * PT_PER_INCH;
// Spine width: 0.002252" per page for B&W interior (KDP standard)
const SPINE_WIDTH_PER_PAGE = 0.002252;

export function calculateSpineWidth(pageCount: number): number {
  return pageCount * SPINE_WIDTH_PER_PAGE; // in inches
}

export async function exportCoverPdf(book: Book, options: CoverOptions): Promise<void> {
  const PDFDocument = (await import('pdfkit'));
  const PdfDocClass = (PDFDocument as any).default || PDFDocument;

  const trim = TRIM_SIZE_MAP[options.trimSize] || TRIM_SIZE_MAP['6x9'];
  const spineWidth = calculateSpineWidth(options.pageCount);

  // Full cover = back + spine + front (left to right in PDF)
  const totalWidth = (trim.width * 2 + spineWidth) * PT_PER_INCH + BLEED_PT * 2;
  const totalHeight = trim.height * PT_PER_INCH + BLEED_PT * 2;

  const doc = new PdfDocClass({
    size: [totalWidth, totalHeight],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const blob = new Blob([pdfBuffer.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(book.title || 'book').replace(/[^a-zA-Z0-9]/g, '_')}_cover.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    });
    doc.on('error', reject);

    // Background (spine color or white)
    if (options.spineColor) {
      doc.save();
      doc.fillColor(options.spineColor);
      const spineX = BLEED_PT + trim.width * PT_PER_INCH;
      doc.rect(spineX, BLEED_PT, spineWidth * PT_PER_INCH, trim.height * PT_PER_INCH).fill();
      doc.restore();
    }

    // Front cover area
    const frontX = BLEED_PT + trim.width * PT_PER_INCH + spineWidth * PT_PER_INCH;

    // Title on front cover
    doc.fillColor(options.titleColor || '#000000');
    doc.font('Helvetica-Bold').fontSize(24);
    doc.text(
      book.title || 'Untitled Book',
      frontX + BLEED_PT + 36,
      BLEED_PT + totalHeight * 0.3,
      { width: trim.width * PT_PER_INCH - 72, align: 'center' }
    );

    // Author on front cover
    if (book.author) {
      doc.font('Helvetica').fontSize(14);
      doc.fillColor(options.authorColor || '#333333');
      doc.text(
        book.author,
        frontX + BLEED_PT + 36,
        doc.y + 20,
        { width: trim.width * PT_PER_INCH - 72, align: 'center' }
      );
    }

    // Spine text (rotated)
    if (spineWidth * PT_PER_INCH > 36) { // only if spine is wide enough
      doc.save();
      doc.font('Helvetica-Bold').fontSize(10);
      doc.fillColor(options.titleColor || '#000000');
      // Rotate and position spine text
      const spineCenterX = BLEED_PT + trim.width * PT_PER_INCH + (spineWidth * PT_PER_INCH) / 2;
      const spineCenterY = BLEED_PT + (trim.height * PT_PER_INCH) / 2;
      doc.rotate(-90, { origin: [spineCenterX, spineCenterY] });
      doc.text(book.title || '', spineCenterX - 100, spineCenterY - 5, {
        width: 200,
        align: 'center',
      });
      doc.restore();
    }

    // Back cover - barcode placeholder
    const backX = BLEED_PT + 36;
    const backY = BLEED_PT + totalHeight * 0.7;
    doc.save();
    doc.lineWidth(0.5);
    doc.strokeColor('#999999');
    doc.rect(backX, backY, 72, 36).stroke();
    doc.font('Helvetica').fontSize(6);
    doc.fillColor('#999999');
    doc.text('BARCODE', backX, backY + 40, { width: 72, align: 'center' });
    doc.restore();

    // Bleed marks
    addCoverBleedMarks(doc, totalWidth, totalHeight);

    doc.end();
  });
}

function addCoverBleedMarks(doc: any, totalWidth: number, totalHeight: number) {
  const markLength = 18;
  doc.save();
  doc.lineWidth(0.5);
  doc.strokeColor('#000000');

  // Four corners
  const corners = [
    [0, 0],
    [totalWidth, 0],
    [0, totalHeight],
    [totalWidth, totalHeight],
  ];

  for (const [cx, cy] of corners) {
    const dx1 = cx === 0 ? 1 : -1;
    const dy1 = cy === 0 ? 1 : -1;
    doc.moveTo(cx, cy + dy1 * BLEED_PT).lineTo(cx + dx1 * markLength, cy + dy1 * BLEED_PT).stroke();
    doc.moveTo(cx + dx1 * BLEED_PT, cy).lineTo(cx + dx1 * BLEED_PT, cy + dy1 * markLength).stroke();
  }

  doc.restore();
}
