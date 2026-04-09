export interface Paper {
  id: string // arxiv ID (e.g. "2310.06825") — unchanged
  title: string
  authors: string[]
  year: number
  abstract: string
  keywords: string[]
  citations: number
  pdfUrl?: string
  summary?: string
  similarPapers?: string[]
  paper_id?: string // Backend UUID assigned after ingestion via /papers/add
  ingestion_status?: string // "pending" | "ready" | "failed" | "not_ingested"
}

export interface Note {
  id: string
  paperId: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface Bookmark {
  id: string
  paperId: string
  paper: Paper
  createdAt: Date
}

export interface ResearchIdea {
  id: string
  topic: string
  description: string
  dataset: string
  methodology: string
  potentialImpact: string
  relatedFields: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface LiteratureReview {
  topic: string
  overview: string
  papers: Paper[]
  trends: string[]
  researchGaps: string[]
  methodology: string
}
