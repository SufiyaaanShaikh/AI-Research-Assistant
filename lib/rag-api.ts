/**
 * Client for the new FastAPI RAG pipeline endpoints.
 * All functions call FastAPI directly (same pattern as lib/ml-api.ts).
 */

const FASTAPI_BASE = 'http://127.0.0.1:8000'

// ── Types ──────────────────────────────────────────────────────────────────

export type IngestionStatus =
  | 'pending'
  | 'downloading'
  | 'parsing'
  | 'chunking'
  | 'embedding'
  | 'ready'
  | 'failed'
  | 'not_ingested'

export type PaperStatusResult = {
  paper_id: string
  title: string
  status: IngestionStatus
  created_at: string | null
}

export type CitationItem = {
  chunk_id: string
  page: number
  section: string
  snippet: string
}

export type RagQueryResult = {
  paper_id: string
  question: string
  answer: string
  citations: CitationItem[]
  chunks_used: number
  model: string
}

export type IngestResult = {
  paper_id: string
  title: string
  status: string
  message: string
}

// ── API functions ──────────────────────────────────────────────────────────

/**
 * Ingest a paper by arxiv ID.
 * Creates a DB record and starts the background ingestion worker.
 * Returns the UUID paper_id to store in the bookmark.
 */
export async function ingestPaper(arxivId: string): Promise<IngestResult> {
  const response = await fetch(`${FASTAPI_BASE}/papers/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arxiv_id: arxivId }),
  })
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(err.detail ?? `Ingestion failed: ${response.status}`)
  }
  return response.json() as Promise<IngestResult>
}

/**
 * Look up whether a paper has already been ingested, by arxiv ID.
 * Returns null if not found (paper was never ingested).
 */
export async function findPaperByArxivId(arxivId: string): Promise<PaperStatusResult | null> {
  const response = await fetch(`${FASTAPI_BASE}/papers/by-arxiv/${encodeURIComponent(arxivId)}`)
  if (response.status === 404) return null
  if (!response.ok) return null
  return response.json() as Promise<PaperStatusResult>
}

/**
 * Poll the current status of a paper by its UUID.
 * Returns null if the paper is not found.
 */
export async function getPaperStatus(paperId: string): Promise<PaperStatusResult | null> {
  const response = await fetch(`${FASTAPI_BASE}/papers/status/${encodeURIComponent(paperId)}`)
  if (response.status === 404) return null
  if (!response.ok) return null
  return response.json() as Promise<PaperStatusResult>
}

/**
 * Send a question about a paper and get a cited answer.
 * Requires paper_id (UUID) and the paper must have status="ready".
 */
export async function queryPaper(
  paperId: string,
  question: string,
  includeHistory = true,
  topK = 40,
  topN = 12,
): Promise<RagQueryResult> {
  const response = await fetch(`${FASTAPI_BASE}/papers/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paper_id: paperId,
      question,
      include_history: includeHistory,
      top_k: topK,
      top_n: topN,
    }),
  })
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(err.detail ?? `Query failed: ${response.status}`)
  }
  return response.json() as Promise<RagQueryResult>
}

/**
 * Ensure a paper is ingested: first checks if it already exists, then ingests if not.
 * Returns the paper_id UUID and current status.
 */
export async function ensurePaperIngested(
  arxivId: string,
): Promise<{ paper_id: string; status: IngestionStatus }> {
  // Check if already ingested
  const existing = await findPaperByArxivId(arxivId)
  if (existing) {
    return { paper_id: existing.paper_id, status: existing.status as IngestionStatus }
  }
  // Not found — trigger ingestion
  const result = await ingestPaper(arxivId)
  return { paper_id: result.paper_id, status: result.status as IngestionStatus }
}
