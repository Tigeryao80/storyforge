'use client';

import { useBookStore } from '@/store/bookStore';
import { themePresets } from '@/lib/themes/presets';

export default function ThemeSelector() {
  const { theme, setTheme } = useBookStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Theme:</span>
      <select
        value={theme.id}
        onChange={(e) => {
          const preset = themePresets.find(t => t.id === e.target.value);
          if (preset) setTheme(preset);
        }}
        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
      >
        {themePresets.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}
