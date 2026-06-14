'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Image from '@tiptap/extension-image';
import { Callout } from '@/lib/tiptap/callout';
import { useBookStore } from '@/store/bookStore';
import Toolbar from './Toolbar';

interface SceneEditorProps {
  chapterId: string;
  sceneId: string;
}

export default function SceneEditor({ chapterId, sceneId }: SceneEditorProps) {
  const updateSceneContent = useBookStore((s) => s.updateSceneContent);
  const activeScene = useBookStore((s) =>
    s.book.chapters
      .find((ch) => ch.id === chapterId)
      ?.scenes.find((sc) => sc.id === sceneId)
  );
  const theme = useBookStore((s) => s.theme);

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
      Callout,
    ],
    content: activeScene?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[60vh] px-8 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      updateSceneContent(chapterId, sceneId, html);
    },
  });

  useEffect(() => {
    if (editor && activeScene?.content && editor.getHTML() !== activeScene.content) {
      editor.commands.setContent(activeScene.content);
    }
  }, [activeScene?.content, editor, activeScene]);

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
            <div className="text-sm text-gray-400 mt-1">
              {activeScene.wordCount} words
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
