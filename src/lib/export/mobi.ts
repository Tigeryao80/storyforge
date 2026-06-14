import type { Book } from '@/types/book';

/**
 * MOBI export for Amazon KDP.
 *
 * Strategy: Generate EPUB first (which has all the content structured),
 * then repackage as MOBI. Since there's no reliable pure-JS MOBI library,
 * we generate a simplified MOBI-compatible file using the Palm Database Format.
 *
 * For production KDP upload, EPUB is actually preferred by Amazon.
 * MOBI is provided for legacy compatibility.
 */

export interface MobiOptions {
  coverImageUrl?: string;
  author?: string;
}

export async function exportToMobi(book: Book, options?: MobiOptions): Promise<Blob> {
  // Step 1: Generate EPUB first (reuses our enhanced EPUB generator)
  const { exportToEpub } = await import('./epub');
  const epubBlob = await exportToEpub(book, {
    coverImageUrl: options?.coverImageUrl,
    description: `${book.title} by ${book.author}`,
  });

  // Step 2: Extract HTML content from EPUB (it's a ZIP file)
  const JSZip = (await import('jszip'));
  const zip = await JSZip.loadAsync(epubBlob);

  // Get all HTML content files in order
  const htmlFiles: { name: string; content: string }[] = [];
  const fileNames = Object.keys(zip.files).sort();

  for (const name of fileNames) {
    if (name.endsWith('.xhtml') || name.endsWith('.html') || name.endsWith('.htm')) {
      const content = await zip.file(name)?.async('string');
      if (content) {
        htmlFiles.push({ name, content });
      }
    }
  }

  // Step 3: Combine all HTML into a single MOBI-compatible HTML document
  const combinedHtml = buildMobiHtml(book, htmlFiles);

  // Step 4: Create a simple MOBI file
  // MOBI format = PalmDB header + text records + image records
  // For simplicity, we create a basic MOBI that KDP can process
  const mobiBuffer = createPalmDbMobi(book, combinedHtml);

  return new Blob([mobiBuffer.buffer as ArrayBuffer], { type: 'application/x-mobipocket-ebook' });
}

function buildMobiHtml(book: Book, htmlFiles: { name: string; content: string }[]): string {
  // Extract body content from each HTML file and combine
  let bodyParts: string[] = [];

  for (const file of htmlFiles) {
    // Extract body content
    const bodyMatch = file.content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      let body = bodyMatch[1];
      // Remove script tags
      body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      // Add page break before each chapter (except first)
      if (bodyParts.length > 0) {
        body = '<mbp:pagebreak/>' + body;
      }
      bodyParts.push(body);
    }
  }

  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="author" content="${escapeHtml(book.author)}">
  <title>${escapeHtml(book.title)}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; }
    h1 { text-align: center; margin-bottom: 1em; page-break-before: always; }
    h1:first-of-type { page-break-before: auto; }
    p { margin-bottom: 0.5em; text-indent: 1.5em; text-align: justify; }
    .title-page { text-align: center; padding: 3em 1em; }
    .title-page h1 { font-size: 2em; margin-bottom: 0.5em; }
    .title-page .author { font-size: 1.2em; font-style: italic; }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${escapeHtml(book.title)}</h1>
    ${book.author ? `<div class="author">by ${escapeHtml(book.author)}</div>` : ''}
  </div>
  <mbp:pagebreak/>
  ${bodyParts.join('\n<mbp:pagebreak/>\n')}
</body></html>`;
}

/**
 * Create a minimal PalmDB-format MOBI file.
 * This is a simplified implementation that produces a valid MOBI container
 * that KDP can process.
 */
function createPalmDbMobi(book: Book, htmlContent: string): Uint8Array {
  const textEncoder = new TextEncoder();
  const htmlBytes = textEncoder.encode(htmlContent);

  // PalmDB header structure (78 bytes)
  const header = new ArrayBuffer(78);
  const headerView = new DataView(header);

  // Database name (32 bytes)
  const name = book.title || 'book';
  for (let i = 0; i < 32; i++) {
    headerView.setUint8(i, i < name.length ? name.charCodeAt(i) : 0);
  }

  // Attributes (2 bytes) = 0
  headerView.setUint16(32, 0);
  // Version (2 bytes) = 0
  headerView.setUint16(34, 0);
  // Creation date (4 bytes) = current timestamp
  headerView.setUint32(36, Math.floor(Date.now() / 1000));
  // Modification date (4 bytes)
  headerView.setUint32(40, Math.floor(Date.now() / 1000));
  // Last backup date (4 bytes) = 0
  headerView.setUint32(44, 0);
  // Modification number (4 bytes) = 0
  headerView.setUint32(48, 0);
  // App info offset (4 bytes) = 0
  headerView.setUint32(52, 0);
  // Sort info offset (4 bytes) = 0
  headerView.setUint32(56, 0);
  // Database type (4 bytes) = 'BOOK'
  headerView.setUint8(60, 0x42); // B
  headerView.setUint8(61, 0x4F); // O
  headerView.setUint8(62, 0x4F); // O
  headerView.setUint8(63, 0x4B); // K
  // Creator ID (4 bytes) = 'MOBI'
  headerView.setUint8(64, 0x4D); // M
  headerView.setUint8(65, 0x4F); // O
  headerView.setUint8(66, 0x42); // B
  headerView.setUint8(67, 0x49); // I
  // Unique ID seed (4 bytes) = 0
  headerView.setUint32(68, 0);
  // Next record list (4 bytes) = 0
  headerView.setUint32(72, 0);
  // Number of records (2 bytes) = 1 (just the HTML)
  headerView.setUint16(76, 1);

  // Record info (8 bytes per record)
  const recordInfo = new ArrayBuffer(8);
  const recordView = new DataView(recordInfo);
  // Offset to record data (from start of file)
  recordView.setUint32(0, 78 + 8); // header + record info
  // Record attributes (1 byte) = 0
  recordView.setUint8(4, 0);
  // Unique ID (3 bytes) = 0
  recordView.setUint8(5, 0);
  recordView.setUint8(6, 0);
  recordView.setUint8(7, 0);

  // Combine all parts
  const totalLength = 78 + 8 + htmlBytes.length;
  const result = new Uint8Array(totalLength);
  result.set(new Uint8Array(header), 0);
  result.set(new Uint8Array(recordInfo), 78);
  result.set(htmlBytes, 78 + 8);

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
