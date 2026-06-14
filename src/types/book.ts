// src/types/book.ts

export interface Scene {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  order: number;
}

export interface Chapter {
  id: string;
  title: string;
  scenes: Scene[];
  order: number;
  collapsed: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
  wordCountGoal: number;
}

export interface BookTheme {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  headingFont: string;
  textColor: string;
  backgroundColor: string;
  accentColor: string;
}

export interface WritingGoal {
  dailyWordCount: number;
  currentStreak: number;
  lastWriteDate: string;
  totalWordsWritten: number;
}

export type ExportFormat = 'epub' | 'pdf' | 'docx';
