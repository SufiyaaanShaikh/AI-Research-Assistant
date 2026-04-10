'use client'

import { useState, useEffect } from 'react'
import { Note } from '@/lib/types'
import { NotesEditor } from '@/components/features/notes-editor'
import { toast } from 'sonner'

const STORAGE_KEY = 'notes'

function loadNotes(): Note[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) return []

  try {
    return JSON.parse(stored).map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }))
  } catch (error) {
    console.error('Failed to parse notes:', error)
    return []
  }
}

function saveNotes(notes: Note[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null)

  // Load notes on mount
  useEffect(() => {
    setNotes(loadNotes())
  }, [])

  // Save notes whenever changed
  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  const handleAddNote = (
    title: string,
    content: string,
    paperId?: string
  ) => {
    if (!content.trim()) return

    const newNote: Note = {
      id: crypto.randomUUID(),
      paperId: paperId || '',
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setNotes((prev) => [newNote, ...prev])
    toast.success('Note created')
  }

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
    toast.info('Note deleted')
  }

  const handleUpdateNote = (
    noteId: string,
    updatedContent: string
  ) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? {
              ...note,
              content: updatedContent,
              updatedAt: new Date(),
            }
          : note
      )
    )

    toast.success('Note updated')
  }

  const filteredNotes = notes
    .filter((note) =>
      selectedPaperId
        ? note.paperId === selectedPaperId
        : true
    )
    .filter(
      (note) =>
        note.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        note.content
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    )

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Notes
        </h1>
        <p className="text-muted-foreground">
          Create and manage your research notes
        </p>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search notes..."
        value={searchQuery}
        onChange={(e) =>
          setSearchQuery(e.target.value)
        }
        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {/* Notes Editor */}
      <NotesEditor
        notes={filteredNotes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onUpdateNote={handleUpdateNote}
        onSelectPaper={setSelectedPaperId}
      />
    </div>
  )
}