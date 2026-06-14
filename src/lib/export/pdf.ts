import PDFDocument from 'pdfkit';
import type { Book } from '@/types/book';

export async function exportToPdf(book: Book): Promise<void> {
  const doc = new (PDFDocument as any)({ margin: 72 });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title || 'book'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    });
    doc.on('error', reject);

    // Title page
    doc.fontSize(24).font('Helvetica-Bold').text(book.title || 'Untitled Book', { align: 'center' });
    if (book.author) {
      doc.moveDown();
      doc.fontSize(14).font('Helvetica').text(`by ${book.author}`, { align: 'center' });
    }
    doc.addPage();

    // Chapters
    for (let ci = 0; ci < book.chapters.length; ci++) {
      const chapter = book.chapters[ci];
      doc.fontSize(18).font('Helvetica-Bold').text(chapter.title);
      doc.moveDown();

      for (const scene of chapter.scenes) {
        const plainText = scene.content.replace(/<[^>]+>/g, '').trim();
        if (plainText) {
          doc.fontSize(12).font('Times-Roman').text(plainText, { indent: 30, align: 'justify' });
          doc.moveDown();
        }
      }

      if (ci < book.chapters.length - 1) {
        doc.addPage();
      }
    }

    doc.end();
  });
}
