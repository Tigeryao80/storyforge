// src/lib/api/types.ts

export interface SceneImport {
  id?: string;
  title: string;
  content: string;
  order?: number;
}

export interface ChapterImport {
  id?: string;
  title: string;
  scenes: SceneImport[];
  order?: number;
  wordCountGoal?: number;
}

export interface PartImport {
  id?: string;
  title: string;
  chapters: ChapterImport[];
  order?: number;
}

export interface BookImport {
  id?: string;
  title: string;
  author: string;
  subtitle?: string;
  parts?: PartImport[];
  chapters: ChapterImport[];
  wordCountGoal?: number;
  trimSize?: string;
  includeToc?: boolean;
  includeCopyright?: boolean;
  includeDedication?: boolean;
  copyrightText?: string;
  dedicationText?: string;
}

export interface ImportValidation {
  valid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  field: string;
  message: string;
  chapterIndex?: number;
  sceneIndex?: number;
}

export interface ImportWarning {
  field: string;
  message: string;
  chapterIndex?: number;
  sceneIndex?: number;
}
