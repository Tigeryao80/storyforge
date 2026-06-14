'use client';

import { useBookStore } from '@/store/bookStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableChapter({ chapter, isActive, activeSceneId, onSelectChapter, onSelectScene, onToggleCollapse, onAddScene, onRemoveScene }: {
  chapter: any;
  isActive: boolean;
  activeSceneId: string | null;
  onSelectChapter: (id: string) => void;
  onSelectScene: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddScene: (chapterId: string) => void;
  onRemoveScene: (chapterId: string, sceneId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-1">
      <div
        className={`group flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
          isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => {
          onToggleCollapse(chapter.id);
          onSelectChapter(chapter.id);
        }}
      >
        <span className="text-gray-400 text-xs cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
          ≡
        </span>
        <span className="flex-1 truncate">{chapter.title}</span>
        <span className="text-xs text-gray-400">
          {chapter.scenes.reduce((t: number, s: any) => t + s.wordCount, 0)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddScene(chapter.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 text-xs w-5 h-5 flex items-center justify-center"
          title="Add scene"
        >
          +
        </button>
      </div>

      {!chapter.collapsed && (
        <div className="ml-4">
          {chapter.scenes.map((scene: any) => (
            <div
              key={scene.id}
              className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm ${
                activeSceneId === scene.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => onSelectScene(scene.id)}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className="flex-1 truncate text-xs">{scene.title}</span>
              {chapter.scenes.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveScene(chapter.id, scene.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 text-xs"
                  title="Remove scene"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChapterTree() {
  const {
    book,
    activeChapterId,
    activeSceneId,
    setActiveChapter,
    setActiveScene,
    addChapter,
    removeChapter,
    addScene,
    removeScene,
    toggleChapterCollapse,
    reorderChapters,
    getTotalWordCount,
  } = useBookStore();

  const totalWords = getTotalWordCount();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = book.chapters.findIndex((ch) => ch.id === active.id);
      const newIndex = book.chapters.findIndex((ch) => ch.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderChapters(oldIndex, newIndex);
      }
    }
  };

  return (
    <aside className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
          {book.title || 'Untitled Book'}
        </h2>
        <div className="mt-1 text-xs text-gray-500">
          {totalWords.toLocaleString()} / {book.wordCountGoal.toLocaleString()} words
        </div>
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min((totalWords / book.wordCountGoal) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={book.chapters.map((ch) => ch.id)} strategy={verticalListSortingStrategy}>
            {book.chapters.map((chapter) => (
              <SortableChapter
                key={chapter.id}
                chapter={chapter}
                isActive={activeChapterId === chapter.id}
                activeSceneId={activeSceneId}
                onSelectChapter={setActiveChapter}
                onSelectScene={setActiveScene}
                onToggleCollapse={toggleChapterCollapse}
                onAddScene={addScene}
                onRemoveScene={removeScene}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => addChapter()}
          className="w-full text-sm text-gray-600 hover:text-blue-600 py-1.5 px-3 rounded hover:bg-blue-50 transition-colors"
        >
          + Add Chapter
        </button>
      </div>
    </aside>
  );
}
