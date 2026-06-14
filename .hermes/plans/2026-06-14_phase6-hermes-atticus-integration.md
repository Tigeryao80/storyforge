# Phase 6: Hermes ↔ Atticus Integration

**Goal:** Connect Hermes AI agent to Atticus so Hermes can write stories directly into Atticus with proper formatting, and Atticus auto-formats everything for zero-friction novel publishing.

**Profile:** coder (DeepSeek V4 Pro primary, GPT-5.4 Mini fallback, Owl Alpha fallback 2)
**Workflow:** plan → writing-plans → subagent-driven-development → review → hindsight

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      HERMES AGENT                           │
│  - Writes chapters, scenes, dialogue, descriptions          │
│  - Understands Atticus book structure (H1-H6, parts, etc.)  │
│  - Calls Atticus tools via MCP or file bridge               │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
     ┌────▼────┐  ┌────▼────┐  ┌───▼──────┐
     │  File   │  │  Local  │  │   MCP    │
     │ Bridge  │  │  API    │  │  Server  │
     │ (JSON)  │  │ (REST)  │  │(Protocol)│
     └────┬────┘  └────┬────┘  └───┬──────┘
          │            │            │
          └────────────┼────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      ATTICUS APP                            │
│  - Receives structured content from Hermes                  │
│  - Auto-formats: headers, themes, TOC, page breaks          │
│  - Exports: EPUB, PDF, MOBI, DOCX (KDP compliant)           │
│  - Stores: IndexedDB (local) + .atticus JSON (portable)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Task Breakdown

### Task 1: Hermes Atticus Writing Skill (P0 — Foundation)
**File:** `~/.hermes/skills/atticus-writing/SKILL.md`
**Assignee:** coder profile (writing-plans skill)

Create a Hermes skill that teaches the agent:
- Atticus book data model (Book → Parts → Chapters → Scenes)
- Header hierarchy rules (H1=chapter, H2=scene, H3-H6=subsections)
- Front matter vs body vs back matter structure
- Formatting rules (callout boxes, block quotes, dialogue)
- How to output `.atticus` JSON format
- How to call Atticus API/MCP tools

**Acceptance Criteria:**
- [ ] Skill file created with complete formatting rules
- [ ] Hermes can generate a full chapter with correct H1/H2/H3 structure
- [ ] Hermes output validates against Atticus JSON schema
- [ ] Skill includes examples of well-formatted novel content

---

### Task 2: Atticus Import API (P0 — Core Bridge)
**New files:**
- `src/lib/api/bookImport.ts` — import parser/validator
- `src/lib/api/types.ts` — API type definitions

**Modified files:**
- `src/store/bookStore.ts` — add `importBook()`, `importChapter()`, `importScene()` actions
- `src/types/book.ts` — add `BookImport`, `ChapterImport`, `SceneImport` types

Create an API layer that accepts Hermes-generated content:

```typescript
// Import a full book from Hermes
function importBook(data: BookImport): void

// Import a single chapter (append or replace)
function importChapter(chapter: ChapterImport, position?: number): void

// Import a scene into an existing chapter
function importScene(chapterId: string, scene: SceneImport): void
```

**Validation rules:**
- H1 tags → chapter titles
- H2 tags → scene breaks
- H3-H6 → subsections within scenes
- `<div data-callout-type="info|warning|tip">` → callout blocks
- `<blockquote>` → block quotes

**Acceptance Criteria:**
- [ ] `importBook()` creates full book with chapters, scenes, correct structure
- [ ] `importChapter()` adds chapter at correct position, reorders existing
- [ ] `importScene()` adds scene to specified chapter
- [ ] HTML content is sanitized (no script tags, no inline styles)
- [ ] Word counts auto-calculated on import
- [ ] All existing tests still pass

---

### Task 3: Hermes → Atticus File Bridge (P0 — Works Today)
**New files:**
- `src/lib/bridge/hermesBridge.ts` — watches for `.atticus` files, auto-imports
- `src/components/import/HermesImportButton.tsx` — UI button to import from Hermes

