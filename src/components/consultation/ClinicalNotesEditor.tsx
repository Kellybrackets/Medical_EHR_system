import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';

interface ClinicalNotesEditorProps {
  value: string;
  onChange: (html: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * ClinicalNotesEditor - Rich text editor for medical documentation
 *
 * Uses TipTap editor with medical-friendly features:
 * - Basic formatting (bold, italic)
 * - Headings for structured notes
 * - Lists for organized information
 * - Blockquotes for important observations
 * - Medical-specific placeholder text
 *
 * IMPORTANT: Content is stored as HTML for backend compatibility.
 * Medical/legal data - ensure proper sanitization and backup procedures.
 */
export const ClinicalNotesEditor: React.FC<ClinicalNotesEditorProps> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: `Chief complaint:

History of presenting illness:

Examination findings:

Assessment:

Plan:`,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const MenuButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    icon: React.ReactNode;
    title: string;
  }> = ({ onClick, active, disabled, icon, title }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded transition-colors
        ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={disabled}
          icon={<Bold className="h-4 w-4" />}
          title="Bold"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          disabled={disabled}
          icon={<Italic className="h-4 w-4" />}
          title="Italic"
        />

        <div className="w-px bg-gray-300 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          disabled={disabled}
          icon={<Heading1 className="h-4 w-4" />}
          title="Heading 1"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          disabled={disabled}
          icon={<Heading2 className="h-4 w-4" />}
          title="Heading 2"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          disabled={disabled}
          icon={<Heading3 className="h-4 w-4" />}
          title="Heading 3"
        />

        <div className="w-px bg-gray-300 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          disabled={disabled}
          icon={<List className="h-4 w-4" />}
          title="Bullet List"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          disabled={disabled}
          icon={<ListOrdered className="h-4 w-4" />}
          title="Numbered List"
        />

        <div className="w-px bg-gray-300 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          disabled={disabled}
          icon={<Quote className="h-4 w-4" />}
          title="Blockquote"
        />

        <div className="w-px bg-gray-300 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || disabled}
          icon={<Undo className="h-4 w-4" />}
          title="Undo"
        />
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || disabled}
          icon={<Redo className="h-4 w-4" />}
          title="Redo"
        />
      </div>

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 p-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};
