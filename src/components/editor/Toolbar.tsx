'use client';

interface ToolbarProps {
  editor: any;
}

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-sm rounded font-bold ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Bold (Ctrl+B)"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-sm rounded italic ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Italic (Ctrl+I)"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2 py-1 text-sm rounded line-through ${editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Strikethrough"
      >
        S
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Heading 3"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('paragraph') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Paragraph"
      >
        P
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={addImage}
        className="px-2 py-1 text-sm rounded text-gray-600 hover:bg-gray-100"
        title="Insert image from URL"
      >
        🖼️ Image
      </button>
      <button
        type="button"
        onClick={() => {
          const text = prompt('Footnote text:');
          if (text) {
            const count = editor.state.doc.content.childCount;
            editor.chain().focus().insertContent(`<sup class="footnote" title="${text}">[${count}]</sup>&nbsp;`).run();
          }
        }}
        className="px-2 py-1 text-sm rounded text-gray-600 hover:bg-gray-100"
        title="Insert footnote marker"
      >
        Fn
      </button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCallout('info').run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('callout') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Toggle callout box"
      >
        📦 Callout
      </button>
    </div>
  );
}
