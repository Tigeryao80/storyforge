# ATTICUS — Build Plan
## Canva-Duplicate Book & Visual Design Platform

> "The Canva killer for authors and creators"

---

## WHAT WE ALREADY HAVE ✅

### Working Features
| Feature | Status | Quality |
|---------|--------|---------|
| Next.js 16 + React 19 app | ✅ | Clean |
| TypeScript throughout | ✅ | Clean |
| TipTap rich text editor | ✅ | Good |
| Chapter/scene hierarchy | ✅ | Good |
| Drag-and-drop reordering | ✅ | Good |
| Zustand state management | ✅ | Good |
| Dexie (IndexedDB) offline storage | ✅ | Good |
| DOCX import | ✅ | Basic |
| DOCX export | ✅ | Basic |
| EPUB export | ✅ | Basic |
| PDF export | ✅ | Basic |
| MOBI export (lib exists) | ✅ | Untested |
| 3 book theme presets | ✅ | Basic |
| Font selector (system fonts) | ✅ | Basic |
| Theme builder (basic) | ✅ | Basic |
| Cover generator (ComfyUI) | ✅ | Experimental |
| PWA manifest + service worker | ✅ | Untested |
| Hermes AI panel | ✅ | Basic |
| Writing goals tracker | ✅ | Basic |
| Version history | ✅ | Experimental |
| Cloud backup | ✅ | Experimental |
| Import boundaries checker | ✅ | Working |
| Jest test suite | ✅ | 1 test file |

### Tech Stack (Already Installed)
```
Frontend:  Next.js 16.2.9, React 19, TypeScript 5.9
Editor:    TipTap 3.x (Document, Paragraph, Text, Heading, Image, Dropcursor)
State:     Zustand 5.x
Storage:   Dexie 4.x (IndexedDB wrapper)
PWA:       next-pwa 5.6
Desktop:   Tauri 2.x (Rust backend)
Styling:   Tailwind CSS 4.x
AI:        Hermes AI (via API), ComfyUI (local SD)
DOCX:      docx 9.x, mammoth 1.x (import)
EPUB:      epub-gen-memory 1.x
PDF:       pdfkit 0.19
Testing:   Jest 30, React Testing Library, Playwright
```

---

## WHAT'S MISSING ❌ (Build Plan)

### TIER 1: Critical (Week 1-2) — Core Design Experience

**1. Template System Overhaul (17+ Templates)**
- Current: 3 basic CSS presets
- Target: 17 professionally designed book templates
- Each template = CSS file + TipTap config + preview thumbnail
- Genre-specific: Romance, Thriller, Memoir, Fantasy, Sci-Fi, Non-Fiction, Self-Help, Poetry, Children's, Academic, Cookbook, Travel, Business, YA, New Adult, Horror, Historical Fiction
- Effort: ~2 days per template = ~34 days (parallelizable with Hermes)

**2. Google Fonts Integration (1,500+ Fonts)**
- Current: System fonts only
- Target: Full Google Fonts library with search, filtering, preview
- `googleFonts.ts` already exists — needs UI wiring
- Font pairing suggestions (heading + body combos)
- Effort: ~4 days

**3. Theme Builder UI (Full)**
- Current: Basic color/font picker
- Target: Canva-level theme customization — colors, fonts, spacing, margins, headers, footers, page backgrounds, accent colors, link colors
- Live preview panel
- Save/load custom themes
- Effort: ~5 days

**4. Parts/Volumes Support**
- Current: Flat chapter list
- Target: Parts → Chapters → Scenes hierarchy
- Data model change + UI update
- Effort: ~2 days

**5. Focus Mode**
- Current: None
- Target: Distraction-free writing overlay (typewriter mode, dimmed UI)
- Configurable: background color, font size, line height, margin width
- Effort: ~1 day

**6. Typewriter Scroll**
- Current: Standard scroll
- Target: Cursor stays vertically centered while typing
- Effort: ~4 hours

**7. Word Count Dashboard**
- Current: Basic counter (per chapter)
- Target: Per-chapter, per-scene, per-book, per-session, daily goal tracking
- Writing streak calendar
- Effort: ~2 days

---

### TIER 2: Important (Week 3-4) — Export & Preview

**8. Device Preview Renderer**
- Current: None
- Target: Live preview in iPhone, iPad, Kindle Paperwhite, Kindle Oasis, Galaxy S21, Fire Tablet frames
- Side-by-side with editor
- Effort: ~3 days

**9. Print-Ready PDF Export**
- Current: Basic PDF
- Target: Bleed marks, trim size options (5x8, 5.25x8, 6x9, 8.5x11, A4, A5)
- CMYK color support for print
- ISBN barcode insertion
- Effort: ~3 days

**10. Enhanced EPUB Export**
- Current: Basic EPUB
- Target: NCX navigation, embedded cover image, full metadata (author, ISBN, publisher, language), custom CSS per template
- Effort: ~2 days

**11. MOBI Export (Kindle Legacy)**
- Current: Code exists, untested
- Target: Working Kindle .mobi output with proper metadata
- Effort: ~4 hours

**12. Front/Back Matter Templates**
- Current: None
- Target: Dedication, Copyright Page, Table of Contents (auto-generated), About the Author, Acknowledgments, Also By, Preview Chapter (link to next book)
- Effort: ~2 days

**13. Drop Caps**
- Current: None
- Target: First letter styling for chapter openers (3-line, 4-line, decorative, raised)
- Effort: ~4 hours

**14. Scene Break Styling**
- Current: None
- Target: Custom scene break graphics — ornamental dividers, asterisks, flourishes, custom images
- Effort: ~1 day

---

