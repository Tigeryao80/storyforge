// src/lib/formatting/rules.ts

export const FORMATTING_RULES = {
  chapterTitle: { tag: 'h1', required: true, maxPerScene: 1 },
  sceneBreak: { tag: 'h2', required: true, maxPerChapter: null },
  subsections: { tags: ['h3', 'h4', 'h5', 'h6'], required: false },
  calloutTypes: ['info', 'warning', 'tip'] as const,
  blockQuote: { tag: 'blockquote', required: false },
  pageBreak: { beforeChapter: true, beforePart: true },
  frontMatter: { sections: ['dedication', 'preface', 'foreword', 'toc'] as const },
  backMatter: { sections: ['acknowledgments', 'author-bio', 'glossary', 'index'] as const },
} as const;

export type CalloutType = typeof FORMATTING_RULES.calloutTypes[number];
export type FrontMatterSection = typeof FORMATTING_RULES.frontMatter.sections[number];
export type BackMatterSection = typeof FORMATTING_RULES.backMatter.sections[number];

// Header hierarchy order for validation
export const HEADER_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

export function getHeaderLevel(tag: string): number {
  return HEADER_LEVELS.indexOf(tag.toLowerCase() as typeof HEADER_LEVELS[number]);
}

export function isValidCalloutType(type: string): type is CalloutType {
  return FORMATTING_RULES.calloutTypes.includes(type as CalloutType);
}
