'use client';

import { useCallback, useRef } from 'react';
import { useBookStore } from '@/store/bookStore';

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function CloudBackup() {
  const backup = useBookStore((s) => s.backup);
  const setBackupStatus = useBookStore((s) => s.setBackupStatus);
  const book = useBookStore((s) => s.book);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    setBackupStatus('syncing');
    try {
      const json = JSON.stringify(book, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_backup_${new Date().toISOString().split('T')[0]}.storyforge`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus('synced');
    } catch (err) {
      setBackupStatus('error', err instanceof Error ? err.message : 'Export failed');
    }
  }, [book, setBackupStatus]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupStatus('syncing');
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!imported.id || !imported.title || !Array.isArray(imported.chapters)) {
        throw new Error('Invalid StoryForge backup file');
      }
      // Restore the book via the store's setBookMeta — we'll use a direct store reset
      const store = useBookStore.getState();
      useBookStore.setState({
        book: {
          ...imported,
          updatedAt: new Date().toISOString(),
        },
        activeChapterId: imported.chapters[0]?.id ?? null,
        activeSceneId: imported.chapters[0]?.scenes[0]?.id ?? null,
      });
      setBackupStatus('synced');
    } catch (err) {
      setBackupStatus('error', err instanceof Error ? err.message : 'Import failed');
    }
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setBackupStatus]);

  const statusColor = {
    idle: 'text-gray-500',
    syncing: 'text-blue-500',
    error: 'text-red-500',
    synced: 'text-green-600',
  }[backup.status];

  const statusLabel = {
    idle: 'Ready',
    syncing: 'Backing up...',
    error: 'Error',
    synced: 'Backed up',
  }[backup.status];

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Cloud Backup</h3>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium ${statusColor}`}>● {statusLabel}</span>
        <span className="text-xs text-gray-400">
          {backup.status === 'error' ? backup.errorMessage : `Last: ${formatTimestamp(backup.lastBackupAt)}`}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleExport}
          disabled={backup.status === 'syncing'}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          Export Backup
        </button>
        <button
          onClick={handleImport}
          disabled={backup.status === 'syncing'}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          Restore
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".storyforge,.json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
