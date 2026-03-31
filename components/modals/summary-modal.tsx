'use client'

import Link from 'next/link'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SummaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paperTitle: string
  paperId: string
  summary: string
  isBookmarked: boolean
  onBookmarkToggle: () => void
}

export function SummaryModal({
  open,
  onOpenChange,
  paperTitle,
  paperId,
  summary,
  isBookmarked,
  onBookmarkToggle,
}: SummaryModalProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary)
    toast.success('Summary copied')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{paperTitle}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto rounded-md border border-border bg-secondary/30 p-4">
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{summary}</p>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              <Copy size={14} />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={onBookmarkToggle}>
              {isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Link href={`/paper/${paperId}`}>
              <Button variant="outline" size="sm">Open Paper</Button>
            </Link>
            <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
