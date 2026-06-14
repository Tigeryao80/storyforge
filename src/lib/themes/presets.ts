import type { BookTheme } from '@/types/book';

export const themePresets: BookTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 16,
    lineHeight: 1.8,
    headingFont: 'Georgia, "Times New Roman", serif',
    textColor: '#1a1a1a',
    backgroundColor: '#ffffff',
    accentColor: '#2563eb',
  },
  {
    id: 'modern',
    name: 'Modern',
    fontFamily: '"Inter", "Helvetica Neue", sans-serif',
    fontSize: 15,
    lineHeight: 1.7,
    headingFont: '"Inter", "Helvetica Neue", sans-serif',
    textColor: '#2d3748',
    backgroundColor: '#fafafa',
    accentColor: '#6366f1',
  },
  {
    id: 'manuscript',
    name: 'Manuscript',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 14,
    lineHeight: 2.0,
    headingFont: '"Courier New", Courier, monospace',
    textColor: '#333333',
    backgroundColor: '#fffff8',
    accentColor: '#8b4513',
  },
];

export function getThemeById(id: string): BookTheme {
  return themePresets.find(t => t.id === id) ?? themePresets[0];
}
