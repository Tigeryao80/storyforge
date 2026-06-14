// src/components/editor/Toolbar.tsx

'use client';

import { useCallback } from 'react';

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

  const insertFootnote = () => {
    const text = prompt('Footnote text:');
    if (text) {
      const fnId = Date.now();
      editor
        .chain()
        .focus()
        .insertContent(
          `<sup class="footnote" data-fn="${fnId}" title="${text}">[fn]&nbsp;</sup>`
        )
        .run();
    }
  };

  const btnClass = (active: boolean) =>
    `px-2 py-1 text-sm rounded ${
      active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
      {/* Text formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
        title="Underline (Ctrl+U)"
      >
        <u>U</u>
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Headings H2-H6 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2 / Scene Break (Ctrl+2)"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
        title="Heading 3 / Section (Ctrl+3)"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        className={btnClass(editor.isActive('heading', { level: 4 }))}
        title="Heading 4 / Subsection (Ctrl+4)"
      >
        H4
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        className={btnClass(editor.isActive('heading', { level: 5 }))}
        title="Heading 5 (Ctrl+5)"
      >
        H5
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
        className={btnClass(editor.isActive('heading', { level: 6 }))}
        title="Heading 6 (Ctrl+6)"
      >
        H6
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={btnClass(editor.isActive('paragraph'))}
        title="Paragraph"
      >
        P
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Block elements */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
        title="Block Quote"
      >
        &ldquo;&rdquo;
      </button>
      <button
        type="button"
        onClick={insertFootnote}
        className="px-2 py-1 text-sm rounded text-gray-600 hover:bg-gray-100"
        title="Insert Footnote"
      >
        Fn
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCallout('info').run()}
        className={btnClass(editor.isActive('callout'))}
        title="Toggle Callout Box (Ctrl+Shift+K)"
      >
        📦
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Media */}
      <button
        type="button"
        onClick={addImage}
        className="px-2 py-1 text-sm rounded text-gray-600 hover:bg-gray-100"
        title="Insert image from URL"
      >
        🖼️
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Callout type selector */}
      <select
        onChange={(e) => {
          const type = e.target.value;
          if (type) editor.chain().focus().toggleCallout(type).run();
          e.target.value = '';
        }}
        className="text-xs px-1 py-1 rounded border border-gray-200 text-gray-600 bg-white"
        defaultValue=""
        title="Callout type"
      >
        <option value="" disabled>
          Callout...
        </option>
        <option value="info">ℹ️ Info</option>
        <option value="warning">⚠️ Warning</option>
        <option value="tip">💡 Tip</option>
      </select>
    </div>
  );
}
