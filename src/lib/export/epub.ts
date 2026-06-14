import type { Book } from '@/types/book';

export interface EpubOptions {
  coverImageUrl?: string;
  isbn?: string;
  description?: string;
  language?: string;
}

export async function exportToEpub(book: Book, options?: EpubOptions): Promise<Blob> {
  const Epub = (await import('epub-gen-memory')).default;

  const contents: any[] = [];

  // Title page
  contents.push({
    title: 'Title Page',
    data: `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"><title>${escapeHtml(book.title)}</title>
<style>
  body { font-family: Georgia, serif; text-align: center; padding: 3em 1em; }
  .title { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }
  .author { font-size: 1.2em; font-style: italic; margin-bottom: 2em; }
  .copyright { font-size: 0.85em; color: #666; margin-top: 3em; }
</style>
</head>
<body>
  <div class="title">${escapeHtml(book.title)}</div>
  ${book.author ? `<div class="author">by ${escapeHtml(book.author)}</div>` : ''}
  ${book.copyrightText ? `<div class="copyright">${escapeHtml(book.copyrightText).replace(/\n/g, '<br/>')}</div>` : ''}
</body></html>`,
  });

  // Dedication page
  if (book.includeDedication && book.dedicationText) {
    contents.push({
      title: 'Dedication',
      data: `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"><title>Dedication</title>
<style>
  body { font-family: Georgia, serif; text-align: center; padding: 4em 2em; font-style: italic; }
</style>
</head>
<body>${escapeHtml(book.dedicationText).replace(/\n/g, '<br/>')}</body></html>`,
    });
  }

  // Table of Contents page (HTML TOC for NCX)
  let tocHtml = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"><title>Table of Contents</title>
<style>
  body { font-family: Georgia, serif; padding: 2em; }
  h1 { text-align: center; margin-bottom: 1em; }
  ol { list-style-type: none; padding-left: 0; }
  li { margin-bottom: 0.5em; }
  a { text-decoration: none; color: #333; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
  <h1>Table of Contents</h1>
  <ol>`;

  if (book.includeDedication && book.dedicationText) {
    tocHtml += `\n    <li><a href="dedication.xhtml">Dedication</a></li>`;
  }
  for (const chapter of book.chapters) {
    const slug = `chapter-${chapter.order}`;
    tocHtml += `\n    <li><a href="${slug}.xhtml">${escapeHtml(chapter.title)}</a></li>`;
  }
  tocHtml += `\n  </ol>\n</body></html>`;

  if (book.includeToc) {
    contents.push({ title: 'Table of Contents', data: tocHtml });
  }

  // Parts
  for (const part of book.parts) {
    // Part divider page
    contents.push({
      title: part.title,
      data: `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"><title>${escapeHtml(part.title)}</title>
<style>
  body { font-family: Georgia, serif; text-align: center; padding: 4em 2em; }
  .part-title { font-size: 1.8em; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; }
</style>
</head>
<body><div class="part-title">${escapeHtml(part.title)}</div></body></html>`,
    });

    // Chapters in part
    for (const chapter of part.chapters) {
      contents.push(generateChapterContent(chapter));
    }
  }

  // Flat chapters (backward compat)
  for (const chapter of book.chapters) {
    contents.push(generateChapterContent(chapter));
  }

  const epub = new (Epub as any)(
    {
      title: book.title || 'Untitled Book',
      author: book.author || 'Unknown Author',
      publisher: 'StoryForge Rebuild',
      description: options?.description || '',
      lang: options?.language || 'en',
      isbn: options?.isbn || '',
      cover: options?.coverImageUrl || '',
      tocTitle: 'Table of Contents',
      tocInTOC: true,
      numberChaptersInTOC: true,
      content: contents,
    },
    {}
  );

  const blob = await epub.genEpub();
  return blob as Blob;
}

function generateChapterContent(chapter: { id: string; title: string; scenes: { content: string; wordCount: number; order: number; title: string }[]; order: number }): { title: string; data: string } {
  const slug = `chapter-${chapter.order}`;
  let bodyHtml = '';

  for (const scene of chapter.scenes) {
    const plainText = scene.content.replace(/<[^>]+>/g, '').trim();
    if (plainText) {
      const paragraphs = plainText.split(/\n\n+/);
      for (const para of paragraphs) {
        if (para.trim()) {
          bodyHtml += `    <p>${escapeHtml(para)}</p>\n`;
        }
      }
    }
  }

  if (!bodyHtml) {
    bodyHtml = '    <p>Start writing...</p>\n';
  }

  return {
    title: chapter.title,
    data: `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"><title>${escapeHtml(chapter.title)}</title>
<style>
  body { font-family: Georgia, serif; line-height: 1.8; padding: 1em 2em; }
  h1 { text-align: center; margin-bottom: 1.5em; font-size: 1.5em; }
  p { margin-bottom: 0.8em; text-indent: 1.5em; text-align: justify; }
  p:first-of-type { text-indent: 0; }
</style>
</head>
<body>
  <h1>${escapeHtml(chapter.title)}</h1>
${bodyHtml}</body></html>`,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
