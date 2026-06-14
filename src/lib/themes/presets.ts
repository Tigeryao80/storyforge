import type { BookTheme } from '@/types/book';

export interface ThemePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  fontFamily: string;
  headingFont: string;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  textColor: string;
  backgroundColor: string;
  headingColor: string;
  accentColor: string;
  pageMargins: { top: number; bottom: number; left: number; right: number };
  chapterStartStyle: 'any-page' | 'right-page' | 'odd-page';
  dropCap: boolean;
  sceneBreakStyle: 'none' | 'ornament' | 'line' | 'spacing';
  sceneBreakContent: string;
}

export const themePresets: ThemePreset[] = [
  // ═══ CLASSIC (3 variants) ═══
  {
    id: 'classic-serif',
    name: 'Classic Serif',
    category: 'Classic',
    description: 'Traditional book typography with Georgia serif',
    fontFamily: 'Georgia, "Times New Roman", serif',
    headingFont: 'Georgia, "Times New Roman", serif',
    fontSize: 12, lineHeight: 1.6, paragraphSpacing: 1.5,
    textColor: '#1a1a1a', backgroundColor: '#ffffff',
    headingColor: '#111111', accentColor: '#2563eb',
    pageMargins: { top: 72, bottom: 72, left: 72, right: 72 },
    chapterStartStyle: 'right-page', dropCap: true,
    sceneBreakStyle: 'ornament', sceneBreakContent: '❧',
  },
  {
    id: 'classic-sans',
    name: 'Classic Sans-Serif',
    category: 'Classic',
    description: 'Clean modern classic with Helvetica',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    headingFont: '"Helvetica Neue", Arial, sans-serif',
    fontSize: 11, lineHeight: 1.5, paragraphSpacing: 1.2,
    textColor: '#2d2d2d', backgroundColor: '#ffffff',
    headingColor: '#1a1a1a', accentColor: '#333333',
    pageMargins: { top: 72, bottom: 72, left: 72, right: 72 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'line', sceneBreakContent: '—',
  },
  {
    id: 'classic-garamond',
    name: 'Classic Garamond',
    category: 'Classic',
    description: 'Elegant literary feel with Garamond',
    fontFamily: '"EB Garamond", "Garamond", serif',
    headingFont: '"EB Garamond", "Garamond", serif',
    fontSize: 12, lineHeight: 1.7, paragraphSpacing: 1.8,
    textColor: '#1a1a1a', backgroundColor: '#faf8f5',
    headingColor: '#111111', accentColor: '#8b4513',
    pageMargins: { top: 80, bottom: 80, left: 80, right: 80 },
    chapterStartStyle: 'right-page', dropCap: true,
    sceneBreakStyle: 'ornament', sceneBreakContent: '✦',
  },

  // ═══ MODERN (3 variants) ═══
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'Modern',
    description: 'Clean, minimalist design for contemporary fiction',
    fontFamily: '"Inter", "Helvetica Neue", sans-serif',
    headingFont: '"Inter", "Helvetica Neue", sans-serif',
    fontSize: 11, lineHeight: 1.6, paragraphSpacing: 1.0,
    textColor: '#2d3748', backgroundColor: '#fafafa',
    headingColor: '#1a202c', accentColor: '#6366f1',
    pageMargins: { top: 60, bottom: 60, left: 60, right: 60 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'spacing', sceneBreakContent: '',
  },
  {
    id: 'modern-bold',
    name: 'Modern Bold',
    category: 'Modern',
    description: 'Strong headings, tight spacing for thrillers',
    fontFamily: '"Roboto", "Arial", sans-serif',
    headingFont: '"Roboto Condensed", "Arial Narrow", sans-serif',
    fontSize: 11, lineHeight: 1.5, paragraphSpacing: 0.8,
    textColor: '#1a1a1a', backgroundColor: '#ffffff',
    headingColor: '#000000', accentColor: '#dc2626',
    pageMargins: { top: 65, bottom: 65, left: 65, right: 65 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'line', sceneBreakContent: '▬',
  },
  {
    id: 'modern-elegant',
    name: 'Modern Elegant',
    category: 'Modern',
    description: 'Sophisticated design for literary fiction',
    fontFamily: '"Source Serif Pro", "Georgia", serif',
    headingFont: '"Playfair Display", "Georgia", serif',
    fontSize: 12, lineHeight: 1.7, paragraphSpacing: 1.5,
    textColor: '#2c2c2c', backgroundColor: '#fefefe',
    headingColor: '#1a1a1a', accentColor: '#b8860b',
    pageMargins: { top: 72, bottom: 72, left: 72, right: 72 },
    chapterStartStyle: 'right-page', dropCap: true,
    sceneBreakStyle: 'ornament', sceneBreakContent: '❖',
  },

  // ═══ GENRE-SPECIFIC (6 variants) ═══
  {
    id: 'fantasy-epic',
    name: 'Epic Fantasy',
    category: 'Fantasy',
    description: 'Ornate styling for epic fantasy novels',
    fontFamily: '"Crimson Text", "Garamond", serif',
    headingFont: '"Cinzel", "Trajan Pro", serif',
    fontSize: 12, lineHeight: 1.7, paragraphSpacing: 1.5,
    textColor: '#1a1a1a', backgroundColor: '#fdf8f0',
    headingColor: '#2c1810', accentColor: '#8b0000',
    pageMargins: { top: 72, bottom: 72, left: 80, right: 72 },
    chapterStartStyle: 'right-page', dropCap: true,
    sceneBreakStyle: 'ornament', sceneBreakContent: '⚔',
  },
  {
    id: 'romance-warm',
    name: 'Warm Romance',
    category: 'Romance',
    description: 'Warm, inviting typography for romance novels',
    fontFamily: '"Lora", "Georgia", serif',
    headingFont: '"Great Vibes", "Brush Script MT", cursive',
    fontSize: 12, lineHeight: 1.6, paragraphSpacing: 1.3,
    textColor: '#2d2d2d', backgroundColor: '#fffaf5',
    headingColor: '#8b4513', accentColor: '#c41e3a',
    pageMargins: { top: 72, bottom: 72, left: 72, right: 72 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'ornament', sceneBreakContent: '♥',
  },
  {
    id: 'scifi-tech',
    name: 'Sci-Fi Tech',
    category: 'Sci-Fi',
    description: 'Futuristic monospace-influenced design',
    fontFamily: '"IBM Plex Sans", "Helvetica Neue", sans-serif',
    headingFont: '"Orbitron", "Arial Black", sans-serif',
    fontSize: 11, lineHeight: 1.5, paragraphSpacing: 1.0,
    textColor: '#e0e0e0', backgroundColor: '#0a0a0a',
    headingColor: '#00d4ff', accentColor: '#00ff88',
    pageMargins: { top: 60, bottom: 60, left: 60, right: 60 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'line', sceneBreakContent: '▸▸▸',
  },
  {
    id: 'mystery-dark',
    name: 'Dark Mystery',
    category: 'Mystery',
    description: 'Dark, atmospheric styling for mystery/thriller',
    fontFamily: '"Merriweather", "Georgia", serif',
    headingFont: '"Oswald", "Impact", sans-serif',
    fontSize: 11, lineHeight: 1.5, paragraphSpacing: 1.0,
    textColor: '#d4d4d4', backgroundColor: '#1a1a2e',
    headingColor: '#e0e0e0', accentColor: '#c0392b',
    pageMargins: { top: 72, bottom: 72, left: 72, right: 72 },
    chapterStartStyle: 'right-page', dropCap: true,
    sceneBreakStyle: 'spacing', sceneBreakContent: '',
  },
  {
    id: 'nonfiction-clean',
    name: 'Clean Non-Fiction',
    category: 'Non-Fiction',
    description: 'Professional, readable design for non-fiction',
    fontFamily: '"Open Sans", "Helvetica Neue", sans-serif',
    headingFont: '"Montserrat", "Arial", sans-serif',
    fontSize: 11, lineHeight: 1.6, paragraphSpacing: 1.2,
    textColor: '#2d2d2d', backgroundColor: '#ffffff',
    headingColor: '#1a1a1a', accentColor: '#2563eb',
    pageMargins: { top: 72, bottom: 72, left: 72, right: 72 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'line', sceneBreakContent: '—',
  },
  {
    id: 'memoir-personal',
    name: 'Personal Memoir',
    category: 'Memoir',
    description: 'Intimate, personal feel for memoirs',
    fontFamily: '"Libre Baskerville", "Georgia", serif',
    headingFont: '"Libre Baskerville", "Georgia", serif',
    fontSize: 12, lineHeight: 1.8, paragraphSpacing: 1.5,
    textColor: '#2c2c2c', backgroundColor: '#faf9f6',
    headingColor: '#1a1a1a', accentColor: '#6b7280',
    pageMargins: { top: 80, bottom: 80, left: 80, right: 80 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'ornament', sceneBreakContent: '✿',
  },

  // ═══ SPECIALTY (5 variants) ═══
  {
    id: 'large-print',
    name: 'Large Print',
    category: 'Accessibility',
    description: '18pt+ fonts for visually impaired readers',
    fontFamily: '"Atkinson Hyperlegible", "Verdana", sans-serif',
    headingFont: '"Atkinson Hyperlegible", "Verdana", sans-serif',
    fontSize: 18, lineHeight: 2.0, paragraphSpacing: 2.0,
    textColor: '#000000', backgroundColor: '#fffff0',
    headingColor: '#000000', accentColor: '#0000cc',
    pageMargins: { top: 90, bottom: 90, left: 90, right: 90 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'line', sceneBreakContent: '━━━',
  },
  {
    id: 'manuscript',
    name: 'Manuscript',
    category: 'Draft',
    description: 'Courier-style for manuscript submissions',
    fontFamily: '"Courier New", Courier, monospace',
    headingFont: '"Courier New", Courier, monospace',
    fontSize: 12, lineHeight: 2.0, paragraphSpacing: 0,
    textColor: '#000000', backgroundColor: '#ffffff',
    headingColor: '#000000', accentColor: '#000000',
    pageMargins: { top: 72, bottom: 72, left: 108, right: 72 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'line', sceneBreakContent: '# # #',
  },
  {
    id: 'poetry',
    name: 'Poetry Collection',
    category: 'Poetry',
    description: 'Centered, spacious layout for poetry',
    fontFamily: '"Cormorant Garamond", "Garamond", serif',
    headingFont: '"Cormorant Garamond", "Garamond", serif',
    fontSize: 13, lineHeight: 1.9, paragraphSpacing: 2.0,
    textColor: '#1a1a1a', backgroundColor: '#fefefe',
    headingColor: '#1a1a1a', accentColor: '#8b7355',
    pageMargins: { top: 96, bottom: 96, left: 96, right: 96 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'ornament', sceneBreakContent: '◊',
  },
  {
    id: 'childrens-book',
    name: "Children's Book",
    category: 'Children',
    description: 'Large, playful fonts for children\'s books',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
    headingFont: '"Fredoka One", "Comic Sans MS", cursive',
    fontSize: 16, lineHeight: 1.8, paragraphSpacing: 2.0,
    textColor: '#2d2d2d', backgroundColor: '#fffef5',
    headingColor: '#1a1a1a', accentColor: '#ff6b6b',
    pageMargins: { top: 60, bottom: 60, left: 60, right: 60 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'ornament', sceneBreakContent: '★',
  },
  {
    id: 'cookbook',
    name: 'Cookbook',
    category: 'Cookbook',
    description: 'Two-column friendly layout for cookbooks',
    fontFamily: '"Lato", "Helvetica Neue", sans-serif',
    headingFont: '"Playfair Display", "Georgia", serif',
    fontSize: 11, lineHeight: 1.5, paragraphSpacing: 1.0,
    textColor: '#2d2d2d', backgroundColor: '#ffffff',
    headingColor: '#1a1a1a', accentColor: '#d97706',
    pageMargins: { top: 72, bottom: 72, left: 72, right: 72 },
    chapterStartStyle: 'any-page', dropCap: false,
    sceneBreakStyle: 'line', sceneBreakContent: '—',
  },
];

export function getThemeById(id: string): ThemePreset {
  return themePresets.find(t => t.id === id) ?? themePresets[0];
}

export function getThemesByCategory(): Record<string, ThemePreset[]> {
  const categories: Record<string, ThemePreset[]> = {};
  for (const theme of themePresets) {
    if (!categories[theme.category]) categories[theme.category] = [];
    categories[theme.category].push(theme);
  }
  return categories;
}

export const themeCategories = [...new Set(themePresets.map(t => t.category))];
