# ATTICUS REBUILD — Project Blueprint

## Objective
Build a web-based book writing & formatting application inspired by Atticus (atticus.io).
Target: PWA that works offline, exports to EPUB/PDF/DOCX, with professional book formatting.

## Feature Parity Target (from atticus.io)

### Writing
- [ ] Purpose-built book editor (rich text, not plain markdown)
- [ ] Drag-and-drop chapter organization
- [ ] Writing goals & habit tracker
- [ ] Word counter (per chapter + total)
- [ ] Scene/chapter hierarchy (parts → chapters → scenes)

### Formatting
- [ ] 17+ book templates with 1,200+ combinations
- [ ] Custom theme builder (fonts, colors, spacing)
- [ ] H2-H6 headings, footnotes, callout boxes
- [ ] Full bleed images
- [ ] Volumes and parts support
- [ ] Large print formatting

### Import & Export
- [ ] Import: DOCX files
- [ ] Export: EPUB, PDF, DOCX
- [ ] Device preview (iPhone, iPad, Kindle, etc.)

### Platform
- [ ] PWA (works in any browser)
- [ ] Offline-first with local storage
- [ ] Cloud backup/sync
- [ ] Windows, Mac, Linux, Chromebook support

### Business Model Reference
- One-time $147 payment (no subscription)
- Lifetime updates
- 30-day money-back guarantee

## Tech Stack Decision

### Option A: Electron + React (Desktop-first)
- Pros: Full filesystem access, native PDF/EPUB generation, offline by default
- Cons: Larger download, separate builds per platform

### Option B: PWA + Next.js (Web-first)
- Pros: No install required, auto-updates, works everywhere
- Cons: Limited filesystem access, requires service worker for offline

### Option C: Tauri + React (Recommended)
- Pros: Smaller than Electron, native performance, full filesystem access, PWA-like
- Cons: Newer ecosystem, Rust learning curve for native modules

**RECOMMENDED: Option C (Tauri + React + TypeScript)**
- Tauri for desktop shell (smaller than Electron)
- React + TypeScript for UI
- Rust backend for file operations (DOCX import/export, EPUB generation)
- PWA fallback for browser-only users

## Architecture

```
atticus-rebuild/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── editor/             # Rich text editor module
│   ├── chapters/           # Chapter management
│   ├── themes/             # Template/theme system
│   ├── export/             # Export logic (EPUB, PDF, DOCX)
│   ├── preview/            # Device preview renderer
│   └── store/              # State management
├── src-tauri/              # Tauri/Rust backend
│   ├── src/                # Rust source
│   └── Cargo.toml
├── public/                 # Static assets
├── docs/                   # Documentation
└── tests/                  # Test suites
```

## Execution Plan

### Phase 1: Foundation
1. Scaffold Tauri + React + TypeScript project
2. Set up project structure
3. Configure build pipeline

### Phase 2: Editor Core
4. Integrate rich text editor (TipTap / Slate / ProseMirror)
5. Implement chapter/scene tree structure
6. Add drag-and-drop reordering
7. Word counter

### Phase 3: Formatting Engine
8. Build theme system (CSS-in-JS templates)
9. Implement 3 starter templates
10. Add heading styles, footnotes, callout boxes

### Phase 4: Import/Export
11. DOCX import
12. EPUB export
13. PDF export
14. DOCX export

### Phase 5: Platform & Polish
15. PWA configuration
16. Offline storage (IndexedDB)
17. Cloud backup
18. Device preview renderer
19. Writing goals tracker

## First Micro-Step
→ Scaffold the Tauri + React + TypeScript project
