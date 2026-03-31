const FULLTEXT_KEY = 'researchai_fulltext_cache'

type FullTextCache = Record<string, string>

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function getStore(): FullTextCache {
  if (!canUseStorage()) return {}
  const raw = window.localStorage.getItem(FULLTEXT_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as FullTextCache
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function setStore(store: FullTextCache): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(FULLTEXT_KEY, JSON.stringify(store))
}

export function getCachedFullText(paperId: string): string | null {
  const store = getStore()
  return store[paperId] ?? null
}

export function setCachedFullText(paperId: string, text: string): void {
  const store = getStore()
  store[paperId] = text
  setStore(store)
}
