'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { SearchBar } from '@/components/features/search-bar'
import { PaperList } from '@/components/features/paper-list'
import { PaperCardSkeleton } from '@/components/skeletons/content-skeleton'
import { clusterPapers, type MLPaper } from '@/lib/ml-api'
import { mapApiPaperToUiPaper } from '@/lib/paper-mappers'
import type { Paper } from '@/lib/types'
import type { Paper as ApiPaper } from '@/types/paper'

type PapersResponse = {
  papers?: ApiPaper[]
  error?: string
}

export default function SearchPapersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryFromUrl = searchParams.get('q')?.trim() ?? ''

  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(false)
  const [clusters, setClusters] = useState<Record<string, MLPaper[]>>({})
  const [mlLoading, setMlLoading] = useState(false)
  const [mlWarning, setMlWarning] = useState<string | null>(null)
  const lastFetchedQueryRef = useRef<string | null>(null)
  const lastClusterSignatureRef = useRef<string | null>(null)

  const fetchPapers = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const endpoint = query
        ? `/api/papers/search?q=${encodeURIComponent(query)}`
        : '/api/papers/trending'
      const res = await fetch(endpoint)
      const data = (await res.json()) as PapersResponse

      if (!res.ok) {
        throw new Error(data.error || 'Request failed')
      }

      const mapped = (data.papers ?? []).map(mapApiPaperToUiPaper)
      setPapers(mapped)
      setClusters({})
      setMlWarning(null)
    } catch {
      setPapers([])
      toast.error('Failed to fetch papers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (lastFetchedQueryRef.current === queryFromUrl) {
      return
    }
    lastFetchedQueryRef.current = queryFromUrl
    fetchPapers(queryFromUrl)
  }, [fetchPapers, queryFromUrl])

  useEffect(() => {
    if (papers.length === 0) {
      setClusters({})
      setMlLoading(false)
      return
    }

    const signature = papers.map((paper) => paper.id).join('|')
    if (lastClusterSignatureRef.current === signature) {
      return
    }
    lastClusterSignatureRef.current = signature

    let mounted = true

    async function runClustering() {
      setMlLoading(true)
      setMlWarning(null)

      try {
        const mlInput: MLPaper[] = papers.map((paper) => ({
          id: paper.id,
          title: paper.title,
          summary: paper.abstract,
        }))
        const nextClusters = await clusterPapers(mlInput)
        if (mounted) {
          setClusters(nextClusters)
        }
      } catch {
        if (mounted) {
          setClusters({})
          setMlWarning('ML service unavailable')
        }
      } finally {
        if (mounted) {
          setMlLoading(false)
        }
      }
    }

    runClustering()

    return () => {
      mounted = false
    }
  }, [papers])

  const handleSearch = (searchQuery: string) => {
    const nextQuery = searchQuery.trim()

    if (!nextQuery) {
      router.push('/search-papers')
      return
    }

    router.push(`/search-papers?q=${encodeURIComponent(nextQuery)}`)
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Search Papers</h1>
        <p className="text-muted-foreground">Search papers or explore trending AI research</p>
      </div>

      <div className="w-full max-w-2xl">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search by title, authors, keywords, or abstract..."
          loading={loading}
          initialQuery={queryFromUrl}
        />
      </div>

      {!loading && queryFromUrl && (
        <div className="text-sm text-muted-foreground">
          Found {papers.length} paper{papers.length !== 1 ? 's' : ''} matching "{queryFromUrl}"
        </div>
      )}

      {!loading && !queryFromUrl && (
        <div>
          <h2 className="text-2xl font-bold text-foreground">Trending Research Papers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Latest papers from Arxiv categories `cs.AI` and `cs.LG`
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {queryFromUrl ? 'Searching papers...' : 'Searching papers...'}
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <PaperCardSkeleton key={item} />
            ))}
          </div>
        </div>
      )}

      {!loading && <PaperList papers={papers} />}

      {!loading && papers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Topic Clusters</h2>

          {mlLoading && (
            <p className="text-sm text-muted-foreground">Analyzing papers...</p>
          )}

          {mlWarning && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
              {mlWarning}
            </div>
          )}

          {!mlLoading && !mlWarning && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(clusters).map(([clusterName, clusterPapers]) => (
                <div key={clusterName} className="bg-card border border-border rounded-lg p-4 space-y-3">
                  <h3 className="text-base font-semibold text-card-foreground capitalize">
                    {clusterName.replace('_', ' ')}
                  </h3>
                  {clusterPapers.length > 0 ? (
                    <ul className="space-y-2">
                      {clusterPapers.map((paper) => (
                        <li key={paper.id}>
                          <Link
                            href={`/paper/${paper.id}`}
                            className="text-sm text-primary hover:underline line-clamp-2"
                          >
                            {paper.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No papers in this cluster.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
