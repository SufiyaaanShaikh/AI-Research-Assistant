import { Note } from '@/lib/types'

const STORAGE_KEY = 'notes'

export function loadNotes(): Note[] {
  if (typeof window === 'undefined') return []

  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) return []

  try {
    return JSON.parse(raw).map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
    }))
  } catch {
    return []
  }
}

export function saveNotes(notes: Note[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}