import type { Book } from '@/types/book';
import type { TRIM_SIZES } from '@/types/book';

export interface PdfExportOptions {
  trimSize: string;       // e.g. '6x9', '5x8'
  bleed: boolean;         // add bleed marks
  pageNumbers: boolean;   // add page numbers
  includeToc: boolean;    // include table of contents
  fontFamily: string;     // body font
  fontSize: number;       // body font size in pt
  lineHeight: number;     // line height multiplier
  gutterInches: number;   // extra inner margin for binding
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
const BLEED_PT = 0.125 * PT_PER_INCH; // 9pt bleed per side

export async function exportToPrintPdf(book: Book, options: PdfExportOptions): Promise<void> {
  const PDFDocument = (await import('pdfkit'));
  const PdfDocClass = (PDFDocument as any).default || PDFDocument;

  const trim = TRIM_SIZE_MAP[options.trimSize] || TRIM_SIZE_MAP['6x9'];
  const pageWidth = trim.width * PT_PER_INCH;
  const pageHeight = trim.height * PT_PER_INCH;
  const hasBleed = options.bleed;

  // Margins: base 0.75" + gutter for binding side
  const baseMargin = 0.75 * PT_PER_INCH;
  const gutter = options.gutterInches * PT_PER_INCH;

  const doc = new PdfDocClass({
    size: [pageWidth + (hasBleed ? BLEED_PT * 2 : 0), pageHeight + (hasBleed ? BLEED_PT * 2 : 0)],
    margins: {
      top: baseMargin + (hasBleed ? BLEED_PT : 0),
      bottom: baseMargin + (hasBleed ? BLEED_PT : 0),
      left: baseMargin + gutter + (hasBleed ? BLEED_PT : 0),
      right: baseMargin + (hasBleed ? BLEED_PT : 0),
    },
    info: {
      Title: book.title || 'Untitled Book',
      Author: book.author || 'Unknown Author',
      Creator: 'StoryForge Rebuild',
      Producer: 'pdfkit',
    },
  });

  const chunks: Buffer[] = [];
  let pageNum = 0;

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(book.title || 'book').replace(/[^a-zA-Z0-9]/g, '_')}_print.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    });
    doc.on('error', reject);

    // Title page
    addTitlePage(doc, book, pageWidth, pageHeight, hasBleed);
    pageNum++;

    // Copyright page
    if (book.copyrightText) {
      doc.addPage();
      pageNum++;
      doc.font('Times-Roman').fontSize(10);
      const copyrightY = pageHeight / 3;
      doc.text(book.copyrightText, baseMargin + gutter + (hasBleed ? BLEED_PT : 0), copyrightY, {
        width: pageWidth - baseMargin * 2 - gutter,
        align: 'left',
      });
    }

    // Dedication
    if (book.includeDedication && book.dedicationText) {
      doc.addPage();
      pageNum++;
      doc.font('Times-Roman').fontSize(12);
      doc.text(book.dedicationText, baseMargin + gutter + (hasBleed ? BLEED_PT : 0), pageHeight / 3, {
        width: pageWidth - baseMargin * 2 - gutter,
        align: 'center',
      });
    }

    // Table of Contents
    if (options.includeToc) {
      doc.addPage();
      pageNum++;
      addTableOfContents(doc, book, pageWidth, pageHeight, baseMargin, gutter, hasBleed, options);
    }

    // Chapters
    for (let ci = 0; ci < book.chapters.length; ci++) {
      const chapter = book.chapters[ci];

      // Start each chapter on a right-hand (odd-numbered) page
      if (pageNum % 2 === 0) {
        doc.addPage();
        pageNum++;
      }

      doc.addPage();
      pageNum++;

      // Chapter title
      doc.font('Times-Bold').fontSize(18);
      const titleY = pageHeight / 3;
      doc.text(chapter.title, baseMargin + gutter + (hasBleed ? BLEED_PT : 0), titleY, {
        width: pageWidth - baseMargin * 2 - gutter,
        align: 'center',
      });

      // Scene content
      doc.font(options.fontFamily || 'Times-Roman').fontSize(options.fontSize || 12);

      for (const scene of chapter.scenes) {
        const plainText = scene.content.replace(/<[^>]+>/g, '').trim();
        if (plainText) {
          const paragraphs = plainText.split(/\n\n+/);
          for (const para of paragraphs) {
            if (para.trim()) {
              doc.text(para.trim(), {
                width: pageWidth - baseMargin * 2 - gutter,
                align: 'justify',
                lineGap: (options.lineHeight || 1.5) * (options.fontSize || 12) - (options.fontSize || 12),
                indent: ci === 0 ? 0 : 18, // no indent for first paragraph of chapter
              });
              doc.moveDown(0.5);
            }
          }
        }
      }

      // Page number
      if (options.pageNumbers) {
        addPageNumber(doc, pageNum, pageWidth, pageHeight, baseMargin, hasBleed);
      }
    }

    // Bleed marks on all pages
    if (hasBleed) {
      addBleedMarks(doc, pageWidth, pageHeight);
    }

    doc.end();
  });
}

