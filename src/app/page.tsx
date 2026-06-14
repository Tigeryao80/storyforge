'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import ChapterTree from '@/components/sidebar/ChapterTree';
import WritingGoals from '@/components/sidebar/WritingGoals';
import DocxImportButton from '@/components/import/DocxImportButton';
import ThemeSelector from '@/components/themes/ThemeSelector';
import { exportToDocx } from '@/lib/export/docx';
import { exportToEpub } from '@/lib/export/epub';
import { exportToPdf } from '@/lib/export/pdf';
import { useBookStore } from '@/store/bookStore';
import { loadMostRecentBook } from '@/lib/db/bookPersistence';

const SceneEditor = dynamic(() => import('@/components/editor/SceneEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      Loading editor...
    </div>
  ),
});

export default function Home() {
  const { activeChapterId, activeSceneId, book, sidebarOpen, toggleSidebar, theme } = useBookStore();

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

  const handleExport = async (format: 'docx' | 'epub' | 'pdf') => {
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
    } else if (format === 'pdf') {
      await exportToPdf(book);
    }
  };

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

        <DocxImportButton />

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

        <ThemeSelector />

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleExport('docx')}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="Export to DOCX"
          >
            DOCX
          </button>
          <button
            onClick={() => handleExport('epub')}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="Export to EPUB"
          >
            EPUB
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="Export to PDF"
          >
            PDF
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="flex flex-col h-full">
            <ChapterTree />
            <WritingGoals />
          </div>
        )}

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
