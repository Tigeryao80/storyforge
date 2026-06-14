// mcp-server/src/server.ts

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Configuration ──────────────────────────────────────────

const HERMES_OUTPUT_DIR = join(__dirname, '..', '..', 'hermes-output');
const ATTICUS_DIR = join(__dirname, '..', '..');

// ── Types ──────────────────────────────────────────────────

interface StoryForgeBook {
  id: string;
  title: string;
  author: string;
  subtitle?: string;
  parts: unknown[];
  chapters: StoryForgeChapter[];
  createdAt: string;
  updatedAt: string;
  wordCountGoal: number;
  trimSize?: string;
  includeToc?: boolean;
  includeCopyright?: boolean;
  includeDedication?: boolean;
  copyrightText?: string;
  dedicationText?: string;
}

interface StoryForgeChapter {
  id: string;
  title: string;
  scenes: SceneData[];
  order: number;
  collapsed: boolean;
  wordCountGoal: number;
}

interface SceneData {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  order: number;
}

// ── Tool Definitions ───────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'list_books',
    description: 'List all .storyforge book files in the hermes-output directory. Use to see what books Hermes has written.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'read_book',
    description: 'Read a full .storyforge book file and return its structure (title, author, chapters, scenes, word counts). Use to review what Hermes has written.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename in hermes-output directory (e.g., "my-novel.storyforge" or "chapter-03.storyforge")',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'get_book_summary',
    description: 'Get a summary of a book: title, author, chapter count, total words, chapter titles. Use for quick overview without full content.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename in hermes-output directory',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'get_chapter_text',
    description: 'Get the full text content of a specific chapter from a .storyforge file. Use when Hermes needs to review or continue a specific chapter.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename in hermes-output directory',
        },
        chapter_index: {
          type: 'number',
          description: 'Zero-based chapter index (0 = first chapter)',
        },
      },
      required: ['filename', 'chapter_index'],
    },
  },
  {
    name: 'check_formatting',
    description: 'Validate a .storyforge book file for formatting issues: missing headers, header hierarchy, empty chapters, KDP compliance. Returns list of issues found.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename in hermes-output directory',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'get_word_count',
    description: 'Get word count statistics for a book: total words, per-chapter words, per-scene words, progress toward goal.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename in hermes-output directory',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'list_chapters',
    description: 'List all chapters in a book with titles, scene counts, and word counts. Use for navigation and planning.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename in hermes-output directory',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'validate_kdp',
    description: 'Check KDP publishing compliance: title, author, word count, trim size, chapter structure. Returns pass/fail with specific issues.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename in hermes-output directory',
        },
      },
      required: ['filename'],
    },
  },
];

// ── Helpers ────────────────────────────────────────────────

function readBookFile(filename: string): StoryForgeBook {
  const filepath = join(HERMES_OUTPUT_DIR, filename);
  if (!existsSync(filepath)) {
    throw new Error(`File not found: ${filename}`);
  }
  const content = readFileSync(filepath, 'utf-8');
  return JSON.parse(content) as StoryForgeBook;
}

function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return stripped.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// ── Tool Handlers ──────────────────────────────────────────

async function handleListBooks() {
  const files = readdirSync(HERMES_OUTPUT_DIR)
    .filter(f => f.endsWith('.storyforge') || f.endsWith('.json'));

  if (files.length === 0) {
    return { content: [{ type: 'text' as const, text: 'No .storyforge files found in hermes-output directory.' }] };
  }

  const list = files.map(f => {
    try {
      const book = readBookFile(f);
      const totalWords = book.chapters.reduce(
        (t, ch) => t + ch.scenes.reduce((ct, s) => ct + s.wordCount, 0), 0
      );
      return `📖 ${f}\n   Title: ${book.title} | Author: ${book.author || 'N/A'} | Chapters: ${book.chapters.length} | Words: ${totalWords.toLocaleString()}`;
    } catch {
      return `📄 ${f} (could not parse)`;
    }
  });

  return { content: [{ type: 'text' as const, text: list.join('\n\n') }] };
}

async function handleReadBook(args: { filename: string }) {
  const book = readBookFile(args.filename);
  const totalWords = book.chapters.reduce(
    (t, ch) => t + ch.scenes.reduce((ct, s) => ct + s.wordCount, 0), 0
  );

  const summary = [
    `📖 ${book.title}`,
    `Author: ${book.author || 'N/A'}`,
    `Chapters: ${book.chapters.length} | Total Words: ${totalWords.toLocaleString()} / ${book.wordCountGoal.toLocaleString()}`,
    `Trim: ${book.trimSize || '6x9'} | TOC: ${book.includeToc ? 'Yes' : 'No'}`,
    ``,
    `Chapters:`,
    ...book.chapters.map((ch, i) => {
      const chWords = ch.scenes.reduce((t, s) => t + s.wordCount, 0);
      return `  ${i + 1}. "${ch.title}" — ${ch.scenes.length} scenes, ${chWords.toLocaleString()} words`;
    }),
  ].join('\n');

  return { content: [{ type: 'text' as const, text: summary }] };
}

