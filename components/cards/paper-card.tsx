'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Paper } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { BookMarked, MessageSquare, TrendingUp, Calendar, Sparkles } from 'lucide-react'
import { addBookmark, isBookmarked as isPaperBookmarked, removeBookmark } from '@/lib/bookmarks'
import { getCachedSummary, setCachedSummary } from '@/lib/cache'
import { SummaryModal } from '@/components/modals/summary-modal'
import { toast } from 'sonner'

interface PaperCardProps {
  paper: Paper
  onBookmark?: (paperId: string) => void
  isBookmarked?: boolean
  onSummarize?: (paperId: string) => void
}

export function PaperCard({ paper, onBookmark, isBookmarked, onSummarize }: PaperCardProps) {
  const [bookmarked, setBookmarked] = useState<boolean>(Boolean(isBookmarked))
  const [aiSummary, setAiSummary] = useState('')
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    setBookmarked(isBookmarked ?? isPaperBookmarked(paper.id))
  }, [isBookmarked, paper.id])

  const handleBookmarkToggle = () => {
    if (bookmarked) {
      removeBookmark(paper.id)
      setBookmarked(false)
      toast.success('Bookmark removed')
    } else {
      addBookmark(paper)
      setBookmarked(true)
      toast.success('Paper bookmarked')
    }

    onBookmark?.(paper.id)
  }

  const handleSummarize = async () => {
    const cachedSummary = getCachedSummary(paper.id)
    if (cachedSummary) {
      setAiSummary(cachedSummary)
      setIsSummaryModalOpen(true)
      onSummarize?.(paper.id)
      return
    }

    setSummaryLoading(true)
    const loadingToastId = toast.loading('Summarizing paper...')

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: paper.title,
          summary: paper.abstract,
        }),
      })

      const data = (await res.json()) as { summary?: string; error?: string }

      if (!res.ok || !data.summary) {
        throw new Error(data.error || 'Failed to summarize paper')
      }

      setCachedSummary(paper.id, data.summary)
      setAiSummary(data.summary)
      setIsSummaryModalOpen(true)
      onSummarize?.(paper.id)
      toast.success('Summary generated')
    } catch {
      toast.error('AI generation failed')
    } finally {
      toast.dismiss(loadingToastId)
      setSummaryLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
      <div className="space-y-3">
        {/* Title */}
        <Link href={`/paper/${paper.id}`}>
          <h3 className="text-lg font-semibold text-card-foreground hover:text-primary transition-colors line-clamp-2">
            {paper.title}
          </h3>
        </Link>

        {/* Authors and Year */}
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {paper.authors.join(', ')} • <span className="font-medium">{paper.year}</span>
          </p>
        </div>

        {/* Abstract */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {paper.abstract}
        </p>

        {/* Keywords */}
        <div className="flex flex-wrap gap-2">
          {paper.keywords.slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              className="inline-block px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
            >
              {keyword}
            </span>
          ))}
          {paper.keywords.length > 3 && (
            <span className="inline-block px-2.5 py-1 text-xs text-muted-foreground">
              +{paper.keywords.length - 3}
            </span>
          )}
        </div>

        {/* Metrics Display */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp size={14} className="text-primary" />
            <span>{paper.citations.toLocaleString()} citations</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={14} className="text-accent" />
            <span>Year {paper.year}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={handleSummarize}
            title="Summarize paper with AI"
            disabled={summaryLoading}
          >
            <Sparkles size={14} />
            {summaryLoading ? 'Summarizing paper...' : 'Summarize'}
          </Button>
          <div className="flex items-center gap-1">
            <Link href={`/chat-paper?paperId=${paper.id}`}>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-secondary"
                title="Chat with paper"
              >
                <MessageSquare size={16} />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-secondary"
              onClick={handleBookmarkToggle}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark paper'}
            >
              <BookMarked size={16} fill={bookmarked ? 'currentColor' : 'none'} />
            </Button>
          </div>
        </div>

      </div>

      <SummaryModal
        open={isSummaryModalOpen}
        onOpenChange={setIsSummaryModalOpen}
        paperTitle={paper.title}
        paperId={paper.id}
        summary={aiSummary}
        isBookmarked={bookmarked}
        onBookmarkToggle={handleBookmarkToggle}
      />
    </div>
  )
}
