'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/bookStore';

const DEVICES = [
  { id: 'iphone', name: 'iPhone', width: 375, height: 812, scale: 0.5 },
  { id: 'ipad', name: 'iPad', width: 768, height: 1024, scale: 0.4 },
  { id: 'kindle-pw', name: 'Kindle Paperwhite', width: 658, height: 904, scale: 0.35 },
  { id: 'kindle-oasis', name: 'Kindle Oasis', width: 658, height: 904, scale: 0.35 },
  { id: 'galaxy-s21', name: 'Galaxy S21', width: 360, height: 800, scale: 0.5 },
  { id: 'fire-tablet', name: 'Fire Tablet', width: 800, height: 1280, scale: 0.35 },
] as const;

export default function DevicePreview() {
  const { book, theme } = useBookStore();
  const [activeDevice, setActiveDevice] = useState<typeof DEVICES[number]['id']>('iphone');
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
        title="Preview on device"
      >
        📱 Preview
      </button>
    );
  }

  const device = DEVICES.find(d => d.id === activeDevice) ?? DEVICES[0];
  const totalWords = book.chapters.reduce(
    (t, ch) => t + ch.scenes.reduce((ct, s) => ct + s.wordCount, 0), 0
  );
  const firstChapter = book.chapters[0];
  const previewContent = firstChapter?.scenes[0]?.content || '<p>Start writing to see preview...</p>';
  const plainPreview = previewContent.replace(/<[^>]+>/g, '').trim().slice(0, 500);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Device Preview</h2>
            <p className="text-sm text-gray-500">Preview your book on different devices</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Device selector */}
          <div className="w-48 border-r border-gray-200 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Devices</h3>
            {DEVICES.map(d => (
              <button
                key={d.id}
                onClick={() => setActiveDevice(d.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  activeDevice === d.id
                    ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Preview area */}
          <div className="flex-1 flex items-center justify-center bg-gray-100 p-8 overflow-auto">
            <div
              className="rounded-[2rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden relative"
              style={{
                width: device.width * device.scale,
                height: device.height * device.scale,
              }}
            >
              {/* Device notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-4 bg-gray-800 rounded-b-lg z-10" />

              {/* Screen content */}
              <div
                className="w-full h-full overflow-y-auto"
                style={{
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  fontFamily: theme.fontFamily,
                  fontSize: `${theme.fontSize * 0.5}px`,
                  lineHeight: theme.lineHeight,
                  padding: '2rem 1rem 1rem',
                }}
              >
                <h1 style={{
                  fontFamily: theme.headingFont,
                  fontSize: `${theme.fontSize * 1.2}px`,
                  fontWeight: 700,
                  marginBottom: '0.5em',
                  textAlign: 'center',
                }}>
                  {book.title || 'Untitled Book'}
                </h1>
                {book.author && (
                  <p style={{ textAlign: 'center', fontStyle: 'italic', marginBottom: '1.5em', opacity: 0.7 }}>
                    by {book.author}
                  </p>
                )}
                <h2 style={{
                  fontFamily: theme.headingFont,
                  fontSize: `${theme.fontSize * 0.8}px`,
                  fontWeight: 600,
                  marginTop: '1em',
                  marginBottom: '0.5em',
                }}>
                  {firstChapter?.title || 'Chapter 1'}
                </h2>
                <p style={{ textIndent: '1.5em', marginBottom: '0.8em' }}>
                  {plainPreview}
                </p>
              </div>
            </div>
          </div>

          {/* Right panel: book info */}
          <div className="w-56 border-l border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Book Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs">Title</div>
                <div className="font-medium text-gray-900 truncate">{book.title || 'Untitled'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Author</div>
                <div className="font-medium text-gray-900 truncate">{book.author || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Chapters</div>
                <div className="font-medium text-gray-900">{book.chapters.length}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Total Words</div>
                <div className="font-medium text-gray-900">{totalWords.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Theme</div>
                <div className="font-medium text-gray-900">{theme.name}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Trim Size</div>
                <div className="font-medium text-gray-900">6" × 9"</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
