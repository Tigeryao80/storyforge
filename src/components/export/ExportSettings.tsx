'use client';

import { useState, useCallback } from 'react';
import { useBookStore } from '@/store/bookStore';
import { exportToDocx } from '@/lib/export/docx';
import { exportToEpub } from '@/lib/export/epub';
import { exportToPrintPdf, type PdfExportOptions } from '@/lib/export/pdf-print';
import { exportToMobi } from '@/lib/export/mobi';
import { exportCoverPdf, type CoverOptions, calculateSpineWidth } from '@/lib/export/pdf-cover';
import { TRIM_SIZES } from '@/types/book';

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

interface ExportSettingsProps {
  onClose: () => void;
}

export default function ExportSettings({ onClose }: ExportSettingsProps) {
  const book = useBookStore((s) => s.book);
  const [format, setFormat] = useState<'epub' | 'mobi' | 'pdf' | 'docx' | 'cover'>('epub');
  const [trimSize, setTrimSize] = useState('6x9');
  const [bleed, setBleed] = useState(true);
  const [pageNumbers, setPageNumbers] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [fontFamily, setFontFamily] = useState('Times-Roman');
  const [fontSize, setFontSize] = useState(12);
  const [gutter, setGutter] = useState(0.75);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageCount = estimatePageCount(book);
  const spineWidth = calculateSpineWidth(pageCount);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      switch (format) {
        case 'epub': {
          const blob = await exportToEpub(book);
          downloadBlob(blob, `${book.title || 'book'}.epub`);
          break;
        }
        case 'mobi': {
          const blob = await exportToMobi(book);
          downloadBlob(blob, `${book.title || 'book'}.mobi`);
          break;
        }
        case 'docx': {
          await exportToDocx(book);
          break;
        }
        case 'pdf': {
          const pdfOpts: PdfExportOptions = {
            trimSize,
            bleed,
            pageNumbers,
            includeToc,
            fontFamily,
            fontSize,
            lineHeight: 1.5,
            gutterInches: gutter,
          };
          await exportToPrintPdf(book, pdfOpts);
          break;
        }
        case 'cover': {
          const coverOpts: CoverOptions = {
            trimSize,
            pageCount,
          };
          await exportCoverPdf(book, coverOpts);
          break;
        }
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [format, trimSize, bleed, pageNumbers, includeToc, fontFamily, fontSize, gutter, book, onClose]);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      // Export all KDP formats
      const epubBlob = await exportToEpub(book);
      downloadBlob(epubBlob, `${book.title || 'book'}.epub`);

      const mobiBlob = await exportToMobi(book);
      downloadBlob(mobiBlob, `${book.title || 'book'}.mobi`);

      const pdfOpts: PdfExportOptions = {
        trimSize, bleed, pageNumbers, includeToc,
        fontFamily, fontSize, lineHeight: 1.5, gutterInches: gutter,
      };
      await exportToPrintPdf(book, pdfOpts);

      const coverOpts: CoverOptions = { trimSize, pageCount };
      await exportCoverPdf(book, coverOpts);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [book, trimSize, bleed, pageNumbers, includeToc, fontFamily, fontSize, gutter, pageCount, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Export for KDP</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>

          {/* Format selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <div className="flex flex-wrap gap-2">
              {(['epub', 'mobi', 'pdf', 'docx', 'cover'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    format === f
                      ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'cover' ? 'Cover PDF' : f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Trim size (for PDF and Cover) */}
          {(format === 'pdf' || format === 'cover') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Trim Size</label>
              <select
                value={trimSize}
                onChange={(e) => setTrimSize(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                {TRIM_SIZES.map((ts) => (
                  <option key={ts.id} value={ts.id}>{ts.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Est. page count: {pageCount} · Spine: {spineWidth.toFixed  (3)}"
              </p>
            </div>
          )}

          {/* PDF-specific options */}
          {format === 'pdf' && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={bleed} onChange={(e) => setBleed(e.target.checked)} className="rounded" />
                  Bleed marks
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={pageNumbers} onChange={(e) => setPageNumbers(e.target.checked)} className="rounded" />
                  Page numbers
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={includeToc} onChange={(e) => setIncludeToc(e.target.checked)} className="rounded" />
                  Table of Contents
                </label>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Body Font</label>
                  <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded">
                    <option value="Times-Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Garamond">Garamond</option>
                    <option value="Palatino">Palatino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                  <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded">
                    {[10, 10.5, 11, 12, 13, 14].map((s) => (
                      <option key={s} value={s}>{s}pt</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Gutter (binding margin)</label>
                <select value={gutter} onChange={(e) => setGutter(Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded">
                  <option value={0.5}>0.5" (thin books)</option>
                  <option value={0.75}>0.75" (standard)</option>
                  <option value={1.0}>1.0" (thick books 300+ pages)</option>
                  <option value={1.25}>1.25" (very thick 500+ pages)</option>
                </select>
              </div>
            </>
          )}

          {/* Cover info */}
          {format === 'cover' && (
            <div className="mb-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
              <p>Cover will include: front cover, spine ({spineWidth.toFixed(3)}"), back cover</p>
              <p>Total size: {((TRIM_SIZE_MAP[trimSize]?.width || 6) * 2 + spineWidth + 0.25).toFixed(3)}" × {((TRIM_SIZE_MAP[trimSize]?.height || 9) + 0.25).toFixed(3)}" (with bleed)</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {exporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
            </button>
            <button
              onClick={handleExportAll}
              disabled={exporting}
              className="flex-1 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {exporting ? 'Exporting...' : 'Export All (KDP)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function estimatePageCount(book: { chapters: { scenes: { wordCount: number }[] }[] }): number {
  const totalWords = book.chapters.reduce(
    (sum, ch) => sum + ch.scenes.reduce((s, sc) => s + sc.wordCount, 0),
    0
  );
  // Average 250 words per page for a 6x9 book with 12pt font
  return Math.max(1, Math.ceil(totalWords / 250));
}
