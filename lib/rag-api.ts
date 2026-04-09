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
 * Stream a question about a paper and receive tokens progressively.
 * Citations should be fetched separately from the non-stream endpoint after completion.
 */
export async function queryPaperStream(
  paperId: string,
  question: string,
  onToken: (token: string) => void,
): Promise<void> {
  const response = await fetch(`${FASTAPI_BASE}/papers/query/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paper_id: paperId,
      question,
      include_history: true,
      top_k: 40,
      top_n: 12,
    }),
  })

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(err.detail ?? `Stream query failed: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('Streaming response body is unavailable')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const processEvent = (eventChunk: string): boolean => {
    const lines = eventChunk.split('\n')
    let eventName = 'message'
    let payload = ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
        continue
      }
      if (line.startsWith('data:')) {
        payload = line.slice(5).trim()
      }
    }

    if (eventName === 'done') {
      return true
    }

    if (eventName === 'error') {
      throw new Error(payload || 'Groq API unavailable after retries.')
    }

    if (!payload) return false

    const parsed = JSON.parse(payload) as { token?: string; error?: string }
    if (parsed.error) {
      throw new Error(parsed.error)
    }
    if (parsed.token) {
      onToken(parsed.token)
    }

    return false
  }

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })

    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const eventChunk of events) {
      if (processEvent(eventChunk)) {
        return
      }
    }

    if (done) {
      if (buffer.trim()) {
        processEvent(buffer)
      }
      return
    }
  }
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
