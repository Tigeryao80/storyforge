// src/lib/fonts/fontPreview.ts

/**
 * Dynamically load a Google Font into the page for preview.
 * Uses the CSS Font Loading API for efficient loading.
 */

const loadedFonts = new Set<string>();

/**
 * Load a single Google Font family.
 */
export function loadFontCSS(family: string, variants: string[] = ['regular', '700']): Promise<void> {
  const fontKey = `${family}:${variants.join(',')}`;

  if (loadedFonts.has(fontKey)) {
    return Promise.resolve();
  }

  // Build the Google Fonts CSS URL
  const variantStr = variants.join(',');
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${variantStr}&display=swap`;

  return new Promise((resolve, reject) => {
    // Check if link already exists
    const existing = document.querySelector(`link[href="${url}"]`);
    if (existing) {
      loadedFonts.add(fontKey);
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => {
      loadedFonts.add(fontKey);
      resolve();
    };
    link.onerror = () => reject(new Error(`Failed to load font: ${family}`));
    document.head.appendChild(link);
  });
}

/**
 * Load multiple fonts at once.
 */
export function loadMultipleFonts(fonts: { family: string; variants?: string[] }[]): Promise<void[]> {
  return Promise.all(fonts.map((f) => loadFontCSS(f.family, f.variants)));
}

/**
 * Check if a font is already loaded.
 */
export function isFontLoaded(family: string, variants?: string[]): boolean {
  const key = variants ? `${family}:${variants.join(',')}` : family;
  return loadedFonts.has(key);
}

/**
 * Get the CSS font-family string for a Google Font.
 */
export function getFontFamily(family: string): string {
  return `"${family}", sans-serif`;
}

/**
 * Get the CSS font-family string with fallback based on category.
 */
export function getFontFamilyWithFallback(family: string, category: string): string {
  const fallbacks: Record<string, string> = {
    serif: 'Georgia, serif',
    'sans-serif': 'Arial, sans-serif',
    display: 'Georgia, serif',
    handwriting: 'cursive',
    monospace: 'Courier New, monospace',
  };
  return `"${family}", ${fallbacks[category] || 'sans-serif'}`;
}
