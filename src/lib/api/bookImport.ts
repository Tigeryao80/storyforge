// src/lib/api/bookImport.ts

import { v4 as uuidv4 } from 'uuid';
import type {
  BookImport,
  ChapterImport,
  SceneImport,
  ImportValidation,
  ImportError,
  ImportWarning,
} from './types';
import type { Book, Chapter, Scene } from '@/types/book';

// ── Validation ──────────────────────────────────────────────

export function validateImport(data: BookImport): ImportValidation {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  // Required fields
  if (!data.title?.trim()) {
    errors.push({ field: 'title', message: 'Book title is required' });
  }
  if (!data.author?.trim()) {
    warnings.push({ field: 'author', message: 'Author name is missing' });
  }
  if (!data.chapters || data.chapters.length === 0) {
    errors.push({ field: 'chapters', message: 'At least one chapter is required' });
  }

  // Validate each chapter
  if (data.chapters) {
    data.chapters.forEach((ch, ci) => {
      if (!ch.title?.trim()) {
        errors.push({
          field: 'chapters[].title',
          message: `Chapter ${ci + 1} is missing a title`,
          chapterIndex: ci,
        });
      }
      if (!ch.scenes || ch.scenes.length === 0) {
        errors.push({
          field: 'chapters[].scenes',
          message: `Chapter "${ch.title || ci + 1}" has no scenes`,
          chapterIndex: ci,
        });
      }

      // Validate each scene
      if (ch.scenes) {
        ch.scenes.forEach((sc, si) => {
          if (!sc.title?.trim()) {
            warnings.push({
              field: 'chapters[].scenes[].title',
              message: `Scene ${si + 1} in chapter "${ch.title || ci + 1}" is missing a title`,
              chapterIndex: ci,
              sceneIndex: si,
            });
          }
          if (!sc.content?.trim()) {
            warnings.push({
              field: 'chapters[].scenes[].content',
              message: `Scene "${sc.title || si + 1}" in chapter "${ch.title || ci + 1}" has empty content`,
              chapterIndex: ci,
              sceneIndex: si,
            });
          }
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ── Sanitization ────────────────────────────────────────────

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'div', 'span',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'sup', 'sub',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  'div': new Set(['data-callout-type', 'data-section', 'class']),
  'span': new Set(['class', 'style']),
  'a': new Set(['href', 'title', 'target', 'rel']),
  'img': new Set(['src', 'alt', 'width', 'height', 'class']),
  'table': new Set(['class']),
  'th': new Set(['colspan', 'rowspan']),
  'td': new Set(['colspan', 'rowspan']),
  '*': new Set(['class']),
};

function sanitizeHTML(html: string): string {
  // Remove script tags and their content
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Remove event handlers (onclick, onload, etc.)
  cleaned = cleaned.replace(/\s+on\w+="[^"]*"/gi, '');
  cleaned = cleaned.replace(/\s+on\w+='[^']*'/gi, '');
  // Remove javascript: URLs
  cleaned = cleaned.replace(/href="javascript:[^"]*"/gi, 'href="#"');
  cleaned = cleaned.replace(/src="javascript:[^"]*"/gi, '');
  // Remove style tags
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Remove iframe, object, embed
  cleaned = cleaned.replace(/<(iframe|object|embed|form|input|textarea|select)[\s\S]*?<\/\1>/gi, '');
  cleaned = cleaned.replace(/<(iframe|object|embed|form|input|textarea|select)[^>]*\/?>/gi, '');

  return cleaned;
}

// ── Word Count ──────────────────────────────────────────────

export function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return stripped.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// ── Conversion ──────────────────────────────────────────────

export function convertSceneImport(scene: SceneImport, order: number): Scene {
  const content = sanitizeHTML(scene.content || '');
  return {
    id: scene.id || uuidv4(),
    title: scene.title || `Scene ${order + 1}`,
    content,
    wordCount: countWords(content),
    order,
  };
}

export function convertChapterImport(chapter: ChapterImport, order: number): Chapter {
  const scenes = (chapter.scenes || []).map((sc, i) => convertSceneImport(sc, i));
  return {
    id: chapter.id || uuidv4(),
    title: chapter.title || `Chapter ${order + 1}`,
    scenes,
    order,
    collapsed: false,
    wordCountGoal: chapter.wordCountGoal || 0,
  };
}

export function convertToBook(data: BookImport): Book {
  const now = new Date().toISOString();
  const chapters = data.chapters.map((ch, i) => convertChapterImport(ch, i));

  return {
    id: data.id || uuidv4(),
    title: data.title || 'Untitled Book',
    author: data.author || '',
    subtitle: data.subtitle,
    parts: [],
    chapters,
    createdAt: now,
    updatedAt: now,
    wordCountGoal: data.wordCountGoal || 80000,
    trimSize: data.trimSize || '6x9',
    includeToc: data.includeToc ?? true,
    includeCopyright: data.includeCopyright ?? true,
    includeDedication: data.includeDedication ?? false,
    copyrightText: data.copyrightText,
    dedicationText: data.dedicationText,
  };
}

// ── Parse Hermes Output ─────────────────────────────────────

export function parseHermesJSON(jsonString: string): BookImport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON: could not parse file');
  }

  // Handle full .atticus format
  if (isBookImport(parsed)) {
    return parsed;
  }

  // Handle Hermes chapter-only output: { title, chapter: { title, scenes: [...] } }
  if (isHermesChapterOutput(parsed)) {
    return {
      title: parsed.title || 'Untitled Book',
      author: parsed.author || '',
      chapters: [parsed.chapter],
    };
  }

  // Handle Hermes scenes-only output: { scenes: [...] }
  if (isHermesScenesOutput(parsed)) {
    return {
      title: 'Untitled Book',
      author: '',
      chapters: [{
        title: 'Chapter 1',
        scenes: parsed.scenes,
      }],
    };
  }

  throw new Error('Unrecognized format: expected .atticus JSON or Hermes chapter output');
}

function isBookImport(data: unknown): data is BookImport {
  return (
    typeof data === 'object' &&
    data !== null &&
    'chapters' in data &&
    Array.isArray((data as BookImport).chapters)
  );
}

function isHermesChapterOutput(data: unknown): data is { title?: string; author?: string; chapter: ChapterImport } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'chapter' in data &&
    typeof (data as { chapter: unknown }).chapter === 'object' &&
    (data as { chapter: { scenes?: unknown } }).chapter !== null &&
    'scenes' in (data as { chapter: { scenes?: unknown } }).chapter
  );
}

function isHermesScenesOutput(data: unknown): data is { scenes: SceneImport[] } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'scenes' in data &&
    Array.isArray((data as { scenes: unknown }).scenes)
  );
}
