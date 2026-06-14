# Atticus Feature Gap Analysis & Complete Build Plan

## Atticus.io Feature Set (from research)

### Writing
- [x] Purpose-built book editor (rich text) — ✅ WE HAVE THIS
- [x] Drag-and-drop chapter organization — ✅ WE HAVE THIS
- [x] Writing goals & habit tracker — ✅ WE HAVE THIS
- [x] Word counter (per chapter + total) — ✅ WE HAVE THIS
- [x] Scene/chapter hierarchy (parts → chapters → scenes) — ✅ WE HAVE THIS
- [ ] **Parts/Volumes support** — ❌ MISSING (Atticus has parts/volumes above chapters)
- [ ] **Focus mode / distraction-free writing** — ❌ MISSING
- [ ] **Typewriter scroll** — ❌ MISSING (cursor stays centered)

### Formatting
- [x] 17+ book templates with 1,200+ combinations — ⚠️ WE HAVE 3 PRESETS (need 17+)
- [x] Custom theme builder (fonts, colors, spacing) — ⚠️ BASIC (need full builder UI)
- [x] H2-H6 headings — ✅ WE HAVE THIS
- [x] Footnotes — ✅ WE HAVE THIS (basic markers)
- [x] Callout boxes — ✅ WE HAVE THIS
- [x] Full bleed images — ⚠️ NEED CSS for print export
- [x] Volumes and parts support — ❌ MISSING
- [ ] **Large print formatting** — ❌ MISSING
- [ ] **Drop caps** — ❌ MISSING
- [ ] **Scene break styling** — ❌ MISSING
- [ ] **Dedication / Copyright / TOC pages** — ❌ MISSING
- [ ] **1,500+ fonts** — ❌ MISSING (we have system fonts only)
- [ ] **Chapter start page options** — ❌ MISSING (odd/right page, any page)

### Import & Export
- [x] Import: DOCX — ✅ WE HAVE THIS
- [x] Export: EPUB — ✅ WE HAVE THIS
- [x] Export: PDF — ✅ WE HAVE THIS
- [x] Export: DOCX — ✅ WE HAVE THIS
- [ ] **Print-ready PDF with bleed marks** — ❌ MISSING
- [ ] **MOBI export** — ❌ MISSING (Kindle legacy)

### Device Preview
- [ ] iPhone preview — ❌ MISSING
- [ ] iPad preview — ❌ MISSING
- [ ] Kindle Paperwhite preview — ❌ MISSING
- [ ] Kindle Oasis preview — ❌ MISSING
- [ ] Galaxy S21 preview — ❌ MISSING
- [ ] Fire tablet preview — ❌ MISSING

### Platform
- [x] PWA (works in any browser) — ⚠️ PARTIAL (next-pwa installed but not configured)
- [x] Offline-first with local storage — ✅ WE HAVE THIS
- [ ] **Cloud backup/sync** — ❌ MISSING
- [x] Windows, Mac, Linux, Chromebook — ✅ (PWA = all platforms)

### Business Model Reference
- One-time $147 payment (no subscription)
- Lifetime updates
- 30-day money-back guarantee

---

## Priority Build Order (Phases 3-6)

### Phase 3: Formatting Engine (CRITICAL — matches Atticus core value)
1. **17+ Book Templates** — Create 17 theme presets with 1,200+ combinations
2. **Full Theme Builder UI** — Font picker (Google Fonts), color picker, spacing controls
3. **Parts/Volumes** — Add Part layer above chapters in data model
4. **Front Matter Pages** — Dedication, Copyright, TOC, About the Author
5. **Back Matter Pages** — Acknowledgments, Also By, Preview Chapter
6. **Drop Caps** — First letter styling for chapter openers
7. **Scene Break Styling** — Custom scene break graphics/ornaments
8. **Large Print Formatting** — 18pt+ font, increased line height preset

### Phase 4: Device Preview
9. **Device Preview Renderer** — iPhone, iPad, Kindle, Galaxy, Fire tablet frames
10. **Live Preview Panel** — Side-by-side device preview while editing

### Phase 5: Export Polish
11. **Print-Ready PDF** — Bleed marks, trim size options (5x8, 5.25x8, 6x9, etc.)
12. **MOBI Export** — Kindle legacy format
13. **Enhanced EPUB** — NCX navigation, cover image, metadata
14. **Batch Export** — Export all formats at once

### Phase 6: Platform & Polish
15. **PWA Configuration** — Service worker, manifest, install prompt
16. **Cloud Backup** — Firebase or simple REST API sync
17. **Focus Mode** — Distraction-free writing overlay
18. **Typewriter Scroll** — Cursor stays vertically centered
19. **Keyboard Shortcuts** — Ctrl+S, Ctrl+B, Ctrl+I, etc.
20. **Auto-save indicator** — Visual "Saved" / "Saving..." status
