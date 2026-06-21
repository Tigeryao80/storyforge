import type { Book } from '@/types/book';

export interface CoverOptions {
  trimSize: string;
  pageCount: number;
  coverImageUrl?: string;
  backCoverBlurb?: string;
  authorBio?: string;
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

export async function exportCoverPdf(book: Book, options: CoverOptions): Promise<Blob> {
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

  return new Promise<Blob>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const blob = new Blob([pdfBuffer.buffer as ArrayBuffer], { type: 'application/pdf' });
      resolve(blob);
    });
    doc.on('error', reject);

    // ── Background ──
    // Full cover background (white)
    doc.save();
    doc.fillColor('#ffffff');
    doc.rect(0, 0, totalWidth, totalHeight).fill();
    doc.restore();

    // Spine background
    if (options.spineColor) {
      doc.save();
      doc.fillColor(options.spineColor);
      const spineX = BLEED_PT + trim.width * PT_PER_INCH;
      doc.rect(spineX, BLEED_PT, spineWidth * PT_PER_INCH, trim.height * PT_PER_INCH).fill();
      doc.restore();
    }

    // ── Front Cover ──
    const frontX = BLEED_PT + trim.width * PT_PER_INCH + spineWidth * PT_PER_INCH;
    const frontWidth = trim.width * PT_PER_INCH;

    // Cover image (if provided)
    if (options.coverImageUrl) {
      try {
        // Try to embed the image
        doc.image(options.coverImageUrl, frontX, BLEED_PT, {
          width: frontWidth,
          height: trim.height * PT_PER_INCH,
          fit: [frontWidth, trim.height * PT_PER_INCH],
        });
      } catch {
        // If image fails to load, fall back to text-only cover
        addFrontCoverText(doc, book, options, frontX, frontWidth, totalHeight);
      }
    } else {
      // Text-only front cover
      addFrontCoverText(doc, book, options, frontX, frontWidth, totalHeight);
    }

    // ── Spine ──
    if (spineWidth * PT_PER_INCH > 36) { // only if spine is wide enough
      doc.save();
      doc.font('Helvetica-Bold').fontSize(10);
      doc.fillColor(options.titleColor || '#000000');
      const spineCenterX = BLEED_PT + trim.width * PT_PER_INCH + (spineWidth * PT_PER_INCH) / 2;
      const spineCenterY = BLEED_PT + (trim.height * PT_PER_INCH) / 2;
      doc.rotate(-90, { origin: [spineCenterX, spineCenterY] });
      doc.text(book.title || '', spineCenterX - 100, spineCenterY - 5, {
        width: 200,
        align: 'center',
      });
      doc.restore();
    }

    // ── Back Cover ──
    const backX = BLEED_PT + 36;
    const backWidth = trim.width * PT_PER_INCH - 72;
    const backTopY = BLEED_PT + totalHeight * 0.15;

    // Back cover blurb
    if (options.backCoverBlurb) {
      doc.save();
      doc.font('Helvetica').fontSize(10);
      doc.fillColor('#333333');
      doc.text(options.backCoverBlurb, backX, backTopY, {
        width: backWidth,
        align: 'left',
        lineGap: 4,
      });
      doc.restore();
    }

    // Author bio (below blurb)
    if (options.authorBio) {
      const bioY = backTopY + 120;
      doc.save();
      doc.font('Helvetica').fontSize(9);
      doc.fillColor('#555555');
      doc.text(options.authorBio, backX, bioY, {
        width: backWidth,
        align: 'left',
        lineGap: 3,
      });
      doc.restore();
    }

    // Barcode placeholder (bottom right of back cover)
    const barcodeX = backX + backWidth - 80;
    const barcodeY = BLEED_PT + totalHeight * 0.75;
    doc.save();
    doc.lineWidth(0.5);
    doc.strokeColor('#999999');
    doc.rect(barcodeX, barcodeY, 72, 36).stroke();
    doc.font('Helvetica').fontSize(6);
    doc.fillColor('#999999');
    doc.text('BARCODE', barcodeX, barcodeY + 40, { width: 72, align: 'center' });
    if (book.isbn) {
      doc.font('Helvetica').fontSize(8);
      doc.text(book.isbn, barcodeX, barcodeY - 12, { width: 72, align: 'center' });
    }
    doc.restore();

    // ── Bleed marks ──
    addCoverBleedMarks(doc, totalWidth, totalHeight);

    doc.end();
  });
}

function addFrontCoverText(doc: any, book: Book, options: CoverOptions, frontX: number, frontWidth: number, totalHeight: number) {
  // Title on front cover
  doc.fillColor(options.titleColor || '#000000');
  doc.font('Helvetica-Bold').fontSize(24);
  doc.text(
    book.title || 'Untitled Book',
    frontX + BLEED_PT + 36,
    BLEED_PT + totalHeight * 0.3,
    { width: frontWidth - 72, align: 'center' }
  );

  // Subtitle
  if (book.subtitle) {
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(14);
    doc.fillColor('#555555');
    doc.text(book.subtitle, frontX + BLEED_PT + 36, doc.y, {
      width: frontWidth - 72,
      align: 'center',
    });
  }

  // Author on front cover
  if (book.author) {
    doc.moveDown(1.5);
    doc.font('Helvetica').fontSize(14);
    doc.fillColor(options.authorColor || '#333333');
    doc.text(
      book.author,
      frontX + BLEED_PT + 36,
      doc.y,
      { width: frontWidth - 72, align: 'center' }
    );
  }
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
