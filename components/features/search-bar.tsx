'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  loading?: boolean
  initialQuery?: string
}

export function SearchBar({ 
  onSearch, 
  placeholder = 'Search papers...',
  loading = false,
  initialQuery = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1"
      />
      <Button 
        type="submit"
        disabled={loading || !query.trim()}
        className="gap-2"
      >
        <Search size={16} />
        <span className="hidden sm:inline">Search</span>
      </Button>
    </form>
  )
}