async function handleGetBookSummary(args: { filename: string }) {
  const book = readBookFile(args.filename);
  const totalWords = book.chapters.reduce(
    (t, ch) => t + ch.scenes.reduce((ct, s) => ct + s.wordCount, 0), 0
  );

  const progress = ((totalWords / book.wordCountGoal) * 100).toFixed(1);

  const summary = [
    `📖 ${book.title} by ${book.author || 'Unknown'}`,
    `Progress: ${totalWords.toLocaleString()} / ${book.wordCountGoal.toLocaleString()} words (${progress}%)`,
    `Chapters: ${book.chapters.length}`,
    ``,
    `Chapter List:`,
    ...book.chapters.map((ch, i) => {
      const chWords = ch.scenes.reduce((t, s) => t + s.wordCount, 0);
      return `  Ch.${i + 1}: "${ch.title}" — ${chWords.toLocaleString()} words`;
    }),
  ].join('\n');

  return { content: [{ type: 'text' as const, text: summary }] };
}

async function handleGetChapterText(args: { filename: string; chapter_index: number }) {
  const book = readBookFile(args.filename);
  const chapter = book.chapters[args.chapter_index];

  if (!chapter) {
    throw new Error(`Chapter index ${args.chapter_index} not found. Book has ${book.chapters.length} chapters (0-${book.chapters.length - 1}).`);
  }

  const lines = [
    `📖 ${book.title} — Chapter ${args.chapter_index + 1}: ${chapter.title}`,
    `Scenes: ${chapter.scenes.length} | Word Goal: ${chapter.wordCountGoal.toLocaleString()}`,
    ``,
  ];

  chapter.scenes.forEach((scene, i) => {
    lines.push(`── Scene ${i + 1}: ${scene.title} (${scene.wordCount.toLocaleString()} words) ──`);
    // Strip HTML for readable text
    const text = scene.content.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    lines.push(text);
    lines.push('');
  });

  return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
}

async function handleCheckFormatting(args: { filename: string }) {
  const book = readBookFile(args.filename);
  const issues: string[] = [];
  const warnings: string[] = [];

  // Book-level
  if (!book.title?.trim()) issues.push('❌ Book title is empty');
  if (!book.author?.trim()) warnings.push('⚠️ Author name is missing');
  if (book.chapters.length === 0) issues.push('❌ Book has no chapters');

  // Chapter-level
  book.chapters.forEach((ch, ci) => {
    if (!ch.title?.trim()) issues.push(`❌ Chapter ${ci + 1} has no title`);
    if (ch.scenes.length === 0) issues.push(`❌ Chapter "${ch.title || ci + 1}" has no scenes`);

    ch.scenes.forEach((sc, si) => {
      // Check for H1 in scene content (should be H2)
      if (/<h1[^>]*>/i.test(sc.content)) {
        warnings.push(`⚠️ Scene "${sc.title}" in Ch.${ci + 1} contains H1 tag (should be H2 for scene break)`);
      }
      // Check for empty content
      const text = sc.content.replace(/<[^>]*>/g, '').trim();
      if (!text) warnings.push(`⚠️ Scene "${sc.title}" in Ch.${ci + 1} has empty content`);
      // Check for script tags
      if (/<script/i.test(sc.content)) issues.push(`❌ Scene "${sc.title}" in Ch.${ci + 1} contains script tags (security risk)`);
    });
  });

  const allIssues = [...issues, ...warnings];
  const result = [
    `Formatting Check: ${book.title}`,
    `Errors: ${issues.length} | Warnings: ${warnings.length}`,
    ``,
    ...(allIssues.length > 0 ? allIssues : ['✅ No formatting issues found!']),
  ].join('\n');

  return { content: [{ type: 'text' as const, text: result }] };
}

