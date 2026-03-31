import { Paper } from '@/lib/types'
import { PaperCard } from '@/components/cards/paper-card'

interface PaperListProps {
  papers: Paper[]
  onBookmark?: (paperId: string) => void
  bookmarkedIds?: string[]
  onSummarize?: (paperId: string) => void
}

export function PaperList({ papers, onBookmark, bookmarkedIds, onSummarize }: PaperListProps) {
  if (papers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-muted-foreground text-lg">No papers found</p>
        <p className="text-muted-foreground text-sm">Try adjusting your search</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {papers.map((paper) => (
        <PaperCard
          key={paper.id}
          paper={paper}
          onBookmark={onBookmark}
          isBookmarked={bookmarkedIds ? bookmarkedIds.includes(paper.id) : undefined}
          onSummarize={onSummarize}
        />
      ))}
    </div>
  )
}
