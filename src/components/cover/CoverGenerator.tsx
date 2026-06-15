'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/bookStore';

interface CoverGeneratorProps {
  onClose?: () => void;
}

const GENRES = [
  { id: '', name: 'Auto (from book description)' },
  { id: 'fantasy', name: 'Fantasy' },
  { id: 'scifi', name: 'Sci-Fi' },
  { id: 'romance', name: 'Romance' },
  { id: 'thriller', name: 'Thriller' },
  { id: 'horror', name: 'Horror' },
  { id: 'mystery', name: 'Mystery' },
  { id: 'historical', name: 'Historical' },
  { id: 'literary', name: 'Literary Fiction' },
  { id: 'adventure', name: 'Adventure' },
  { id: 'biography', name: 'Biography / Memoir' },
];

const TRIM_SIZES = [
  { id: '5x8', name: '5" × 8"' },
  { id: '5.5x8.5', name: '5.5" × 8.5"' },
  { id: '6x9', name: '6" × 9" (standard)' },
  { id: '7x10', name: '7" × 10"' },
  { id: '8.5x11', name: '8.5" × 11"' },
];

export default function CoverGenerator({ onClose }: CoverGeneratorProps) {
  const book = useBookStore((s) => s.book);
  const setBookMeta = useBookStore((s) => s.setBookMeta);

  const [genre, setGenre] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [trimSize, setTrimSize] = useState(book.trimSize || '6x9');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(book.coverImageUrl || null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setStatusMessage('Connecting to ComfyUI...');

    try {
      // Build the prompt payload
      const payload = {
        title: book.title || 'Untitled Book',
        subtitle: book.subtitle,
        author: book.author,
        genre: genre || undefined,
        description: customPrompt || book.bookDescription || `${book.title} book cover`,
        style: undefined,
        trimSize,
      };

      // Call the MCP server via HTTP
      // Since this runs in the browser, we need a bridge endpoint
      const resp = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err || 'Failed to generate cover');
      }

      const result = await resp.json();

      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      setStatusMessage('✅ Cover generated! Loading preview...');

      // Show preview
      if (result.imageUrl) {
        setPreviewUrl(result.imageUrl);
      }

      // Save to book
      useBookStore.setState((state) => ({
        book: {
          ...state.book,
          coverImageUrl: result.imageUrl,
          updatedAt: new Date().toISOString(),
        },
      }));

      setStatusMessage('✅ Cover ready! Saved to book.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cover');
      setStatusMessage(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleAccept = () => {
    if (previewUrl) {
      setBookMeta(book.title, book.author);
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">🎨 AI Cover Generator</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>

          {/* Book Info Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
            <p><span className="font-medium">Book:</span> {book.title || 'Untitled'}</p>
            <p><span className="font-medium">Author:</span> {book.author || '(not set)'}</p>
            {book.bookDescription && (
              <p className="text-xs text-gray-500 mt-1 truncate">{book.bookDescription}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Genre */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                {GENRES.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Trim Size */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Aspect Ratio (trim size)</label>
              <select
                value={trimSize}
                onChange={(e) => setTrimSize(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                {TRIM_SIZES.map((ts) => (
                  <option key={ts.id} value={ts.id}>{ts.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom prompt */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custom prompt <span className="text-gray-400">(optional — describe what the cover should show)</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={`Describe the scene, mood, colors, or style for your cover...\n\nExample: "A lone figure stands on a cliff overlooking a stormy sea, dramatic lightning in the sky, purple and orange sunset."`}
              rows={3}
              className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
            />
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Preview</label>
              <div className="border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center max-h-80">
                <img
                  src={previewUrl}
                  alt="Book cover preview"
                  className="max-w-full max-h-80 object-contain"
                />
              </div>
            </div>
          )}

          {/* Status messages */}
          {statusMessage && !error && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              {statusMessage}
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
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="animate-pulse">⚡</span>
                  Generating...
                </>
              ) : (
                <>
                  🎨 Generate Cover
                </>
              )}
            </button>
            {previewUrl && (
              <>
                <button
                  onClick={handleAccept}
                  className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  ✅ Use This Cover
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  🔄 Regenerate
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Uses ComfyUI (local) + Juggernaut XL v9 · Images generate in ~10-30 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
