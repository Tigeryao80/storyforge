// src/app/api/export/route.ts
// Server-only API route for book exports.
// Runs on the server where Node 'fs' is available, so epub-gen-memory,
// pdfkit, etc. work without client-side bundling issues.

import type { Book } from '@/types/book';
import { requireAuth, requireRole } from '@/lib/api/auth';
import { z } from 'zod';

const ExportBodySchema = z.object({
  book: z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(500),
  }).passthrough(),
  format: z.enum(['epub', 'mobi', 'docx', 'pdf', 'cover']),
  options: z.record(z.string(), z.unknown()).optional(),
});

type ExportBody = z.infer<typeof ExportBodySchema>;

const MAX_BODY_SIZE = 50 * 1024 * 1024; // 50MB

const CONTENT_TYPES: Record<string, string> = {
  epub: 'application/epub+zip',
  mobi: 'application/x-mobipocket-ebook',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  cover: 'application/pdf',
};

const EXTENSIONS: Record<string, string> = {
  epub: 'epub',
  mobi: 'mobi',
  docx: 'docx',
  pdf: '_print.pdf',
  cover: '_cover.pdf',
};

export async function POST(request: Request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const roleError = requireRole('admin');
  if (roleError) return roleError;

  // Body size check
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: `Body too large. Max ${MAX_BODY_SIZE / 1024 / 1024}MB.` }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await request.json();
    const parsed = ExportBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const body = parsed.data;
    const { book, format } = body;
    const bookData = book as unknown as Book;

    let blob: Blob;

    switch (format) {
      case 'epub': {
        const { exportToEpub } = await import('@/lib/export/epub');
        blob = await exportToEpub(bookData);
        break;
      }
      case 'mobi': {
        const { exportToMobi } = await import('@/lib/export/mobi');
        blob = await exportToMobi(bookData);
        break;
      }
      case 'docx': {
        const { exportToDocx } = await import('@/lib/export/docx');
        blob = await exportToDocx(bookData);
        break;
      }
      case 'pdf': {
        const opts: Record<string, unknown> = body.options || {};
        const { exportToPrintPdf } = await import('@/lib/export/pdf-print');
        blob = await exportToPrintPdf(bookData, opts as any);
        break;
      }
      case 'cover': {
        const opts: Record<string, unknown> = body.options || {};
        const { exportCoverPdf, calculateSpineWidth } = await import('@/lib/export/pdf-cover');
        if (!opts.pageCount && bookData.chapters?.length) {
          const totalWords = bookData.chapters.reduce(
            (sum: number, ch: { scenes: { wordCount: number }[] }) =>
              sum + ch.scenes.reduce((s: number, sc: { wordCount: number }) => s + sc.wordCount, 0),
            0
          );
          (opts as any).pageCount = Math.max(1, Math.ceil(totalWords / 250));
        }
        blob = await exportCoverPdf(bookData, opts as any);
        break;
      }
      default:
        return new Response(`Unsupported format: ${format}`, { status: 400 });
    }

    const filename = `${(book.title || 'book').replace(/[^a-zA-Z0-9]/g, '_')}${EXTENSIONS[format]}`;
    const contentType = CONTENT_TYPES[format];

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Export API error:', err);
    return new Response(
      err instanceof Error ? err.message : 'Export failed',
      { status: 500 }
    );
  }
}
