# Phase 1: Foundation — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Establish the core project infrastructure — verify build pipeline, add missing config, set up testing, and ensure the existing codebase compiles cleanly.

**Architecture:** Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS 4. Zustand for state management. TipTap 3 for rich text editing. All client-side (no server yet).

**Tech Stack:** Next.js 16.2.9, React 19.2, TypeScript 5.9, Tailwind CSS 4.1, Zustand 5, TipTap 3, Jest 30, Playwright

**Current State:** Project scaffold exists with basic types, store, editor component, sidebar, and DOCX export. node_modules installed. Build not yet verified. No tests exist. No PWA config. No drag-and-drop.

---

## Task 1: Verify Build Pipeline

**Objective:** Ensure the existing codebase compiles and runs without errors.

**Files:**
- Verify: `package.json`
- Verify: `tsconfig.json`
- Verify: `next.config.ts`

**Step 1: Run type check**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npx tsc --noEmit 2>&1`
Expected: No errors (or list existing errors to fix)

**Step 2: Run production build**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npm run build 2>&1`
Expected: Build completes successfully

**Step 3: Fix any build errors**

If build fails, fix errors. Common issues to check:
- Missing type declarations (`@types/*` packages)
- Import path issues (`@/*` alias)
- Missing `next-env.d.ts`

**Step 4: Verify dev server starts**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && timeout 15 npm run dev 2>&1 || true`
Expected: "Ready in Xms" message

**Step 5: Commit**

```bash
cd /c/Users/tiger/hermes-workspace/storyforge-rebuild
git add -A
git commit -m "chore: verify build pipeline and fix any errors"
```

---

## Task 2: Add Missing next-env.d.ts

**Objective:** Ensure TypeScript recognizes Next.js types.

**Files:**
- Create: `next-env.d.ts`

**Step 1: Check if file exists**

Run: `ls /c/Users/tiger/hermes-workspace/storyforge-rebuild/next-env.d.ts 2>&1`

**Step 2: Create if missing**

If the file doesn't exist, create `next-env.d.ts`:

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

**Step 3: Commit**

```bash
cd /c/Users/tiger/hermes-workspace/storyforge-rebuild
git add next-env.d.ts
git commit -m "chore: add next-env.d.ts for Next.js TypeScript support"
```

---

## Task 3: Set Up Jest Testing Infrastructure

**Objective:** Configure Jest with TypeScript support for unit testing.

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json` (verify test script)

**Step 1: Create jest.config.ts**

Create file `jest.config.ts`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

export default config;
```

**Step 2: Create jest.setup.ts**

Create file `jest.setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

**Step 3: Verify test script in package.json**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && cat package.json | grep '"test"'`
Expected: `"test": "jest"` exists

**Step 4: Run tests to verify setup**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npm test 2>&1`
Expected: "No tests found" (setup works, no tests yet)

**Step 5: Commit**

```bash
cd /c/Users/tiger/hermes-workspace/storyforge-rebuild
git add jest.config.ts jest.setup.ts
git commit -m "chore: configure Jest with TypeScript and jsdom"
```

---

## Task 4: Write First Store Tests (TDD)

**Objective:** Add unit tests for the Zustand book store — the core data layer.

**Files:**
- Create: `tests/store/bookStore.test.ts`

**Step 1: Write failing test**

Create file `tests/store/bookStore.test.ts`:

