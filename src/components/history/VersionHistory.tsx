// src/components/history/VersionHistory.tsx

'use client';

import { useState, useEffect } from 'react';
import { useBookStore } from '@/store/bookStore';
import { saveVersion, listVersions, deleteVersion } from '@/lib/db/versionHistory';
import type { BookVersion } from '@/lib/db/versionHistory';

export default function VersionHistory() {
  const book = useBookStore((s) => s.book);
  const importBook = useBookStore((s) => s.importBook);
  const [versions, setVersions] = useState<BookVersion[]>([]);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  useEffect(() => {
    listVersions(book.id).then(setVersions);
  }, [book.id]);

  const handleSave = async () => {
    const label = prompt('Version label (optional):');
    await saveVersion(book, label || undefined);
    const updated = await listVersions(book.id);
    setVersions(updated);
  };

  const handleRestore = async (version: BookVersion) => {
    importBook(version.snapshot);
    setShowConfirm(null);
  };

  const handleDelete = async (id: string) => {
    await deleteVersion(id);
    const updated = await listVersions(book.id);
    setVersions(updated);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="border-t border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800">📋 Version History</h3>
        <button
          onClick={handleSave}
          className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700"
        >
          + Save Version
        </button>
      </div>

      {versions.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No versions saved yet</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {versions.map((v) => (
            <div
              key={v.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="text-gray-700 truncate">{v.label}</div>
                <div className="text-gray-400">
                  {formatDate(v.createdAt)} · {v.wordCount.toLocaleString()} words
                </div>
              </div>
              {showConfirm === v.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleRestore(v)}
                    className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setShowConfirm(v.id)}
                    className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-xs"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-xs"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
