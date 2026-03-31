'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Search, 
  Home, 
  BookMarked, 
  MessageSquare, 
  BookOpen, 
  Lightbulb, 
  Layers,
  NotebookTabs,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/search-papers', label: 'Search Papers', icon: Search },
    { href: '/chat-paper', label: 'Chat with Paper', icon: MessageSquare },
    { href: '/paper/compare', label: 'Compare Papers', icon: Layers },
    { href: '/research-ideas', label: 'Research Ideas', icon: Lightbulb },
    { href: '/literature-review', label: 'Literature Review', icon: BookOpen },
    { href: '/bookmarks', label: 'Bookmarks', icon: BookMarked },
    { href: '/notes', label: 'Notes', icon: NotebookTabs },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href)

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Title */}
          <div className="border-b border-sidebar-border p-6">
            <h1 className="text-2xl font-bold text-sidebar-foreground">
              ResearchAI
            </h1>
            <p className="text-xs text-sidebar-accent-foreground mt-1 opacity-60">
              AI Research Assistant
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            <p className="text-xs text-sidebar-accent-foreground text-center opacity-60">
              v1.0.0
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