**Modified files:**
- `src/app/page.tsx` — add Hermes Import button to toolbar

This is the simplest bridge: Hermes writes a `.atticus` JSON file → Atticus imports it.

```typescript
// hermesBridge.ts
export function parseHermesFile(jsonString: string): BookImport {
  // Validate and parse Hermes-generated .atticus JSON
  // Return BookImport object ready for importBook()
}

export function watchForHermesFiles(callback: (book: BookImport) => void): void {
  // Optional: watch a directory for new .atticus files
}
```

**Acceptance Criteria:**
- [ ] Hermes Import button in toolbar
- [ ] File picker selects `.atticus` JSON files
- [ ] Parsed content creates proper book structure in Atticus
- [ ] Invalid JSON shows user-friendly error message
- [ ] Import preserves all formatting (headers, callouts, block quotes)

---

### Task 4: Formatting Rules Engine (P1 — Auto-Format)
**New files:**
- `src/lib/formatting/rules.ts` — formatting rule definitions
- `src/lib/formatting/validator.ts` — validates book structure
- `src/lib/formatting/autoFix.ts` — auto-fixes formatting issues

**Modified files:**
- `src/store/bookStore.ts` — add `validateFormatting()`, `autoFormat()` actions

```typescript
// rules.ts
export const FORMATTING_RULES = {
  chapterTitle: { tag: 'h1', required: true, maxPerScene: 1 },
  sceneBreak: { tag: 'h2', required: false, maxPerScene: 1 },
  subsections: { tags: ['h3', 'h4', 'h5', 'h6'], required: false },
  calloutTypes: ['info', 'warning', 'tip'],
  blockQuote: { tag: 'blockquote', required: false },
  pageBreak: { beforeChapter: true, beforePart: true },
} as const;

// validator.ts
export interface FormattingIssue {
  type: 'error' | 'warning';
  chapterId?: string;
  sceneId?: string;
  message: string;
  autoFixable: boolean;
}

export function validateBook(book: Book): FormattingIssue[] {
  // Check: every chapter has H1 title
  // Check: no duplicate H1 in same scene
  // Check: header hierarchy (no H3 without H2)
  // Check: callout types are valid
  // Check: chapters have content
  // Check: scenes have content
  // Return list of issues
}

// autoFix.ts
export function autoFixBook(book: Book, issues: FormattingIssue[]): Book {
  // Auto-fix: add missing H1, fix header order, normalize callouts
  // Return corrected book
}
```

**Acceptance Criteria:**
- [ ] `validateBook()` detects all formatting issues
- [ ] `autoFixBook()` fixes auto-fixable issues
- [ ] Formatting issues shown in sidebar (new component)
- [ ] "Fix All" button applies auto-fixes
- [ ] KDP compliance check (trim size, bleed, TOC, copyright page)

---

### Task 5: Hermes Writing Dashboard (P1 — UI)
**New files:**
- `src/components/hermes/HermesPanel.tsx` — sidebar panel for Hermes integration
- `src/components/hermes/ChapterOutline.tsx` — AI-generated chapter outline
- `src/components/hermes/WritingPrompt.tsx` — writing prompt display

**Modified files:**
- `src/app/page.tsx` — add Hermes panel to sidebar

A UI panel that shows:
- Book outline (AI-generated chapter summaries)
- Writing prompts for next chapter
- Hermes writing status (idle/writing/done)
- Quick actions: "Write Next Chapter", "Review Continuity", "Auto-Format"

**Acceptance Criteria:**
- [ ] Hermes panel visible in sidebar
- [ ] Shows current book outline with chapter titles
- [ ] "Write Next Chapter" button triggers Hermes writing flow
- [ ] Writing status indicator (idle/writing/done/error)
- [ ] Chapter count, word count, progress displayed

---

### Task 6: Focus Mode + Typewriter Scroll + Keyboard Shortcuts (P1 — Editor UX)
**New files:**
- `src/components/editor/FocusMode.tsx` — distraction-free overlay
- `src/hooks/useKeyboardShortcuts.ts` — keyboard shortcut handler

