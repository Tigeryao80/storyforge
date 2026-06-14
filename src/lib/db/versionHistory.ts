// src/lib/db/versionHistory.ts

import { db } from './database';
import type { Book } from '@/types/book';

export interface BookVersion {
  id: string;
  bookId: string;
  snapshot: Book;
  createdAt: string;
  label: string;
  wordCount: number;
}

const MAX_VERSIONS = 50;

export async function saveVersion(book: Book, label?: string): Promise<void> {
  const totalWords = book.chapters.reduce(
    (t, ch) => t + ch.scenes.reduce((ct, s) => ct + s.wordCount, 0),
    0
  );

  await db.versions.put({
    id: crypto.randomUUID?.() || `v-${Date.now()}`,
    bookId: book.id,
    data: JSON.parse(JSON.stringify(book)),
    label: label || `Version ${new Date().toLocaleString()}`,
    wordCount: totalWords,
    createdAt: new Date().toISOString(),
  });

  // Prune old versions if over limit
  const count = await db.versions.where('bookId').equals(book.id).count();
  if (count > MAX_VERSIONS) {
    const oldest = await db.versions
      .where('bookId')
      .equals(book.id)
      .sortBy('createdAt');
    const toDelete = oldest.slice(0, count - MAX_VERSIONS);
    for (const v of toDelete) {
      await db.versions.delete(v.id);
    }
  }
}

export async function listVersions(bookId: string): Promise<BookVersion[]> {
  const records = await db.versions
    .where('bookId')
    .equals(bookId)
    .reverse()
    .sortBy('createdAt');
  return records.map(r => ({
    id: r.id,
    bookId: r.bookId,
    snapshot: r.data,
    createdAt: r.createdAt,
    label: r.label,
    wordCount: r.wordCount,
  }));
}

export async function getVersion(versionId: string): Promise<BookVersion | null> {
  const r = await db.versions.get(versionId);
  if (!r) return null;
  return {
    id: r.id,
    bookId: r.bookId,
    snapshot: r.data,
    createdAt: r.createdAt,
    label: r.label,
    wordCount: r.wordCount,
  };
}

export async function deleteVersion(versionId: string): Promise<void> {
  await db.versions.delete(versionId);
}

export async function clearVersions(bookId: string): Promise<void> {
  await db.versions.where('bookId').equals(bookId).delete();
}
