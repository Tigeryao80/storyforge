// src/components/editor/FocusMode.tsx

'use client';

import { useEffect, useCallback } from 'react';

interface FocusModeProps {
  active: boolean;
  onExit: () => void;
}

export default function FocusMode({ active, onExit }: FocusModeProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    },
    [onExit]
  );

  useEffect(() => {
    if (active) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.classList.add('focus-mode');
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('focus-mode');
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('focus-mode');
    };
  }, [active, handleKeyDown]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1a2e] flex flex-col items-center justify-center">
      {/* Subtle exit hint */}
      <div className="absolute top-6 right-6 text-gray-600 text-xs">
        Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">Esc</kbd> to exit focus mode
      </div>

      {/* Centered writing area */}
      <div className="w-full max-w-3xl px-12">
        <div className="text-gray-500 text-sm mb-4 text-center">
          Focus Mode — Distraction Free
        </div>
        {/* The editor content will be rendered here by the parent */}
        <div id="focus-mode-editor" className="min-h-[60vh]" />
      </div>
    </div>
  );
}
