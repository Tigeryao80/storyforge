import type { Book } from '@/types/book';

export interface PdfExportOptions {
  trimSize: string;       // e.g. '6x9', '5x8'
  bleed: boolean;         // add bleed marks
  pageNumbers: boolean;   // add page numbers
  includeToc: boolean;    // include table of contents
  fontFamily: string;     // body font
  fontSize: number;       // body font size in pt
  lineHeight: number;     // line height multiplier
  gutterInches: number;   // extra inner margin for binding
  // Running headers/footers
  runningHeader: boolean; // show running header (book title left, chapter title right)
  runningFooter: boolean; // show running footer (page number centered)
  differentFirstPage: boolean; // no header/footer on chapter first pages
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
  const headerFooterSpace = 36; // 0.5" for header/footer area

  const doc = new PdfDocClass({
    size: [pageWidth + (hasBleed ? BLEED_PT * 2 : 0), pageHeight + (hasBleed ? BLEED_PT * 2 : 0)],
    margins: {
      top: baseMargin + (options.runningHeader ? headerFooterSpace : 0) + (hasBleed ? BLEED_PT : 0),
      bottom: baseMargin + (options.runningFooter ? headerFooterSpace : 0) + (hasBleed ? BLEED_PT : 0),
      left: baseMargin + gutter + (hasBleed ? BLEED_PT : 0),
      right: baseMargin + (hasBleed ? BLEED_PT : 0),
    },
    info: {
      Title: book.title || 'Untitled Book',
      Author: book.author || 'Unknown Author',
      Creator: 'StoryForge v0.9.0',
      Producer: 'pdfkit',
    },
  });

  const chunks: Buffer[] = [];
  let pageNum = 0;
  let isFirstPageOfChapter = true;

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

    // ── Front Matter ──

    // Title page
    addTitlePage(doc, book, pageWidth, pageHeight, hasBleed);
    pageNum++;

    // Copyright page
    if (book.copyrightText) {
      doc.addPage();
      pageNum++;
      addCopyrightPage(doc, book, pageWidth, pageHeight, baseMargin, gutter, hasBleed);
    }

    // Dedication
    if (book.includeDedication && book.dedicationText) {
      doc.addPage();
      pageNum++;
      addDedicationPage(doc, book, pageWidth, pageHeight, baseMargin, gutter, hasBleed);
    }

    // Table of Contents
    if (options.includeToc) {
      doc.addPage();
      pageNum++;
      addTableOfContents(doc, book, pageWidth, pageHeight, baseMargin, gutter, hasBleed, options);
    }

    // ── Chapters ──
    for (let ci = 0; ci < book.chapters.length; ci++) {
      const chapter = book.chapters[ci];

      // Start each chapter on a right-hand (odd-numbered) page
      if (pageNum % 2 === 0) {
        doc.addPage();
        pageNum++;
      }

      doc.addPage();
      pageNum++;
      isFirstPageOfChapter = true;

      // Chapter title page (no running header if differentFirstPage)
      addChapterTitle(doc, chapter, pageWidth, pageHeight, baseMargin, gutter, hasBleed);

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
                indent: 18,
              });
              doc.moveDown(0.5);
            }
          }
        }
      }

      // Running header/footer for this chapter
      if (options.runningHeader || options.runningFooter) {
        // We'll add headers/footers via pageAdded event
        // For now, add page number on last page
        if (options.pageNumbers && options.runningFooter) {
          addPageNumber(doc, pageNum, pageWidth, pageHeight, baseMargin, hasBleed);
        }
      } else if (options.pageNumbers) {
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
  const titleY = pageHeight * 0.35 + offset;

  // Title
  doc.font('Times-Bold').fontSize(28);
  doc.text(book.title || 'Untitled Book', centerX - 180, titleY, {
    width: 360,
    align: 'center',
  });

  // Subtitle
  if (book.subtitle) {
    doc.moveDown(0.5);
    doc.font('Times-Roman').fontSize(16);
    doc.text(book.subtitle, centerX - 180, doc.y, {
      width: 360,
      align: 'center',
    });
  }

  // Author
  if (book.author) {
    doc.moveDown(2);
    doc.font('Times-Roman').fontSize(16);
    doc.text(`by ${book.author}`, centerX - 180, doc.y, {
      width: 360,
      align: 'center',
    });
  }

  // Series info
  if (book.seriesName) {
    doc.moveDown(1);
    doc.font('Times-Roman').fontSize(12);
    const seriesText = book.seriesNumber
      ? `${book.seriesName} — Book ${book.seriesNumber}`
      : book.seriesName;
    doc.text(seriesText, centerX - 180, doc.y, {
      width: 360,
      align: 'center',
    });
  }
}

function addCopyrightPage(doc: any, book: Book, pageWidth: number, pageHeight: number, baseMargin: number, gutter: number, hasBleed: boolean) {
  const offset = hasBleed ? BLEED_PT : 0;
  const x = baseMargin + gutter + offset;
  const contentWidth = pageWidth - baseMargin * 2 - gutter;
  const y = pageHeight * 0.15 + offset;

  doc.font('Times-Roman').fontSize(10);

  const lines: string[] = [];
  lines.push(`Copyright © ${new Date().getFullYear()} ${book.author || 'Author'}`);
  lines.push('');
  lines.push('All rights reserved. No part of this publication may be reproduced,');
  lines.push('distributed, or transmitted in any form or by any means without the');
  lines.push('prior written permission of the publisher.');
  lines.push('');
  if (book.isbn) {
    lines.push(`ISBN: ${book.isbn}`);
    lines.push('');
  }
  lines.push('All characters and events in this book are fictional.');
  lines.push('Any resemblance to real persons, living or dead, is coincidental.');
  lines.push('');
  lines.push('Cover design by author.');
  lines.push('Interior design by StoryForge.');

  for (const line of lines) {
    doc.text(line, x, doc.y, { width: contentWidth, align: 'left' });
    if (line === '') doc.moveDown(0.3);
  }
}

function addDedicationPage(doc: any, book: Book, pageWidth: number, pageHeight: number, baseMargin: number, gutter: number, hasBleed: boolean) {
  const offset = hasBleed ? BLEED_PT : 0;
  const x = baseMargin + gutter + offset;
  const contentWidth = pageWidth - baseMargin * 2 - gutter;

  doc.font('Times-Roman').fontSize(12);
  doc.text(book.dedicationText || '', x, pageHeight * 0.35 + offset, {
    width: contentWidth,
    align: 'center',
  });
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

function addChapterTitle(doc: any, chapter: { title: string }, pageWidth: number, pageHeight: number, baseMargin: number, gutter: number, hasBleed: boolean) {
  const offset = hasBleed ? BLEED_PT : 0;
  const x = baseMargin + gutter + offset;
  const contentWidth = pageWidth - baseMargin * 2 - gutter;
  const titleY = pageHeight * 0.35 + offset;

  doc.font('Times-Bold').fontSize(22);
  doc.text(chapter.title, x, titleY, {
    width: contentWidth,
    align: 'center',
  });
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
