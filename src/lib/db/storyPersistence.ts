import { db } from './database';
import type { Character, PlotOutline, StoryBible, WritingSession } from '@/types/story';

// ── Character CRUD ──────────────────────────────────────────

export async function saveCharacter(bookId: string, character: Character): Promise<void> {
  await db.characters.put({
    id: character.id,
    bookId,
    data: character,
    updatedAt: character.updatedAt,
  });
}

export async function loadCharacters(bookId: string): Promise<Character[]> {
  const records = await db.characters.where('bookId').equals(bookId).toArray();
  return records.map(r => r.data).sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadCharacter(bookId: string, characterId: string): Promise<Character | null> {
  const record = await db.characters.get(characterId);
  if (record && record.bookId === bookId) return record.data;
  return null;
}

export async function deleteCharacter(bookId: string, characterId: string): Promise<void> {
  const record = await db.characters.get(characterId);
  if (record && record.bookId === bookId) {
    await db.characters.delete(characterId);
  }
}

// ── Plot Outline CRUD ───────────────────────────────────────

export async function savePlotOutline(outline: PlotOutline): Promise<void> {
  await db.plotOutlines.put({
    id: outline.id,
    bookId: outline.bookId,
    data: outline,
    updatedAt: outline.updatedAt,
  });
}

export async function loadPlotOutline(bookId: string): Promise<PlotOutline | null> {
  const records = await db.plotOutlines.where('bookId').equals(bookId).toArray();
  return records[0]?.data ?? null;
}

// ── Story Bible CRUD ────────────────────────────────────────

export async function saveStoryBible(bible: StoryBible): Promise<void> {
  await db.storyBibles.put({
    id: bible.id,
    bookId: bible.bookId,
    data: bible,
    updatedAt: bible.updatedAt,
  });
}

export async function loadStoryBible(bookId: string): Promise<StoryBible | null> {
  const records = await db.storyBibles.where('bookId').equals(bookId).toArray();
  return records[0]?.data ?? null;
}

// ── Writing Session CRUD ────────────────────────────────────

export async function saveWritingSession(session: WritingSession): Promise<void> {
  await db.writingSessions.put({
    id: session.id,
    bookId: session.bookId,
    data: session,
    createdAt: session.startedAt,
  });
}

export async function loadWritingSessions(bookId: string, limit = 20): Promise<WritingSession[]> {
  const records = await db.writingSessions
    .where('bookId')
    .equals(bookId)
    .reverse()
    .limit(limit)
    .toArray();
  return records.map(r => r.data);
}

export async function loadLatestWritingSession(bookId: string): Promise<WritingSession | null> {
  const records = await db.writingSessions
    .where('bookId')
    .equals(bookId)
    .reverse()
    .limit(1)
    .toArray();
  return records[0]?.data ?? null;
}
