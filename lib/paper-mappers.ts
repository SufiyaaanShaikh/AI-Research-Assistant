import type { Paper as UiPaper } from '@/lib/types'
import type { Paper as ApiPaper } from '@/types/paper'

function parseYear(published: string): number {
  const year = Number.parseInt(published.slice(0, 4), 10)
  return Number.isNaN(year) ? new Date().getFullYear() : year
}

export function mapApiPaperToUiPaper(paper: ApiPaper): UiPaper {
  return {
    id: paper.id,
    title: paper.title,
    authors: paper.authors,
    year: parseYear(paper.published),
    abstract: paper.summary,
    keywords: paper.categories,
    citations: 0,
    pdfUrl: paper.link,
    summary: paper.summary,
  }
}
