'use client'

import { useState } from 'react'
import { Note } from '@/lib/types'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, FileText } from 'lucide-react'
import { mockPapers } from '@/lib/mock-data'
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
}

export function NotesEditor({ notes, onAddNote, onDeleteNote }: NotesEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedPaperId, setSelectedPaperId] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && content.trim()) {
      onAddNote(title, content, selectedPaperId || undefined)
      setTitle('')
      setContent('')
      setSelectedPaperId('')
    }
  }

  const selectedPaper = selectedPaperId ? mockPapers.find(p => p.id === selectedPaperId) : null

  return (
    <div className="space-y-6">
      {/* New Note Form */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Add New Note</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paper Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Select Paper (Optional)</label>
            <Select value={selectedPaperId} onValueChange={setSelectedPaperId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a paper to link to this note..." />
              </SelectTrigger>
              <SelectContent>
                {mockPapers.map((paper) => (
                  <SelectItem key={paper.id} value={paper.id}>
                    {paper.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPaper && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <FileText size={12} />
                Linked to: {selectedPaper.title}
              </p>
            )}
          </div>

          <Input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
          <Button type="submit" className="w-full gap-2">
            <Plus size={16} />
            Add Note
          </Button>
        </form>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground">Your Notes</h3>
          {notes.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground bg-secondary/30 px-2.5 py-1 rounded-full">
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {notes.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <FileText size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground font-medium">No research notes yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Select a paper and start writing insights to build your research knowledge base.</p>
          </div>
        ) : (
          <div className="space-y-3 grid gap-3">
            {notes.map((note) => {
              const paper = note.paperId ? mockPapers.find(p => p.id === note.paperId) : null
              return (
                <div 
                  key={note.id} 
                  className="bg-card border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {paper && (
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <FileText size={12} className="text-accent" />
                          {paper.title}
                        </p>
                      )}
                      <h4 className="font-semibold text-card-foreground">{note.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                      <p className="text-xs text-muted-foreground opacity-60">
                        Created {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDeleteNote(note.id)}
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
