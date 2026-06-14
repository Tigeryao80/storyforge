// src/lib/formatting/validator.ts

import type { Book, Chapter, Scene } from '@/types/book';
import { getHeaderLevel, isValidCalloutType } from './rules';

export interface FormattingIssue {
  type: 'error' | 'warning';
  chapterId?: string;
  sceneId?: string;
  message: string;
  autoFixable: boolean;
}

export interface ValidationResult {
  valid: boolean;
  issues: FormattingIssue[];
  errorCount: number;
  warningCount: number;
}

export function validateBook(book: Book): ValidationResult {
  const issues: FormattingIssue[] = [];

  // Book-level checks
  if (!book.title?.trim()) {
    issues.push({ type: 'error', message: 'Book title is empty', autoFixable: false });
  }
  if (book.chapters.length === 0) {
    issues.push({ type: 'error', message: 'Book has no chapters', autoFixable: false });
  }

  // Chapter-level checks
  book.chapters.forEach((chapter) => {
    issues.push(...validateChapter(chapter));
  });

  return {
    valid: issues.filter(i => i.type === 'error').length === 0,
    issues,
    errorCount: issues.filter(i => i.type === 'error').length,
    warningCount: issues.filter(i => i.type === 'warning').length,
  };
}

function validateChapter(chapter: Chapter): FormattingIssue[] {
  const issues: FormattingIssue[] = [];

  if (!chapter.title?.trim()) {
    issues.push({
      type: 'error',
      chapterId: chapter.id,
      message: `Chapter ${chapter.order + 1} has no title`,
      autoFixable: true,
    });
  }

  if (chapter.scenes.length === 0) {
    issues.push({
      type: 'error',
      chapterId: chapter.id,
      message: `Chapter "${chapter.title}" has no scenes`,
      autoFixable: true,
    });
  }

  chapter.scenes.forEach((scene) => {
    issues.push(...validateScene(chapter.id, scene));
  });

  return issues;
}

function validateScene(chapterId: string, scene: Scene): FormattingIssue[] {
  const issues: FormattingIssue[] = [];
  const content = scene.content || '';

  // Check for H1 in scene content (should only be chapter title, not in scene body)
  const h1Match = content.match(/<h1[^>]*>/gi);
  if (h1Match && h1Match.length > 0) {
    issues.push({
      type: 'warning',
      chapterId,
      sceneId: scene.id,
      message: `Scene "${scene.title}" contains H1 tag (should be H2 for scene break)`,
      autoFixable: true,
    });
  }

  // Check header hierarchy
  const headerTags = content.match(/<h[1-6][^>]*>/gi) || [];
  let lastLevel = 0;
  headerTags.forEach((tag) => {
    const level = getHeaderLevel(tag);
    if (level > lastLevel + 1 && lastLevel > 0) {
      issues.push({
        type: 'warning',
        chapterId,
        sceneId: scene.id,
        message: `Header hierarchy skip detected: H${lastLevel} → H${level} in scene "${scene.title}"`,
        autoFixable: true,
      });
    }
    lastLevel = level;
  });

  // Check for empty content
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  if (!textContent) {
    issues.push({
      type: 'warning',
      chapterId,
      sceneId: scene.id,
      message: `Scene "${scene.title}" has no text content`,
      autoFixable: false,
    });
  }

  // Check callout types
  const calloutMatches = content.match(/data-callout-type="([^"]*)"/gi) || [];
  calloutMatches.forEach((match) => {
    const type = match.replace('data-callout-type="', '').replace('"', '');
    if (!isValidCalloutType(type)) {
      issues.push({
        type: 'error',
        chapterId,
        sceneId: scene.id,
        message: `Invalid callout type "${type}" in scene "${scene.title}" (valid: info, warning, tip)`,
        autoFixable: true,
      });
    }
  });

  // Check for script tags (security)
  if (/<script/i.test(content)) {
    issues.push({
      type: 'error',
      chapterId,
      sceneId: scene.id,
      message: `Scene "${scene.title}" contains script tags (security risk)`,
      autoFixable: true,
    });
  }

  return issues;
}

// KDP-specific validation
export function validateKDPCompliance(book: Book): FormattingIssue[] {
  const issues: FormattingIssue[] = [];

  if (!book.title?.trim()) {
    issues.push({ type: 'error', message: 'KDP requires a book title', autoFixable: false });
  }
  if (!book.author?.trim()) {
    issues.push({ type: 'error', message: 'KDP requires an author name', autoFixable: false });
  }
  if (book.chapters.length === 0) {
    issues.push({ type: 'error', message: 'KDP requires at least one chapter', autoFixable: false });
  }

  // Check total word count
  const totalWords = book.chapters.reduce(
    (total, ch) => total + ch.scenes.reduce((chTotal, s) => chTotal + s.wordCount, 0),
    0
  );

  if (totalWords < 1000) {
    issues.push({
      type: 'warning',
      message: `Book has only ${totalWords.toLocaleString()} words. KDP minimum is typically 1,000+ words.`,
      autoFixable: false,
    });
  }

  if (totalWords > 150000) {
    issues.push({
      type: 'warning',
      message: `Book has ${totalWords.toLocaleString()} words. KDP has file size limits for very large books.`,
      autoFixable: false,
    });
  }

  // Check trim size
  const validTrimSizes = ['5x8', '5.25x8', '5.5x8.5', '6x9', '6.14x9.21', '7x10', '8x10', '8.5x11'];
  if (book.trimSize && !validTrimSizes.includes(book.trimSize)) {
    issues.push({
      type: 'warning',
      message: `Trim size "${book.trimSize}" may not be KDP standard`,
      autoFixable: true,
    });
  }

  return issues;
}