### TIER 3: Polish (Week 5-6) — Platform & AI

**15. PWA Configuration**
- Current: next-pwa installed but unconfigured
- Target: Full offline support, install prompt, app icon, splash screen
- Effort: ~1 day

**16. Cloud Backup/Sync**
- Current: Experimental
- Target: Firebase or Supabase sync, restore from any device, version history with restore points
- Effort: ~3 days

**17. Brand Kit (Light)**
- Current: None
- Target: Save font + color + logo combos per book. Reuse across projects. Export/import brand settings.
- Effort: ~2 days

**18. AI Image Generation**
- Current: ComfyUI integration (experimental)
- Target: Stable Diffusion / DALL-E integration for book cover generation, chapter header images, scene illustrations
- Effort: ~3 days

**19. AI Text Generation (Enhanced)**
- Current: Hermes AI panel (basic)
- Target: In-editor AI writing assistant — continue writing, rewrite for tone, expand scene, summarize, check consistency, generate dialogue
- Effort: ~3 days

**20. Keyboard Shortcuts**
- Current: Basic shortcuts exist
- Target: Full shortcut system — Ctrl+S, Ctrl+B, Ctrl+I, Ctrl+Z, Ctrl+Shift+Z, Ctrl+1-6 (headings), Ctrl+Enter (new scene), Ctrl+Shift+N (new chapter), custom shortcut editor
- Effort: ~1 day

**21. Auto-Save Indicator**
- Current: None
- Target: Visual "Saved" / "Saving..." / "Offline" status in toolbar with last-saved timestamp
- Effort: ~4 hours

**22. Large Print Formatting**
- Current: None
- Target: 18pt+ font preset, increased line height, high contrast mode
- Effort: ~4 hours

**23. Chapter Start Page Options**
- Current: None
- Target: Start chapter on right page (odd), any page, or continuous
- Effort: ~4 hours

---

### TIER 4: Stretch Goals (Week 7+) — Canva-Adjacent Features

**24. Design Canvas (Canva Core)**
- Drag-and-drop design surface for non-book visuals — social media graphics, book trailers, promotional images
- Layers panel, alignment tools, grouping, z-index
- Export as PNG/JPG/SVG
- Effort: ~2 weeks

**25. Stock Media Integration**
- Unsplash/Pexels API for free stock photos
- For book covers, chapter headers, promotional images
- Effort: ~3 days

**26. Background Remover**
- Remove.bg API or self-hosted model
- One-click background removal for cover images
- Effort: ~2 days

**27. Image Upscaler**
- AI upscaling for low-res cover images
- Effort: ~2 days

**28. Video Editor (Basic)**
- Timeline-based video editing for book trailers
- Text overlays, transitions, music
- Effort: ~2 weeks

**29. Presentation Mode**
- Turn book content into a slide deck
- Reveal.js or custom presentation renderer
- Effort: ~1 week

**30. Collaboration (Future)**
- Real-time multi-user editing (like Google Docs)
- Comments, suggestions, track changes
- Effort: ~4 weeks (WebSockets + CRDT)

---

## TOTAL EFFORT ESTIMATE

| Tier | Scope | Estimated Time |
|------|-------|---------------|
| Tier 1 | Core Design Experience | 5-6 weeks |
| Tier 2 | Export & Preview | 3-4 weeks |
| Tier 3 | Platform & AI | 2-3 weeks |
| Tier 4 | Canva-Adjacent | 6-8 weeks |
| **TOTAL** | **Full Canva-level tool** | **4-5 months** |

---

## INSTALLATION / SETUP CHECKLIST

### Already Installed ✅
- [x] Node.js + npm
- [x] Next.js 16.2.9
- [x] React 19
- [x] TypeScript 5.9
- [x] Tailwind CSS 4
- [x] TipTap editor
- [x] Zustand
- [x] Dexie
- [x] next-pwa
- [x] docx / mammoth / epub-gen-memory / pdfkit
- [x] Jest + Playwright
- [x] Tauri CLI

### Need to Install
- [ ] **Google Fonts API key** — free, https://console.cloud.google.com → APIs → Google Fonts API → Create key
- [ ] **Firebase project** — for cloud backup, https://console.firebase.google.com → Create project → Enable Firestore + Auth
- [ ] **ComfyUI** — local AI image generation, `pip install comfyui` or use pre-built from https://github.com/comfyanonymous/ComfyUI
- [ ] **Unsplash API key** — free for stock photos, https://unsplash.com/developers → Register app
- [ ] **Remove.bg API key** — free tier 50 images/month, https://www.remove.bg/api
- [ ] **Rust** — for Tauri native modules, https://rustup.rs

### Need to Configure
- [ ] PWA manifest (`public/manifest.json` — needs app name, icons, theme color)
- [ ] Service worker (`public/sw.js` — needs caching strategy)
- [ ] Next.js config (`next.config.ts` — needs PWA config)
- [ ] Firebase config (`src/lib/firebase.ts` — needs API key, project ID)
- [ ] Google Fonts config (`src/lib/fonts/googleFonts.ts` — needs API key)
- [ ] Hermes API endpoint (`src/components/hermes/HermesPanel.tsx` — needs working API)

---

## FIRST 3 ACTIONS (Do These Now)

1. **Pick the name** — Atticus? Folio? Quill? Inkwell? Press? Your call. I'll rename everything.

2. **Set up Firebase** — Create a free Firebase project at https://console.firebase.google.com. Enable Firestore + Authentication. Give me the config keys.

3. **Install Rust** — If not already installed: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` (Mac/Linux) or https://rustup.rs (Windows). Required for Tauri.

Once you do those three things, I start writing code.
