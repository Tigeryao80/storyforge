import mammoth from 'mammoth';
import type { Book, Chapter, Scene } from '@/types/book';
import { v4 as uuidv4 } from 'uuid';

function htmlToScenes(html: string): Scene[] {
  const scenes: Scene[] = [];
  const parts = html.split(/<h2[^>]*>/i);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.trim()) continue;

    const titleMatch = part.match(/^([^<]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `Scene ${i + 1}`;
    const content = part.replace(/^[^<]+/, '').trim();
    const plainText = content.replace(/<[^>]+>/g, '').trim();
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

    scenes.push({
      id: uuidv4(),
      title,
      content: content || '<p>Start writing...</p>',
      wordCount,
      order: scenes.length,
    });
  }

  if (scenes.length === 0) {
    const plainText = html.replace(/<[^>]+>/g, '').trim();
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
    scenes.push({
      id: uuidv4(),
      title: 'Imported Content',
      content: html || '<p>Start writing...</p>',
      wordCount,
      order: 0,
    });
  }

  return scenes;
}

export async function importDocx(file: File): Promise<Book> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  const chapters: Chapter[] = [];
  const chapterParts = html.split(/<h1[^>]*>/i);

  for (let i = 0; i < chapterParts.length; i++) {
    const part = chapterParts[i];
    if (!part.trim()) continue;

    const titleMatch = part.match(/^([^<]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `Chapter ${i + 1}`;
    const content = part.replace(/^[^<]+/, '').trim();

    chapters.push({
      id: uuidv4(),
      title,
      scenes: htmlToScenes(content),
      order: chapters.length,
      collapsed: false,
    });
  }

  if (chapters.length === 0) {
    chapters.push({
      id: uuidv4(),
      title: file.name.replace('.docx', ''),
      scenes: htmlToScenes(html),
      order: 0,
      collapsed: false,
    });
  }

  const now = new Date().toISOString();
  const totalWords = chapters.reduce(
    (t, ch) => t + ch.scenes.reduce((ct, s) => ct + s.wordCount, 0),
    0
  );

  return {
    id: uuidv4(),
    title: file.name.replace('.docx', ''),
    author: '',
    parts: [],
    chapters,
    createdAt: now,
    updatedAt: now,
    wordCountGoal: Math.max(80000, totalWords),
  };
}
