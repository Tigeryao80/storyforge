// src/app/page.tsx

'use client';

import dynamic from 'next/dynamic';
import ChapterTree from '@/components/sidebar/ChapterTree';
import { useBookStore } from '@/store/bookStore';

// Dynamic import to avoid SSR issues with TipTap
const SceneEditor = dynamic(() => import('@/components/editor/SceneEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      Loading editor...
    </div>
  ),
});

export default function Home() {
  const { activeChapterId, activeSceneId, book, sidebarOpen, toggleSidebar } = useBookStore();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top toolbar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 rounded hover:bg-gray-100"
        >
          {sidebarOpen ? '◀' : '▶'} Chapters
        </button>

        <div className="flex-1 text-center">
          <span className="font-semibold text-gray-800">{book.title || 'Untitled Book'}</span>
          {book.author && (
            <span className="text-gray-400 ml-2">by {book.author}</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>
            {book.chapters.reduce(
              (t, ch) => t + ch.scenes.reduce((ct, s) => ct + s.wordCount, 0),
              0
            ).toLocaleString()} words
          </span>
          <span className="text-gray-300">|</span>
          <span>{book.chapters.length} chapters</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && <ChapterTree />}

        {/* Editor */}
        {activeChapterId && activeSceneId ? (
          <SceneEditor chapterId={activeChapterId} sceneId={activeSceneId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Click a chapter to start writing
          </div>
        )}
      </div>

      {/* Status bar */}
      <footer className="h-8 bg-gray-50 border-t border-gray-200 flex items-center px-4 text-xs text-gray-500 gap-4 shrink-0">
        <span>Atticus Rebuild v0.1.0</span>
        <span className="flex-1" />
        <span>Auto-saved locally</span>
      </footer>
    </div>
  );
}
