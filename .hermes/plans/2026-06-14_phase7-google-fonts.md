# Phase 7: Google Fonts Integration

**Goal:** Integrate 1,500+ Google Fonts into Atticus so users can choose from the full Google Fonts library for their book's body text, headings, and accents.

**Profile:** coder (DeepSeek V4 Pro primary)
**Workflow:** plan → subagent-driven-development → review → hindsight

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Google Fonts API                    │
│  https://www.googleapis.com/webfonts/v1/webfonts    │
│  Key: AIzaSy... (free, 100k requests/day)            │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  Font    │  │  Font    │  │  Font    │
   │  Fetch   │  │  Preview │  │  Apply   │
   │  Service │  │  Render  │  │  to Theme│
   └──────────┘  └──────────┘  └──────────┘
          │            │            │
          └────────────┼────────────┘
                       │
              ┌────────▼────────┐
              │  Theme System   │
              │  (bookStore)    │
              └─────────────────┘
```

---

## Tasks

### Task 1: Google Fonts API Service
**New file:** `src/lib/fonts/googleFonts.ts`

Create a service that:
1. Fetches the full Google Fonts list (sorted by popularity)
2. Caches results in localStorage (refresh every 24h)
3. Provides search/filter by name, category (serif, sans-serif, display, handwriting, monospace)
4. Provides pagination (50 fonts per page)
5. Lazy-loads font previews using the CSS API

```typescript
interface GoogleFont {
  family: string;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>; // variant -> URL
  popularity: number;
}

async function fetchGoogleFonts(sortBy: 'popularity' | 'trending' | 'alpha'): Promise<GoogleFont[]>
async function searchFonts(query: string): Promise<GoogleFont[]>
function loadFontCSS(fontFamily: string, variants?: string[]): Promise<void>
```

### Task 2: Font Selector Component
**New file:** `src/components/themes/FontSelector.tsx`

A searchable, paginated font picker modal:
- Search box (fuzzy search)
- Category filter tabs (all, serif, sans-serif, display, handwriting, monospace)
- Font preview cards (renders actual font via CSS)
- Pagination (50 per page, infinite scroll)
- "My Fonts" section (recently used)
- Sort options (popularity, trending, alphabetical)

### Task 3: Font Preview Rendering
**New file:** `src/lib/fonts/fontPreview.ts`

Loads Google Fonts dynamically into the page for preview:
- Uses `WebFontLoader` or direct CSS `@import`
- Preloads only visible fonts (lazy loading)
- Renders preview text: "The quick brown fox jumps over the lazy dog"
- Shows font name, category, sample preview

### Task 4: Apply Fonts to Theme
**Modified files:** `src/components/themes/ThemeSelector.tsx`, `src/components/themes/ThemeBuilder.tsx`

- Add "Body Font" and "Heading Font" selectors in ThemeBuilder
- Show font preview in the theme builder live preview
- Update `BookTheme` to store Google Font metadata (family, category, variants)
- Apply font-family via inline style on editor content area

### Task 5: Export with Embedded Fonts
**Modified files:** `src/lib/export/epub.ts`, `src/lib/export/pdf-print.ts`, `src/lib/export/docx.ts`

- EPUB: Embed Google Font files in the EPUB archive, reference in CSS
- PDF: Register fonts with pdfkit for print PDF
- DOCX: Reference font in Word styles

---

## API Key

The Google Fonts API is **free** — no API key required for read access.

Endpoint: `https://www.googleapis.com/webfonts/v1/webfonts`
Auth: None for public data (or optional API key for higher rate limits)

---

## File Inventory

### New Files (4)
1. `src/lib/fonts/googleFonts.ts`
2. `src/lib/fonts/fontPreview.ts`
3. `src/components/themes/FontSelector.tsx`

### Modified Files (4)
1. `src/components/themes/ThemeSelector.tsx`
2. `src/components/themes/ThemeBuilder.tsx`
3. `src/lib/export/epub.ts`
4. `src/lib/export/pdf-print.ts`
5. `src/lib/export/docx.ts`

---

## Execution Order
1. Task 1: Google Fonts API service (foundation)
2. Task 3: Font preview rendering (prerequisite for Task 2)
3. Task 2: Font selector UI (search, filter, preview, paginate)
4. Task 4: Apply fonts to theme system
5. Task 5: Font embedding in exports

## Acceptance Criteria
- [ ] 1,500+ Google Fonts loadable from API
- [ ] Search and filter by name/category
- [ ] Font preview renders actual typeface
- [ ] Selectable as body font and heading font
- [ ] Fonts apply in editor live preview
- [ ] Fonts embed in EPUB export
- [ ] Fonts work in PDF export
- [ ] TypeScript: zero errors
- [ ] Tests: all passing
- [ ] Build: successful