```typescript
import { useBookStore } from '@/src/store/bookStore';

describe('bookStore', () => {
  beforeEach(() => {
    useBookStore.setState({
      book: {
        id: 'test-id',
        title: 'Test Book',
        author: 'Test Author',
        chapters: [
          {
            id: 'ch-1',
            title: 'Chapter 1',
            order: 0,
            collapsed: false,
            scenes: [
              {
                id: 'sc-1',
                title: 'Scene 1',
                content: 'Hello world content here',
                wordCount: 4,
                order: 0,
              },
            ],
          },
        ],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        wordCountGoal: 80000,
      },
      activeChapterId: 'ch-1',
      activeSceneId: 'sc-1',
      sidebarOpen: true,
    });
  });

  it('should calculate total word count', () => {
    const count = useBookStore.getState().getTotalWordCount();
    expect(count).toBe(4);
  });

  it('should add a chapter', () => {
    const initialCount = useBookStore.getState().book.chapters.length;
    useBookStore.getState().addChapter();
    expect(useBookStore.getState().book.chapters.length).toBe(initialCount + 1);
  });

  it('should remove a chapter', () => {
    // Add a second chapter first
    useBookStore.getState().addChapter();
    const count = useBookStore.getState().book.chapters.length;
    const secondChapterId = useBookStore.getState().book.chapters[1].id;
    useBookStore.getState().removeChapter(secondChapterId);
    expect(useBookStore.getState().book.chapters.length).toBe(count - 1);
  });

  it('should not remove the last chapter', () => {
    // Remove all but one chapter
    const chapters = useBookStore.getState().book.chapters;
    // Try to remove the only chapter
    const onlyChapterId = chapters[0].id;
    useBookStore.getState().removeChapter(onlyChapterId);
    expect(useBookStore.getState().book.chapters.length).toBe(1);
  });

  it('should update scene content and word count', () => {
    useBookStore.getState().updateSceneContent('ch-1', 'sc-1', 'New content with five words here');
    const scene = useBookStore.getState().book.chapters[0].scenes[0];
    expect(scene.wordCount).toBe(5);
  });

  it('should toggle chapter collapse', () => {
    const chapterId = 'ch-1';
    const initial = useBookStore.getState().book.chapters[0].collapsed;
    useBookStore.getState().toggleChapterCollapse(chapterId);
    expect(useBookStore.getState().book.chapters[0].collapsed).toBe(!initial);
  });

  it('should set active chapter and auto-select first scene', () => {
    useBookStore.getState().addChapter();
    const newChapterId = useBookStore.getState().book.chapters[1].id;
    useBookStore.getState().setActiveChapter(newChapterId);
    expect(useBookStore.getState().activeChapterId).toBe(newChapterId);
    expect(useBookStore.getState().activeSceneId).not.toBeNull();
  });
});
```

**Step 2: Run tests to verify**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npm test 2>&1`
Expected: All 7 tests PASS

**Step 3: Commit**

```bash
cd /c/Users/tiger/hermes-workspace/storyforge-rebuild
git add tests/store/bookStore.test.ts
git commit -m "test: add unit tests for bookStore (7 tests)"
```

---

## Task 5: Add DOCX Import (mammoth integration)

**Objective:** Implement DOCX file import using the already-installed mammoth package.

**Files:**
- Create: `src/lib/import/docx.ts`
- Create: `src/components/import/DocxImportButton.tsx`

**Step 1: Create DOCX import utility**

Create file `src/lib/import/docx.ts`:

```typescript
import mammoth from 'mammoth';
import type { Book, Chapter, Scene } from '@/types/book';
import { v4 as uuidv4 } from 'uuid';

function htmlToScenes(html: string): Scene[] {
  // Split HTML by h2 tags into scenes
  const scenes: Scene[] = [];
  const parts = html.split(/<h2[^>]*>/i);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.trim()) continue;

    // Extract title from h2
    const titleMatch = part.match(/^([^<]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `Scene ${i + 1}`;

    // Remove h2 tag content from body
    const content = part.replace(/^[^<]+/, '').trim();
    const plainText = content.replace(/<[^>]+>/g, '').trim();
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

    scenes.push({
      id: uuidv4(),
      title,
      content: content || '<p>Start writing...</p>',
      wordCount,
      order: scenes.length,
    });
  }

  // If no h2 splits found, create single scene
  if (scenes.length === 0) {
    const plainText = html.replace(/<[^>]+>/g, '').trim();
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
    scenes.push({
      id: uuidv4(),
      title: 'Imported Content',
      content: html || '<p>Start writing...</p>',
      wordCount,
      order: 0,
    });
  }

  return scenes;
}

