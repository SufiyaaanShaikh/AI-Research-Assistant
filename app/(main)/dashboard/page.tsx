'use client'

import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Lightbulb, MessageSquare, Search } from 'lucide-react'
import { toast } from 'sonner'

import { DashboardCard } from '@/components/cards/dashboard-card'
import { SearchBar } from '@/components/features/search-bar'
import { PaperList } from '@/components/features/paper-list'
import { PaperCardSkeleton } from '@/components/skeletons/content-skeleton'
import { mapApiPaperToUiPaper } from '@/lib/paper-mappers'
import type { Paper } from '@/lib/types'
import type { Paper as ApiPaper } from '@/types/paper'

type PapersResponse = {
  papers?: ApiPaper[]
  error?: string
}

export default function DashboardPage() {
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState<Paper[]>([])
  const [featuredPapers, setFeaturedPapers] = useState<Paper[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingFeatured, setLoadingFeatured] = useState(false)

  const fetchFeaturedPapers = useCallback(async () => {
    setLoadingFeatured(true)
    try {
      const res = await fetch('/api/papers/trending')
      const data = (await res.json()) as PapersResponse

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch featured papers')
      }

      setFeaturedPapers((data.papers ?? []).slice(0, 6).map(mapApiPaperToUiPaper))
    } catch {
      setFeaturedPapers([])
      toast.error('Failed to fetch papers')
    } finally {
      setLoadingFeatured(false)
    }
  }, [])

  useEffect(() => {
    fetchFeaturedPapers()
  }, [fetchFeaturedPapers])

  const handleSearch = async (query: string) => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) return

    setLoadingSearch(true)
    try {
      const res = await fetch(`/api/papers/search?q=${encodeURIComponent(normalizedQuery)}`)
      const data = (await res.json()) as PapersResponse

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search papers')
      }

      setSearchResults((data.papers ?? []).map(mapApiPaperToUiPaper))
      setShowResults(true)
    } catch {
      setSearchResults([])
      toast.error('Failed to fetch papers')
    } finally {
      setLoadingSearch(false)
    }
  }

  const quickActions = [
    {
      title: 'Search Papers',
      description: 'Find research papers by keywords, authors, or topics',
      icon: Search,
      href: '/search-papers',
      color: 'primary' as const,
    },
    {
      title: 'Chat with Paper',
      description: 'Ask questions about a specific research paper',
      icon: MessageSquare,
      href: '/chat-paper',
      color: 'accent' as const,
    },
    {
      title: 'Research Ideas',
      description: 'Get AI-generated research ideas and proposals',
      icon: Lightbulb,
      href: '/research-ideas',
      color: 'secondary' as const,
    },
    {
      title: 'Literature Review',
      description: 'Generate comprehensive literature reviews',
      icon: BookOpen,
      href: '/literature-review',
      color: 'primary' as const,
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
        <p className="text-muted-foreground">
          Search papers, discover insights, and accelerate your research
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search papers by title, authors, or keywords..."
          loading={loadingSearch}
        />
      </div>

      {!showResults && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => (
              <DashboardCard
                key={action.href}
                title={action.title}
                description={action.description}
                icon={action.icon}
                href={action.href}
                color={action.color}
              />
            ))}
          </div>
        </div>
      )}

      {showResults && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Search Results</h2>
          {loadingSearch ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <PaperCardSkeleton key={item} />
              ))}
            </div>
          ) : (
            <PaperList papers={searchResults} />
          )}
          <button onClick={() => setShowResults(false)} className="text-primary font-medium hover:underline">
            Back to Dashboard
          </button>
        </div>
      )}

      {!showResults && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Featured Papers</h2>
          {loadingFeatured ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <PaperCardSkeleton key={item} />
              ))}
            </div>
          ) : (
            <PaperList papers={featuredPapers} />
          )}
        </div>
      )}
    </div>
  )
}
