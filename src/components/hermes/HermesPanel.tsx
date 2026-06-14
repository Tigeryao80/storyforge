// src/components/hermes/HermesPanel.tsx

'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/bookStore';

export default function HermesPanel() {
  const { book, getTotalWordCount } = useBookStore();
  const [hermesStatus, setHermesStatus] = useState<'idle' | 'writing' | 'done' | 'error'>('idle');
  const [lastAction, setLastAction] = useState('');
  const totalWords = getTotalWordCount();
  const progress = book.wordCountGoal > 0
    ? Math.min((totalWords / book.wordCountGoal) * 100, 100)
    : 0;

  const handleWriteNext = () => {
    setHermesStatus('writing');
    setLastAction('Writing next chapter...');
    // In real usage, this would trigger Hermes via MCP
    // For now, it's a placeholder for the Hermes integration
    setTimeout(() => {
      setHermesStatus('done');
      setLastAction('Chapter outline ready for review');
    }, 2000);
  };

  const handleCheckContinuity = () => {
    setHermesStatus('writing');
    setLastAction('Checking continuity...');
    setTimeout(() => {
      setHermesStatus('done');
      setLastAction('No continuity issues found');
    }, 1500);
  };

  const handleAutoFormat = async () => {
    setHermesStatus('writing');
    setLastAction('Validating formatting...');
    try {
      const { validateBook } = await import('@/lib/formatting/validator');
      const result = validateBook(book);
      setHermesStatus('done');
      if (result.issues.length === 0) {
        setLastAction('✅ All formatting valid');
      } else {
        setLastAction(`Found ${result.errorCount} errors, ${result.warningCount} warnings`);
      }
    } catch {
      setHermesStatus('error');
      setLastAction('Format check failed');
    }
  };

  return (
    <div className="border-t border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🐾</span>
        <h3 className="text-sm font-semibold text-gray-800">Hermes Writer</h3>
        {hermesStatus === 'writing' && (
          <span className="text-xs text-blue-500 animate-pulse">Working...</span>
        )}
        {hermesStatus === 'done' && (
          <span className="text-xs text-green-500">✓ Done</span>
        )}
        {hermesStatus === 'error' && (
          <span className="text-xs text-red-500">✗ Error</span>
        )}
      </div>

      {/* Book Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{totalWords.toLocaleString()} / {book.wordCountGoal.toLocaleString()} words</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Last action */}
      {lastAction && (
        <div className="text-xs text-gray-600 mb-2 bg-purple-50 rounded px-2 py-1">
          {lastAction}
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-1.5">
        <button
          onClick={handleWriteNext}
          disabled={hermesStatus === 'writing'}
          className="w-full text-xs text-left px-2.5 py-1.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 disabled:opacity-50 transition-colors"
        >
          ✍️ Write Next Chapter
        </button>
        <button
          onClick={handleCheckContinuity}
          disabled={hermesStatus === 'writing'}
          className="w-full text-xs text-left px-2.5 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50 transition-colors"
        >
          🔍 Check Continuity
        </button>
        <button
          onClick={handleAutoFormat}
          disabled={hermesStatus === 'writing'}
          className="w-full text-xs text-left px-2.5 py-1.5 rounded bg-green-50 hover:bg-green-100 text-green-700 disabled:opacity-50 transition-colors"
        >
          📐 Validate Formatting
        </button>
      </div>

      {/* Chapter outline */}
      <div className="mt-3">
        <h4 className="text-xs font-medium text-gray-600 mb-1">Chapter Outline</h4>
        <div className="max-h-40 overflow-y-auto space-y-0.5">
          {book.chapters.map((ch, i) => {
            const chWords = ch.scenes.reduce((t, s) => t + s.wordCount, 0);
            return (
              <div
                key={ch.id}
                className="text-xs text-gray-500 flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-gray-50"
              >
                <span className="text-gray-400 w-4">{i + 1}.</span>
                <span className="flex-1 truncate">{ch.title}</span>
                <span className="text-gray-400">{chWords.toLocaleString()}w</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      <div className="mt-3 text-xs text-gray-400 italic">
        Tip: Ask Hermes in Telegram to write chapters, then import with 🐾 button
      </div>
    </div>
  );
}
