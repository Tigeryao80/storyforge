import Dexie, { type EntityTable } from 'dexie';
import type { Book } from '@/types/book';

interface BookRecord {
  id: string;
  data: Book;
  updatedAt: string;
}

const db = new Dexie('AtticusRebuild') as Dexie & {
  books: EntityTable<BookRecord, 'id'>;
};

db.version(1).stores({
  books: 'id, updatedAt',
});

export { db };
export type { BookRecord };