export async function importDocx(file: File): Promise<Book> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  // Split by h1 tags into chapters
  const chapters: Chapter[] = [];
  const chapterParts = html.split(/<h1[^>]*>/i);

  for (let i = 0; i < chapterParts.length; i++) {
    const part = chapterParts[i];
    if (!part.trim()) continue;

    const titleMatch = part.match(/^([^<]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `Chapter ${i + 1}`;
    const content = part.replace(/^[^<]+/, '').trim();

    chapters.push({
      id: uuidv4(),
      title,
      scenes: htmlToScenes(content),
      order: chapters.length,
      collapsed: false,
    });
  }

  // If no h1 splits, treat entire doc as one chapter
  if (chapters.length === 0) {
    chapters.push({
      id: uuidv4(),
      title: file.name.replace('.docx', ''),
      scenes: htmlToScenes(html),
      order: 0,
      collapsed: false,
    });
  }

  const now = new Date().toISOString();
  const totalWords = chapters.reduce(
    (t, ch) => t + ch.scenes.reduce((ct, s) => ct + s.wordCount, 0),
    0
  );

  return {
    id: uuidv4(),
    title: file.name.replace('.docx', ''),
    author: '',
    chapters,
    createdAt: now,
    updatedAt: now,
    wordCountGoal: Math.max(80000, totalWords),
  };
}
```

**Step 2: Create import button component**

Create file `src/components/import/DocxImportButton.tsx`:

```typescript
'use client';

import { useRef } from 'react';
import { importDocx } from '@/lib/import/docx';
import { useBookStore } from '@/store/bookStore';

export default function DocxImportButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setBook = useBookStore((s) => s.book);
  const setActiveChapter = useBookStore((s) => s.setActiveChapter);
  const setActiveScene = useBookStore((s) => s.setActiveScene);

  // We need to use getState for the full store access
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedBook = await importDocx(file);
      // Replace the entire book in store
      useBookStore.setState({
        book: importedBook,
        activeChapterId: importedBook.chapters[0]?.id ?? null,
        activeSceneId: importedBook.chapters[0]?.scenes[0]?.id ?? null,
      });
    } catch (err) {
      console.error('Failed to import DOCX:', err);
      alert('Failed to import file. Please try a valid .docx file.');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        onChange={handleImport}
        className="hidden"
        id="docx-import"
      />
      <label
        htmlFor="docx-import"
        className="text-sm text-gray-500 hover:text-blue-600 cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
      >
        Import DOCX
      </label>
    </>
  );
}
```

**Step 3: Add import button to toolbar**

Modify `src/app/page.tsx` — add the import button in the toolbar:

In the `<header>` section, after the sidebar toggle button, add:

```tsx
import DocxImportButton from '@/components/import/DocxImportButton';

// Inside the header, after the sidebar toggle button:
<DocxImportButton />
```

**Step 4: Run tests**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npm test 2>&1`
Expected: All existing tests still pass

**Step 5: Run type check**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npx tsc --noEmit 2>&1`
Expected: No errors

**Step 6: Commit**

```bash
cd /c/Users/tiger/hermes-workspace/storyforge-rebuild
git add src/lib/import/docx.ts src/components/import/DocxImportButton.tsx src/app/page.tsx
git commit -m "feat: add DOCX import with mammoth integration"
```

---

## Task 6: Add EPUB Export

**Objective:** Implement EPUB export using the already-installed epub-gen-memory package.

**Files:**
- Create: `src/lib/export/epub.ts`

**Step 1: Create EPUB export utility**

Create file `src/lib/export/epub.ts`:

```typescript
import Epub from 'epub-gen-memory';
import type { Book } from '@/types/book';

