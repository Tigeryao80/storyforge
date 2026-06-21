'use client';

import { useState, useCallback } from 'react';
import { useBookStore } from '@/store/bookStore';
// All export logic is delegated to the server via /api/export.
// No server-only modules are imported here — keeps the client bundle clean.
import { TRIM_SIZES } from '@/types/book';
import CoverGenerator from '@/components/cover/CoverGenerator';

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
  const setBookMeta = useBookStore((s) => s.setBookMeta);
  const [format, setFormat] = useState<'epub' | 'mobi' | 'pdf' | 'docx' | 'cover'>('epub');
  const [trimSize, setTrimSize] = useState('6x9');
  const [bleed, setBleed] = useState(true);
  const [pageNumbers, setPageNumbers] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [fontFamily, setFontFamily] = useState('Times-Roman');
  const [fontSize, setFontSize] = useState(12);
  const [gutter, setGutter] = useState(0.75);
  // Running headers/footers
  const [runningHeader, setRunningHeader] = useState(true);
  const [runningFooter, setRunningFooter] = useState(true);
  const [differentFirstPage, setDifferentFirstPage] = useState(true);
  // Cover options
  const [coverImageUrl, setCoverImageUrl] = useState(book.coverImageUrl || '');
  const [backCoverBlurb, setBackCoverBlurb] = useState(book.backCoverBlurb || '');
  const [authorBio, setAuthorBio] = useState(book.authorBio || '');
  // KDP metadata
  const [kdpIsbn, setKdpIsbn] = useState(book.isbn || '');
  const [kdpDescription, setKdpDescription] = useState(book.bookDescription || '');
  const [kdpSeriesName, setKdpSeriesName] = useState(book.seriesName || '');
  const [kdpSeriesNumber, setKdpSeriesNumber] = useState(book.seriesNumber?.toString() || '');
  const [kdpPenName, setKdpPenName] = useState(book.penName || '');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'format' | 'kdp'>('format');
  const [showCoverGenerator, setShowCoverGenerator] = useState(false);

  const pageCount = estimatePageCount(book);
  const spineWidth = pageCount * 0.002252;

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const filename = `${book.title || 'book'}`;
      const safeFilename = filename.replace(/[^a-zA-Z0-9]/g, '_');

      async function exportOne(format: string, options?: Record<string, unknown>): Promise<void> {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ book, format, options }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Export failed (${res.status})`);
        }
        const blob = await res.blob();
        const extMap: Record<string, string> = {
          epub: 'epub', mobi: 'mobi', docx: 'docx', pdf: '_print.pdf', cover: '_cover.pdf',
        };
        downloadBlob(blob, `${safeFilename}${extMap[format] || format}`);
      }

      switch (format) {
        case 'epub':
        case 'mobi':
        case 'docx':
          await exportOne(format);
          break;
        case 'pdf': {
          const pdfOpts = {
            trimSize, bleed, pageNumbers, includeToc,
            fontFamily, fontSize, lineHeight: 1.5, gutterInches: gutter,
            runningHeader, runningFooter, differentFirstPage,
          };
          await exportOne('pdf', pdfOpts as any);
          break;
        }
        case 'cover': {
          const coverOpts = {
            trimSize, pageCount,
            coverImageUrl: coverImageUrl || undefined,
            backCoverBlurb: backCoverBlurb || undefined,
            authorBio: authorBio || undefined,
          };
          await exportOne('cover', coverOpts as any);
          break;
        }
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [format, trimSize, bleed, pageNumbers, includeToc, fontFamily, fontSize, gutter, runningHeader, runningFooter, differentFirstPage, coverImageUrl, backCoverBlurb, authorBio, book, pageCount, onClose]);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const filename = `${book.title || 'book'}`;
      const safeFilename = filename.replace(/[^a-zA-Z0-9]/g, '_');

      async function exportOne(format: string, options?: Record<string, unknown>): Promise<void> {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ book, format, options }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Export failed (${res.status})`);
        }
        const blob = await res.blob();
        const extMap: Record<string, string> = {
          epub: 'epub', mobi: 'mobi', docx: 'docx', pdf: '_print.pdf', cover: '_cover.pdf',
        };
        downloadBlob(blob, `${safeFilename}${extMap[format] || format}`);
      }

      // Export all KDP formats sequentially
      await exportOne('epub');
      await exportOne('mobi');

      const pdfOpts = {
        trimSize, bleed, pageNumbers, includeToc,
        fontFamily, fontSize, lineHeight: 1.5, gutterInches: gutter,
        runningHeader, runningFooter, differentFirstPage,
      };
      await exportOne('pdf', pdfOpts);

      const coverOpts = {
        trimSize, pageCount,
        coverImageUrl: coverImageUrl || undefined,
        backCoverBlurb: backCoverBlurb || undefined,
        authorBio: authorBio || undefined,
      };
      await exportOne('cover', coverOpts);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [book, trimSize, bleed, pageNumbers, includeToc, fontFamily, fontSize, gutter, runningHeader, runningFooter, differentFirstPage, coverImageUrl, backCoverBlurb, authorBio, pageCount, onClose]);

  const handleSaveKdpMeta = useCallback(() => {
    // Save KDP metadata to the book store
    useBookStore.setState((state) => ({
      book: {
        ...state.book,
        isbn: kdpIsbn || undefined,
        bookDescription: kdpDescription || undefined,
        seriesName: kdpSeriesName || undefined,
        seriesNumber: kdpSeriesNumber ? parseInt(kdpSeriesNumber, 10) : undefined,
        penName: kdpPenName || undefined,
        coverImageUrl: coverImageUrl || undefined,
        backCoverBlurb: backCoverBlurb || undefined,
        authorBio: authorBio || undefined,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, [kdpIsbn, kdpDescription, kdpSeriesName, kdpSeriesNumber, kdpPenName, coverImageUrl, backCoverBlurb, authorBio]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Export for KDP</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('format')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'format' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📄 Format & Layout
            </button>
            <button
              onClick={() => setActiveTab('kdp')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'kdp' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🏪 KDP Metadata
            </button>
          </div>

          {/* ── Format & Layout Tab ── */}
          {activeTab === 'format' && (
            <>
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
                    Est. page count: {pageCount} · Spine: {spineWidth.toFixed(3)}"
                  </p>
                </div>
              )}

              {/* PDF-specific options */}
              {format === 'pdf' && (
                <>
                  {/* Section: Content */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Content</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={includeToc} onChange={(e) => setIncludeToc(e.target.checked)} className="rounded" />
                        Table of Contents
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={bleed} onChange={(e) => setBleed(e.target.checked)} className="rounded" />
                        Bleed marks
                      </label>
                    </div>
                  </div>

                  {/* Section: Running Headers/Footers */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Headers & Footers</p>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={runningHeader} onChange={(e) => setRunningHeader(e.target.checked)} className="rounded" />
                        Running header <span className="text-xs text-gray-400">(book title left, chapter title right)</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={runningFooter} onChange={(e) => setRunningFooter(e.target.checked)} className="rounded" />
                        Running footer <span className="text-xs text-gray-400">(page number centered)</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={differentFirstPage} onChange={(e) => setDifferentFirstPage(e.target.checked)} className="rounded" />
                        No header/footer on chapter first pages
                      </label>
                    </div>
                  </div>

                  {/* Section: Typography */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Typography</p>
                    <div className="grid grid-cols-2 gap-3">
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
                  </div>

                  {/* Section: Layout */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Layout</p>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Gutter (binding margin)</label>
                      <select value={gutter} onChange={(e) => setGutter(Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border rounded">
                        <option value={0.5}>0.5&quot; (thin books)</option>
                        <option value={0.75}>0.75&quot; (standard)</option>
                        <option value={1.0}>1.0&quot; (thick books 300+ pages)</option>
                        <option value={1.25}>1.25&quot; (very thick 500+ pages)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Cover-specific options */}
              {format === 'cover' && (
                <>
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Front Cover</p>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cover Image URL</label>
                      <input
                        type="text"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        placeholder="https://example.com/cover.jpg"
                        className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                      />
                      <p className="text-xs text-gray-400 mt-1">Paste a URL to your cover image (JPEG/PNG, min 1600px height recommended)</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Back Cover</p>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Blurb / Synopsis</label>
                        <textarea
                          value={backCoverBlurb}
                          onChange={(e) => setBackCoverBlurb(e.target.value)}
                          placeholder="A compelling description of your book..."
                          rows={3}
                          className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Author Bio</label>
                        <textarea
                          value={authorBio}
                          onChange={(e) => setAuthorBio(e.target.value)}
                          placeholder="About the author..."
                          rows={2}
                          className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">Cover Summary</p>
                    <p>Front cover, spine ({spineWidth.toFixed(3)}"), back cover with blurb + bio</p>
                    <p>Total: {((TRIM_SIZE_MAP[trimSize]?.width || 6) * 2 + spineWidth + 0.25).toFixed(3)}&quot; × {((TRIM_SIZE_MAP[trimSize]?.height || 9) + 0.25).toFixed(3)}&quot; (with bleed)</p>
                    {kdpIsbn && <p>ISBN: {kdpIsbn}</p>}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── KDP Metadata Tab ── */}
          {activeTab === 'kdp' && (
            <>
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Book Info</p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ISBN (optional)</label>
                    <input
                      type="text"
                      value={kdpIsbn}
                      onChange={(e) => setKdpIsbn(e.target.value)}
                      placeholder="978-0-000000-00-0"
                      className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pen Name (if different from author)</label>
                    <input
                      type="text"
                      value={kdpPenName}
                      onChange={(e) => setKdpPenName(e.target.value)}
                      placeholder="Pen name for publication"
                      className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Series</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Series Name</label>
                    <input
                      type="text"
                      value={kdpSeriesName}
                      onChange={(e) => setKdpSeriesName(e.target.value)}
                      placeholder="The Great Series"
                      className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Book #</label>
                    <input
                      type="number"
                      value={kdpSeriesNumber}
                      onChange={(e) => setKdpSeriesNumber(e.target.value)}
                      placeholder="1"
                      min="1"
                      className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Amazon Listing</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Book Description</label>
                  <textarea
                    value={kdpDescription}
                    onChange={(e) => setKdpDescription(e.target.value)}
                    placeholder="Your Amazon book description (HTML allowed)..."
                    rows={4}
                    className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">This is your Amazon product description. Supports HTML.</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cover Assets</p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cover Image URL</label>
                    <input
                      type="text"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                      className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Back Cover Blurb</label>
                    <textarea
                      value={backCoverBlurb}
                      onChange={(e) => setBackCoverBlurb(e.target.value)}
                      placeholder="Short blurb for back cover..."
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Author Bio</label>
                    <textarea
                      value={authorBio}
                      onChange={(e) => setAuthorBio(e.target.value)}
                      placeholder="About the author..."
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveKdpMeta}
                className="w-full px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                💾 Save KDP Metadata to Book
              </button>
            </>
          )}

          {/* ── AI Cover Generator (both tabs) ── */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowCoverGenerator(true)}
              className="w-full px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              🎨 Generate AI Cover with ComfyUI
            </button>
            <p className="text-xs text-gray-400 mt-1 text-center">
              Powered by Juggernaut XL · Requires ComfyUI running on localhost:8188
            </p>
          </div>

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

          {/* Cover Generator Modal */}
          {showCoverGenerator && (
            <CoverGenerator onClose={() => setShowCoverGenerator(false)} />
          )}
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
