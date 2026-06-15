// src/app/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ChapterTree from '@/components/sidebar/ChapterTree';
import WritingGoals from '@/components/sidebar/WritingGoals';
import ChapterGoals from '@/components/sidebar/ChapterGoals';
import SprintTimer from '@/components/sprint/SprintTimer';
import CloudBackup from '@/components/backup/CloudBackup';
import HermesPanel from '@/components/hermes/HermesPanel';
import VersionHistory from '@/components/history/VersionHistory';
import DocxImportButton from '@/components/import/DocxImportButton';
import HermesImportButton from '@/components/import/HermesImportButton';
import ThemeBuilder from '@/components/themes/ThemeBuilder';
import DevicePreview from '@/components/preview/DevicePreview';
import ExportSettings from '@/components/export/ExportSettings';
import FocusMode from '@/components/editor/FocusMode';
import { useBookStore } from '@/store/bookStore';
import { loadMostRecentBook } from '@/lib/db/bookPersistence';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const SceneEditor = dynamic(() => import('@/components/editor/SceneEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      Loading editor...
    </div>
  ),
});

export default function Home() {
  const {
    activeChapterId,
    activeSceneId,
    book,
    sidebarOpen,
    toggleSidebar,
    theme,
    setBookMeta,
  } = useBookStore();

  const [showExportSettings, setShowExportSettings] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);

  // Load saved book on mount
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

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    'Ctrl+Shift+F': () => setShowFocusMode((v) => !v),
    'Ctrl+Shift+E': () => setShowExportSettings(true),
    'Ctrl+Shift+H': () => toggleSidebar(),
  });

  const handleExitFocus = useCallback(() => {
    setShowFocusMode(false);
  }, []);

  const handleExport = async (format: 'docx' | 'epub' | 'pdf' | 'mobi') => {
    if (format === 'docx') {
      const { exportToDocx } = await import('@/lib/export/docx');
      await exportToDocx(book);
    } else if (format === 'epub') {
      const { exportToEpub } = await import('@/lib/export/epub');
      const blob = await exportToEpub(book);
      downloadBlob(blob, `${book.title || 'book'}.epub`);
    } else if (format === 'mobi') {
      const { exportToMobi } = await import('@/lib/export/mobi');
      const blob = await exportToMobi(book);
      downloadBlob(blob, `${book.title || 'book'}.mobi`);
    } else if (format === 'pdf') {
      const { exportToPdf } = await import('@/lib/export/pdf');
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
          title="Toggle sidebar (Ctrl+Shift+H)"
        >
          {sidebarOpen ? '◀' : '▶'} Chapters
        </button>

        <DocxImportButton />
        <HermesImportButton />

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

        <ThemeBuilder />
        <DevicePreview />

        {/* Focus mode toggle */}
        <button
          onClick={() => setShowFocusMode((v) => !v)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            showFocusMode
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          title="Focus Mode (Ctrl+Shift+F)"
        >
          🎯 Focus
        </button>

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
            onClick={() => handleExport('mobi')}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="Export to MOBI (Kindle)"
          >
            MOBI
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="Export to PDF"
          >
            PDF
          </button>
          <button
            onClick={() => setShowExportSettings(true)}
            className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium"
            title="Export for KDP (all formats) (Ctrl+Shift+E)"
          >
            KDP Export
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto shrink-0">
            <ChapterTree />
            <WritingGoals />
            <ChapterGoals />
            <SprintTimer />
            <CloudBackup />
            <HermesPanel />
            <VersionHistory />
          </div>
        )}

        {/* Editor */}
        {activeChapterId && activeSceneId ? (
          <SceneEditor
            chapterId={activeChapterId}
            sceneId={activeSceneId}
            focusMode={showFocusMode}
            onExitFocus={handleExitFocus}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Click a chapter to start writing
          </div>
        )}
      </div>

      {/* Status bar */}
      <footer className="h-8 bg-gray-50 border-t border-gray-200 flex items-center px-4 text-xs text-gray-500 gap-4 shrink-0">
        <span>StoryForge Rebuild v0.9.0</span>
        <span className="flex-1" />
        <span>
          Shortcuts: Ctrl+B/I/U = format · Ctrl+1-6 = headings · Ctrl+Shift+F = focus · Ctrl+Shift+E = export
        </span>
      </footer>

      {/* Export Settings Modal */}
      {showExportSettings && (
        <ExportSettings onClose={() => setShowExportSettings(false)} />
      )}

      {/* Focus Mode Overlay */}
      {showFocusMode && (
        <FocusMode active={showFocusMode} onExit={handleExitFocus} />
      )}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
