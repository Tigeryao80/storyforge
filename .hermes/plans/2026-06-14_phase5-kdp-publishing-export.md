# Phase 5 Plan — KDP Publishing Export (MOBI, Enhanced EPUB, Print-Ready PDF)

> Created: 2026-06-14 | Status: Planned
> Priority: CRITICAL — This is what makes StoryForge a real KDP publishing tool

## Context
StoryForge.io's core value is one-click export to KDP-ready formats. Our rebuild must match or exceed this. The publishing pipeline (`PUBLISHING_DIRECTIVES.md`) requires EPUB, MOBI, and PDF exports that pass KDP compliance checks.

## KDP Format Requirements

### eBook (Kindle)
- **EPUB** (preferred): reflowable, NCX navigation, embedded cover, metadata
- **MOBI** (legacy): still accepted, uses Amazon's older format
- Cover: separate file, 1:1.6 ratio (e.g., 1600×2560px)

### Paperback
- **PDF**: print-ready with bleed marks, trim size, proper margins
- Trim sizes: 5×8, 5.25×8, 5.5×8.5, 6×9, 6.14×9.21, 7×10, 8×10, 8.5×11
- Bleed: 0.125" on all sides
- Spine: calculated from page count (0.002252" per page B&W)
- Gutter: 0.5" minimum, 0.75"+ recommended for thick books

## Tasks

### Task 5.1: Enhanced EPUB Export
- Add NCX navigation (table of contents for e-readers)
- Embed cover image support (base64 or URL)
- Add full metadata (title, author, publisher, language, ISBN field, description)
- Add chapter-level TOC entries
- Validate against KDP EPUB requirements

### Task 5.2: MOBI Export
- Use `kindlegen` or `ebook-convert` (calibre) approach
- Since these are CLI tools, provide a "Download MOBI" button that:
  1. Generates EPUB first
  2. Uses a serverless function or instructs user to use calibre
- Alternative: Use `mobi` npm package (JS-based MOBI generator)
- Add to export menu in page.tsx

### Task 5.3: Print-Ready PDF with Bleed Marks
- Extend pdfkit export with:
  - Trim size selection (dropdown: 5×8, 6×9, etc.)
  - Bleed marks (crop marks at 0.125" offset)
  - Page numbers (footer, centered or outside)
  - Chapter start on right-hand page (odd page)
  - Gutter margin adjustment based on trim size + page count
  - Font embedding (subset)
- Add print preview in DevicePreview component

### Task 5.4: KDP Cover PDF Generator
- Calculate spine width from page count
- Generate full cover PDF (front + spine + back) with bleed
- Allow cover image upload
- Preview cover with spine visualization

### Task 5.5: Export Settings Panel
- Create `src/components/export/ExportSettings.tsx` modal
- Settings: format, trim size, bleed, include TOC, include cover, font embedding
- One-click "Export for KDP" button that generates all required files
