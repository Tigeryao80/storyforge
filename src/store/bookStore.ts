// src/store/bookStore.ts

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Book, Chapter, Scene, BookTheme, WritingGoal, CloudBackup } from '@/types/book';
import type { Character, PlotOutline, StoryBible, WritingSession } from '@/types/story';
import { saveBook } from '@/lib/db/bookPersistence';
import {
  saveCharacter, loadCharacters, deleteCharacter,
  savePlotOutline, loadPlotOutline,
  saveStoryBible, loadStoryBible,
  saveWritingSession, loadWritingSessions, loadLatestWritingSession,
} from '@/lib/db/storyPersistence';
import { convertToBook, parseHermesJSON, validateImport, convertChapterImport, convertSceneImport } from '@/lib/api/bookImport';
import type { BookImport, ChapterImport, SceneImport } from '@/lib/api/types';

interface SprintSession {
  startedAt: string;
  endedAt: string;
  wordsWritten: number;
}

interface BookState {
  book: Book;
  activeChapterId: string | null;
  activeSceneId: string | null;
  theme: BookTheme;
  goal: WritingGoal;
  sidebarOpen: boolean;
  backup: CloudBackup;
  sprintActive: boolean;
  sprintRemaining: number;
  sprintDuration: number;
  sprintsCompleted: number;
  sprintHistory: SprintSession[];
  sprintStartSnapshot: number;
  sprintWordsWritten: number;

  // Chapter actions
  addChapter: (afterOrder?: number) => void;
  removeChapter: (id: string) => void;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  reorderChapters: (fromIndex: number, toIndex: number) => void;
  toggleChapterCollapse: (id: string) => void;

  // Scene actions
  addScene: (chapterId: string) => void;
  removeScene: (chapterId: string, sceneId: string) => void;
  updateScene: (chapterId: string, sceneId: string, updates: Partial<Scene>) => void;
  updateSceneContent: (chapterId: string, sceneId: string, content: string) => void;

  // Book actions
  setBookMeta: (title: string, author: string) => void;
  setActiveChapter: (id: string | null) => void;
  setActiveScene: (id: string | null) => void;

  // Theme
  setTheme: (theme: BookTheme) => void;

  // Goal
  updateGoal: (words: number) => void;

  // UI
  toggleSidebar: () => void;

  // Computed
  getTotalWordCount: () => number;

  // Backup actions
  setBackupStatus: (status: CloudBackup['status'], errorMessage?: string) => void;

  // Sprint actions
  startSprint: (durationMinutes?: number) => void;
  tickSprint: () => void;
  stopSprint: () => void;
  resetSprint: () => void;
  setSprintDuration: (minutes: number) => void;

  // Hermes import actions
  importBook: (data: BookImport) => void;
  importChapter: (chapter: ChapterImport, afterOrder?: number) => void;
  importScene: (chapterId: string, scene: SceneImport) => void;
  importFromHermesJSON: (jsonString: string) => { success: boolean; errors: string[]; warnings: string[] };

  // Per-chapter theme
  setChapterTheme: (chapterId: string, theme: Partial<BookTheme> | null) => void;

  // Characters
  characters: Character[];
  loadBookCharacters: () => Promise<void>;
  addCharacter: (character: Partial<Character>) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;

  // Plot outline
  plotOutline: PlotOutline | null;
  loadBookPlot: () => Promise<void>;
  setPlotOutline: (outline: PlotOutline) => void;
  addPlotBeat: (beat: Partial<import('@/types/story').PlotBeat>) => void;
  updatePlotBeat: (id: string, updates: Partial<import('@/types/story').PlotBeat>) => void;
  removePlotBeat: (id: string) => void;

  // Story bible
  storyBible: StoryBible | null;
  loadBookBible: () => Promise<void>;
  setStoryBible: (bible: StoryBible) => void;

  // Writing sessions
  writingSessions: WritingSession[];
  latestSession: WritingSession | null;
  loadBookSessions: () => Promise<void>;
  startWritingSession: () => string;  // returns sessionId
  endWritingSession: (id: string, summary: string, nextAction: string, wordsWritten: number) => void;