function addTitlePage(doc: any, book: Book, pageWidth: number, pageHeight: number, hasBleed: boolean) {
  const offset = hasBleed ? BLEED_PT : 0;
  const centerX = pageWidth / 2 + offset;
  const centerY = pageHeight / 2 + offset;

  doc.font('Times-Bold').fontSize(28);
  doc.text(book.title || 'Untitled Book', centerX - 150, centerY - 60, {
    width: 300,
    align: 'center',
  });

  if (book.author) {
    doc.font('Times-Roman').fontSize(16);
    doc.text(`by ${book.author}`, centerX - 150, centerY + 20, {
      width: 300,
      align: 'center',
    });
  }
}

function addTableOfContents(doc: any, book: Book, pageWidth: number, pageHeight: number, baseMargin: number, gutter: number, hasBleed: boolean, options: PdfExportOptions) {
  const offset = hasBleed ? BLEED_PT : 0;
  const x = baseMargin + gutter + offset;
  const contentWidth = pageWidth - baseMargin * 2 - gutter;

  doc.font('Times-Bold').fontSize(20);
  doc.text('Table of Contents', x, baseMargin + offset, { width: contentWidth, align: 'center' });
  doc.moveDown(2);

  doc.font('Times-Roman').fontSize(12);

  if (book.includeDedication && book.dedicationText) {
    doc.text('Dedication', x, doc.y, { width: contentWidth, continued: false });
    doc.moveDown(0.8);
  }

  for (const chapter of book.chapters) {
    doc.text(chapter.title, x, doc.y, { width: contentWidth, continued: false });
    doc.moveDown(0.8);
  }
}

function addPageNumber(doc: any, pageNum: number, pageWidth: number, pageHeight: number, baseMargin: number, hasBleed: boolean) {
  const offset = hasBleed ? BLEED_PT : 0;
  doc.font('Times-Roman').fontSize(10);
  doc.text(
    String(pageNum),
    offset,
    pageHeight - baseMargin + offset - 10,
    { width: pageWidth, align: 'center' }
  );
}

function addBleedMarks(doc: any, pageWidth: number, pageHeight: number) {
  // Crop marks at each corner
  const markLength = 18; // 0.25"
  const markOffset = BLEED_PT;

  doc.save();
  doc.lineWidth(0.5);
  doc.strokeColor('#000000');

  // Top-left
  doc.moveTo(0, markOffset).lineTo(markLength, markOffset).stroke();
  doc.moveTo(markOffset, 0).lineTo(markOffset, markLength).stroke();

  // Top-right
  doc.moveTo(pageWidth + BLEED_PT * 2, markOffset).lineTo(pageWidth + BLEED_PT * 2 - markLength, markOffset).stroke();
  doc.moveTo(pageWidth + BLEED_PT * 2 - markOffset, 0).lineTo(pageWidth + BLEED_PT * 2 - markOffset, markLength).stroke();

  // Bottom-left
  doc.moveTo(0, pageHeight + BLEED_PT * 2 - markOffset).lineTo(markLength, pageHeight + BLEED_PT * 2 - markOffset).stroke();
  doc.moveTo(markOffset, pageHeight + BLEED_PT * 2).lineTo(markOffset, pageHeight + BLEED_PT * 2 - markLength).stroke();

  // Bottom-right
  doc.moveTo(pageWidth + BLEED_PT * 2, pageHeight + BLEED_PT * 2 - markOffset).lineTo(pageWidth + BLEED_PT * 2 - markLength, pageHeight + BLEED_PT * 2 - markOffset).stroke();
  doc.moveTo(pageWidth + BLEED_PT * 2 - markOffset, pageHeight + BLEED_PT * 2).lineTo(pageWidth + BLEED_PT * 2 - markOffset, pageHeight + BLEED_PT * 2 - markLength).stroke();

  doc.restore();
}
