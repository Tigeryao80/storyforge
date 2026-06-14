'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/bookStore';
import { themePresets, getThemeById, themeCategories } from '@/lib/themes/presets';
import type { BookTheme } from '@/types/book';
import FontSelector from './FontSelector';
import type { GoogleFont } from '@/lib/fonts/googleFonts';
import { loadFontCSS, getFontFamilyWithFallback } from '@/lib/fonts/fontPreview';

export default function ThemeBuilder() {
  const { theme, setTheme } = useBookStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Classic');
  const [fontSelectorTarget, setFontSelectorTarget] = useState<'body' | 'heading' | null>(null);

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

  const handleFontSelect = (font: GoogleFont) => {
    const fontFamily = getFontFamilyWithFallback(font.family, font.category);
    loadFontCSS(font.family, ['400', '700']).catch(() => {});
    if (fontSelectorTarget === 'body') {
      setTheme({ ...theme, fontFamily, id: 'custom', name: 'Custom' });
    } else if (fontSelectorTarget === 'heading') {
      setTheme({ ...theme, headingFont: fontFamily, id: 'custom', name: 'Custom' });
    }
    setFontSelectorTarget(null);
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
    <>
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
              <div className="p-4 border-b border-gray-100 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Body Font</label>
                  <button
                    onClick={() => setFontSelectorTarget('body')}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 text-left flex items-center justify-between hover:border-gray-300 transition-colors"
                    style={{ fontFamily: theme.fontFamily }}
                  >
                    <span className="truncate">{theme.fontFamily.split(',')[0].replace(/['"]/g, '')}</span>
                    <span className="text-blue-500 shrink-0 ml-1">Browse...</span>
                  </button>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Heading Font</label>
                  <button
                    onClick={() => setFontSelectorTarget('heading')}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 text-left flex items-center justify-between hover:border-gray-300 transition-colors"
                    style={{ fontFamily: theme.headingFont }}
                  >
                    <span className="truncate">{theme.headingFont.split(',')[0].replace(/['"]/g, '')}</span>
                    <span className="text-blue-500 shrink-0 ml-1">Browse...</span>
                  </button>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Font Size: {theme.fontSize}pt</label>
                  <input type="range" min="9" max="24" value={theme.fontSize} onChange={(e) => handleCustomChange('fontSize', parseInt(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Line Height: {theme.lineHeight}</label>
                  <input type="range" min="1.0" max="2.5" step="0.1" value={theme.lineHeight} onChange={(e) => handleCustomChange('lineHeight', parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Text Color</label>
                  <input type="color" value={theme.textColor} onChange={(e) => handleCustomChange('textColor', e.target.value)} className="w-full h-8 rounded border border-gray-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Background</label>
                  <input type="color" value={theme.backgroundColor} onChange={(e) => handleCustomChange('backgroundColor', e.target.value)} className="w-full h-8 rounded border border-gray-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Accent Color</label>
                  <input type="color" value={theme.accentColor} onChange={(e) => handleCustomChange('accentColor', e.target.value)} className="w-full h-8 rounded border border-gray-200 cursor-pointer" />
                </div>
              </div>

              {/* Preview */}
              <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.backgroundColor }}>
                <div className="max-w-lg mx-auto">
                  <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: theme.headingFont, color: theme.textColor }}>
                    Chapter One: The Beginning
                  </h1>
                  <p className="mb-3" style={{ fontFamily: theme.fontFamily, fontSize: `${theme.fontSize}px`, lineHeight: theme.lineHeight, color: theme.textColor }}>
                    The rain hammered against the windows of the old mansion as Detective Sarah Mitchell stared at the letter on her desk. The handwriting was elegant, practiced — whoever wrote this wanted to be remembered.
                  </p>
                  <p className="mb-3" style={{ fontFamily: theme.fontFamily, fontSize: `${theme.fontSize}px`, lineHeight: theme.lineHeight, color: theme.textColor }}>
                    She picked up her coffee, now cold, and took a sip. The case had consumed her for three weeks now, and the trail had gone cold. Until tonight.
                  </p>
                  <blockquote className="border-l-4 pl-4 italic my-4" style={{ fontFamily: theme.fontFamily, borderColor: theme.accentColor, color: theme.textColor, opacity: 0.8 }}>
                    "The truth is always in the details, Detective."
                  </blockquote>
                  <h2 className="text-2xl font-bold mt-6 mb-3" style={{ fontFamily: theme.headingFont, color: theme.textColor }}>
                    The First Clue
                  </h2>
                  <p style={{ fontFamily: theme.fontFamily, fontSize: `${theme.fontSize}px`, lineHeight: theme.lineHeight, color: theme.textColor }}>
                    The envelope had no return address. Just her name, written in that same elegant script, and a single word: "Tonight."
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
              <button onClick={() => handleSelectPreset('classic-serif')} className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100">
                Reset to Classic
              </button>
              <button onClick={() => setIsOpen(false)} className="text-xs px-4 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium">
                Apply Theme
              </button>
            </div>
          </div>
        </div>
      </div>
      <FontSelector
        isOpen={fontSelectorTarget !== null}
        onClose={() => setFontSelectorTarget(null)}
        onSelect={handleFontSelect}
        currentFont={
          fontSelectorTarget === 'body'
            ? theme.fontFamily.split(',')[0].replace(/['"]/g, '')
            : fontSelectorTarget === 'heading'
            ? theme.headingFont.split(',')[0].replace(/['"]/g, '')
            : undefined
        }
      />
    </>
  );
}
