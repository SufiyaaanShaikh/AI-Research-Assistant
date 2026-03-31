'use client'

import { GlobalSearch } from '@/components/features/global-search'
import { ThemeToggle } from '@/components/theme-toggle'

export function TopNav() {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
        <GlobalSearch />
        <ThemeToggle />
      </div>
    </nav>
  )
}
