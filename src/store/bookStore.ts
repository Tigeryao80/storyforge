// src/store/bookStore.ts

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Book, Chapter, Scene, BookTheme, WritingGoal } from '@/types/book';

interface BookState {
  book: Book;
  activeChapterId: string | null;
  activeSceneId: string | null;
  theme: BookTheme;
  goal: WritingGoal;
  sidebarOpen: boolean;

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
  };
}

function createDefaultBook(): Book {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: 'Untitled Book',
    author: '',
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
}));