export async function exportToEpub(book: Book): Promise<Blob> {
  const htmlContent = generateHtmlContent(book);

  const epub = new Epub(
    {
      title: book.title || 'Untitled Book',
      author: book.author || 'Unknown Author',
      publisher: 'StoryForge Rebuild',
      content: [
        {
          title: book.title || 'Untitled Book',
          data: htmlContent,
        },
      ],
    },
    {} // options
  );

  const blob = await epub.genEpub();
  return blob;
}

function generateHtmlContent(book: Book): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(book.title)}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.8; max-width: 40em; margin: 0 auto; padding: 2em; }
    h1 { text-align: center; margin-bottom: 0.5em; }
    .author { text-align: center; font-style: italic; margin-bottom: 3em; }
    h2 { margin-top: 2em; margin-bottom: 1em; }
    p { margin-bottom: 1em; text-indent: 1.5em; }
    .chapter { page-break-before: always; }
  </style>
</head>
<body>
  <h1>${escapeHtml(book.title)}</h1>
  ${book.author ? `<p class="author">by ${escapeHtml(book.author)}</p>` : ''}
`;

  for (const chapter of book.chapters) {
    html += `  <div class="chapter">\n    <h2>${escapeHtml(chapter.title)}</h2>\n`;
    for (const scene of chapter.scenes) {
      const plainText = scene.content.replace(/<[^>]+>/g, '').trim();
      if (plainText) {
        const paragraphs = plainText.split(/\n\n+/);
        for (const para of paragraphs) {
          if (para.trim()) {
            html += `    <p>${escapeHtml(para)}</p>\n`;
          }
        }
      }
    }
    html += `  </div>\n`;
  }

  html += `</body></html>`;
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Step 2: Add export button to toolbar**

Modify `src/app/page.tsx` — add export dropdown:

Add to the header section:

```tsx
import { exportToDocx } from '@/lib/export/docx';
import { exportToEpub } from '@/lib/export/epub';
import { useBookStore } from '@/store/store';

// Inside the component, add export handler:
const book = useBookStore((s) => s.book);

