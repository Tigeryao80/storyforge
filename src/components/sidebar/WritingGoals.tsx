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

      {goal.currentStreak > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          🔥 {goal.currentStreak} day streak
        </div>
      )}
    </div>
  );
}
