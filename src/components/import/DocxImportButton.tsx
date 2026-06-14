'use client';

import { useRef } from 'react';
import { importDocx } from '@/lib/import/docx';
import { useBookStore } from '@/store/bookStore';

export default function DocxImportButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedBook = await importDocx(file);
      useBookStore.setState({
        book: importedBook,
        activeChapterId: importedBook.chapters[0]?.id ?? null,
        activeSceneId: importedBook.chapters[0]?.scenes[0]?.id ?? null,
      });
    } catch (err) {
      console.error('Failed to import DOCX:', err);
      alert('Failed to import file. Please try a valid .docx file.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        onChange={handleImport}
        className="hidden"
        id="docx-import"
      />
      <label
        htmlFor="docx-import"
        className="text-sm text-gray-500 hover:text-blue-600 cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
      >
        Import DOCX
      </label>
    </>
  );
}
