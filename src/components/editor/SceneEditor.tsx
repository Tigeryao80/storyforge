// src/components/editor/SceneEditor.tsx

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import type { Level } from '@tiptap/extension-heading';
import { Callout } from '@/lib/tiptap/callout';
import { useBookStore } from '@/store/bookStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import Toolbar from './Toolbar';

interface SceneEditorProps {
  chapterId: string;
  sceneId: string;
  focusMode: boolean;
  onExitFocus: () => void;
}

export default function SceneEditor({ chapterId, sceneId, focusMode, onExitFocus }: SceneEditorProps) {
  const updateSceneContent = useBookStore((s) => s.updateSceneContent);
  const activeScene = useBookStore((s) =>
    s.book.chapters
      .find((ch) => ch.id === chapterId)
      ?.scenes.find((sc) => sc.id === sceneId)
  );
  const theme = useBookStore((s) => s.theme);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({
        levels: [2, 3, 4, 5, 6],
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Underline,
      Callout,
    ],
    content: activeScene?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[60vh] px-8 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('saving');
      const html = editor.getHTML();
      updateSceneContent(chapterId, sceneId, html);
      // Debounced "saved" indicator
      setTimeout(() => setSaveStatus('saved'), 800);
    },
  });

  // Typewriter scroll: keep cursor centered
  useEffect(() => {
    if (!editor || focusMode) return;

    const handleSelectionUpdate = () => {
      const { view } = editor;
      if (!view) return;

      // Get cursor position
      const { from } = view.state.selection;
      const coords = view.coordsAtPos(from);

      // Calculate center of viewport
      const editorEl = view.dom.parentElement;
      if (!editorEl) return;
      const rect = editorEl.getBoundingClientRect();
      const centerY = rect.height / 2;

      // If cursor is below center, scroll to center it
      if (coords.bottom > rect.top + centerY + 60) {
        const scrollOffset = coords.top - rect.top - centerY + 60;
        editorEl.scrollTop += scrollOffset * 0.5; // Smooth, partial scroll
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, focusMode]);

  // Sync content when switching scenes
  useEffect(() => {
    if (editor && activeScene?.content && editor.getHTML() !== activeScene.content) {
      editor.commands.setContent(activeScene.content);
    }
  }, [activeScene?.content, editor, activeScene]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'Ctrl+B': () => editor?.chain().focus().toggleBold().run(),
    'Ctrl+I': () => editor?.chain().focus().toggleItalic().run(),
    'Ctrl+U': () => editor?.chain().focus().toggleUnderline().run(),
    'Ctrl+Shift+K': () => {
      if (!editor) return;
      (editor.commands as any).toggleCallout?.('info');
      editor.chain().focus().run();
    },
    'Escape': () => {
      if (focusMode) onExitFocus();
    },
  });

  // Heading shortcuts: Ctrl+1=H2, Ctrl+2=H3, Ctrl+3=H4, Ctrl+4=H5, Ctrl+5=H6
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (view: any, event: KeyboardEvent) => {
      if (!event.ctrlKey) return false;

      const headingMap: Record<string, Level> = {
        '2': 2 as Level, '3': 3 as Level, '4': 4 as Level, '5': 5 as Level, '6': 6 as Level,
      };

      if (headingMap[event.key]) {
        event.preventDefault();
        editor.chain().focus().toggleHeading({ level: headingMap[event.key] }).run();
        return true;
      }

      return false;
    };

    editor.view.dom.addEventListener('keydown', (e: any) => handleKeyDown(editor.view, e));
    return () => {
      editor.view.dom.removeEventListener('keydown', (e: any) => handleKeyDown(editor.view, e));
    };
  }, [editor]);

  if (!activeScene) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a scene to start writing
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto flex flex-col"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="px-8 pt-8 pb-2">
            <input
              type="text"
              value={activeScene.title}
              onChange={(e) =>
                useBookStore
                  .getState()
                  .updateScene(chapterId, sceneId, { title: e.target.value })
              }
              className="text-3xl font-bold w-full border-none outline-none bg-transparent placeholder-gray-300"
              style={{ color: theme.textColor }}
              placeholder="Scene title..."
            />
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-400">
                {activeScene.wordCount.toLocaleString()} words
              </span>
              {/* Auto-save indicator */}
              <span className={`text-xs ${
                saveStatus === 'saving'
                  ? 'text-yellow-500'
                  : saveStatus === 'unsaved'
                  ? 'text-gray-400'
                  : 'text-green-500'
              }`}>
                {saveStatus === 'saving' && '⏳ Saving...'}
                {saveStatus === 'saved' && '✓ Saved'}
                {saveStatus === 'unsaved' && '○ Unsaved'}
              </span>
            </div>
          </div>
          <div className="px-4">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
