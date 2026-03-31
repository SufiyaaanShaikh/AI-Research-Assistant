'use client'

import { useState, useEffect } from 'react'
import { Note } from '@/lib/types'
import { NotesEditor } from '@/components/features/notes-editor'
import { toast } from 'sonner'

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])

  // Load notes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('notes')
    if (stored) {
      try {
        const parsedNotes = JSON.parse(stored).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }))
        setNotes(parsedNotes)
      } catch (e) {
        console.error('Failed to load notes:', e)
      }
    }
  }, [])

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes))
  }, [notes])

  const handleAddNote = (title: string, content: string, paperId?: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      paperId: paperId || '',
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setNotes([newNote, ...notes])
    toast.success('Note created')
  }

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter((note) => note.id !== noteId))
    toast.info('Note deleted')
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Notes</h1>
        <p className="text-muted-foreground">
          Create and manage your research notes
        </p>
      </div>

      {/* Notes Editor */}
      <NotesEditor
        notes={notes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
      />
    </div>
  )
}
