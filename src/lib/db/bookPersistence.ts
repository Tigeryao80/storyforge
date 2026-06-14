import { db } from './database';
import type { Book } from '@/types/book';

const ACTIVE_BOOK_KEY = 'storyforge-active-book-id';

export async function saveBook(book: Book): Promise<void> {
  await db.books.put({
    id: book.id,
    data: book,
    updatedAt: book.updatedAt,
  });
  localStorage.setItem(ACTIVE_BOOK_KEY, book.id);
}

export async function loadBook(bookId: string): Promise<Book | null> {
  const record = await db.books.get(bookId);
  return record?.data ?? null;
}

export async function loadMostRecentBook(): Promise<Book | null> {
  const activeId = localStorage.getItem(ACTIVE_BOOK_KEY);
  if (activeId) {
    const book = await loadBook(activeId);
    if (book) return book;
  }
  const all = await db.books.orderBy('updatedAt').reverse().limit(1).toArray();
  return all[0]?.data ?? null;
}

export async function listBooks(): Promise<{ id: string; title: string; updatedAt: string }[]> {
  return db.books.orderBy('updatedAt').reverse().toArray().then(records =>
    records.map(r => ({ id: r.id, title: r.data.title, updatedAt: r.updatedAt }))
  );
}

export async function deleteBook(bookId: string): Promise<void> {
  await db.books.delete(bookId);
}
