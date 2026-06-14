// src/lib/fonts/googleFonts.ts

export interface GoogleFont {
  family: string;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  popularity: number;
}

type SortBy = 'popularity' | 'trending' | 'alpha';

const CACHE_KEY = 'storyforge-google-fonts';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const PAGE_SIZE = 50;

interface CacheData {
  fonts: GoogleFont[];
  fetchedAt: number;
}

// ── Cache ─────────────────────────────────────────────────

function getCache(): GoogleFont[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: CacheData = JSON.parse(raw);
    if (Date.now() - data.fetchedAt > CACHE_TTL) return null;
    return data.fonts;
  } catch {
    return null;
  }
}

function setCache(fonts: GoogleFont[]): void {
  try {
    const data: CacheData = { fonts, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

// ── API ───────────────────────────────────────────────────

const API_BASE = 'https://www.googleapis.com/webfonts/v1/webfonts';

/**
 * Fetch the full Google Fonts list, sorted by the given criteria.
 * Results are cached in localStorage for 24 hours.
 */
export async function fetchGoogleFonts(sortBy: SortBy = 'popularity'): Promise<GoogleFont[]> {
  const cached = getCache();
  if (cached) return cached;

  const url = `${API_BASE}?sort=${sortBy}&fields=items(family,category,variants,subsets,version,lastModified,files)&key=`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Fonts API error: ${res.status}`);
  }

  const data = await res.json();

  const fonts: GoogleFont[] = (data.items || []).map((item: any, index: number) => ({
    family: item.family,
    category: item.category || 'sans-serif',
    variants: item.variants || ['regular'],
    subsets: item.subsets || ['latin'],
    version: item.version || '',
    lastModified: item.lastModified || '',
    files: item.files || {},
    popularity: index + 1,
  }));

  setCache(fonts);
  return fonts;
}

/**
 * Get fonts for a specific page (for pagination).
 */
export async function getFontPage(
  page: number,
  sortBy: SortBy = 'popularity'
): Promise<{ fonts: GoogleFont[]; total: number }> {
  const all = await fetchGoogleFonts(sortBy);
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return {
    fonts: all.slice(start, end),
    total: all.length,
  };
}

/**
 * Search fonts by name (fuzzy match).
 */
export async function searchFonts(
  query: string,
  category?: string
): Promise<GoogleFont[]> {
  const all = await fetchGoogleFonts();
  const q = query.toLowerCase().trim();

  let results = all;

  if (q) {
    results = results.filter((f) =>
      f.family.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'all') {
    results = results.filter((f) => f.category === category);
  }

  return results;
}

/**
 * Get a single font by family name.
 */
export async function getFont(family: string): Promise<GoogleFont | null> {
  const all = await fetchGoogleFonts();
  return all.find((f) => f.family === family) || null;
}

/**
 * Get all unique categories.
 */
export function getCategories(): string[] {
  return ['all', 'serif', 'sans-serif', 'display', 'handwriting', 'monospace'];
}

/**
 * Get recently used fonts from localStorage.
 */
export function getRecentFonts(): string[] {
  try {
    const raw = localStorage.getItem('storyforge-recent-fonts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add a font to recently used.
 */
export function addRecentFont(family: string): void {
  try {
    const recent = getRecentFonts();
    const updated = [family, ...recent.filter((f) => f !== family)].slice(0, 10);
    localStorage.setItem('storyforge-recent-fonts', JSON.stringify(updated));
  } catch {
    // ignore
  }
}
