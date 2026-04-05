'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { PaperList } from '@/components/features/paper-list'
import { extractKeywords, getSimilarPapers, type MLPaper } from '@/lib/ml-api'
import { mapApiPaperToUiPaper } from '@/lib/paper-mappers'
import type { Paper } from '@/types/paper'
import type { Paper as UiPaper } from '@/lib/types'

type PaperApiResponse = {
  paper?: Paper
  error?: string
}

export default function PaperDetailsPage() {
  const params = useParams<{ id: string }>()
  const paperId = params.id

  const [paper, setPaper] = useState<Paper | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keywords, setKeywords] = useState<string[]>([])
  const [similarPapers, setSimilarPapers] = useState<UiPaper[]>([])
  const [mlLoading, setMlLoading] = useState(false)
  const [mlWarning, setMlWarning] = useState<string | null>(null)

  // FIX #1: Removed `fetchedRef` which caused a React 18 Strict Mode deadlock.
  // In Strict Mode, effects run twice (mount → unmount → mount). The old code set
  // fetchedRef on the first run and returned early on the second run, but the first
  // run's async fetch had already set `mounted = false` via cleanup — so
  // `setLoading(false)` was never called, leaving the page stuck on the skeleton.
  // The fix: use a plain `cancelled` flag instead. Each effect run gets its own
  // flag, so the active mount always completes its fetch and clears loading state.
  useEffect(() => {
    if (!paperId) return
    let cancelled = false

    async function loadPaper() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/papers/${encodeURIComponent(paperId)}`)
        const data = (await res.json()) as PaperApiResponse

        if (cancelled) return

        if (!res.ok || !data.paper) {
          throw new Error(data.error || 'Paper not found')
        }

        setPaper(data.paper)
      } catch {
        if (cancelled) return
        setPaper(null)
        setError('Paper not found')
      } finally {
        // This now always runs on the active mount, regardless of Strict Mode.
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPaper()

    return () => {
      cancelled = true
    }
  }, [paperId])

  useEffect(() => {
    if (!paper) return
    let cancelled = false

    async function analyzePaper(currentPaper: Paper) {
      setMlLoading(true)
      setMlWarning(null)
      setKeywords([])
      setSimilarPapers([])

      try {
        const searchRes = await fetch(
          `/api/papers/search?q=${encodeURIComponent(currentPaper.title)}`,
        )
        const searchData = (await searchRes.json()) as { papers?: Paper[]; error?: string }

        if (cancelled) return

        if (!searchRes.ok) {
          throw new Error(searchData.error || 'Failed to fetch candidate papers')
        }

        const candidates = (searchData.papers ?? []).filter((item) => item.id !== currentPaper.id)
        const mlCandidates: MLPaper[] = candidates.map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
        }))

        const [nextKeywords, similar] = await Promise.all([
          extractKeywords(currentPaper.summary),
          getSimilarPapers(
            {
              id: currentPaper.id,
              title: currentPaper.title,
              summary: currentPaper.summary,
            },
            mlCandidates,
          ),
        ])

        if (cancelled) return

        setKeywords(nextKeywords)

        const byId = new Map(candidates.map((item) => [item.id, mapApiPaperToUiPaper(item)]))
        const similarUi = similar
          .map((item) => byId.get(item.id))
          .filter((item): item is UiPaper => Boolean(item))
          .slice(0, 3)

        setSimilarPapers(similarUi)
      } catch {
        if (cancelled) return
        setMlWarning('ML service unavailable')
      } finally {
        if (!cancelled) {
          setMlLoading(false)
        }
      }
    }

    analyzePaper(paper)

    return () => {
      cancelled = true
    }
  }, [paper])

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-5 w-32 bg-secondary rounded animate-pulse" />
        <div className="bg-card border border-border rounded-lg p-6 space-y-4 animate-pulse">
          <div className="h-8 bg-secondary rounded w-5/6" />
          <div className="h-4 bg-secondary rounded w-2/3" />
          <div className="h-4 bg-secondary rounded w-1/3" />
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-secondary rounded w-full" />
            <div className="h-4 bg-secondary rounded w-full" />
            <div className="h-4 bg-secondary rounded w-4/5" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !paper) {
    return (
      <div className="space-y-4">
        <Link href="/search-papers" className="flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft size={16} />
          Back to Search
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Paper not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <Link href="/search-papers" className="flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft size={16} />
        Back to Search
      </Link>

      <article className="bg-card border border-border rounded-lg p-6 space-y-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-card-foreground">{paper.title}</h1>
          <p className="text-sm text-muted-foreground">{paper.authors.join(', ')}</p>
          <p className="text-sm text-muted-foreground">Published: {paper.published}</p>
          <Link
            href={paper.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            View on Arxiv
            <ExternalLink size={14} />
          </Link>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-card-foreground">Summary</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{paper.summary}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-card-foreground">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {paper.categories.map((category) => (
              <span
                key={category}
                className="inline-block px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-card-foreground">Keywords</h2>
          {mlLoading ? (
            <p className="text-sm text-muted-foreground">Analyzing papers...</p>
          ) : keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-block px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No keywords available.</p>
          )}
        </section>
      </article>

      {mlWarning && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          {mlWarning}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Similar Papers</h2>
        {mlLoading ? (
          <p className="text-sm text-muted-foreground">Analyzing papers...</p>
        ) : similarPapers.length > 0 ? (
          <PaperList papers={similarPapers} />
        ) : (
          <p className="text-sm text-muted-foreground">No similar papers found.</p>
        )}
      </section>
    </div>
  )
}