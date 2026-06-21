# StoryForge — Complete Fix Summary
**Date**: 2026-06-18

## Problem
StoryForge desktop app failed to open when double-clicking `StoryForge.bat`. Root cause: `Module not found: Can't resolve 'fs'` — Node-only modules (`epub-gen-memory`, `pdfkit`, `ejs`) were being bundled for the client by Turbopack.

## Root Cause
Export functions in `src/lib/export/` were imported into `page.tsx` (a client component) via `await import()`. Turbopack traces ALL imports during build — including dynamic ones — and tried to bundle `fs`-dependent modules for the browser.

## Solution
Moved ALL export logic to a server-side API route at `src/app/api/export/route.ts`. The client now calls `fetch('/api/export')` instead of importing server-only modules.

## Files Changed

### Core Fix
- `src/app/api/export/route.ts` — **Created**: Server-side export handler (POST) for all 5 formats
- `src/lib/export/docx.ts` — Modified to return `Promise<Blob>` (was `void` + `saveAs`)
- `src/lib/export/pdf-print.ts` — Modified to return `Promise<Blob>` (was `void` + download trigger)
- `src/lib/export/pdf-cover.ts` — Modified to return `Promise<Blob>` (was `void` + download trigger)
- `src/components/export/ExportSettings.tsx` — `handleExport` and `handleExportAll` now use `fetch('/api/export')`
- `src/app/page.tsx` — Removed `handleExport()`, export buttons, `downloadBlob()`
- `next.config.ts` — Added `serverExternalPackages` for defense-in-depth
- `src/lib/export/pdf.ts` — **Deleted** (dead code, replaced by `pdf-print.ts`)

### Prevention
- `scripts/check-import-boundaries.js` — **Created**: Pre-flight import boundary checker
  - Scans client files for server-only imports (including dynamic `await import()`)
  - Traces relative imports through the dependency graph
  - Fails with clear error messages if violations found
- `package.json` — Added `preflight` script, gated `dev` and `build` behind preflight check
- `C:\Users\tiger\Desktop\StoryForge.bat` — Rewritten with preflight check, port conflict handling, browser launch
- `docs/postmortems/2026-06-18-fs-bundling-bug.md` — Full post-mortem with timeline, root cause, lessons

## Verification
- ✅ `npm run preflight` — Clean (23 files checked)
- ✅ `npm run build` — Passes with webpack
- ✅ `npm run build:turbopack` — Passes with Turbopack
- ✅ `next dev` — Starts and serves HTTP 200 on port 3000
- ✅ `/api/export` POST — Responds correctly

## Key Lesson
> Never import a module that transitively depends on `fs`, `path`, `child_process`, 
> or any Node built-in into a client component — even dynamically. 
> Turbopack traces ALL imports during build. 
> The only safe approach is to move that code to a server API route.