**Modified files:**
- `src/components/editor/SceneEditor.tsx` — add typewriter scroll, focus mode
- `src/components/editor/Toolbar.tsx` — add H4/H5/H6 buttons
- `src/app/page.tsx` — add focus mode toggle, keyboard shortcuts

**Features:**
- **Focus Mode:** Full-screen editor, hides sidebar/toolbar, dims everything else
- **Typewriter Scroll:** Cursor stays centered vertically while typing
- **Keyboard Shortcuts:**
  - `Ctrl+S` — save (trigger auto-save)
  - `Ctrl+B` — bold
  - `Ctrl+I` — italic
  - `Ctrl+U` — underline
  - `Ctrl+1-6` — H1-H6 headings
  - `Ctrl+Shift+K` — insert callout
  - `Ctrl+Shift+F` — toggle focus mode
  - `Ctrl+Shift+E` — open export modal
- **H4/H5/H6 buttons** in toolbar (currently only H2/H3)
- **Auto-save indicator** in status bar ("Saved" / "Saving..." / "Unsaved changes")

**Acceptance Criteria:**
- [ ] Focus mode toggle in toolbar (icon: eye/distraction-free)
- [ ] Focus mode hides sidebar, dims toolbar, centers editor
- [ ] Typewriter scroll keeps cursor centered
- [ ] All keyboard shortcuts work
- [ ] H4/H5/H6 buttons in toolbar
- [ ] Auto-save indicator shows real-time status
- [ ] All existing tests still pass

---

### Task 7: Book Version History (P2 — Version Control)
**New files:**
- `src/lib/db/versionHistory.ts` — version history storage
- `src/components/history/VersionHistory.tsx` — version history UI

**Modified files:**
- `src/store/bookStore.ts` — add `saveVersion()`, `restoreVersion()`, `listVersions()` actions
- `src/types/book.ts` — add `BookVersion` type

```typescript
export interface BookVersion {
  id: string;
  bookId: string;
  snapshot: Book;  // full book snapshot
  createdAt: string;
  label: string;   // e.g., "Before Hermes edit", "Chapter 5 complete"
  wordCount: number;
}

// Auto-save version on:
// - Hermes import
// - Chapter completion (word count goal reached)
// - Manual "Save Version" button
// - Before auto-format
```

**Acceptance Criteria:**
- [ ] Versions stored in IndexedDB
- [ ] Auto-version on Hermes import
- [ ] Manual "Save Version" button in toolbar
- [ ] Version history panel shows list with timestamps
- [ ] Click version to preview, click "Restore" to revert
- [ ] Max 50 versions (oldest auto-deleted)

---

### Task 8: Enhanced Footnotes + Per-Chapter Themes (P2 — Polish)
**New files:**
- `src/lib/tiptap/footnote.ts` — TipTap footnote extension
- `src/components/editor/FootnoteEditor.tsx` — footnote editing UI

**Modified files:**
- `src/types/book.ts` — add `themeOverride` to Chapter
- `src/store/bookStore.ts` — add `setChapterTheme()` action
- `src/components/themes/ThemeSelector.tsx` — add per-chapter theme override
- `src/lib/export/epub.ts` — use per-chapter themes in export
- `src/lib/export/pdf-print.ts` — use per-chapter themes in export

**Features:**
- **Footnotes:** Click to add footnote, auto-numbered, rendered at chapter end
- **Per-Chapter Themes:** Override global theme for specific chapters (e.g., prologue in different font)

**Acceptance Criteria:**
- [ ] Footnote extension works in TipTap editor
- [ ] Footnotes render at bottom of chapter in preview
- [ ] Footnotes included in EPUB/PDF export
- [ ] Per-chapter theme override in chapter settings
- [ ] Export uses per-chapter themes correctly

---

## File Inventory

