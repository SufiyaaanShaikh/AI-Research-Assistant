import type { Paper as UiPaper } from '@/lib/types'

const keywordsCache = new Map<string, string[]>()
const similarCache = new Map<string, UiPaper[]>()

export function getCachedKeywords(id: string): string[] | undefined {
  return keywordsCache.get(id)
}

export function setCachedKeywords(id: string, data: string[]): void {
  keywordsCache.set(id, data)
}

export function getCachedSimilar(id: string): UiPaper[] | undefined {
  return similarCache.get(id)
}

export function setCachedSimilar(id: string, data: UiPaper[]): void {
  similarCache.set(id, data)
}
