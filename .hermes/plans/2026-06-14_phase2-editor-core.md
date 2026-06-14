# Phase 2: Editor Core — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Enhance the TipTap editor with image support, footnotes, callout boxes, and a formatting toolbar.

**Architecture:** Extend existing SceneEditor.tsx with new TipTap extensions. Add toolbar component. Add callout box CSS.

**Tech Stack:** TipTap 3 (Image, Dropcursor already installed), custom extensions for footnotes/callouts

---

## Task 11: Add Image Support to Editor

**Objective:** Enable image insertion in the TipTap editor using the already-installed @tiptap/extension-image.

**Files:**
- Modify: `src/components/editor/SceneEditor.tsx`
- Create: `src/components/editor/Toolbar.tsx`

**Step 1: Add Image extension to SceneEditor**

Add to extensions array in SceneEditor:
```tsx
import Image from '@tiptap/extension-image';

// In useEditor extensions:
Image.configure({
  inline: false,
  allowBase64: true,
}),
```

**Step 2: Create Toolbar component**

Create `src/components/editor/Toolbar.tsx`:
```tsx
'use client';

interface ToolbarProps {
  editor: any;
}

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Bold"
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-sm rounded italic ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Italic"
      >
        I
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2 py-1 text-sm rounded line-through ${editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Strikethrough"
      >
        S
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Heading 3"
      >
        H3
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        onClick={addImage}
        className="px-2 py-1 text-sm rounded text-gray-600 hover:bg-gray-100"
        title="Insert image"
      >
        🖼️
      </button>
      <button
        onClick={() => {
          const text = prompt('Footnote text:');
          if (text) {
            editor.chain().focus().insertContent(`<sup class="footnote" title="${text}">[${editor.state.doc.content.childCount}]</sup>`).run();
          }
        }}
        className="px-2 py-1 text-sm rounded text-gray-600 hover:bg-gray-100"
        title="Insert footnote"
        >
        Fn
      </button>
    </div>
  );
}
```

**Step 3: Integrate Toolbar into SceneEditor**

Add toolbar above the editor content:
```tsx
import Toolbar from './Toolbar';

// In the return, before EditorContent:
<Toolbar editor={editor} />
```

**Step 4: Verify build**

Run: `npx tsc --noEmit` → Expected: no errors

**Step 5: Commit**

```bash
git add src/components/editor/
git commit -m "feat: add editor toolbar with image, headings, bold, italic, footnote"
```

---

## Task 12: Add Callout Box Extension

**Objective:** Create a custom TipTap node for callout boxes (info/warning/tip).

**Files:**
- Create: `src/lib/tiptap/callout.ts`
- Modify: `src/components/editor/SceneEditor.tsx`
- Modify: `src/app/globals.css`

**Step 1: Create custom callout node**

Create `src/lib/tiptap/callout.ts`:
```typescript
import { Node, mergeAttributes } from '@tiptap/core';

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,
  selectable: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-callout-type'),
        renderHTML: attributes => ({
          'data-callout-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      class: `callout callout-${node.attrs.type}`,
    }), 0];
  },

  addCommands() {
    return {
      setCallout: (type: string) => ({ commands }) =>
        commands.setNode(this.name, { type }),
      toggleCallout: (type: string) => ({ commands }) =>
        commands.toggleNode(this.name, 'paragraph', { type }),
    } as any;
  },
});
```

**Step 2: Add callout to SceneEditor extensions**

```tsx
import { Callout } from '@/lib/tiptap/callout';

// In extensions:
Callout,
```

**Step 3: Add callout button to Toolbar**

Add to Toolbar component:
```tsx
<button
  onClick={() => editor.chain().focus().toggleCallout('info').run()}
  className={`px-2 py-1 text-sm rounded ${editor.isActive('callout') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
  title="Callout box"
  >
  📦
</button>
```

**Step 4: Add callout CSS**

Add to `globals.css`:
```css
.callout {
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
  border-radius: 6px;
  border-left: 4px solid;
  font-size: 0.95rem;
}

.callout-info {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1e40af;
}

.callout-warning {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #92400e;
}

.callout-tip {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #166534;
}
```

**Step 5: Verify build + commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add callout box extension (info/warning/tip)"
```

---

## Task 13: Add PDF Export

**Objective:** Implement PDF export using the already-installed pdfkit package.

**Files:**
- Create: `src/lib/export/pdf.ts`
- Modify: `src/app/page.tsx` (add PDF export button handler)

**Step 1: Create PDF export utility**

Create `src/lib/export/pdf.ts`:
```typescript
import PDFDocument from 'pdfkit';
import type { Book } from '@/types/book';

export async function exportToPdf(book: Book): Promise<void> {
  const doc = new PDFDocument({ margin: 72 });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title || 'book'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    });
    doc.on('error', reject);

    // Title page
    doc.fontSize(24).font('Helvetica-Bold').text(book.title || 'Untitled Book', { align: 'center' });
    if (book.author) {
      doc.moveDown();
      doc.fontSize(14).font('Helvetica').text(`by ${book.author}`, { align: 'center' });
    }
    doc.addPage();

    // Chapters
    for (const chapter of book.chapters) {
      doc.fontSize(18).font('Helvetica-Bold').text(chapter.title);
      doc.moveDown();

      for (const scene of chapter.scenes) {
        const plainText = scene.content.replace(/<[^>]+>/g, '').trim();
        if (plainText) {
          doc.fontSize(12).font('Times-Roman').text(plainText, { indent: 30, align: 'justify' });
          doc.moveDown();
        }
      }

      if (chapter !== book.chapters[book.chapters.length - 1]) {
        doc.addPage();
      }
    }

    doc.end();
  });
}
```

**Step 2: Add PDF export to page toolbar**

In `src/app/page.tsx`, add:
```tsx
import { exportToPdf } from '@/lib/export/pdf';

// Add to handleExport:
} else if (format === 'pdf') {
  await exportToPdf(book);
}

// Add PDF button alongside DOCX and EPUB:
<button
  onClick={() => handleExport('pdf')}
  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
  title="Export to PDF"
>
  PDF
</button>
```

**Step 3: Verify build + commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add PDF export with pdfkit"
```

---

## Phase 2 Completion Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes (34+ tests)
- [ ] Editor has toolbar with bold, italic, strikethrough, headings
- [ ] Editor supports image insertion
- [ ] Editor supports footnote markers
- [ ] Editor supports callout boxes (info/warning/tip)
- [ ] PDF export works alongside DOCX and EPUB
- [ ] All changes committed

**Next phase (Phase 3):** Image handling improvements, device preview renderer, PWA configuration.
