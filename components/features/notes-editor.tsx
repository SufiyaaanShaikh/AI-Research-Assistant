'use client'

import { useState, useEffect } from 'react'
import { Note } from '@/lib/types'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, FileText, Pencil } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NotesEditorProps {
  notes: Note[]
  onAddNote: (title: string, content: string, paperId?: string) => void
  onDeleteNote: (noteId: string) => void
  onUpdateNote: (noteId: string, content: string) => void
  onSelectPaper?: (paperId: string | null) => void
}

type PaperOption = {
  id: string
  title: string
}

export function NotesEditor({
  notes,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
  onSelectPaper,
}: NotesEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedPaperId, setSelectedPaperId] = useState<string>('')

  const [papers, setPapers] = useState<PaperOption[]>([])
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  // Load papers dynamically from localStorage (same source as Chat page)
  useEffect(() => {
    const storedBookmarks = localStorage.getItem('researchai_bookmarks')

    if (!storedBookmarks) return

    try {
      const parsed = JSON.parse(storedBookmarks)

      setPapers(
        parsed.map((paper: any) => ({
          id: paper.id,
          title: paper.title,
        }))
      )
    } catch (error) {
      console.warn('Failed to load bookmarked papers', error)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) return

    onAddNote(title, content, selectedPaperId || undefined)

    setTitle('')
    setContent('')
    setSelectedPaperId('')
  }

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id)
    setEditingContent(note.content)
  }

  const saveEdit = () => {
    if (!editingNoteId) return

    onUpdateNote(editingNoteId, editingContent)

    setEditingNoteId(null)
    setEditingContent('')
  }

  return (
    <div className="space-y-6">
      {/* Add Note */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Note</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paper selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select Paper (Optional)
            </label>

            <Select
              value={selectedPaperId}
              onValueChange={(id) => {
                setSelectedPaperId(id)
                onSelectPaper?.(id || null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose paper..." />
              </SelectTrigger>

              <SelectContent>
                {papers.map((paper) => (
                  <SelectItem key={paper.id} value={paper.id}>
                    {paper.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            placeholder="Write insight..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />

          <Button className="w-full gap-2">
            <Plus size={16} />
            Add Note
          </Button>
        </form>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your Notes</h3>

          {!!notes.length && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              {notes.length} note{notes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {notes.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <FileText className="mx-auto opacity-40 mb-3" />
            <p>No research notes yet.</p>
          </div>
        ) : (
          notes.map((note) => {
            const paper = papers.find((p) => p.id === note.paperId)

            return (
              <div
                key={note.id}
                className="bg-card border border-border rounded-lg p-4"
              >
                {paper && (
                  <p className="text-xs text-muted-foreground mb-1">
                    📄 {paper.title}
                  </p>
                )}

                <h4 className="font-semibold">{note.title}</h4>

                {editingNoteId === note.id ? (
                  <>
                    <Textarea
                      value={editingContent}
                      onChange={(e) =>
                        setEditingContent(e.target.value)
                      }
                      rows={4}
                    />

                    <Button
                      size="sm"
                      onClick={saveEdit}
                      className="mt-2"
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {note.content}
                  </p>
                )}

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(note)}
                  >
                    <Pencil size={14} />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteNote(note.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}