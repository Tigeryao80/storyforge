// src/components/themes/FontSelector.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchGoogleFonts,
  searchFonts,
  getCategories,
  getRecentFonts,
  addRecentFont,
} from '@/lib/fonts/googleFonts';
import { loadFontCSS, getFontFamilyWithFallback } from '@/lib/fonts/fontPreview';
import type { GoogleFont } from '@/lib/fonts/googleFonts';

interface FontSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (font: GoogleFont) => void;
  currentFont?: string;
}

const PREVIEW_TEXT = 'The quick brown fox jumps over the lazy dog';
const PAGE_SIZE = 30;

export default function FontSelector({ isOpen, onClose, onSelect, currentFont }: FontSelectorProps) {
  const [fonts, setFonts] = useState<GoogleFont[]>([]);
  const [filtered, setFiltered] = useState<GoogleFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [recentFonts, setRecentFonts] = useState<string[]>([]);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch fonts on open
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    fetchGoogleFonts('popularity')
      .then((data) => {
        setFonts(data);
        setFiltered(data.slice(0, PAGE_SIZE));
        setTotal(data.length);
        setPage(1);
        setRecentFonts(getRecentFonts());
        setLoading(false);

        // Preload first page fonts for preview
        loadPageFonts(data.slice(0, 10));
      })
      .catch((err) => {
        setError(err.message || 'Failed to load fonts');
        setLoading(false);
      });
  }, [isOpen]);

  // Filter on search/category change
  useEffect(() => {
    if (!search && category === 'all') {
      setFiltered(fonts.slice(0, page * PAGE_SIZE));
      setTotal(fonts.length);
      return;
    }

    searchFonts(search, category === 'all' ? undefined : category).then((results) => {
      setFiltered(results.slice(0, PAGE_SIZE));
      setTotal(results.length);
      setPage(1);
      loadPageFonts(results.slice(0, 10));
    });
  }, [search, category, fonts, page]);

  const loadPageFonts = useCallback((fontList: GoogleFont[]) => {
    fontList.forEach((f) => {
      if (!loadedFonts.has(f.family)) {
        loadFontCSS(f.family, ['400', '700']).then(() => {
          setLoadedFonts((prev) => new Set(prev).add(f.family));
        }).catch(() => {
          // Font failed to load — skip
        });
      }
    });
  }, [loadedFonts]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      // Load more
      if (!loading && filtered.length < total) {
        const nextPage = page + 1;
        const start = 0;
        const end = nextPage * PAGE_SIZE;
        let source = fonts;
        if (search || category !== 'all') {
          // Re-filter for next page
          searchFonts(search, category === 'all' ? undefined : category).then((results) => {
            setFiltered(results.slice(0, end));
            setTotal(results.length);
            setPage(nextPage);
            loadPageFonts(results.slice((nextPage - 1) * PAGE_SIZE, nextPage * PAGE_SIZE));
          });
        } else {
          setFiltered(source.slice(0, end));
          setPage(nextPage);
          loadPageFonts(source.slice((nextPage - 1) * PAGE_SIZE, nextPage * PAGE_SIZE));
        }
      }
    }
  }, [filtered.length, total, page, search, category, fonts, loading, loadPageFonts]);

  const handleSelect = (font: GoogleFont) => {
    addRecentFont(font.family);
    onSelect(font);
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    setCategory('all');
    setPage(0);
    onClose();
  };

  if (!isOpen) return null;

  const categories = getCategories();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Choose a Font</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search + Filters */}
        <div className="px-5 py-3 border-b border-gray-100 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fonts..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-1 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  category === cat
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Font List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-5 py-3"
          onScroll={handleScroll}
        >
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <span className="animate-spin mr-2">⏳</span> Loading 1,500+ fonts...
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
              <button
                onClick={handleClose}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Close
              </button>
            </div>
          )}

          {/* Recent fonts */}
          {!loading && !error && recentFonts.length > 0 && category === 'all' && !search && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Recent
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {recentFonts.slice(0, 4).map((family) => {
                  const font = fonts.find((f) => f.family === family);
                  if (!font) return null;
                  return (
                    <FontCard
                      key={`recent-${family}`}
                      font={font}
                      isLoaded={loadedFonts.has(font.family)}
                      isSelected={currentFont === font.family}
                      onSelect={handleSelect}
                      previewSize="small"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* All fonts */}
          {!loading && !error && (
            <>
              <div className="text-xs text-gray-400 mb-2">
                {filtered.length} of {total} fonts
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filtered.map((font) => (
                  <FontCard
                    key={font.family}
                    font={font}
                    isLoaded={loadedFonts.has(font.family)}
                    isSelected={currentFont === font.family}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 text-xs text-gray-400 text-center">
          Powered by Google Fonts API
        </div>
      </div>
    </div>
  );
}

// ── Font Card ─────────────────────────────────────────────

interface FontCardProps {
  font: GoogleFont;
  isLoaded: boolean;
  isSelected: boolean;
  onSelect: (font: GoogleFont) => void;
  previewSize?: 'normal' | 'small';
}

function FontCard({ font, isLoaded, isSelected, onSelect, previewSize = 'normal' }: FontCardProps) {
  const isSmall = previewSize === 'small';

  return (
    <button
      onClick={() => onSelect(font)}
      className={`text-left p-3 rounded-lg border transition-all hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-800 truncate">
          {font.family}
        </span>
        <span className="text-[10px] text-gray-400 uppercase ml-2 shrink-0">
          {font.category}
        </span>
      </div>
      <div
        className={`${isSmall ? 'text-lg' : 'text-2xl'} text-gray-700 leading-tight`}
        style={{
          fontFamily: isLoaded
            ? getFontFamilyWithFallback(font.family, font.category)
            : 'inherit',
          minHeight: isSmall ? '24px' : '36px',
        }}
      >
        {isLoaded ? PREVIEW_TEXT : <span className="text-sm text-gray-300">Loading...</span>}
      </div>
    </button>
  );
}
