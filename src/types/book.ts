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
  wordCountGoal: number;
  themeOverride?: Partial<BookTheme>;
}

export interface Part {
  id: string;
  title: string;
  chapters: Chapter[];
  order: number;
  collapsed: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  subtitle?: string;
  parts: Part[];
  // Flat chapters array for backward compatibility
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
  wordCountGoal: number;
  trimSize?: string;
  includeToc?: boolean;
  includeCopyright?: boolean;
  includeDedication?: boolean;
  copyrightText?: string;
  dedicationText?: string;
  // KDP metadata
  bookDescription?: string;
  amazonKeywords?: string[];
  bisacCategories?: string[];
  seriesName?: string;
  seriesNumber?: number;
  penName?: string;
  isbn?: string;
  coverImageUrl?: string;
  backCoverBlurb?: string;
  authorBio?: string;
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

export type BackupStatus = 'idle' | 'syncing' | 'error' | 'synced';

export interface CloudBackup {
  lastBackupAt: string | null;
  status: BackupStatus;
  errorMessage: string | null;
}

export const TRIM_SIZES = [
  { id: '5x8', name: '5" × 8"', width: 5, height: 8 },
  { id: '5.25x8', name: '5.25" × 8"', width: 5.25, height: 8 },
  { id: '5.5x8.5', name: '5.5" × 8.5"', width: 5.5, height: 8.5 },
  { id: '6x9', name: '6" × 9"', width: 6, height: 9 },
  { id: '6.14x9.21', name: '6.14" × 9.21"', width: 6.14, height: 9.21 },
  { id: '7x10', name: '7" × 10"', width: 7, height: 10 },
  { id: '8x10', name: '8" × 10"', width: 8, height: 10 },
  { id: '8.5x11', name: '8.5" × 11"', width: 8.5, height: 11 },
] as const;

export type TrimSize = typeof TRIM_SIZES[number]['id'];