async function handleGetWordCount(args: { filename: string }) {
  const book = readBookFile(args.filename);
  const totalWords = book.chapters.reduce(
    (t, ch) => t + ch.scenes.reduce((ct, s) => ct + s.wordCount, 0), 0
  );
  const progress = ((totalWords / book.wordCountGoal) * 100).toFixed(1);

  const lines = [
    `📊 Word Count: ${book.title}`,
    `Total: ${totalWords.toLocaleString()} / ${book.wordCountGoal.toLocaleString()} words (${progress}%)`,
    ``,
    `Per Chapter:`,
    ...book.chapters.map((ch, i) => {
      const chWords = ch.scenes.reduce((t, s) => t + s.wordCount, 0);
      const sceneInfo = ch.scenes.map((s, j) => `    Scene ${j + 1}: ${s.wordCount.toLocaleString()}w`).join('\n');
      return `  Ch.${i + 1} "${ch.title}": ${chWords.toLocaleString()} words\n${sceneInfo}`;
    }),
  ].join('\n');

  return { content: [{ type: 'text' as const, text: lines }] };
}

async function handleListChapters(args: { filename: string }) {
  const book = readBookFile(args.filename);

  const lines = [
    `📑 Chapters in "${book.title}":`,
    ``,
    ...book.chapters.map((ch, i) => {
      const chWords = ch.scenes.reduce((t, s) => t + s.wordCount, 0);
      return `${i + 1}. "${ch.title}"\n   Scenes: ${ch.scenes.length} | Words: ${chWords.toLocaleString()} | Goal: ${ch.wordCountGoal.toLocaleString()}`;
    }),
  ].join('\n\n');

  return { content: [{ type: 'text' as const, text: lines }] };
}

async function handleValidateKDP(args: { filename: string }) {
  const book = readBookFile(args.filename);
  const issues: string[] = [];
  const passes: string[] = [];

  // Required fields
  if (book.title?.trim()) passes.push('✅ Title present');
  else issues.push('❌ KDP requires a book title');

  if (book.author?.trim()) passes.push('✅ Author present');
  else issues.push('❌ KDP requires an author name');

  if (book.chapters.length > 0) passes.push(`✅ ${book.chapters.length} chapter(s)`);
  else issues.push('❌ KDP requires at least one chapter');

  // Word count
  const totalWords = book.chapters.reduce(
    (t, ch) => t + ch.scenes.reduce((ct, s) => ct + s.wordCount, 0), 0
  );
  if (totalWords >= 1000) passes.push(`✅ Word count: ${totalWords.toLocaleString()} (above 1,000 minimum)`);
  else issues.push(`❌ Word count too low: ${totalWords.toLocaleString()} (KDP minimum ~1,000)`);

  if (totalWords > 150000) issues.push(`⚠️ Very large book (${totalWords.toLocaleString()} words) — may hit KDP file size limits`);

  // Trim size
  const validTrims = ['5x8', '5.25x8', '5.5x8.5', '6x9', '6.14x9.21', '7x10', '8x10', '8.5x11'];
  if (book.trimSize && validTrims.includes(book.trimSize)) passes.push(`✅ Trim size: ${book.trimSize} (KDP standard)`);
  else if (book.trimSize) issues.push(`⚠️ Trim size "${book.trimSize}" may not be KDP standard`);
  else issues.push('⚠️ No trim size set (default: 6x9)');

  // Structure
  const allChaptersHaveScenes = book.chapters.every(ch => ch.scenes.length > 0);
  if (allChaptersHaveScenes) passes.push('✅ All chapters have scenes');
  else issues.push('❌ Some chapters have no scenes');

  const compliant = issues.filter(i => i.startsWith('❌')).length === 0;

  const result = [
    `KDP Compliance: ${book.title}`,
    compliant ? '✅ PASSED (ready for KDP)' : '❌ NEEDS FIXES',
    ``,
    `Passes:`,
    ...passes,
    ``,
    ...(issues.length > 0 ? ['Issues:', ...issues] : []),
  ].join('\n');

  return { content: [{ type: 'text' as const, text: result }] };
}

// ── Server Setup ───────────────────────────────────────────

const server = new Server(
  {
    name: 'storyforge-mcp-server',
    version: '1.0.0',
    description: 'MCP server for StoryForge book writing app. Lets Hermes read books, check formatting, validate KDP compliance, and get word counts.',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_books':
        return await handleListBooks();
      case 'read_book':
        return await handleReadBook(args as { filename: string });
      case 'get_book_summary':
        return await handleGetBookSummary(args as { filename: string });
      case 'get_chapter_text':
        return await handleGetChapterText(args as { filename: string; chapter_index: number });
      case 'check_formatting':
        return await handleCheckFormatting(args as { filename: string });
      case 'get_word_count':
        return await handleGetWordCount(args as { filename: string });
      case 'list_chapters':
        return await handleListChapters(args as { filename: string });
      case 'validate_kdp':
        return await handleValidateKDP(args as { filename: string });
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{
        type: 'text' as const,
        text: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
});

// ── Start ──────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('StoryForge MCP Server running on stdio');
}

main().catch(console.error);
