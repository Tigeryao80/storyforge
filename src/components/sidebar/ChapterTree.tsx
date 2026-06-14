// src/components/sidebar/ChapterTree.tsx

'use client';

import { useBookStore } from '@/store/bookStore';
import { v4 as uuidv4 } from 'uuid';

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
    getTotalWordCount,
  } = useBookStore();

  const totalWords = getTotalWordCount();

  return (
    <aside className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
          {book.title || 'Untitled Book'}
        </h2>
        <div className="mt-1 text-xs text-gray-500">
          {totalWords.toLocaleString()} / {book.wordCountGoal.toLocaleString()} words
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min((totalWords / book.wordCountGoal) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto py-2">
        {book.chapters.map((chapter) => (
          <div key={chapter.id} className="mb-1">
            {/* Chapter header */}
            <div
              className={`group flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
                activeChapterId === chapter.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => {
                toggleChapterCollapse(chapter.id);
                setActiveChapter(chapter.id);
              }}
            >
              <span className="text-gray-400 text-xs">≡</span>
              <span className="flex-1 truncate">{chapter.title}</span>
              <span className="text-xs text-gray-400">
                {chapter.scenes.reduce((t, s) => t + s.wordCount, 0)}
              </span>
              {/* Add scene button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addScene(chapter.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 text-xs w-5 h-5 flex items-center justify-center"
                title="Add scene"
              >
                +
              </button>
            </div>

            {/* Scenes (expanded) */}
            {!chapter.collapsed && (
              <div className="ml-4">
                {chapter.scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm ${
                      activeSceneId === scene.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveScene(scene.id)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <span className="flex-1 truncate text-xs">{scene.title}</span>
                    {chapter.scenes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeScene(chapter.id, scene.id);
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
        ))}
      </div>

      {/* Footer actions */}
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
