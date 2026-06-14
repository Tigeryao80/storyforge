// src/lib/formatting/autoFix.ts

import type { Book, Chapter, Scene } from '@/types/book';
import type { FormattingIssue } from './validator';
import { countWords } from '@/lib/api/bookImport';

/**
 * Auto-fix formatting issues in a book.
 * Returns a new book with fixes applied.
 */
export function autoFixBook(book: Book, issues: FormattingIssue[]): Book {
  let fixedBook = { ...book };

  for (const issue of issues) {
    if (!issue.autoFixable) continue;

    if (issue.message.includes('has no title') && issue.chapterId) {
      fixedBook = fixChapterTitle(fixedBook, issue.chapterId);
    }

    if (issue.message.includes('has no scenes') && issue.chapterId) {
      fixedBook = fixEmptyChapter(fixedBook, issue.chapterId);
    }

    if (issue.message.includes('H1 tag (should be H2)')) {
      fixedBook = fixH1InScene(fixedBook, issue.chapterId, issue.sceneId);
    }

    if (issue.message.includes('Header hierarchy skip')) {
      fixedBook = fixHeaderHierarchy(fixedBook, issue.sceneId);
    }

    if (issue.message.includes('Invalid callout type')) {
      fixedBook = fixCalloutType(fixedBook, issue.sceneId);
    }

    if (issue.message.includes('script tags')) {
      fixScriptTags(fixedBook, issue.sceneId);
    }
  }

  return fixedBook;
}

function fixChapterTitle(book: Book, chapterId: string): Book {
  return {
    ...book,
    chapters: book.chapters.map(ch =>
      ch.id === chapterId && !ch.title.trim()
        ? { ...ch, title: `Chapter ${ch.order + 1}` }
        : ch
    ),
  };
}

function fixEmptyChapter(book: Book, chapterId: string): Book {
  return {
    ...book,
    chapters: book.chapters.map(ch => {
      if (ch.id !== chapterId || ch.scenes.length > 0) return ch;
      return {
        ...ch,
        scenes: [{
          id: crypto.randomUUID?.() || `scene-${Date.now()}`,
          title: 'Scene 1',
          content: '<p>Start writing here...</p>',
          wordCount: 0,
          order: 0,
        }],
      };
    }),
  };
}

function fixH1InScene(book: Book, chapterId?: string, sceneId?: string): Book {
  if (!chapterId || !sceneId) return book;
  return {
    ...book,
    chapters: book.chapters.map(ch => {
      if (ch.id !== chapterId) return ch;
      return {
        ...ch,
        scenes: ch.scenes.map(sc => {
          if (sc.id !== sceneId) return sc;
          const fixedContent = sc.content.replace(/<h1[^>]*>/gi, '<h2>').replace(/<\/h1>/gi, '</h2>');
          return { ...sc, content: fixedContent, wordCount: countWords(fixedContent) };
        }),
      };
    }),
  };
}

function fixHeaderHierarchy(book: Book, sceneId?: string): Book {
  if (!sceneId) return book;
  return {
    ...book,
    chapters: book.chapters.map(ch => ({
      ...ch,
      scenes: ch.scenes.map(sc => {
        if (sc.id !== sceneId) return sc;
        // Fix skipped levels: H1→H3 becomes H1→H2→H3, etc.
        let content = sc.content;
        const headers = content.match(/<h([1-6])[^>]*>/gi) || [];
        let lastLevel = 0;
        headers.forEach((tag) => {
          const level = parseInt(tag.match(/h([1-6])/i)?.[1] || '6');
          if (level > lastLevel + 1) {
            // Downgrade to lastLevel + 1
            const newLevel = lastLevel + 1;
            content = content.replace(tag, `<h${newLevel}>`);
            // Also fix closing tag
            const closingTag = `</h${level}>`;
            const newClosingTag = `</h${newLevel}>`;
            // Replace only the first occurrence after the opening tag
            const tagIndex = content.indexOf(`<h${newLevel}>`);
            if (tagIndex >= 0) {
              const afterTag = content.substring(tagIndex);
              const fixedAfter = afterTag.replace(closingTag, newClosingTag);
              content = content.substring(0, tagIndex) + fixedAfter;
            }
          }
          lastLevel = Math.min(level, lastLevel + 1);
        });
        return { ...sc, content, wordCount: countWords(content) };
      }),
    })),
  };
}

function fixCalloutType(book: Book, sceneId?: string): Book {
  if (!sceneId) return book;
  return {
    ...book,
    chapters: book.chapters.map(ch => ({
      ...ch,
      scenes: ch.scenes.map(sc => {
        if (sc.id !== sceneId) return sc;
        // Replace invalid callout types with "info"
        const fixedContent = sc.content.replace(
          /data-callout-type="(?!info|warning|tip)([^"]*)"/gi,
          'data-callout-type="info"'
        );
        return { ...sc, content: fixedContent, wordCount: countWords(fixedContent) };
      }),
    })),
  };
}

function fixScriptTags(book: Book, sceneId?: string): Book {
  if (!sceneId) return book;
  return {
    ...book,
    chapters: book.chapters.map(ch => ({
      ...ch,
      scenes: ch.scenes.map(sc => {
        if (sc.id !== sceneId) return sc;
        const fixedContent = sc.content.replace(/<script[\s\S]*?<\/script>/gi, '');
        return { ...sc, content: fixedContent, wordCount: countWords(fixedContent) };
      }),
    })),
  };
}
