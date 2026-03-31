import { XMLParser } from 'fast-xml-parser'

import type { Paper } from '@/types/paper'

const ARXIV_API_URL = 'https://export.arxiv.org/api/query'
const MAX_RESULTS = 10
const TRENDING_QUERY = 'cat:cs.AI OR cat:cs.LG'
const CACHE_TTL_MS = 10 * 60 * 1000
const REQUEST_INTERVAL_MS = 1000

type CacheEntry = {
  data: ArxivEntry[]
  timer: ReturnType<typeof setTimeout>
}

type ArxivCategory = {
  term?: string
}

type ArxivAuthor = {
  name?: string
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

type ArxivFeed = {
  entry?: ArxivEntry | ArxivEntry[]
}

type ArxivResponse = {
  feed?: ArxivFeed
}

const arxivCache = new Map<string, CacheEntry>()
const inflightRequests = new Map<string, Promise<ArxivEntry[]>>()
let lastRequestTime = 0

function buildArxivUrl(query: string): string {
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: '0',
    max_results: String(MAX_RESULTS),
  })

  return `${ARXIV_API_URL}?${params.toString()}`
}

function buildArxivIdUrl(id: string): string {
  const params = new URLSearchParams({
    id_list: id,
  })

  return `${ARXIV_API_URL}?${params.toString()}`
}

function buildTrendingArxivUrl(maxResults: number): string {
  const params = new URLSearchParams({
    search_query: TRENDING_QUERY,
    sortBy: 'submittedDate',
    sortOrder: 'descending',
    start: '0',
    max_results: String(maxResults),
  })

  return `${ARXIV_API_URL}?${params.toString()}`
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function cleanText(text: string | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim()
}

function toPaper(entry: ArxivEntry): Paper {
  const entryId = cleanText(entry.id)
  const id = entryId.split('/').pop() ?? entryId

  const authors = toArray(entry.author)
    .map((author) => cleanText(author.name))
    .filter(Boolean)

  const categories = toArray(entry.category)
    .map((category) => cleanText(category.term))
    .filter(Boolean)

  const links = toArray(entry.link)
  const preferredLink =
    links.find((link) => link.rel === 'alternate' && link.type === 'text/html') ??
    links.find((link) => link.rel === 'alternate') ??
    links[0]

  return {
    id,
    title: cleanText(entry.title),
    authors,
    summary: cleanText(entry.summary),
    published: cleanText(entry.published).split('T')[0] ?? '',
    categories,
    link: cleanText(preferredLink?.href) || entryId,
  }
}

function buildFallbackPaper(id: string): Paper {
  return {
    id,
    title: 'Paper temporarily unavailable',
    authors: [],
    summary: 'arXiv rate limit reached. Please retry shortly.',
    published: '',
    categories: [],
    link: `https://arxiv.org/abs/${id}`,
  }
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function throttleRequests(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < REQUEST_INTERVAL_MS) {
    await wait(REQUEST_INTERVAL_MS - elapsed)
  }
  lastRequestTime = Date.now()
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  let lastResponse: Response | null = null

  for (let i = 0; i < retries; i += 1) {
    await throttleRequests()
    const response = await fetch(url, {
      headers: {
        Accept: 'application/atom+xml',
      },
      cache: 'no-store',
    })

    if (response.status !== 429) {
      return response
    }

    lastResponse = response
    const delay = 2 ** i * 1000
    await wait(delay)
  }

  const status = lastResponse?.status ?? 429
  throw new Error(`arXiv API rate limit exceeded after retries (${status})`)
}

function getCachedEntries(cacheKey: string): ArxivEntry[] | null {
  const cached = arxivCache.get(cacheKey)
  if (!cached) return null
  return cached.data
}

function setCachedEntries(cacheKey: string, entries: ArxivEntry[]): void {
  const existing = arxivCache.get(cacheKey)
  if (existing) {
    clearTimeout(existing.timer)
  }

  const timer = setTimeout(() => {
    arxivCache.delete(cacheKey)
  }, CACHE_TTL_MS)

  arxivCache.set(cacheKey, { data: entries, timer })
}

async function fetchAndParseArxiv(url: string, cacheKey = url): Promise<ArxivEntry[]> {
  const cachedEntries = getCachedEntries(cacheKey)
  if (cachedEntries) {
    return cachedEntries
  }

  const inflight = inflightRequests.get(cacheKey)
  if (inflight) {
    return inflight
  }

  const requestPromise = (async () => {
    const response = await fetchWithRetry(url)

    if (!response.ok) {
      throw new Error(`Arxiv API request failed with status ${response.status}`)
    }

    const xml = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    })

    const parsed = parser.parse(xml) as ArxivResponse
    if (!parsed.feed) {
      throw new Error('Invalid Arxiv API response format')
    }

    const entries = toArray(parsed.feed.entry)
    setCachedEntries(cacheKey, entries)
    return entries
  })()

  inflightRequests.set(cacheKey, requestPromise)

  try {
    return await requestPromise
  } finally {
    inflightRequests.delete(cacheKey)
  }
}

export async function searchArxiv(query: string): Promise<Paper[]> {
  const normalizedQuery = query.trim()
  const url = buildArxivUrl(normalizedQuery)
  const cacheKey = `search:${normalizedQuery.toLowerCase()}`
  const entries = await fetchAndParseArxiv(url, cacheKey)
  return entries.map(toPaper).slice(0, MAX_RESULTS)
}

export async function getArxivPaperById(id: string): Promise<Paper | null> {
  const normalizedId = id.trim()
  const url = buildArxivIdUrl(normalizedId)
  const cacheKey = `id:${normalizedId}`

  try {
    const entries = await fetchAndParseArxiv(url, cacheKey)
    const firstEntry = entries[0]

    if (!firstEntry) {
      return null
    }

    return toPaper(firstEntry)
  } catch {
    return buildFallbackPaper(normalizedId)
  }
}

export async function getTrendingArxivPapers(maxResults = MAX_RESULTS): Promise<Paper[]> {
  const url = buildTrendingArxivUrl(maxResults)
  const cacheKey = `trending:${maxResults}`
  const entries = await fetchAndParseArxiv(url, cacheKey)
  return entries.map(toPaper).slice(0, maxResults)
}
