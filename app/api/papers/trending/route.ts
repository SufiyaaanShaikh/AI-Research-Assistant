import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

const ARXIV_TRENDING_URL =
  'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=10'

const FALLBACK_PAPERS = [
  {
    id: '1706.03762',
    title: 'Attention Is All You Need',
    authors: ['Vaswani et al'],
    summary: 'Transformer architecture paper...',
    published: '2017-06-12',
    pdf_url: 'https://arxiv.org/pdf/1706.03762.pdf',
    categories: ['cs.CL'],
    link: 'https://arxiv.org/abs/1706.03762',
  },
]

type ArxivAuthor = {
  name?: string
}

type ArxivCategory = {
  term?: string
}

type ArxivLink = {
  href?: string
  rel?: string
  type?: string
}

type ArxivEntry = {
  id?: string
  title?: string
  summary?: string
  published?: string
  author?: ArxivAuthor | ArxivAuthor[]
  category?: ArxivCategory | ArxivCategory[]
  link?: ArxivLink | ArxivLink[]
}

type ParsedFeed = {
  feed?: {
    entry?: ArxivEntry | ArxivEntry[]
  }
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function cleanText(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function toPdfUrl(absUrl: string): string {
  if (!absUrl) return ''
  return absUrl.includes('/abs/') ? absUrl.replace('/abs/', '/pdf/') + '.pdf' : `${absUrl}.pdf`
}

export async function GET() {
  console.log('Fetching trending papers from arxiv')

  try {
    const response = await fetch(ARXIV_TRENDING_URL, {
      headers: { Accept: 'application/atom+xml' },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Arxiv request failed: ${response.status}`)
    }

    const xml = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    })
    const parsed = parser.parse(xml) as ParsedFeed
    const entries = toArray(parsed.feed?.entry)

    const papers = entries.map((entry) => {
      const rawId = cleanText(entry.id)
      const id = rawId.split('/').pop() ?? rawId
      const authors = toArray(entry.author)
        .map((author) => cleanText(author.name))
        .filter(Boolean)
      const categories = toArray(entry.category)
        .map((category) => cleanText(category.term))
        .filter(Boolean)
      const links = toArray(entry.link)
      const absLink =
        links.find((link) => link.rel === 'alternate' && link.type === 'text/html')?.href ??
        links.find((link) => link.rel === 'alternate')?.href ??
        rawId

      return {
        id,
        title: cleanText(entry.title),
        authors,
        summary: cleanText(entry.summary),
        published: cleanText(entry.published).split('T')[0] ?? '',
        pdf_url: toPdfUrl(absLink),
        categories,
        link: absLink,
      }
    })

    return NextResponse.json({ papers: papers.length > 0 ? papers : FALLBACK_PAPERS })
  } catch (error) {
    console.error('Trending API error:', error)
    return NextResponse.json({ papers: FALLBACK_PAPERS })
  }
}
