import type { Book } from '@/types/book';

export async function exportToEpub(book: Book): Promise<Blob> {
  const Epub = (await import('epub-gen-memory')).default;
  const htmlContent = generateHtmlContent(book);

  const epub = new (Epub as any)(
    {
      title: book.title || 'Untitled Book',
      author: book.author || 'Unknown Author',
      publisher: 'Atticus Rebuild',
      content: [
        {
          title: book.title || 'Untitled Book',
          data: htmlContent,
        },
      ],
    },
    {}
  );

  const blob = await epub.genEpub();
  return blob as Blob;
}

function generateHtmlContent(book: Book): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(book.title)}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.8; max-width: 40em; margin: 0 auto; padding: 2em; }
    h1 { text-align: center; margin-bottom: 0.5em; }
    .author { text-align: center; font-style: italic; margin-bottom: 3em; }
    h2 { margin-top: 2em; margin-bottom: 1em; }
    p { margin-bottom: 1em; text-indent: 1.5em; }
    .chapter { page-break-before: always; }
  </style>
</head>
<body>
  <h1>${escapeHtml(book.title)}</h1>
  ${book.author ? `<p class="author">by ${escapeHtml(book.author)}</p>` : ''}
`;

  for (const chapter of book.chapters) {
    html += `  <div class="chapter">\n    <h2>${escapeHtml(chapter.title)}</h2>\n`;
    for (const scene of chapter.scenes) {
      const plainText = scene.content.replace(/<[^>]+>/g, '').trim();
      if (plainText) {
        const paragraphs = plainText.split(/\n\n+/);
        for (const para of paragraphs) {
          if (para.trim()) {
            html += `    <p>${escapeHtml(para)}</p>\n`;
          }
        }
      }
    }
    html += `  </div>\n`;
  }

  html += `</body></html>`;
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
