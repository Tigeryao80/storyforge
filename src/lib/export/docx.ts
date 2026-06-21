// src/lib/export/docx.ts

import type { Book } from '@/types/book';

// Dynamic import for docx to avoid TS module issues
async function getDocx() {
  const mod = await import('docx');
  return mod;
}

export async function exportToDocx(book: Book): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await getDocx();

  const children: InstanceType<typeof Paragraph>[] = [];

  // Title page
  children.push(
    new Paragraph({
      text: book.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  if (book.author) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `by ${book.author}`, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
      })
    );
  }

  // Chapters
  for (const chapter of book.chapters) {
    children.push(
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
      })
    );

    for (const scene of chapter.scenes) {
      const plainText = scene.content.replace(/<[^>]+>/g, '').trim();
      if (plainText) {
        const paragraphs = plainText.split(/\n\n+/);
        for (const para of paragraphs) {
          children.push(
            new Paragraph({
              children: [new TextRun(para)],
              spacing: { after: 200 },
            })
          );
        }
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
