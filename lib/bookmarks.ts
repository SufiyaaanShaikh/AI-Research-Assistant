import type { Paper } from '@/lib/types'

const BOOKMARKS_KEY = 'researchai_bookmarks'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getBookmarks(): Paper[] {
  if (!canUseStorage()) return []

  const raw = window.localStorage.getItem(BOOKMARKS_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as Paper[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function setBookmarks(nextBookmarks: Paper[]): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(nextBookmarks))
}

export function addBookmark(paper: Paper): Paper[] {
  const bookmarks = getBookmarks()
  if (bookmarks.some((item) => item.id === paper.id)) {
    return bookmarks
  }

  const next = [paper, ...bookmarks]
  setBookmarks(next)
  return next
}

export function removeBookmark(id: string): Paper[] {
  const next = getBookmarks().filter((item) => item.id !== id)
  setBookmarks(next)
  return next
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().some((item) => item.id === id)
}
