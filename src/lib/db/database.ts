import Dexie, { type EntityTable } from 'dexie';
import type { Book } from '@/types/book';

interface BookRecord {
  id: string;
  data: Book;
  updatedAt: string;
}

interface VersionRecord {
  id: string;
  bookId: string;
  data: Book;
  label: string;
  wordCount: number;
  createdAt: string;
}

const db = new Dexie('AtticusRebuild') as Dexie & {
  books: EntityTable<BookRecord, 'id'>;
  versions: EntityTable<VersionRecord, 'id'>;
};

db.version(1).stores({
  books: 'id, updatedAt',
});

db.version(2).stores({
  books: 'id, updatedAt',
  versions: 'id, bookId, createdAt',
});

export { db };
export type { BookRecord, VersionRecord };
