'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/bookStore';
import { themePresets, getThemeById, themeCategories } from '@/lib/themes/presets';
import type { BookTheme } from '@/types/book';

export default function ThemeBuilder() {
  const { theme, setTheme } = useBookStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Classic');

  const categories = themeCategories;
  const presets = themePresets.filter(t => t.category === activeCategory);

  const handleSelectPreset = (presetId: string) => {
    const preset = getThemeById(presetId);
    const newTheme: BookTheme = {
      id: preset.id,
      name: preset.name,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      lineHeight: preset.lineHeight,
      headingFont: preset.headingFont,
      textColor: preset.textColor,
      backgroundColor: preset.backgroundColor,
      accentColor: preset.accentColor,
    };
    setTheme(newTheme);
  };

  const handleCustomChange = (key: keyof BookTheme, value: string | number) => {
    setTheme({ ...theme, [key]: value, id: 'custom', name: 'Custom' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
        title="Open theme builder"
      >
        🎨 Themes
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Theme Builder</h2>
            <p className="text-sm text-gray-500">17+ templates with 1,200+ combinations</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: Preset selector */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 p-3 border-b border-gray-100">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-2 py-1 rounded ${
                    activeCategory === cat
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Preset list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {presets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    theme.id === preset.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{preset.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{preset.description}</div>
                  <div className="mt-2 h-6 rounded overflow-hidden" style={{ backgroundColor: preset.backgroundColor }}>
                    <span
                      className="text-xs"
                      style={{
                        fontFamily: preset.fontFamily,
                        color: preset.textColor,
                        fontSize: '0.6rem',
                        padding: '2px 4px',
                        display: 'block',
                      }}
                    >
                      Aa Bb Cc — {preset.fontSize}pt {preset.fontFamily.split(',')[0].replace(/['"]/g, '')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Custom controls + Preview */}
          <div className="flex-1 flex flex-col">
            {/* Custom controls */}
            <div className="p-4 border-b border-gray-100 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Body Font</label>
                <select
                  value={theme.fontFamily}
                  onChange={(e) => handleCustomChange('fontFamily', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1.5"
                >
                  <option value='Georgia, "Times New Roman", serif'>Georgia</option>
                  <option value='"Helvetica Neue", Arial, sans-serif'>Helvetica Neue</option>
                  <option value='"Times New Roman", Times, serif'>Times New Roman</option>
                  <option value='"Courier New", Courier, monospace'>Courier New</option>
                  <option value='"Palatino Linotype", Palatino, serif'>Palatino</option>
                  <option value='"Garamond", serif'>Garamond</option>
                  <option value='"Trebuchet MS", sans-serif'>Trebuchet MS</option>
                  <option value='"Bookman Old Style", serif'>Bookman</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Heading Font</label>
                <select
                  value={theme.headingFont}
                  onChange={(e) => handleCustomChange('headingFont', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1.5"
                >
                  <option value={theme.headingFont}>{theme.headingFont.split(',')[0].replace(/['"]/g, '')}</option>
                  <option value='Georgia, "Times New Roman", serif'>Georgia</option>
                  <option value='"Helvetica Neue", Arial, sans-serif'>Helvetica Neue</option>
                  <option value='"Playfair Display", serif'>Playfair Display</option>
                  <option value='"Cinzel", serif'>Cinzel</option>
                  <option value='"Oswald", sans-serif'>Oswald</option>
                  <option value='"Montserrat", sans-serif'>Montserrat</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Font Size: {theme.fontSize}pt</label>
                <input
                  type="range"
                  min="9"
                  max="24"
                  value={theme.fontSize}
                  onChange={(e) => handleCustomChange('fontSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Line Height: {theme.lineHeight}</label>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={theme.lineHeight}
                  onChange={(e) => handleCustomChange('lineHeight', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Text Color</label>
                <input
                  type="color"
                  value={theme.textColor}
                  onChange={(e) => handleCustomChange('textColor', e.target.value)}
                  className="w-full h-8 rounded border border-gray-200 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Background</label>
                <input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => handleCustomChange('backgroundColor', e.target.value)}
                  className="w-full h-8 rounded border border-gray-200 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Accent Color</label>
                <input
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => handleCustomChange('accentColor', e.target.value)}
                  className="w-full h-8 rounded border border-gray-200 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Trim Size</label>
                <select className="w-full text-xs border border-gray-200 rounded px-2 py-1.5">
                  <option value="6x9">6" × 9" (Standard)</option>
                  <option value="5x8">5" × 8"</option>
                  <option value="5.25x8">5.25" × 8"</option>
                  <option value="5.5x8.5">5.5" × 8.5"</option>
                  <option value="8.5x11">8.5" × 11"</option>
                </select>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Live Preview</h3>
              <div
                className="rounded-lg border border-gray-200 p-8 shadow-inner"
                style={{
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  fontFamily: theme.fontFamily,
                  fontSize: `${theme.fontSize}px`,
                  lineHeight: theme.lineHeight,
                }}
              >
                <h1 style={{ fontFamily: theme.headingFont, color: theme.textColor, fontSize: `${theme.fontSize * 2}px`, fontWeight: 700, marginBottom: '0.5em' }}>
                  Chapter One
                </h1>
                <p style={{ marginBottom: '1em', textIndent: '1.5em' }}>
                  The morning sun cast long shadows across the village square as Eleanor made her way through the cobblestone streets. She clutched her worn leather satchel close, its contents more precious than gold.
                </p>
                <p style={{ marginBottom: '1em', textIndent: '1.5em' }}>
                  No one spoke to her as they passed, though she felt their eyes watching from behind curtained windows. The silence was familiar now, after all these months.
                </p>
                <h2 style={{ fontFamily: theme.headingFont, color: theme.textColor, fontSize: `${theme.fontSize * 1.5}px`, fontWeight: 600, marginTop: '1.5em', marginBottom: '0.5em' }}>
                  The Old Library
                </h2>
                <p style={{ marginBottom: '1em', textIndent: '1.5em' }}>
                  The library stood at the edge of town, its stone walls covered in ivy that had turned crimson with the season. Eleanor paused at the gate, steeling herself for what lay within.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            Theme: <span className="font-medium text-gray-700">{theme.name}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                handleSelectPreset('classic-serif');
              }}
              className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Reset to Classic
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs px-4 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              Apply Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
