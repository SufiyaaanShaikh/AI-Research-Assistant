'use client'

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Paper as ApiPaper } from '@/types/paper'
import { toast } from 'sonner'

interface SearchSuggestion {
  id: string
  title: string
  authors: string[]
  year: number
}

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setSuggestions([])
      setIsOpen(false)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setLoading(true)

      try {
        const res = await fetch(`/api/papers/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        })
        const data = (await res.json()) as { papers?: ApiPaper[]; error?: string }

        if (!res.ok) {
          throw new Error(data.error || 'Request failed')
        }

        const nextSuggestions = (data.papers ?? []).map((paper) => ({
          id: paper.id,
          title: paper.title,
          authors: paper.authors,
          year: Number.parseInt(paper.published.slice(0, 4), 10) || new Date().getFullYear(),
        }))

        setSuggestions(nextSuggestions)
        setIsOpen(true)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setSuggestions([])
        setIsOpen(true)
        toast.error('Failed to fetch papers')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [query])

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Search papers, authors..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setSuggestions([])
              setIsOpen(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map((paper) => (
              <button
                key={paper.id}
                type="button"
                onClick={() => {
                  router.push(`/paper/${paper.id}`)
                  setQuery('')
                  setSuggestions([])
                  setIsOpen(false)
                }}
                className="w-full text-left"
              >
                <div className="px-4 py-3 hover:bg-secondary border-b border-border last:border-b-0 cursor-pointer transition-colors">
                  <p className="font-medium text-sm text-foreground line-clamp-1">{paper.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {paper.authors.slice(0, 2).join(', ')} {paper.authors.length > 2 ? '...' : ''} - {paper.year}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">Loading papers...</p>
        </div>
      )}

      {isOpen && query && !loading && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">No papers found</p>
        </div>
      )}
    </div>
  )
}
