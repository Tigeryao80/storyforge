export interface Character {
  id: string;
  name: string;
  aliases: string[];          // Other names / nicknames
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'narrator';
  gender?: string;
  age?: string;
  appearance?: string;        // Physical description
  personality?: string;       // Key traits, quirks
  background?: string;        // Backstory
  goals?: string;             // What they want in the story
  arc?: string;               // How they change
  relationships: Relationship[];
  firstAppearanceChapterId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  characterId: string;
  type: string;               // friend, enemy, lover, family, mentor, rival, etc.
  description?: string;
}

export interface PlotOutline {
  id: string;
  bookId: string;
  beats: PlotBeat[];
  createdAt: string;
  updatedAt: string;
}

export interface PlotBeat {
  id: string;
  type: 'act' | 'chapter' | 'scene' | 'note';
  title: string;
  description?: string;
  chapterIndex?: number;      // Link to chapter (0-based)
  sceneIndex?: number;        // Link to scene (0-based)
  status: 'planned' | 'written' | 'revised' | 'cut';
  order: number;
}

export interface StoryBible {
  id: string;
  bookId: string;
  settings: WorldBuildingEntry[];
  magicSystems: WorldBuildingEntry[];
  factions: WorldBuildingEntry[];
  terminology: WorldBuildingEntry[];  // Glossary / made-up words
  timeline: TimelineEntry[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorldBuildingEntry {
  id: string;
  name: string;
  description?: string;
  relatedCharacterIds: string[];
  tags: string[];
}

export interface TimelineEntry {
  id: string;
  label: string;
  chapterIndex?: number;
  sceneIndex?: number;
  order: number;
  description?: string;
}

export interface WritingSession {
  id: string;
  bookId: string;
  startedAt: string;
  endedAt?: string;
  wordsWritten: number;
  scenesWritten: number;
  chaptersWritten: number;
  summary?: string;           // Brief summary of what was accomplished
  nextAction?: string;        // What should be written next
}
