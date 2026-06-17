import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Undo, Redo } from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  minHeight?: number
  showVariableHint?: boolean
}

export default function RichTextEditor({ value, onChange, minHeight = 200, showVariableHint = false }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false)
    }
  }, [value])

  if (!editor) return null

  const Btn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-border rounded overflow-hidden focus-within:border-accent-blue transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-bg-secondary flex-wrap">
        <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras (Ctrl+B)">
          <Bold size={13} />
        </Btn>
        <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique (Ctrl+I)">
          <Italic size={13} />
        </Btn>
        <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligné (Ctrl+U)">
          <UnderlineIcon size={13} />
        </Btn>
        <div className="w-px h-4 bg-border mx-1" />
        <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">
          <List size={13} />
        </Btn>
        <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
          <ListOrdered size={13} />
        </Btn>
        <div className="w-px h-4 bg-border mx-1" />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Annuler (Ctrl+Z)">
          <Undo size={13} />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Rétablir (Ctrl+Y)">
          <Redo size={13} />
        </Btn>
        {showVariableHint && (
          <div className="ml-auto">
            <span className="text-xs text-text-muted">Variables : <code className="text-accent-blue text-xs">{'{{prenom}}'}</code> <code className="text-accent-blue text-xs">{'{{vehicule}}'}</code> etc.</span>
          </div>
        )}
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="rich-editor"
      />
    </div>
  )
}
