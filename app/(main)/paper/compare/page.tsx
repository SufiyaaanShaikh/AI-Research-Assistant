'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getBookmarks } from '@/lib/bookmarks'
import type { Paper } from '@/lib/types'

type ComparisonRow = {
  title: string
  objective: string
  method: string
  strengths: string
  weaknesses: string
  useCases: string
}

export default function ComparePapersPage() {
  const [bookmarkedPapers, setBookmarkedPapers] = useState<Paper[]>([])
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([])
  const [selectedValue, setSelectedValue] = useState('')
  const [rows, setRows] = useState<ComparisonRow[]>([])
  const [loadingComparison, setLoadingComparison] = useState(false)

  useEffect(() => {
    setBookmarkedPapers(getBookmarks())
  }, [])

  const selectedPapers = useMemo(
    () => bookmarkedPapers.filter((paper) => selectedPaperIds.includes(paper.id)),
    [bookmarkedPapers, selectedPaperIds],
  )

  const availablePapers = useMemo(
    () => bookmarkedPapers.filter((paper) => !selectedPaperIds.includes(paper.id)),
    [bookmarkedPapers, selectedPaperIds],
  )

  const handleAddPaper = (paperId: string) => {
    if (!paperId || selectedPaperIds.includes(paperId)) return

    if (selectedPaperIds.length >= 4) {
      toast.error('Maximum 4 papers can be compared.')
      setSelectedValue('')
      return
    }

    setSelectedPaperIds((prev) => [...prev, paperId])
    setSelectedValue('')
    setRows([])
  }

  const handleRemovePaper = (paperId: string) => {
    setSelectedPaperIds((prev) => prev.filter((id) => id !== paperId))
    setRows([])
  }

  const handleCompare = async () => {
    if (selectedPapers.length < 2) {
      return
    }

    setLoadingComparison(true)
    setRows([])

    try {
      const res = await fetch('/api/ai/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          papers: selectedPapers.map((paper) => ({
            title: paper.title,
            summary: paper.abstract,
          })),
        }),
      })

      const data = (await res.json()) as { rows?: ComparisonRow[]; error?: string }
      if (!res.ok || !data.rows || data.rows.length === 0) {
        throw new Error(data.error || 'Failed to compare papers')
      }

      setRows(data.rows)
    } catch {
      toast.error('AI generation failed')
    } finally {
      setLoadingComparison(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Compare Papers</h1>
        <p className="text-muted-foreground">AI-powered comparison for 2 to 4 bookmarked papers</p>
      </div>

      {bookmarkedPapers.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <p className="text-muted-foreground">Bookmark papers to compare.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Select Papers</h2>

          <div className="flex gap-2">
            <Select value={selectedValue} onValueChange={handleAddPaper}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose a bookmarked paper..." />
              </SelectTrigger>
              <SelectContent>
                {availablePapers.map((paper) => (
                  <SelectItem key={paper.id} value={paper.id}>
                    {paper.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedPapers.map((paper) => (
              <div
                key={paper.id}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-full text-sm"
              >
                <span className="max-w-[220px] truncate">{paper.title}</span>
                <button onClick={() => handleRemovePaper(paper.id)} className="ml-1 hover:opacity-70">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {selectedPapers.length < 2 && (
            <p className="text-sm text-muted-foreground">Select at least 2 papers to compare.</p>
          )}

          <Button
            onClick={handleCompare}
            disabled={selectedPapers.length < 2 || loadingComparison}
            className="w-fit"
          >
            {loadingComparison ? 'Comparing papers...' : 'Compare with AI'}
          </Button>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Structured Comparison</h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-secondary/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-foreground">Paper Title</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Objective</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Method</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Strengths</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Weaknesses</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Use Cases</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.title}-${index}`} className="border-t border-border align-top">
                    <td className="px-4 py-3 text-foreground font-medium">{row.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.objective}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.method}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.strengths}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.weaknesses}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.useCases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