  // Continuity — generates a briefing any AI can use
  getWritingBriefing: () => Promise<string>;
}

const defaultTheme: BookTheme = {
  id: 'default',
  name: 'Classic',
  fontFamily: 'Georgia, serif',
  fontSize: 16,
  lineHeight: 1.6,
  headingFont: 'Georgia, serif',
  textColor: '#1a1a1a',
  backgroundColor: '#ffffff',
  accentColor: '#2563eb',
};

const defaultGoal: WritingGoal = {
  dailyWordCount: 1000,
  currentStreak: 0,
  lastWriteDate: '',
  totalWordsWritten: 0,
};

const defaultBackup: CloudBackup = {
  lastBackupAt: null,
  status: 'idle',
  errorMessage: null,
};

function createEmptyScene(order: number): Scene {
  return {
    id: uuidv4(),
    title: `Scene ${order + 1}`,
    content: '',
    wordCount: 0,
    order,
  };
}

function createEmptyChapter(order: number): Chapter {
  return {
    id: uuidv4(),
    title: `Chapter ${order + 1}`,
    scenes: [createEmptyScene(0)],
    order,
    collapsed: false,
    wordCountGoal: 0,
  };
}

function createDefaultBook(): Book {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: 'Untitled Book',
    author: '',
    parts: [],
    chapters: [createEmptyChapter(0)],
    createdAt: now,
    updatedAt: now,
    wordCountGoal: 80000,
  };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export const useBookStore = create<BookState>((set, get) => ({
  book: createDefaultBook(),
  activeChapterId: null,
  activeSceneId: null,
  theme: defaultTheme,
  goal: defaultGoal,
  sidebarOpen: true,
  backup: defaultBackup,
  sprintActive: false,
  sprintRemaining: 25 * 60,
  sprintDuration: 25 * 60,
  sprintsCompleted: 0,
  sprintHistory: [],
  sprintStartSnapshot: 0,
  sprintWordsWritten: 0,

  addChapter: (afterOrder?: number) => {
    set((state) => {
      const order = afterOrder !== undefined ? afterOrder + 1 : state.book.chapters.length;
      const newChapter = createEmptyChapter(order);
      const chapters = [...state.book.chapters];
      chapters.splice(order, 0, newChapter);
      // Reorder
      chapters.forEach((ch, i) => ch.order = i);
      return {
        book: { ...state.book, chapters, updatedAt: new Date().toISOString() },
        activeChapterId: newChapter.id,
        activeSceneId: newChapter.scenes[0]?.id ?? null,
      };
    });
  },

  removeChapter: (id: string) => {
    set((state) => {
      if (state.book.chapters.length <= 1) return state;
      const chapters = state.book.chapters.filter(ch => ch.id !== id).map((ch, i) => ({ ...ch, order: i }));
      return {
        book: { ...state.book, chapters, updatedAt: new Date().toISOString() },
        activeChapterId: state.activeChapterId === id ? (chapters[0]?.id ?? null) : state.activeChapterId,
      };
    });
  },

  updateChapter: (id: string, updates: Partial<Chapter>) => {
    set((state) => ({
      book: {
        ...state.book,
        chapters: state.book.chapters.map(ch => ch.id === id ? { ...ch, ...updates } : ch),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  reorderChapters: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const chapters = [...state.book.chapters];
      const [moved] = chapters.splice(fromIndex, 1);
      chapters.splice(toIndex, 0, moved);
      chapters.forEach((ch, i) => ch.order = i);
      return { book: { ...state.book, chapters, updatedAt: new Date().toISOString() } };
    });
  },

  toggleChapterCollapse: (id: string) => {
    set((state) => ({
      book: {
        ...state.book,
        chapters: state.book.chapters.map(ch =>
          ch.id === id ? { ...ch, collapsed: !ch.collapsed } : ch
        ),
      },
    }));
  },

  addScene: (chapterId: string) => {
    set((state) => ({
      book: {
        ...state.book,
        chapters: state.book.chapters.map(ch => {
          if (ch.id !== chapterId) return ch;
          const newScene = createEmptyScene(ch.scenes.length);
          return { ...ch, scenes: [...ch.scenes, newScene] };
        }),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  removeScene: (chapterId: string, sceneId: string) => {
    set((state) => ({
      book: {
        ...state.book,
        chapters: state.book.chapters.map(ch => {
          if (ch.id !== chapterId) return ch;
          if (ch.scenes.length <= 1) return ch;
          return { ...ch, scenes: ch.scenes.filter(s => s.id !== sceneId).map((s, i) => ({ ...s, order: i })) };
        }),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  updateScene: (chapterId: string, sceneId: string, updates: Partial<Scene>) => {
    set((state) => ({
      book: {
        ...state.book,
        chapters: state.book.chapters.map(ch => {
          if (ch.id !== chapterId) return ch;
          return {
            ...ch,
            scenes: ch.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s),
          };
        }),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  updateSceneContent: (chapterId: string, sceneId: string, content: string) => {
    set((state) => ({
      book: {
        ...state.book,
        chapters: state.book.chapters.map(ch => {
          if (ch.id !== chapterId) return ch;
          return {
            ...ch,
            scenes: ch.scenes.map(s =>
              s.id === sceneId ? { ...s, content, wordCount: countWords(content) } : s
            ),
          };
        }),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  setBookMeta: (title: string, author: string) => {
    set((state) => ({
      book: { ...state.book, title, author, updatedAt: new Date().toISOString() },
    }));
  },

  setActiveChapter: (id: string | null) => {
    const state = get();
    const chapter = state.book.chapters.find(ch => ch.id === id);
    set({
      activeChapterId: id,
      activeSceneId: chapter?.scenes[0]?.id ?? null,
    });
  },

  setActiveScene: (id: string | null) => set({ activeSceneId: id }),

  setTheme: (theme: BookTheme) => set({ theme }),

  updateGoal: (words: number) => {
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const isConsecutive = state.goal.lastWriteDate === today ||
        new Date(state.goal.lastWriteDate).getTime() === new Date(today).getTime() - 86400000;
      return {
        goal: {
          ...state.goal,
          totalWordsWritten: state.goal.totalWordsWritten + words,
          currentStreak: isConsecutive ? state.goal.currentStreak + 1 : 1,
          lastWriteDate: today,
        },
      };
    });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  getTotalWordCount: () => {
    const state = get();
    return state.book.chapters.reduce(
      (total, ch) => total + ch.scenes.reduce((chTotal, s) => chTotal + s.wordCount, 0),
      0
    );
  },

  // Cloud backup actions
  setBackupStatus: (status: CloudBackup['status'], errorMessage?: string) => {
    set((state) => ({
      backup: {
        ...state.backup,
        status,
        errorMessage: errorMessage ?? null,
        lastBackupAt: status === 'synced' ? new Date().toISOString() : state.backup.lastBackupAt,
      },
    }));
  },

  // Sprint actions
  startSprint: (durationMinutes: number = 25) => {
    const state = get();
    set({
      sprintActive: true,
      sprintRemaining: durationMinutes * 60,
      sprintDuration: durationMinutes * 60,
      sprintStartSnapshot: state.getTotalWordCount(),
      sprintWordsWritten: 0,
    });
  },

  tickSprint: () => {
    set((state) => {
      if (!state.sprintActive || state.sprintRemaining <= 0) return state;
      const newRemaining = state.sprintRemaining - 1;
      if (newRemaining <= 0) {
        const wordsThisSprint = state.getTotalWordCount() - state.sprintStartSnapshot;
        return {
          sprintActive: false,
          sprintRemaining: 0,
          sprintsCompleted: state.sprintsCompleted + 1,
          sprintWordsWritten: Math.max(0, wordsThisSprint),
          sprintHistory: [
            ...state.sprintHistory,
            {
              startedAt: new Date(Date.now() - state.sprintDuration * 1000).toISOString(),
              endedAt: new Date().toISOString(),
              wordsWritten: Math.max(0, wordsThisSprint),
            },
          ],
        };
      }
      return { sprintRemaining: newRemaining };
    });
  },

  stopSprint: () => {
    const state = get();
    if (!state.sprintActive) return;
    const wordsThisSprint = state.getTotalWordCount() - state.sprintStartSnapshot;
    set({
      sprintActive: false,
      sprintRemaining: state.sprintDuration,
      sprintWordsWritten: Math.max(0, wordsThisSprint),
      sprintHistory: [
        ...state.sprintHistory,
        {
          startedAt: new Date(Date.now() - (state.sprintDuration - state.sprintRemaining) * 1000).toISOString(),
          endedAt: new Date().toISOString(),
          wordsWritten: Math.max(0, wordsThisSprint),
        },
      ],
    });
  },

  resetSprint: () => {
    set((state) => ({
      sprintActive: false,
      sprintRemaining: state.sprintDuration,
      sprintWordsWritten: 0,
    }));
  },

  setSprintDuration: (minutes: number) => {
    set({
      sprintDuration: minutes * 60,
      sprintRemaining: minutes * 60,
    });
  },

  // Hermes import actions
  importBook: (data: BookImport) => {
    const book = convertToBook(data);
    set({
      book,
      activeChapterId: book.chapters[0]?.id ?? null,
      activeSceneId: book.chapters[0]?.scenes[0]?.id ?? null,
    });
  },

  importChapter: (chapterData: ChapterImport, afterOrder?: number) => {
    set((state) => {
      const order = afterOrder !== undefined ? afterOrder + 1 : state.book.chapters.length;
      const newChapter = convertChapterImport(chapterData, order);
      const chapters = [...state.book.chapters];
      chapters.splice(order, 0, newChapter);
      chapters.forEach((ch, i) => ch.order = i);
      return {
        book: { ...state.book, chapters, updatedAt: new Date().toISOString() },
        activeChapterId: newChapter.id,
        activeSceneId: newChapter.scenes[0]?.id ?? null,
      };
    });
  },

  importScene: (chapterId: string, sceneData: SceneImport) => {
    set((state) => ({
      book: {
        ...state.book,
        chapters: state.book.chapters.map(ch => {
          if (ch.id !== chapterId) return ch;
          const newScene = convertSceneImport(sceneData, ch.scenes.length);
          return { ...ch, scenes: [...ch.scenes, newScene] };
        }),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  importFromHermesJSON: (jsonString: string) => {
    try {
      const parsed = parseHermesJSON(jsonString);
      const validation = validateImport(parsed);

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.message),
          warnings: validation.warnings.map(w => w.message),
        };
      }

      const book = convertToBook(parsed);
      set({
        book,
        activeChapterId: book.chapters[0]?.id ?? null,
        activeSceneId: book.chapters[0]?.scenes[0]?.id ?? null,
      });

      return {
        success: true,
        errors: [],
        warnings: validation.warnings.map(w => w.message),
      };
    } catch (err) {
      return {
        success: false,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
        warnings: [],
      };
    }
  },

  // Per-chapter theme override
  setChapterTheme: (chapterId: string, themeOverride: Partial<BookTheme> | null) => {
    set((state) => ({
      book: {
        ...state.book,
        chapters: state.book.chapters.map(ch =>
          ch.id === chapterId
            ? { ...ch, themeOverride: themeOverride ?? undefined }
            : ch
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  // ── Characters ──────────────────────────────────────────
  characters: [],

  loadBookCharacters: async () => {
    const { book } = get();
    if (!book.id) return;
    const characters = await loadCharacters(book.id);
    set({ characters });
  },

  addCharacter: (partial: Partial<Character>) => {
    const { book, characters } = get();
    const now = new Date().toISOString();
    const character: Character = {
      id: uuidv4(),
      name: partial.name || 'New Character',
      aliases: partial.aliases || [],
      role: partial.role || 'supporting',
      gender: partial.gender,
      age: partial.age,
      appearance: partial.appearance,
      personality: partial.personality,
      background: partial.background,
      goals: partial.goals,
      arc: partial.arc,
      relationships: partial.relationships || [],
      firstAppearanceChapterId: partial.firstAppearanceChapterId,
      notes: partial.notes,
      createdAt: now,
      updatedAt: now,
    };
    set({ characters: [...characters, character] });
    saveCharacter(book.id, character).catch(console.error);
  },

  updateCharacter: (id: string, updates: Partial<Character>) => {
    const { book, characters } = get();
    const updated = characters.map(c =>
      c.id === id
        ? { ...c, ...updates, updatedAt: new Date().toISOString() }
        : c
    );
    set({ characters: updated });
    const found = updated.find(c => c.id === id);
    if (found) saveCharacter(book.id, found).catch(console.error);
  },

  removeCharacter: (id: string) => {
    const { book, characters } = get();
    set({ characters: characters.filter(c => c.id !== id) });
    deleteCharacter(book.id, id).catch(console.error);
  },

  // ── Plot Outline ────────────────────────────────────────
  plotOutline: null,

  loadBookPlot: async () => {
    const { book } = get();
    if (!book.id) return;
    const outline = await loadPlotOutline(book.id);
    set({ plotOutline: outline });
  },

  setPlotOutline: (outline: PlotOutline) => {
    set({ plotOutline: outline });
    savePlotOutline(outline).catch(console.error);
  },

  addPlotBeat: (partial: Partial<import('@/types/story').PlotBeat>) => {
    const { book, plotOutline } = get();
    const now = new Date().toISOString();
    const beat: import('@/types/story').PlotBeat = {
      id: uuidv4(),
      type: partial.type || 'note',
      title: partial.title || 'New Beat',
      description: partial.description,
      chapterIndex: partial.chapterIndex,
      sceneIndex: partial.sceneIndex,
      status: partial.status || 'planned',
      order: partial.order ?? (plotOutline?.beats.length ?? 0),
    };
    const existingBeats = plotOutline?.beats ?? [];
    const outline: PlotOutline = plotOutline
      ? { ...plotOutline, beats: [...existingBeats, beat], updatedAt: now }
      : {
          id: uuidv4(),
          bookId: book.id,
          beats: [beat],
          createdAt: now,
          updatedAt: now,
        };
    set({ plotOutline: outline });
    savePlotOutline(outline).catch(console.error);
  },

  updatePlotBeat: (id: string, updates: Partial<import('@/types/story').PlotBeat>) => {
    const { plotOutline } = get();
    if (!plotOutline) return;
    const now = new Date().toISOString();
    const beats = plotOutline.beats.map(b =>
      b.id === id ? { ...b, ...updates } : b
    );
    const outline = { ...plotOutline, beats, updatedAt: now };
    set({ plotOutline: outline });
    savePlotOutline(outline).catch(console.error);
  },

  removePlotBeat: (id: string) => {
    const { plotOutline } = get();
    if (!plotOutline) return;
    const now = new Date().toISOString();
    const beats = plotOutline.beats.filter(b => b.id !== id);
    const outline = { ...plotOutline, beats, updatedAt: now };
    set({ plotOutline: outline });
    savePlotOutline(outline).catch(console.error);
  },

  // ── Story Bible ─────────────────────────────────────────
  storyBible: null,

  loadBookBible: async () => {
    const { book } = get();
    if (!book.id) return;
    const bible = await loadStoryBible(book.id);
    set({ storyBible: bible });
  },

  setStoryBible: (bible: StoryBible) => {
    set({ storyBible: bible });
    saveStoryBible(bible).catch(console.error);
  },

  // ── Writing Sessions ────────────────────────────────────
  writingSessions: [],
  latestSession: null,

  loadBookSessions: async () => {
    const { book } = get();
    if (!book.id) return;
    const sessions = await loadWritingSessions(book.id);
    const latest = await loadLatestWritingSession(book.id);
    set({ writingSessions: sessions, latestSession: latest });
  },

  startWritingSession: () => {
    const { book, writingSessions } = get();
    const now = new Date().toISOString();
    const session: WritingSession = {
      id: uuidv4(),
      bookId: book.id,
      startedAt: now,
      wordsWritten: 0,
      scenesWritten: 0,
      chaptersWritten: 0,
    };
    set({ writingSessions: [...writingSessions, session], latestSession: session });
    return session.id;
  },

  endWritingSession: (id: string, summary: string, nextAction: string, wordsWritten: number) => {
    const { book, writingSessions } = get();
    const now = new Date().toISOString();
    const sessions = writingSessions.map(s =>
      s.id === id
        ? { ...s, endedAt: now, summary, nextAction, wordsWritten }
        : s
    );
    set({ writingSessions: sessions });
    const ended = sessions.find(s => s.id === id);
    if (ended) saveWritingSession(ended).catch(console.error);
  },

  // ── Continuity Briefing ─────────────────────────────────
  getWritingBriefing: async () => {
    const { book, characters, plotOutline, storyBible, latestSession } = get();

    const totalWords = book.chapters.reduce(
      (t, ch) => t + ch.scenes.reduce((ct, s) => ct + (s.wordCount || 0), 0), 0
    );
    const progress = book.wordCountGoal > 0
      ? ((totalWords / book.wordCountGoal) * 100).toFixed(1)
      : '0';

    // Find next unwritten plot beat
    const nextBeat = plotOutline?.beats.find(b => b.status === 'planned');

    // Find last written chapter
    let lastWrittenChapter = -1;
    for (let i = book.chapters.length - 1; i >= 0; i--) {
      const hasContent = book.chapters[i].scenes.some(s =>
        s.content.replace(/<[^>]*>/g, '').trim().length > 10
      );
      if (hasContent) { lastWrittenChapter = i; break; }
    }

    const lines = [
      `# StoryForge Writing Briefing: ${book.title}`,
      ``,
      `**Author:** ${book.author || 'Not set'}`,
      `**Progress:** ${totalWords.toLocaleString()} / ${book.wordCountGoal.toLocaleString()} words (${progress}%)`,
      `**Chapters:** ${book.chapters.length} total, ${lastWrittenChapter + 1} with content`,
      ``,
      `## Characters (${characters.length})`,
      ...(characters.length > 0
        ? characters.slice(0, 10).map(c => `- **${c.name}** [${c.role}] — ${c.appearance?.substring(0, 60) || 'No description'} ...`)
        : ['- (none)']
      ),
      ``,
      `## Plot Outline (${plotOutline?.beats.length ?? 0} beats)`,
      ...(nextBeat
        ? [`**Next planned beat:** "${nextBeat.title}" — ${nextBeat.description || 'No description'}`]
        : ['- No plot outline yet']
      ),
      ``,
      `## Last Writing Session`,
      ...(latestSession
        ? [
            `- **Started:** ${new Date(latestSession.startedAt).toLocaleString()}`,
            latestSession.endedAt ? `- **Ended:** ${new Date(latestSession.endedAt).toLocaleString()}` : '- **Status:** In progress',
            `- **Words written:** ${latestSession.wordsWritten}`,
            latestSession.summary ? `- **Summary:** ${latestSession.summary}` : '',
            latestSession.nextAction ? `- **Next action:** ${latestSession.nextAction}` : '',
          ].filter(Boolean)
        : ['- No sessions recorded']
      ),
      ``,
      `## Chapter Summary`,
      ...book.chapters.map((ch, i) => {
        const chWords = ch.scenes.reduce((t, s) => t + (s.wordCount || 0), 0);
        const hasContent = ch.scenes.some(s => s.content.replace(/<[^>]*>/g, '').trim().length > 10);
        return `**Ch.${i + 1}: ${ch.title}** — ${chWords.toLocaleString()} words ${hasContent ? '✅' : '📝 (empty)'}`;
      }),
    ];

    return lines.join('\n');
  },
}));

// Auto-save to IndexedDB on changes
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
useBookStore.subscribe((state) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveBook(state.book).catch(console.error);
  }, 1000);
});
