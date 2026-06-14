'use client';

import { useEffect, useCallback } from 'react';
import { useBookStore } from '@/store/bookStore';

const PRESET_DURATIONS = [10, 15, 25, 30, 45, 60];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function SprintTimer() {
  const sprintActive = useBookStore((s) => s.sprintActive);
  const sprintRemaining = useBookStore((s) => s.sprintRemaining);
  const sprintDuration = useBookStore((s) => s.sprintDuration);
  const sprintsCompleted = useBookStore((s) => s.sprintsCompleted);
  const sprintWordsWritten = useBookStore((s) => s.sprintWordsWritten);
  const startSprint = useBookStore((s) => s.startSprint);
  const tickSprint = useBookStore((s) => s.tickSprint);
  const stopSprint = useBookStore((s) => s.stopSprint);
  const resetSprint = useBookStore((s) => s.resetSprint);
  const setSprintDuration = useBookStore((s) => s.setSprintDuration);

  // Tick every second when sprint is active
  useEffect(() => {
    if (!sprintActive) return;
    const id = setInterval(() => {
      tickSprint();
    }, 1000);
    return () => clearInterval(id);
  }, [sprintActive, tickSprint]);

  const progress = sprintDuration > 0 ? ((sprintDuration - sprintRemaining) / sprintDuration) * 100 : 0;

  const handleStart = useCallback(() => {
    startSprint(sprintDuration / 60);
  }, [startSprint, sprintDuration]);

  const handlePreset = useCallback((minutes: number) => {
    setSprintDuration(minutes);
  }, [setSprintDuration]);

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Writing Sprint</h3>

      {/* Timer display */}
      <div className="text-center mb-3">
        <div className={`text-3xl font-mono font-bold ${sprintActive ? 'text-blue-600' : 'text-gray-400'}`}>
          {formatTime(sprintRemaining)}
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${sprintActive ? 'bg-blue-500' : 'bg-gray-300'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        {!sprintActive ? (
          <button
            onClick={handleStart}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
          >
            Start Sprint
          </button>
        ) : (
          <button
            onClick={stopSprint}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
          >
            Stop
          </button>
        )}
        <button
          onClick={resetSprint}
          className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Duration presets */}
      <div className="flex flex-wrap gap-1 mb-3">
        {PRESET_DURATIONS.map((m) => (
          <button
            key={m}
            onClick={() => handlePreset(m)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              sprintDuration / 60 === m && !sprintActive
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="text-xs text-gray-400 text-center">
        {sprintsCompleted > 0 && (
          <span>Sprints completed: {sprintsCompleted} · Words last sprint: {sprintWordsWritten}</span>
        )}
        {sprintsCompleted === 0 && <span>No sprints yet. Pick a duration and go!</span>}
      </div>
    </div>
  );
}
