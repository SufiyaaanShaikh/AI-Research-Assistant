'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Copy, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContentSkeleton } from '@/components/skeletons/content-skeleton'
import type { Paper } from '@/types/paper'

type LiteratureReviewData = {
  overview: string
  keyPapersContributions: string
  currentTrends: string
  researchGaps: string
  futureDirections: string
}

type LiteratureReviewResponse = {
  review?: LiteratureReviewData
  error?: string
}

type PapersResponse = {
  papers?: Paper[]
  error?: string
}

export default function LiteratureReviewPage() {
  const [topic, setTopic] = useState('')
  const [review, setReview] = useState<LiteratureReviewData | null>(null)
  const [relatedPapers, setRelatedPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(false)

  const handleGenerateReview = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTopic = topic.trim()
    if (!trimmedTopic) return

    setLoading(true)
    setReview(null)
    setRelatedPapers([])

    try {
      const [reviewRes, papersRes] = await Promise.all([
        fetch('/api/ai/literature-review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: trimmedTopic }),
        }),
        fetch(`/api/papers/search?q=${encodeURIComponent(trimmedTopic)}`),
      ])

      const reviewData = (await reviewRes.json()) as LiteratureReviewResponse
      const papersData = (await papersRes.json()) as PapersResponse

      if (!reviewRes.ok || !reviewData.review) {
        throw new Error(reviewData.error || 'Failed to generate literature review')
      }

      if (!papersRes.ok) {
        throw new Error(papersData.error || 'Failed to fetch related papers')
      }

      setReview(reviewData.review)
      setRelatedPapers((papersData.papers ?? []).slice(0, 5))
    } catch {
      toast.error('AI generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReview = async () => {
    if (!review) return

    const reviewText = [
      `Overview\n${review.overview}`,
      `Key Papers & Contributions\n${review.keyPapersContributions}`,
      `Current Trends\n${review.currentTrends}`,
      `Research Gaps\n${review.researchGaps}`,
      `Future Directions\n${review.futureDirections}`,
    ].join('\n\n')

    await navigator.clipboard.writeText(reviewText)
    toast.success('Review copied to clipboard')
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Literature Review Generator</h1>
        <p className="text-muted-foreground">Generate a structured literature review for any topic</p>
      </div>

      <form onSubmit={handleGenerateReview} className="space-y-4">
        <label className="block text-sm font-medium text-foreground">Research Topic</label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter a research topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <Button type="submit" disabled={loading || !topic.trim()} className="gap-2 whitespace-nowrap">
            <Zap size={16} />
            Generate
          </Button>
        </div>
      </form>

      {loading && (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Generating literature review...</h2>
          <ContentSkeleton />
        </div>
      )}

      {review && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground">Literature Review: {topic}</h2>
            <Button size="sm" variant="outline" onClick={handleCopyReview} className="gap-2">
              <Copy size={14} />
              Copy
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="key-papers">Key Papers & Contributions</TabsTrigger>
              <TabsTrigger value="trends">Current Trends</TabsTrigger>
              <TabsTrigger value="gaps">Research Gaps</TabsTrigger>
              <TabsTrigger value="future">Future Directions</TabsTrigger>
              <TabsTrigger value="related">Related Papers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">{review.overview}</p>
              </div>
            </TabsContent>

            <TabsContent value="key-papers" className="mt-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">{review.keyPapersContributions}</p>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">{review.currentTrends}</p>
              </div>
            </TabsContent>

            <TabsContent value="gaps" className="mt-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">{review.researchGaps}</p>
              </div>
            </TabsContent>

            <TabsContent value="future" className="mt-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">{review.futureDirections}</p>
              </div>
            </TabsContent>

            <TabsContent value="related" className="mt-4">
              <div className="rounded-lg border border-border bg-card p-6 space-y-3">
                {relatedPapers.length > 0 ? (
                  relatedPapers.map((paper) => (
                    <Link
                      key={paper.id}
                      href={`/paper/${paper.id}`}
                      className="block rounded-md border border-border p-3 hover:bg-secondary/50 transition-colors"
                    >
                      <p className="font-medium text-card-foreground">{paper.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {paper.authors.join(', ')} • {paper.published}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No related papers found.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!review && !loading && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Enter a topic and click Generate to create a literature review.
          </p>
        </div>
      )}
    </div>
  )
}
