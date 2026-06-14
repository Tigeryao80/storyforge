// src/components/import/HermesImportButton.tsx

'use client';

import { useRef, useState } from 'react';
import { useBookStore } from '@/store/bookStore';

export default function HermesImportButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const importFromHermesJSON = useBookStore((state) => state.importFromHermesJSON);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importFromHermesJSON(text);

      if (result.success) {
        setImportStatus('success');
        const warningText = result.warnings.length > 0
          ? ` (${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''})`
          : '';
        setStatusMessage(`Imported successfully${warningText}`);
      } else {
        setImportStatus('error');
        setStatusMessage(result.errors[0] || 'Import failed');
      }
    } catch {
      setImportStatus('error');
      setStatusMessage('Failed to read file');
    }

    // Reset after 3 seconds
    setTimeout(() => {
      setImportStatus('idle');
      setStatusMessage('');
    }, 3000);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".storyforge,.json"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className={`text-xs px-2 py-1 rounded transition-colors ${
          importStatus === 'success'
            ? 'bg-green-100 text-green-700'
            : importStatus === 'error'
            ? 'bg-red-100 text-red-700'
            : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
        }`}
        title="Import from Hermes (.storyforge JSON)"
      >
        {importStatus === 'idle' && '🐾 Hermes'}
        {importStatus === 'success' && `✓ ${statusMessage}`}
        {importStatus === 'error' && `✗ ${statusMessage}`}
      </button>
    </>
  );
}
