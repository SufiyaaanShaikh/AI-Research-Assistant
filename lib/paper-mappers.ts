import type { Paper as UiPaper } from '@/lib/types'
import type { Paper as ApiPaper } from '@/types/paper'

function parseYear(published: string): number {
  const year = Number.parseInt(published.slice(0, 4), 10)
  return Number.isNaN(year) ? new Date().getFullYear() : year
}

// FIX #5: `pdfUrl` was being set to `paper.link`, which is the HTML abstract
// page URL (e.g. https://arxiv.org/abs/2401.12345). This is semantically wrong
// for a field named `pdfUrl` and caused issues in places that use it to fetch
// the PDF directly. The bookmark stored the abstract URL as `pdfUrl`, so when
// chat-paper tried to use `bookmark.pdfUrl` to build the PDF download URL, it
// started with `/abs/` and the conversion worked — but only by accident.
// Other consumers of `pdfUrl` (e.g. future PDF viewers) would receive the
// wrong URL. This fix converts to the real PDF URL at the mapping layer.
function toPdfUrl(absUrl: string): string {
  if (!absUrl) return ''
  if (absUrl.includes('/abs/')) {
    return absUrl.replace('/abs/', '/pdf/') + '.pdf'
  }
  // Already looks like a PDF URL or non-standard URL — return as-is
  return absUrl
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
    pdfUrl: toPdfUrl(paper.link),  // Now correctly points to the .pdf download
    summary: paper.summary,
  }
}