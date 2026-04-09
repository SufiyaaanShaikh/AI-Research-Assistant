'use client'

import { useEffect, useState } from 'react'
import { BookMarked } from 'lucide-react'

import { PaperCard } from '@/components/cards/paper-card'
import { getPaperStatus, type IngestionStatus } from '@/lib/rag-api'
import { getBookmarks } from '@/lib/bookmarks'
import type { Paper } from '@/lib/types'

export default function BookmarksPage() {
  const [bookmarkedPapers, setBookmarkedPapers] = useState<Paper[]>([])
  const [paperStatuses, setPaperStatuses] = useState<Record<string, IngestionStatus>>({})

  useEffect(() => {
    const papers = getBookmarks()
    setBookmarkedPapers(papers)

    // Fetch ingestion status for papers that have a backend UUID stored.
    const papersWithId = papers.filter((p) => p.paper_id)
    if (papersWithId.length === 0) return

    void Promise.all(
      papersWithId.map(async (p) => {
        const result = await getPaperStatus(p.paper_id!).catch(() => null)
        if (result) {
          setPaperStatuses((prev) => ({
            ...prev,
            [p.id]: result.status as IngestionStatus,
          }))
        }
      })
    )
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
          {bookmarkedPapers.map((paper) => {
            const status = paperStatuses[paper.id]
            return (
              <div key={paper.id} className="relative">
                <PaperCard
                  paper={paper}
                  onBookmark={handleBookmarkToggle}
                  isBookmarked={true}
                />
                {/* Ingestion status badge — shown in top-right corner of card */}
                {status && (
                  <div
                    className={`absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium pointer-events-none ${
                      status === 'ready'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : status === 'failed'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {status === 'ready' && <span>✓ AI Ready</span>}
                    {status === 'failed' && <span>✗ Failed</span>}
                    {status !== 'ready' && status !== 'failed' && (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
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
