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

/**
 * Store the backend UUID paper_id for a bookmarked paper.
 * Called after successful ingestion to link the frontend paper to the backend record.
 */
export function updateBookmarkPaperId(arxivId: string, paperId: string, status: string): void {
  if (!canUseStorage()) return
  const bookmarks = getBookmarks()
  const updated = bookmarks.map((paper) =>
    paper.id === arxivId
      ? { ...paper, paper_id: paperId, ingestion_status: status }
      : paper
  )
  setBookmarks(updated)
}

/**
 * Get the stored backend UUID for a bookmarked paper, or null if not yet ingested.
 */
export function getBookmarkPaperId(arxivId: string): string | null {
  return getBookmarks().find((p) => p.id === arxivId)?.paper_id ?? null
}
