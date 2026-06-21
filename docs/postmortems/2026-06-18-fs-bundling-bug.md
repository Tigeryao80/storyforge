# Post-Mortem: StoryForge `fs` Module Bundling Bug

**Date**: 2026-06-18
**Severity**: Critical — app completely non-functional
**Duration**: ~4 days (introduced June 14, fixed June 18)
**Root cause**: Server-only Node modules bundled for client by Turbopack

---

## Timeline

| Date | Commit | What happened |
|------|--------|---------------|
| Jun 14 | `914c352` | Project init — clean `next.config.ts`, no webpack config |
| Jun 14 | `ebdb417` | Phase 4 — Added webpack `resolve.fallback` for `fs: false` etc. **This was the correct fix at the time.** |
| Jun 14 | `3a7d923` | Phase 5 — Added KDP export (EPUB, MOBI, PDF, Cover). Added `handleExport()` with `await import()` to `page.tsx`. Added export buttons to toolbar. **Bug introduced here.** |
| Jun 15 | `20c554a` | Phase 9a — Expanded ExportSettings with tabs, KDP metadata, more PDF options. Added more dynamic imports. **Bug compounded.** |
| Jun 15 | `9635946` | Rename Atticus → StoryForge. **Webpack fallback config was removed** (likely during "all code, config" rewrite). **Bug now has no safety net.** |
| Jun 17-18 | — | Multiple fix attempts (dynamic imports, removing static imports) — all failed because Turbopack traces dynamic imports too |
| Jun 18 | Today | **Final fix**: Moved all export logic to API route (`/api/export/route.ts`). Zero server-only imports in client code. |

---

## Root Cause Analysis

### The Mistake

The original architecture had **two conflicting patterns**:

1. **Phase 4 approach (correct)**: Webpack `resolve.fallback` told the bundler "when building for client, replace `fs` with `false`." This worked because the export functions were designed to run in the browser using browser-compatible APIs (Blob, URL.createObjectURL).

2. **Phase 5 approach (broken)**: Export functions were placed in `src/lib/export/` and imported into `page.tsx` (a client component) via `await import()`. Even though these were "dynamic" imports, **Turbopack traces all imports during build** — including dynamic ones — to build the complete dependency graph. It found `epub-gen-memory` → `ejs` → `fs` and `pdfkit` → `fs`, then failed because `fs` doesn't exist in the browser.

### Why the Fix Wasn't Obvious

1. **Dynamic imports feel like they should work** — the code only runs when the user clicks a button, so intuitively it shouldn't be bundled. But Turbopack's static analysis doesn't care about runtime conditions.

2. **The webpack fallback was removed** — the safety net that would have caught this was removed during the rename refactor. Without it, there was nothing to prevent the `fs` error.

3. **The error message was misleading** — `Module not found: Can't resolve 'fs'` doesn't tell you "you're importing a server module in a client file." It looks like a missing dependency, not an architecture problem.

4. **Incremental fixes kept failing** — removing static imports, adding dynamic imports, adding `serverExternalPackages` — none of these work because Turbopack traces ALL imports regardless.

### The Fundamental Rule

> **Never import a module that transitively depends on `fs`, `path`, `child_process`, or any Node built-in into a client component — even dynamically. The only safe approach is to move that code to a server API route.**

---

## What We Built to Prevent This

### 1. API Route Architecture (`/api/export/route.ts`)
All export logic now runs on the server. The client calls `fetch('/api/export', { method: 'POST', body: JSON.stringify({ book, format }) })`. Server-only modules are never imported in client code.

### 2. `serverExternalPackages` in `next.config.ts`
Added as a defense-in-depth measure. Even if someone accidentally imports a server module in client code, Next.js will refuse to bundle it.

---

## What We Should Build: Automated Prevention

### Tool 1: Pre-flight Import Boundary Checker

A script that runs before `next dev` / `next build` that scans for server-only imports in client files:

```bash
# scripts/check-import-boundaries.js
# Scans src/app/ and src/components/ for imports of known server-only packages
# Fails the build if found
```

**How it works:**
1. Maintain a list of server-only packages: `['fs', 'path', 'child_process', 'epub-gen-memory', 'pdfkit', 'ejs', ...]`
2. Parse all `.tsx`/`.ts` files under `src/app/` and `src/components/`
3. Check both static imports and dynamic `await import()` calls
4. If a server-only package is found in a client file → **fail with clear error**

**Example output:**
```
❌ Import boundary violation found:
   src/app/page.tsx:89 — await import('@/lib/export/epub')
   └─ epub-gen-memory → ejs → fs (Node-only)
   
   Fix: Move this logic to an API route under src/app/api/
```

### Tool 2: ESLint Custom Rule

An ESLint rule that flags imports of server-only packages in client components:

```json
// .eslintrc.json
{
  "rules": {
    "no-server-imports-in-client": ["error", {
      "serverPackages": ["epub-gen-memory", "pdfkit", "ejs", "fs", "path"],
      "clientDirs": ["src/app", "src/components"]
    }]
  }
}
```

This catches the issue at edit-time in the IDE, before the developer even runs the build.

### Tool 3: CI/CD Build Gate

Add to the build pipeline:
```bash
node scripts/check-import-boundaries.js && next build
```

This prevents merging code that would break the build.

---

## Lessons Learned

1. **Turbopack traces dynamic imports** — `await import()` does NOT prevent bundling. Only API routes guarantee server-only execution.

2. **Webpack `resolve.fallback` is a band-aid** — it masks the symptom (`fs` not found) but doesn't fix the architecture. The real fix is proper client/server separation.

3. **Refactors can silently remove safety nets** — the webpack fallback was removed during the rename. Always audit config files during large refactors.

4. **"It works in dev" ≠ "It works in build"** — the dev server may handle dynamic imports differently than the production build. Always test with `next build`.

5. **Export/generation features belong on the server** — any feature that generates files (PDF, EPUB, DOCX) is inherently a server operation. Building it as a client-side feature was an architectural mistake from the start.

---

## Recommended Reading for the Team

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js serverExternalPackages](https://nextjs.org/docs/app/api-reference/next-config-js/serverExternalPackages)
- [Turbopack Module Resolution](https://nextjs.org/docs/app/api-reference/next-config-js/turbopack)
- [Webpack resolve.fallback](https://webpack.js.org/configuration/resolve/#resolvefallback)