const handleExport = async (format: 'docx' | 'epub') => {
  if (format === 'docx') {
    await exportToDocx(book);
  } else if (format === 'epub') {
    const blob = await exportToEpub(book);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title || 'book'}.epub`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

**Step 3: Run type check**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npx tsc --noEmit 2>&1`
Expected: No errors

**Step 4: Commit**

```bash
cd /c/Users/tiger/hermes-workspace/storyforge-rebuild
git add src/lib/export/epub.ts src/app/page.tsx
git commit -m "feat: add EPUB export with epub-gen-memory"
```

---

## Task 7: Add Drag-and-Drop Chapter Reordering

**Objective:** Implement drag-and-drop for chapter reordering using @dnd-kit (already installed).

**Files:**
- Modify: `src/components/sidebar/ChapterTree.tsx`

**Step 1: Refactor ChapterTree for DnD**

Replace the chapter list section in `ChapterTree.tsx` with DnD-enabled version:

```typescript
'use client';

import { useBookStore } from '@/store/bookStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable chapter wrapper
function SortableChapter({ chapter, isActive, activeSceneId, onSelectChapter, onSelectScene, onToggleCollapse, onAddScene, onRemoveScene }: {
  chapter: any;
  isActive: boolean;
  activeSceneId: string | null;
  onSelectChapter: (id: string) => void;
  onSelectScene: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddScene: (chapterId: string) => void;
  onRemoveScene: (chapterId: string, sceneId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-1">
      <div
        className={`group flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
          isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => {
          onToggleCollapse(chapter.id);
          onSelectChapter(chapter.id);
        }}
      >
        <span className="text-gray-400 text-xs cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
          ≡
        </span>
        <span className="flex-1 truncate">{chapter.title}</span>
        <span className="text-xs text-gray-400">
          {chapter.scenes.reduce((t: number, s: any) => t + s.wordCount, 0)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddScene(chapter.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 text-xs w-5 h-5 flex items-center justify-center"
          title="Add scene"
        >
          +
        </button>
      </div>

      {!chapter.collapsed && (
        <div className="ml-4">
          {chapter.scenes.map((scene: any) => (
            <div
              key={scene.id}
              className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm ${
                activeSceneId === scene.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => onSelectScene(scene.id)}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className="flex-1 truncate text-xs">{scene.title}</span>
              {chapter.scenes.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveScene(chapter.id, scene.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 text-xs"
                  title="Remove scene"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChapterTree() {
  const {
    book,
    activeChapterId,
    activeSceneId,
    setActiveChapter,
    setActiveScene,
    addChapter,
    removeChapter,
    addScene,
    removeScene,
    toggleChapterCollapse,
    updateChapter,
    reorderChapters,
    getTotalWordCount,
  } = useBookStore();

  const totalWords = getTotalWordCount();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = book.chapters.findIndex((ch) => ch.id === active.id);
      const newIndex = book.chapters.findIndex((ch) => ch.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderChapters(oldIndex, newIndex);
      }
    }
  };

  return (
    <aside className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
          {book.title || 'Untitled Book'}
        </h2>
        <div className="mt-1 text-xs text-gray-500">
          {totalWords.toLocaleString()} / {book.wordCountGoal.toLocaleString()} words
        </div>
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min((totalWords / book.wordCountGoal) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={book.chapters.map((ch) => ch.id)} strategy={verticalListSortingStrategy}>
            {book.chapters.map((chapter) => (
              <SortableChapter
                key={chapter.id}
                chapter={chapter}
                isActive={activeChapterId === chapter.id}
                activeSceneId={activeSceneId}
                onSelectChapter={setActiveChapter}
                onSelectScene={setActiveScene}
                onToggleCollapse={toggleChapterCollapse}
                onAddScene={addScene}
                onRemoveScene={removeScene}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => addChapter()}
          className="w-full text-sm text-gray-600 hover:text-blue-600 py-1.5 px-3 rounded hover:bg-blue-50 transition-colors"
        >
          + Add Chapter
        </button>
      </div>
    </aside>
  );
}
```

**Step 2: Run type check**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npx tsc --noEmit 2>&1`
Expected: No errors

**Step 3: Commit**

```bash
cd /c/Users/tiger/hermes-workspace/storyforge-rebuild
git add src/components/sidebar/ChapterTree.tsx
git commit -m "feat: add drag-and-drop chapter reordering with @dnd-kit"
```

---

## Task 8: Add Offline Storage (Dexie/IndexedDB)

**Objective:** Persist book data to IndexedDB so work survives page refresh.

**Files:**
- Create: `src/lib/db/database.ts`
- Create: `src/lib/db/bookPersistence.ts`
- Modify: `src/store/bookStore.ts` (add persistence)

**Step 1: Create Dexie database**

Create file `src/lib/db/database.ts`:

```typescript
import Dexie, { type EntityTable } from 'dexie';
import type { Book } from '@/types/book';

interface BookRecord {
  id: string;
  data: Book;
  updatedAt: string;
}

const db = new Dexie('StoryForgeRebuild') as Dexie & {
  books: EntityTable<BookRecord, 'id'>;
};

db.version(1).stores({
  books: 'id, updatedAt',
});

export { db };
export type { BookRecord };
```

**Step 2: Create persistence layer**

Create file `src/lib/db/bookPersistence.ts`:

```typescript
import { db } from './database';
import type { Book } from '@/types/book';

const ACTIVE_BOOK_KEY = 'storyforge-active-book-id';

export async function saveBook(book: Book): Promise<void> {
  await db.books.put({
    id: book.id,
    data: book,
    updatedAt: book.updatedAt,
  });
  localStorage.setItem(ACTIVE_BOOK_KEY, book.id);
}

export async function loadBook(bookId: string): Promise<Book | null> {
  const record = await db.books.get(bookId);
  return record?.data ?? null;
}

export async function loadMostRecentBook(): Promise<Book | null> {
  const activeId = localStorage.getItem(ACTIVE_BOOK_KEY);
  if (activeId) {
    const book = await loadBook(activeId);
    if (book) return book;
  }
  // Fallback: get most recent
  const all = await db.books.orderBy('updatedAt').reverse().limit(1).toArray();
  return all[0]?.data ?? null;
}

export async function listBooks(): Promise<{ id: string; title: string; updatedAt: string }[]> {
  return db.books.orderBy('updatedAt').reverse().toArray().then(records =>
    records.map(r => ({ id: r.id, title: r.data.title, updatedAt: r.updatedAt }))
  );
}

export async function deleteBook(bookId: string): Promise<void> {
  await db.books.delete(bookId);
}
```

**Step 3: Integrate persistence into bookStore**

Modify `src/store/bookStore.ts` — add auto-save:

Add after the imports:

```typescript
import { saveBook } from '@/lib/db/bookPersistence';
```

Add a debounced save helper after the store creation:

```typescript
// Auto-save to IndexedDB on changes
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedSave = (book: Book) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveBook(book).catch(console.error);
  }, 1000);
};

// Subscribe to store changes for persistence
useBookStore.subscribe((state) => {
  debouncedSave(state.book);
});
```

**Step 4: Add load on startup**

Modify `src/app/page.tsx` — load saved book on mount:

Add to the Home component:

```typescript
import { loadMostRecentBook } from '@/lib/db/bookPersistence';
import { useEffect } from 'react';

// Inside the Home component, before the return:
useEffect(() => {
  loadMostRecentBook().then((savedBook) => {
    if (savedBook) {
      useBookStore.setState({
        book: savedBook,
        activeChapterId: savedBook.chapters[0]?.id ?? null,
        activeSceneId: savedBook.chapters[0]?.scenes[0]?.id ?? null,
      });
    }
  });
}, []);
```

**Step 5: Run type check**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npx tsc --noEmit 2>&1`
Expected: No errors

**Step 6: Commit**

```bash
cd /c/Users/tiger/hermes-workspace/storyforge-rebuild
git add src/lib/db/database.ts src/lib/db/bookPersistence.ts src/store/bookStore.ts src/app/page.tsx
git commit -m "feat: add offline persistence with Dexie/IndexedDB"
```

---

## Task 9: Add Writing Goals Tracker UI

**Objective:** Add a writing goals panel to the sidebar.

**Files:**
- Create: `src/components/sidebar/WritingGoals.tsx`
- Modify: `src/components/sidebar/ChapterTree.tsx` (integrate goals panel)

**Step 1: Create WritingGoals component**

Create file `src/components/sidebar/WritingGoals.tsx`:

```typescript
'use client';

import { useBookStore } from '@/store/bookStore';

export default function WritingGoals() {
  const { goal, book, getTotalWordCount } = useBookStore();
  const totalWords = getTotalWordCount();
  const progress = Math.min((totalWords / book.wordCountGoal) * 100, 100);
  const dailyProgress = Math.min((goal.totalWordsWritten / goal.dailyWordCount) * 100, 100);

  return (
    <div className="p-4 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Writing Goals
      </h3>

      {/* Daily goal */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Daily</span>
          <span>{goal.totalWordsWritten} / {goal.dailyWordCount}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${dailyProgress}%` }}
          />
        </div>
      </div>

      {/* Book goal */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Book</span>
          <span>{totalWords.toLocaleString()} / {book.wordCountGoal.toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Streak */}
      {goal.currentStreak > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          🔥 {goal.currentStreak} day streak
        </div>
      )}
    </div>
  );
}
```

**Step 2: Integrate into ChapterTree**

Modify `src/components/sidebar/ChapterTree.tsx` — add WritingGoals at the bottom:

Add import:
```typescript
import WritingGoals from './WritingGoals';
```

Add before the closing `</aside>`:
```tsx
<WritingGoals />
```

**Step 3: Run type check**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npx tsc --noEmit 2>&1`
Expected: No errors

**Step 4: Commit**

```bash
cd /c/Users/tiger/hermes-workspace/storyforge-rebuild
git add src/components/sidebar/WritingGoals.tsx src/components/sidebar/ChapterTree.tsx
git commit -m "feat: add writing goals tracker panel"
```

---

## Task 10: Add Theme System Foundation

**Objective:** Create the theme system with 3 starter book themes.

**Files:**
- Create: `src/lib/themes/presets.ts`
- Create: `src/components/themes/ThemeSelector.tsx`
- Modify: `src/app/page.tsx` (apply theme to editor)

**Step 1: Create theme presets**

Create file `src/lib/themes/presets.ts`:

```typescript
import type { BookTheme } from '@/types/book';

export const themePresets: BookTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 16,
    lineHeight: 1.8,
    headingFont: 'Georgia, "Times New Roman", serif',
    textColor: '#1a1a1a',
    backgroundColor: '#ffffff',
    accentColor: '#2563eb',
  },
  {
    id: 'modern',
    name: 'Modern',
    fontFamily: '"Inter", "Helvetica Neue", sans-serif',
    fontSize: 15,
    lineHeight: 1.7,
    headingFont: '"Inter", "Helvetica Neue", sans-serif',
    textColor: '#2d3748',
    backgroundColor: '#fafafa',
    accentColor: '#6366f1',
  },
  {
    id: 'manuscript',
    name: 'Manuscript',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 14,
    lineHeight: 2.0,
    headingFont: '"Courier New", Courier, monospace',
    textColor: '#333333',
    backgroundColor: '#fffff8',
    accentColor: '#8b4513',
  },
];

export function getThemeById(id: string): BookTheme {
  return themePresets.find(t => t.id === id) ?? themePresets[0];
}
```

**Step 2: Create ThemeSelector component**

Create file `src/components/themes/ThemeSelector.tsx`:

```typescript
'use client';

import { useBookStore } from '@/store/bookStore';
import { themePresets } from '@/lib/themes/presets';

export default function ThemeSelector() {
  const { theme, setTheme } = useBookStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Theme:</span>
      <select
        value={theme.id}
        onChange={(e) => {
          const preset = themePresets.find(t => t.id === e.target.value);
          if (preset) setTheme(preset);
        }}
        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
      >
        {themePresets.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}
```

**Step 3: Apply theme to editor**

Modify `src/components/editor/SceneEditor.tsx` — apply theme styles:

Add to the component:
```typescript
const theme = useBookStore((s) => s.theme);
```

Update the editor container to use theme:
```tsx
<div
  className="flex-1 overflow-y-auto"
  style={{
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: theme.fontFamily,
  }}
>
```

**Step 4: Add ThemeSelector to toolbar**

Modify `src/app/page.tsx` — add ThemeSelector in the header.

**Step 5: Run type check**

Run: `cd /c/Users/tiger/hermes-workspace/storyforge-rebuild && npx tsc --noEmit 2>&1`
Expected: No errors

**Step 6: Commit**

```bash
cd /c/Users/tiger/hermes-workspace/storyforge-rebuild
git add src/lib/themes/presets.ts src/components/themes/ThemeSelector.tsx src/components/editor/SceneEditor.tsx src/app/page.tsx
git commit -m "feat: add theme system with 3 presets (Classic, Modern, Manuscript)"
```

---

## Phase 1 Completion Checklist

After all tasks:
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (7+ tests)
- [ ] `npx tsc --noEmit` passes
- [ ] All changes committed
- [ ] Dev server starts without errors

**Estimated total time:** 10-15 subagent tasks × ~5 min each = ~60-75 minutes of focused work.

**Next phase (Phase 2):** Editor Core — add image support, footnotes, callout boxes, and device preview.
