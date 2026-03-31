'use client'

import { Paper } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookMarked, MessageSquare, ExternalLink, Sparkles, Loader } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface PaperDetailPanelProps {
  paper: Paper
  onBookmark?: (paperId: string) => void
  isBookmarked?: boolean
}

export function PaperDetailPanel({
  paper,
  onBookmark,
  isBookmarked,
}: PaperDetailPanelProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked || false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const handleBookmark = () => {
    setBookmarked(!bookmarked)
    onBookmark?.(paper.id)
    toast.success(bookmarked ? 'Bookmark removed' : 'Paper bookmarked')
  }

  const handleSummarize = async () => {
    setShowSummary(true)
    setSummaryLoading(true)
    
    // Simulate AI summarization
    setTimeout(() => {
      setSummaryLoading(false)
      toast.success('Summary generated')
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h1 className="text-3xl font-bold text-card-foreground mb-2">
          {paper.title}
        </h1>
        <p className="text-sm text-muted-foreground mb-2">
          {paper.authors.join(', ')}
        </p>
        <p className="text-sm text-muted-foreground">
          Published {paper.year} • {paper.citations.toLocaleString()} citations
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          <Button className="flex-1 gap-2">
            <ExternalLink size={16} />
            View PDF
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={handleSummarize}
            disabled={summaryLoading}
          >
            {summaryLoading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Summarize
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            disabled={summaryLoading}
          >
            <MessageSquare size={16} />
            Chat
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleBookmark}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark paper'}
          >
            <BookMarked size={16} fill={bookmarked ? 'currentColor' : 'none'} />
          </Button>
        </div>
      </div>

      {/* Summary Panel */}
      {showSummary && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-card-foreground mb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-accent" />
                Paper Summary
              </h2>
              {summaryLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-secondary/30 rounded animate-pulse"></div>
                  <div className="h-4 bg-secondary/30 rounded animate-pulse"></div>
                  <div className="h-4 bg-secondary/30 rounded animate-pulse w-3/4"></div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This research paper presents a comprehensive study on {paper.keywords[0] || 'the topic'}. 
                  The authors investigate key aspects and provide insights through systematic analysis. 
                  The work contributes significantly to the field by introducing novel methodologies and 
                  demonstrating practical applications. The findings have been cited {paper.citations.toLocaleString()} times, 
                  indicating substantial impact on subsequent research in this domain.
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSummary(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-card border border-border rounded-lg">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none px-6 pt-6 pb-0 bg-transparent">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="citations">Citations</TabsTrigger>
            {paper.similarPapers && paper.similarPapers.length > 0 && (
              <TabsTrigger value="similar">Similar Papers</TabsTrigger>
            )}
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-card-foreground mb-3">Abstract</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {paper.abstract}
              </p>
            </div>
            {paper.summary && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-card-foreground mb-3">AI Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {paper.summary}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="p-6">
            <div className="flex flex-wrap gap-2">
              {paper.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-full font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {paper.keywords.length} keywords total
            </p>
          </TabsContent>

          {/* Citations Tab */}
          <TabsContent value="citations" className="p-6">
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Citation Count</p>
                <p className="text-3xl font-bold text-foreground">
                  {paper.citations.toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                This paper has been cited {paper.citations.toLocaleString()} times in the research community.
              </p>
            </div>
          </TabsContent>

          {/* Similar Papers Tab */}
          {paper.similarPapers && paper.similarPapers.length > 0 && (
            <TabsContent value="similar" className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                {paper.similarPapers.length} related papers found
              </p>
              <div className="space-y-2">
                {paper.similarPapers.map((paperId) => (
                  <div key={paperId} className="p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-foreground">Paper ID: {paperId}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
