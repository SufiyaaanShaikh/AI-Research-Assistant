const SUMMARIES_KEY = 'researchai_summaries'

type SummaryCache = Record<string, string>

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function getSummaryStore(): SummaryCache {
  if (!canUseStorage()) return {}

  const raw = window.localStorage.getItem(SUMMARIES_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as SummaryCache
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function setSummaryStore(store: SummaryCache): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(SUMMARIES_KEY, JSON.stringify(store))
}

export function getCachedSummary(paperId: string): string | null {
  const store = getSummaryStore()
  return store[paperId] ?? null
}

export function setCachedSummary(paperId: string, summary: string): void {
  const store = getSummaryStore()
  store[paperId] = summary
  setSummaryStore(store)
}
