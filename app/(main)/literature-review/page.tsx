'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Copy, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ContentSkeleton } from '@/components/skeletons/content-skeleton'
import type { Paper } from '@/types/paper'

type LiteratureReviewData = {
  overview?: string | string[] | null
  keyPapersContributions?: string | string[] | null
  currentTrends?: string | string[] | null
  researchGaps?: string | string[] | null
  futureDirections?: string | string[] | null
  key_papers?: string | string[] | null
  trends?: string | string[] | null
  gaps?: string | string[] | null
  future?: string | string[] | null
  related?: string | string[] | null
}

type LiteratureReviewResponse = {
  review?: LiteratureReviewData
  error?: string
}

type PapersResponse = {
  papers?: Paper[]
  error?: string
}

type ReviewSection = {
  id: string
  title: string
  content: string
}

export default function LiteratureReviewPage() {
  const [topic, setTopic] = useState('')
  const [review, setReview] = useState<LiteratureReviewData | null>(null)
  const [relatedPapers, setRelatedPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(false)

  const renderText = (value: unknown) => {
    if (!value) return ''

    if (Array.isArray(value)) {
      return value.join('\n')
    }

    if (typeof value === 'string') {
      return value
    }

    return String(value)
  }

  const reviewSections = useMemo<ReviewSection[]>(() => {
    if (!review) return []

    const relatedText =
      renderText(review.related) ||
      (relatedPapers.length > 0
        ? relatedPapers
            .map((paper, index) => `${index + 1}. ${paper.title}\nAuthors: ${paper.authors.join(', ')}\nPublished: ${paper.published}`)
            .join('\n\n')
        : 'No related papers found.')

    return [
      {
        id: 'overview',
        title: 'Overview',
        content: renderText(review.overview),
      },
      {
        id: 'key-papers',
        title: 'Key Papers & Contributions',
        content: renderText(review.key_papers ?? review.keyPapersContributions),
      },
      {
        id: 'current-trends',
        title: 'Current Trends',
        content: renderText(review.trends ?? review.currentTrends),
      },
      {
        id: 'research-gaps',
        title: 'Research Gaps',
        content: renderText(review.gaps ?? review.researchGaps),
      },
      {
        id: 'future-directions',
        title: 'Future Directions',
        content: renderText(review.future ?? review.futureDirections),
      },
      {
        id: 'related-papers',
        title: 'Related Papers',
        content: relatedText,
      },
    ].filter((section) => Boolean(section.content))
  }, [relatedPapers, review])

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

    const reviewText = reviewSections
      .map((section) => `${section.title}:\n${section.content}`)
      .join('\n\n')

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
        <div className="max-w-4xl mx-auto py-6 space-y-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Literature Review: {topic}</h2>
              <p className="text-sm text-muted-foreground">
                Structured review generated as a single academic-style document.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleCopyReview} className="gap-2">
              <Copy size={14} />
              Copy Full Review
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-border pb-4">
            {reviewSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary"
              >
                {section.title}
              </a>
            ))}
          </div>

          <div className="space-y-10">
            {reviewSections.map((section, index) => (
              <div key={section.id} className="space-y-10">
                {review && renderText(section.content) && (
                  <section
                    id={section.id}
                    className="scroll-mt-24 rounded-xl border border-border bg-card/80 p-6 shadow-sm"
                  >
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">{section.title}</h2>
                    <div className="mt-4">
                      <p className="leading-relaxed whitespace-pre-line text-base text-muted-foreground">
                        {renderText(section.content)}
                      </p>
                    </div>

                    {section.id === 'related-papers' && relatedPapers.length > 0 && (
                      <div className="mt-6 space-y-3 border-t border-border pt-5">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Browse Related Papers
                        </h3>
                        <div className="space-y-3">
                          {relatedPapers.map((paper) => (
                            <Link
                              key={paper.id}
                              href={`/paper/${paper.id}`}
                              className="block rounded-md border border-border p-3 transition-colors hover:bg-secondary/50"
                            >
                              <p className="font-medium text-card-foreground">{paper.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {paper.authors.join(', ')} | {paper.published}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}
                {index < reviewSections.length - 1 && <hr className="border-muted" />}
              </div>
            ))}
          </div>
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
