'use client'

import { useEffect, useState } from 'react'
import { BookMarked } from 'lucide-react'

import { PaperCard } from '@/components/cards/paper-card'
import { getBookmarks } from '@/lib/bookmarks'
import type { Paper } from '@/lib/types'

export default function BookmarksPage() {
  const [bookmarkedPapers, setBookmarkedPapers] = useState<Paper[]>([])

  useEffect(() => {
    setBookmarkedPapers(getBookmarks())
  }, [])

  const handleBookmarkToggle = (paperId: string) => {
    setBookmarkedPapers((prev) => prev.filter((paper) => paper.id !== paperId))
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Bookmarks</h1>
        <p className="text-muted-foreground">Your saved research papers</p>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        <BookMarked size={16} />
        <span>
          {bookmarkedPapers.length} bookmarked paper{bookmarkedPapers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {bookmarkedPapers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookmarkedPapers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              onBookmark={handleBookmarkToggle}
              isBookmarked={true}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <BookMarked size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">No bookmarks yet</p>
          <p className="text-sm text-muted-foreground">
            Start bookmarking papers to save them for later
          </p>
        </div>
      )}
    </div>
  )
}