### New Files (12)
1. `~/.hermes/skills/atticus-writing/SKILL.md`
2. `src/lib/api/bookImport.ts`
3. `src/lib/api/types.ts`
4. `src/lib/bridge/hermesBridge.ts`
5. `src/components/import/HermesImportButton.tsx`
6. `src/lib/formatting/rules.ts`
7. `src/lib/formatting/validator.ts`
8. `src/lib/formatting/autoFix.ts`
9. `src/components/hermes/HermesPanel.tsx`
10. `src/components/hermes/ChapterOutline.tsx`
11. `src/components/hermes/WritingPrompt.tsx`
12. `src/components/editor/FocusMode.tsx`
13. `src/hooks/useKeyboardShortcuts.ts`
14. `src/lib/db/versionHistory.ts`
15. `src/components/history/VersionHistory.tsx`
16. `src/lib/tiptap/footnote.ts`
17. `src/components/editor/FootnoteEditor.tsx`

### Modified Files (10)
1. `src/types/book.ts` — add import types, BookVersion, chapter theme override
2. `src/store/bookStore.ts` — add import, formatting, version actions
3. `src/app/page.tsx` — add Hermes panel, focus mode, shortcuts, version button
4. `src/components/editor/SceneEditor.tsx` — typewriter scroll, focus mode
5. `src/components/editor/Toolbar.tsx` — H4/H5/H6 buttons
6. `src/components/sidebar/ChapterTree.tsx` — per-chapter theme indicator
7. `src/components/themes/ThemeSelector.tsx` — per-chapter theme override
8. `src/lib/export/epub.ts` — per-chapter themes
9. `src/lib/export/pdf-print.ts` — per-chapter themes
10. `tests/store/bookStore.test.ts` — tests for new actions

---

## Execution Order

**Wave 1 (Parallel — P0):**
- Task 1: Hermes Atticus Writing Skill (skill creation)
- Task 2: Atticus Import API (backend)
- Task 3: Hermes File Bridge (frontend)

**Wave 2 (Parallel — P1):**
- Task 4: Formatting Rules Engine
- Task 5: Hermes Writing Dashboard
- Task 6: Focus Mode + Typewriter Scroll + Keyboard Shortcuts

**Wave 3 (Parallel — P2):**
- Task 7: Book Version History
- Task 8: Enhanced Footnotes + Per-Chapter Themes

**Wave 4 (Sequential):**
- Full integration test: Hermes writes chapter → Atticus imports → formats → exports
- TypeScript zero errors
- All tests passing
- Build successful
- Git commit per task
- Vault sync

---

## Acceptance Criteria (Phase Complete)

- [ ] Hermes can write a full chapter with correct H1/H2/H3 structure
- [ ] Hermes output imports into Atticus with zero manual formatting
- [ ] Formatting validator detects and auto-fixes issues
- [ ] Focus mode, typewriter scroll, keyboard shortcuts all work
- [ ] H4/H5/H6 buttons in toolbar
- [ ] Auto-save indicator in status bar
- [ ] Version history saves/restores book snapshots
- [ ] Footnotes work in editor and export
- [ ] Per-chapter theme override works
- [ ] TypeScript: zero errors
- [ ] Tests: all passing (existing + new)
- [ ] Build: `next build --webpack` successful
- [ ] Git: each task committed separately
- [ ] Vault: synced

---

## Hermes Skill: Atticus Writing Format (Summary for Task 1)

The skill teaches Hermes these rules:

```
ATTICUS FORMATTING RULES:
─────────────────────────
H1 = Chapter title (one per chapter, centered)
H2 = Scene break (one per scene, bold)
H3 = Section header (within scene, italic)
H4-H6 = Subsections (decreasing emphasis)

STRUCTURE:
- Front Matter: dedication, preface, foreword, TOC
- Body: chapters with scenes
- Back Matter: acknowledgments, author bio, glossout

CALLOUT BOXES:
<div data-callout-type="info">Info text</div>
<div data-callout-type="warning">Warning text</div>
<div data-callout-type="tip">Tip text</div>

BLOCK QUOTES:
<blockquote>Quoted text</div>

DIALOGUE:
Use standard paragraph format with em-dashes or quotation marks
(no special formatting needed)

OUTPUT FORMAT:
.atticus JSON matching the Book type in src/types/book.ts
```
