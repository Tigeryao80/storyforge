import { useBookStore } from '@/store/bookStore';
import type { Book, Chapter, Scene } from '@/types/book';

function createTestBook(): Book {
  const scene1: Scene = {
    id: 'sc-1',
    title: 'Scene 1',
    content: 'Hello world content here',
    wordCount: 4,
    order: 0,
  };
  const scene2: Scene = {
    id: 'sc-2',
    title: 'Scene 2',
    content: 'Second scene text',
    wordCount: 3,
    order: 1,
  };
  const chapter1: Chapter = {
    id: 'ch-1',
    title: 'Chapter 1',
    order: 0,
    collapsed: false,
    wordCountGoal: 0,
    scenes: [scene1, scene2],
  };
  const chapter2: Chapter = {
    id: 'ch-2',
    title: 'Chapter 2',
    order: 1,
    collapsed: false,
    wordCountGoal: 0,
    scenes: [{
      id: 'sc-3',
      title: 'Scene 1',
      content: '',
      wordCount: 0,
      order: 0,
    }],
  };
  return {
    id: 'test-id',
    title: 'Test Book',
    author: 'Test Author',
    parts: [],
    chapters: [chapter1, chapter2],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    wordCountGoal: 80000,
  };
}

describe('bookStore', () => {
  beforeEach(() => {
    useBookStore.setState({
      book: createTestBook(),
      activeChapterId: 'ch-1',
      activeSceneId: 'sc-1',
      sidebarOpen: true,
      goal: {
        dailyWordCount: 1000,
        currentStreak: 3,
        lastWriteDate: '',
        totalWordsWritten: 500,
      },
    });
  });

  describe('getTotalWordCount', () => {
    it('should calculate total word count across all chapters and scenes', () => {
      const count = useBookStore.getState().getTotalWordCount();
      expect(count).toBe(7); // 4 + 3 + 0
    });

    it('should return 0 for empty book', () => {
      useBookStore.setState({
        book: {
          ...createTestBook(),
          chapters: [{
            id: 'ch-empty',
            title: 'Empty',
            order: 0,
            collapsed: false,
            wordCountGoal: 0,
            scenes: [{
              id: 'sc-empty',
              title: 'Empty',
              content: '',
              wordCount: 0,
              order: 0,
            }],
          }],
        },
      });
      expect(useBookStore.getState().getTotalWordCount()).toBe(0);
    });
  });

  describe('addChapter', () => {
    it('should add a chapter at the end by default', () => {
      const initialCount = useBookStore.getState().book.chapters.length;
      useBookStore.getState().addChapter();
      expect(useBookStore.getState().book.chapters.length).toBe(initialCount + 1);
    });

    it('should add a chapter after a specific order', () => {
      useBookStore.getState().addChapter(0);
      const chapters = useBookStore.getState().book.chapters;
      expect(chapters.length).toBe(3);
      expect(chapters[1].title).toContain('Chapter');
    });

    it('should set the new chapter as active', () => {
      useBookStore.getState().addChapter();
      const state = useBookStore.getState();
      expect(state.activeChapterId).not.toBeNull();
      expect(state.activeSceneId).not.toBeNull();
    });

    it('should reorder chapter indices after insertion', () => {
      useBookStore.getState().addChapter(0);
      const chapters = useBookStore.getState().book.chapters;
      chapters.forEach((ch, i) => {
        expect(ch.order).toBe(i);
      });
    });
  });

  describe('removeChapter', () => {
    it('should remove a chapter by id', () => {
      const count = useBookStore.getState().book.chapters.length;
      useBookStore.getState().removeChapter('ch-2');
      expect(useBookStore.getState().book.chapters.length).toBe(count - 1);
    });

    it('should not remove the last chapter', () => {
      // Remove ch-2 first, then try to remove the only remaining chapter
      useBookStore.getState().removeChapter('ch-2');
      const remainingCount = useBookStore.getState().book.chapters.length;
      const onlyChId = useBookStore.getState().book.chapters[0].id;
      useBookStore.getState().removeChapter(onlyChId);
      expect(useBookStore.getState().book.chapters.length).toBe(remainingCount);
    });

    it('should update activeChapterId if removed chapter was active', () => {
      useBookStore.setState({ activeChapterId: 'ch-2' });
      useBookStore.getState().removeChapter('ch-2');
      expect(useBookStore.getState().activeChapterId).toBe('ch-1');
    });

    it('should reorder remaining chapters', () => {
      useBookStore.getState().removeChapter('ch-1');
      const chapters = useBookStore.getState().book.chapters;
      expect(chapters.length).toBe(1);
      expect(chapters[0].order).toBe(0);
    });
  });

  describe('updateChapter', () => {
    it('should update chapter title', () => {
      useBookStore.getState().updateChapter('ch-1', { title: 'New Title' });
      expect(useBookStore.getState().book.chapters[0].title).toBe('New Title');
    });

    it('should not affect other chapters', () => {
      useBookStore.getState().updateChapter('ch-1', { title: 'Changed' });
      expect(useBookStore.getState().book.chapters[1].title).toBe('Chapter 2');
    });

    it('should update the updatedAt timestamp', () => {
      const before = useBookStore.getState().book.updatedAt;
      useBookStore.getState().updateChapter('ch-1', { title: 'Changed' });
      expect(useBookStore.getState().book.updatedAt).not.toBe(before);
    });
  });

  describe('reorderChapters', () => {
    it('should reorder chapters by index', () => {
      useBookStore.getState().reorderChapters(0, 1);
      const chapters = useBookStore.getState().book.chapters;
      expect(chapters[0].id).toBe('ch-2');
      expect(chapters[1].id).toBe('ch-1');
    });

    it('should update order property after reorder', () => {
      useBookStore.getState().reorderChapters(0, 1);
      const chapters = useBookStore.getState().book.chapters;
      chapters.forEach((ch, i) => {
        expect(ch.order).toBe(i);
      });
    });
  });

  describe('toggleChapterCollapse', () => {
    it('should toggle collapsed state', () => {
      const initial = useBookStore.getState().book.chapters[0].collapsed;
      useBookStore.getState().toggleChapterCollapse('ch-1');
      expect(useBookStore.getState().book.chapters[0].collapsed).toBe(!initial);
    });

    it('should not affect other chapters', () => {
      useBookStore.getState().toggleChapterCollapse('ch-1');
      expect(useBookStore.getState().book.chapters[1].collapsed).toBe(false);
    });
  });

  describe('addScene', () => {
    it('should add a scene to the specified chapter', () => {
      const initialCount = useBookStore.getState().book.chapters[0].scenes.length;
      useBookStore.getState().addScene('ch-1');
      expect(useBookStore.getState().book.chapters[0].scenes.length).toBe(initialCount + 1);
    });

    it('should not affect other chapters', () => {
      useBookStore.getState().addScene('ch-1');
      expect(useBookStore.getState().book.chapters[1].scenes.length).toBe(1);
    });
  });

  describe('removeScene', () => {
    it('should remove a scene from a chapter', () => {
      useBookStore.getState().removeScene('ch-1', 'sc-2');
      expect(useBookStore.getState().book.chapters[0].scenes.length).toBe(1);
    });

    it('should not remove the last scene in a chapter', () => {
      // ch-2 only has 1 scene — try to remove it
      useBookStore.getState().removeScene('ch-2', 'sc-3');
      expect(useBookStore.getState().book.chapters[1].scenes.length).toBe(1);
    });

    it('should reorder remaining scenes', () => {
      useBookStore.getState().removeScene('ch-1', 'sc-1');
      const scenes = useBookStore.getState().book.chapters[0].scenes;
      expect(scenes.length).toBe(1);
      expect(scenes[0].order).toBe(0);
    });
  });

  describe('updateScene', () => {
    it('should update scene title', () => {
      useBookStore.getState().updateScene('ch-1', 'sc-1', { title: 'New Scene Title' });
      expect(useBookStore.getState().book.chapters[0].scenes[0].title).toBe('New Scene Title');
    });
  });

  describe('updateSceneContent', () => {
    it('should update content and recalculate word count', () => {
      useBookStore.getState().updateSceneContent('ch-1', 'sc-1', 'New content with five words here');
      const scene = useBookStore.getState().book.chapters[0].scenes[0];
      expect(scene.content).toBe('New content with five words here');
      expect(scene.wordCount).toBe(6);
    });

    it('should handle empty content', () => {
      useBookStore.getState().updateSceneContent('ch-1', 'sc-1', '');
      const scene = useBookStore.getState().book.chapters[0].scenes[0];
      expect(scene.wordCount).toBe(0);
    });
  });

  describe('setActiveChapter', () => {
    it('should set active chapter and auto-select first scene', () => {
      useBookStore.getState().setActiveChapter('ch-2');
      expect(useBookStore.getState().activeChapterId).toBe('ch-2');
      expect(useBookStore.getState().activeSceneId).toBe('sc-3');
    });
  });

  describe('setActiveScene', () => {
    it('should set active scene', () => {
      useBookStore.getState().setActiveScene('sc-2');
      expect(useBookStore.getState().activeSceneId).toBe('sc-2');
    });
  });

  describe('setBookMeta', () => {
    it('should update title and author', () => {
      useBookStore.getState().setBookMeta('My Novel', 'John Doe');
      const book = useBookStore.getState().book;
      expect(book.title).toBe('My Novel');
      expect(book.author).toBe('John Doe');
    });

    it('should update the updatedAt timestamp', () => {
      const before = useBookStore.getState().book.updatedAt;
      useBookStore.getState().setBookMeta('New Title', '');
      expect(useBookStore.getState().book.updatedAt).not.toBe(before);
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar state', () => {
      const initial = useBookStore.getState().sidebarOpen;
      useBookStore.getState().toggleSidebar();
      expect(useBookStore.getState().sidebarOpen).toBe(!initial);
    });
  });

  describe('setTheme', () => {
    it('should update theme', () => {
      const newTheme = {
        id: 'test-theme',
        name: 'Test',
        fontFamily: 'Arial',
        fontSize: 14,
        lineHeight: 1.5,
        headingFont: 'Arial',
        textColor: '#000',
        backgroundColor: '#fff',
        accentColor: '#f00',
      };
      useBookStore.getState().setTheme(newTheme);
      expect(useBookStore.getState().theme.id).toBe('test-theme');
    });
  });

  describe('updateGoal', () => {
    it('should update total words written', () => {
      useBookStore.getState().updateGoal(100);
      expect(useBookStore.getState().goal.totalWordsWritten).toBe(600);
    });

    it('should increment streak for consecutive days', () => {
      const today = new Date().toISOString().split('T')[0];
      useBookStore.setState({
        goal: { ...useBookStore.getState().goal, lastWriteDate: today },
      });
      useBookStore.getState().updateGoal(100);
      expect(useBookStore.getState().goal.currentStreak).toBe(4);
    });

    it('should reset streak to 1 for non-consecutive days', () => {
      useBookStore.setState({
        goal: { ...useBookStore.getState().goal, lastWriteDate: '2025-01-01' },
      });
      useBookStore.getState().updateGoal(100);
      expect(useBookStore.getState().goal.currentStreak).toBe(1);
    });
  });
});
