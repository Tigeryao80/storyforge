import Dexie, { type EntityTable } from 'dexie';
import type { Book } from '@/types/book';
import type { Character, PlotOutline, StoryBible, WritingSession } from '@/types/story';

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

interface CharacterRecord {
  id: string;
  bookId: string;
  data: Character;
  updatedAt: string;
}

interface PlotOutlineRecord {
  id: string;
  bookId: string;
  data: PlotOutline;
  updatedAt: string;
}

interface StoryBibleRecord {
  id: string;
  bookId: string;
  data: StoryBible;
  updatedAt: string;
}

interface WritingSessionRecord {
  id: string;
  bookId: string;
  data: WritingSession;
  createdAt: string;
}

const db = new Dexie('StoryForgeRebuild') as Dexie & {
  books: EntityTable<BookRecord, 'id'>;
  versions: EntityTable<VersionRecord, 'id'>;
  characters: EntityTable<CharacterRecord, 'id'>;
  plotOutlines: EntityTable<PlotOutlineRecord, 'id'>;
  storyBibles: EntityTable<StoryBibleRecord, 'id'>;
  writingSessions: EntityTable<WritingSessionRecord, 'id'>;
};

// Version 3: add characters, plot, bible, sessions
db.version(3).stores({
  books: 'id, updatedAt',
  versions: 'id, bookId, createdAt',
  characters: 'id, bookId, updatedAt',
  plotOutlines: 'id, bookId, updatedAt',
  storyBibles: 'id, bookId, updatedAt',
  writingSessions: 'id, bookId, createdAt',
});

export { db };
export type { BookRecord, VersionRecord, CharacterRecord, PlotOutlineRecord, StoryBibleRecord, WritingSessionRecord };
