'use client';

import { useCallback } from 'react';
import { useBookStore } from '@/store/bookStore';
import type { Chapter } from '@/types/book';

interface ChapterGoalRowProps {
  chapterId: string;
  chapterTitle: string;
  wordCount: number;
  goal: number;
  onSetGoal: (id: string, goal: number) => void;
}

function ChapterGoalRow({ chapterId, chapterTitle, wordCount, goal, onSetGoal }: ChapterGoalRowProps) {
  const pct = goal > 0 ? Math.min(100, Math.round((wordCount / goal) * 100)) : 0;
  const isComplete = goal > 0 && wordCount >= goal;

  const handleGoalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onSetGoal(chapterId, isNaN(val) || val < 0 ? 0 : val);
  }, [chapterId, onSetGoal]);

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-xs text-gray-600 truncate flex-1" title={chapterTitle}>
          {chapterTitle}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-xs font-medium ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
            {wordCount.toLocaleString()}
          </span>
          <span className="text-xs text-gray-300">/</span>
          <input
            type="number"
            value={goal || ''}
            onChange={handleGoalChange}
            placeholder="0"
            min={0}
            step={500}
            className="w-14 px-1 py-0.5 text-xs text-right border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>
      </div>
      {goal > 0 && (
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-blue-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function ChapterGoals() {
  const chapters = useBookStore((s) => s.book.chapters);
  const updateChapter = useBookStore((s) => s.updateChapter);

  const handleSetGoal = useCallback((chapterId: string, goal: number) => {
    updateChapter(chapterId, { wordCountGoal: goal } as Partial<Chapter>);
  }, [updateChapter]);

  const totalWords = chapters.reduce(
    (sum, ch) => sum + ch.scenes.reduce((s, sc) => s + sc.wordCount, 0), 0
  );
  const totalGoal = chapters.reduce((sum, ch) => sum + (ch as any).wordCountGoal || 0, 0);
  const totalPct = totalGoal > 0 ? Math.min(100, Math.round((totalWords / totalGoal) * 100)) : 0;

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Chapter Goals</h3>

      {/* Total progress */}
      {totalGoal > 0 && (
        <div className="mb-3 p-2 bg-gray-50 rounded-md">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 font-medium">Total Progress</span>
            <span className={`font-bold ${totalPct >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
              {totalWords.toLocaleString()} / {totalGoal.toLocaleString()} ({totalPct}%)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${totalPct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${totalPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Per-chapter goals */}
      <div className="max-h-60 overflow-y-auto">
        {chapters.map((ch) => (
          <ChapterGoalRow
            key={ch.id}
            chapterId={ch.id}
            chapterTitle={ch.title}
            wordCount={ch.scenes.reduce((s, sc) => s + sc.wordCount, 0)}
            goal={ch.wordCountGoal || 0}
            onSetGoal={handleSetGoal}
          />
        ))}
      </div>

      {chapters.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">No chapters yet</p>
      )}
    </div>
  );
}
