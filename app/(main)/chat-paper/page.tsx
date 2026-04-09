'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { Copy, Send, Sparkles, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ChatMessageSkeleton } from '@/components/skeletons/content-skeleton'
import { extractKeywords, getSimilarPapers, type MLPaper } from '@/lib/ml-api'
import { getBookmarks } from '@/lib/bookmarks'
import { getCachedSummary, setCachedSummary } from '@/lib/cache'
import { mapApiPaperToUiPaper } from '@/lib/paper-mappers'
import {
  ensurePaperIngested,
  queryPaper,
  getPaperStatus,
  type CitationItem,
  type IngestionStatus,
} from '@/lib/rag-api'
import { updateBookmarkPaperId } from '@/lib/bookmarks'
import type { Paper as UiPaper } from '@/lib/types'
import type { Paper as ApiPaper } from '@/types/paper'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  followUps?: string[]
  citations?: CitationItem[]   // Only on assistant messages from new pipeline
  expandedCitation?: string | null  // chunk_id of currently expanded citation
}

type PaperResponse = {
  paper?: ApiPaper
  error?: string
}

type PapersResponse = {
  papers?: ApiPaper[]
  error?: string
}

type ChatResponse = {
  answer?: string
  followUpQuestions?: string[]
  source_sections?: string[]
  context_source?: 'rag' | 'full_text' | 'abstract_only'
  error?: string
}

const QUICK_ACTIONS: Array<{ label: string; prompt: string; deep?: boolean }> = [
  { label: 'Explain Paper', prompt: 'Explain this research paper in simple terms.' },
  { label: 'Key Findings', prompt: 'What are the key findings and main results of this paper? Include specific numbers and metrics.', deep: true },
  { label: 'Definitions', prompt: 'Define and explain the core concepts, terms, and novel ideas introduced in this paper.', deep: true },
  { label: 'Limitations', prompt: 'What are the main limitations of this paper?' },
  { label: 'Applications', prompt: 'What are practical applications of this work?' },
  { label: 'Future Work', prompt: 'What are strong future work directions based on this paper?' },
  { label: 'Methodology', prompt: 'Explain the methodology used in this paper.' },
  { label: 'Dataset Used', prompt: 'Which datasets are used and how are they evaluated?' },
  { label: 'Analyze Full Paper', prompt: 'Provide a deep full-paper analysis with key technical insights.', deep: true },
]
const CHAT_KEY_PREFIX = 'researchai_chat_'
const MAX_HISTORY = 20

function getPdfUrl(paper: ApiPaper): string {
  if (paper.link.includes('/abs/')) {
    return paper.link.replace('/abs/', '/pdf/') + '.pdf'
  }
  return `${paper.link}.pdf`
}

function keepLast20(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-MAX_HISTORY)
}

function getChatStorageKey(paperId: string): string {
  return `${CHAT_KEY_PREFIX}${paperId}`
}

function loadPersistedChat(paperId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(getChatStorageKey(paperId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatMessage[]
    if (!Array.isArray(parsed)) return []
    return keepLast20(
      parsed.filter(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          (item.role === 'user' || item.role === 'assistant') &&
          typeof item.content === 'string',
      ),
    )
  } catch {
    return []
  }
}

function persistChat(paperId: string, messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getChatStorageKey(paperId), JSON.stringify(keepLast20(messages)))
}

function clearPersistedChat(paperId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(getChatStorageKey(paperId))
}

function mapBookmarkedPaperToApiPaper(bookmark: UiPaper): ApiPaper {
  return {
    id: bookmark.id,
    title: bookmark.title,
    authors: bookmark.authors ?? [],
    summary: bookmark.summary || bookmark.abstract || '',
    published: bookmark.year ? `${bookmark.year}-01-01` : '',
    categories: bookmark.keywords ?? [],
    link: bookmark.pdfUrl || `https://arxiv.org/abs/${bookmark.id}`,
  }
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function renderMarkdownSummary(summary: string): ReactNode {
  const lines = summary.split('\n')
  const blocks: ReactNode[] = []
  let bulletBuffer: string[] = []

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return
    blocks.push(
      <ul key={`bullets-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {bulletBuffer.map((item, index) => (
          <li key={`${item}-${index}`} className="text-sm leading-relaxed text-muted-foreground">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>,
    )
    bulletBuffer = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushBullets()
      blocks.push(<div key={`spacer-${blocks.length}`} className="h-2" />)
      continue
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/)
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1])
      continue
    }

    flushBullets()

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/) || line.match(/^\*\*(.+)\*\*:?\s*$/)
    if (headingMatch) {
      blocks.push(
        <h4 key={`heading-${blocks.length}`} className="text-sm font-semibold text-foreground">
          {headingMatch[1]}
        </h4>,
      )
      continue
    }

    blocks.push(
      <p key={`paragraph-${blocks.length}`} className="text-sm leading-relaxed text-muted-foreground">
        {renderInlineMarkdown(line)}
      </p>,
    )
  }

  flushBullets()
  return <div className="space-y-2">{blocks}</div>
}

export default function ChatPaperPage() {
  const searchParams = useSearchParams()
  const initialPaperId = searchParams.get('paperId')?.trim() ?? ''

  const [paperOptions, setPaperOptions] = useState<ApiPaper[]>([])
  const [selectedPaperId, setSelectedPaperId] = useState(initialPaperId)
  const [paper, setPaper] = useState<ApiPaper | null>(null)
  const [aiSummary, setAiSummary] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [similarPapers, setSimilarPapers] = useState<UiPaper[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [loadingPaper, setLoadingPaper] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [mlWarning, setMlWarning] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<'rag' | 'full_text' | 'abstract_only' | null>(null)

  // FIX #3: Added a `deepMode` toggle (defaults to true).
  // Previously, only the "Analyze Full Paper" quick action button passed
  // `forceDeepMode=true` to sendQuestion. Every other path — manual text input,
  // suggested follow-up question clicks, and all other quick action buttons —
  // called sendQuestion WITHOUT deep mode, so the AI only ever received the
  // abstract and would say "The paper does not provide Table 1" for any question
  // about paper content.
  // Now all questions respect the user's deepMode toggle, which defaults to ON
  // so the full PDF is used by default.
  const [deepMode, setDeepMode] = useState(true)
  // New RAG pipeline state
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus | 'not_ingested'>('not_ingested')
  const [backendPaperId, setBackendPaperId] = useState<string | null>(null)
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null)

  const selectedUiSimilar = useMemo(() => similarPapers.slice(0, 3), [similarPapers])

  useEffect(() => {
    let mounted = true

    function loadPaperOptions() {
      setLoadingOptions(true)
      try {
        const nextOptions = getBookmarks().map(mapBookmarkedPaperToApiPaper)
        if (!mounted) return

        setPaperOptions(nextOptions)

        if (!nextOptions.some((item) => item.id === selectedPaperId)) {
          setSelectedPaperId(nextOptions[0]?.id ?? '')
        }
      } catch {
        if (mounted) {
          setPaperOptions([])
          toast.error('Failed to load bookmarked papers')
        }
      } finally {
        if (mounted) {
          setLoadingOptions(false)
        }
      }
    }

    loadPaperOptions()

    return () => {
      mounted = false
    }
  }, [])

  const loadPaperInsights = useCallback(async (currentPaper: ApiPaper) => {
    setMlWarning(null)
    setLoadingInsights(true)
    setKeywords([])
    setSimilarPapers([])

    try {
      const [keywordResult, candidatesRes] = await Promise.all([
        extractKeywords(currentPaper.summary),
        fetch(`/api/papers/search?q=${encodeURIComponent(currentPaper.title)}`),
      ])

      const candidatesData = (await candidatesRes.json()) as PapersResponse
      if (!candidatesRes.ok) {
        throw new Error(candidatesData.error || 'Failed to fetch related papers')
      }

      setKeywords(keywordResult)

      const candidates = (candidatesData.papers ?? []).filter((item) => item.id !== currentPaper.id)
      const similarIds = await getSimilarPapers(
        { id: currentPaper.id, title: currentPaper.title, summary: currentPaper.summary },
        candidates.map((item) => ({ id: item.id, title: item.title, summary: item.summary })),
      )

      const candidateMap = new Map(candidates.map((item) => [item.id, mapApiPaperToUiPaper(item)]))
      const nextSimilar = similarIds
        .map((item) => candidateMap.get(item.id))
        .filter((item): item is UiPaper => Boolean(item))
        .slice(0, 3)

      setSimilarPapers(nextSimilar)
    } catch {
      setMlWarning('ML service unavailable')
    } finally {
      setLoadingInsights(false)
    }
  }, [])

  const loadPaperSummary = useCallback(async (currentPaper: ApiPaper) => {
    setLoadingSummary(true)
    const cachedSummary = getCachedSummary(currentPaper.id)
    if (cachedSummary) {
      setAiSummary(cachedSummary)
      setLoadingSummary(false)
      return
    }

    try {
      const summarizeRes = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: currentPaper.title, summary: currentPaper.summary }),
      })
      const summarizeData = (await summarizeRes.json()) as { summary?: string; error?: string }
      if (summarizeRes.ok && summarizeData.summary) {
        setAiSummary(summarizeData.summary)
        setCachedSummary(currentPaper.id, summarizeData.summary)
      } else {
        setAiSummary('')
      }
    } catch {
      setAiSummary('')
    } finally {
      setLoadingSummary(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedPaperId) return

    let mounted = true

    async function loadCurrentPaper() {
      setLoadingPaper(true)
      setAiSummary('')

      try {
        const res = await fetch(`/api/papers/${encodeURIComponent(selectedPaperId)}`)
        const data = (await res.json()) as PaperResponse
        if (!res.ok || !data.paper) throw new Error(data.error || 'Paper not found')
        if (!mounted) return

        setPaper(data.paper)
        
        // NEW: Ensure paper is ingested into the RAG backend.
        // First check localStorage for a stored paper_id.
        const storedPaperId = (data.paper as ApiPaper & { paper_id?: string | null }).paper_id ?? null
        if (storedPaperId) {
          setBackendPaperId(storedPaperId)
          // Check current status of already-ingested paper
          const statusResult = await getPaperStatus(storedPaperId).catch(() => null)
          setIngestionStatus((statusResult?.status as IngestionStatus) ?? 'not_ingested')
        } else {
          // No paper_id stored — trigger ingestion now
          try {
            const { paper_id, status } = await ensurePaperIngested(data.paper.id)
            setBackendPaperId(paper_id)
            setIngestionStatus(status)
            // Persist the UUID into the bookmark so future loads skip this step
            updateBookmarkPaperId(data.paper.id, paper_id, status)
          } catch (err) {
            console.warn('[RAG] Ingestion trigger failed:', err)
            setIngestionStatus('not_ingested')
          }
        }

        setMessages(loadPersistedChat(data.paper.id))
        void loadPaperSummary(data.paper)
        void loadPaperInsights(data.paper)
      } catch {
        if (mounted) {
          setPaper(null)
          toast.error('Failed to load paper')
        }
      } finally {
        if (mounted) {
          setLoadingPaper(false)
        }
      }
    }

    loadCurrentPaper()

    return () => {
      mounted = false
    }
  }, [selectedPaperId, loadPaperInsights, loadPaperSummary])

  // Poll ingestion status until paper is ready or failed.
  useEffect(() => {
    if (!backendPaperId) return
    if (ingestionStatus === 'ready' || ingestionStatus === 'failed' || ingestionStatus === 'not_ingested') return

    const interval = setInterval(async () => {
      const result = await getPaperStatus(backendPaperId).catch(() => null)
      if (!result) return
      const status = result.status as IngestionStatus
      setIngestionStatus(status)
      if (status === 'ready' || status === 'failed') {
        clearInterval(interval)
        if (status === 'ready') {
          updateBookmarkPaperId(paper?.id ?? '', backendPaperId, 'ready')
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [backendPaperId, ingestionStatus, paper?.id])

  useEffect(() => {
    if (!paper) return
    persistChat(paper.id, messages)
  }, [paper, messages])

  const sendQuestion = useCallback(
    async (question: string, forceDeepMode = false) => {
      const trimmedQuestion = question.trim()
      if (!paper || !trimmedQuestion || loadingChat) return

      const shouldUseDeepMode = forceDeepMode || (trimmedQuestion.split(' ').length > 15 ? true : false)

      const userMessage: ChatMessage = {
        id: `${Date.now()}-user`,
        role: 'user',
        content: trimmedQuestion,
      }

      setMessages((prev) => keepLast20([...prev, userMessage]))
      setLoadingChat(true)

      try {
        const shouldCompare = /\b(compare|comparison|vs|versus)\b/i.test(trimmedQuestion)
        const similarContext = shouldCompare && selectedUiSimilar.length > 0
          ? `\nSimilar papers for comparison:\n${selectedUiSimilar
              .map((item, index) => `${index + 1}. ${item.title}\nAbstract: ${item.abstract}`)
              .join('\n\n')}`
          : ''

        let assistantContent = ''
        let citations: CitationItem[] = []

        const canUseNewPipeline = backendPaperId && ingestionStatus === 'ready'

        if (canUseNewPipeline) {
          // ── NEW PIPELINE: FastAPI /papers/query (persistent RAG) ──────────────
          const ragResult = await queryPaper(backendPaperId, trimmedQuestion)
          assistantContent = ragResult.answer
          citations = ragResult.citations
        } else {
          // ── LEGACY FALLBACK: /api/ai/chat-paper (old RAG or abstract only) ───
          const paperContext = `Title: ${paper.title}
Authors: ${paper.authors.join(', ')}
Published: ${paper.published}
Abstract: ${paper.summary}
Keywords: ${keywords.join(', ') || paper.categories.join(', ')}${similarContext}`

          const response = await fetch('/api/ai/chat-paper', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paper_context: paperContext,
              pdf_url: (deepMode || shouldUseDeepMode) ? getPdfUrl(paper) : undefined,
              deep_mode: deepMode || shouldUseDeepMode,
              chat_history: keepLast20(messages).map((item) => ({
                role: item.role,
                content: item.content,
              })),
              user_question: trimmedQuestion,
            }),
          })
          const data = (await response.json()) as ChatResponse
          if (!response.ok || !data.answer) {
            throw new Error(data.error || 'Failed to generate response')
          }
          assistantContent = data.answer
          setBackendStatus(data.context_source ?? null)
        }

        const assistantMessage: ChatMessage = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: assistantContent,
          citations: citations.length > 0 ? citations : undefined,
        }
        setMessages((prev) => keepLast20([...prev, assistantMessage]))

      } catch (err) {
        console.error('[sendQuestion error]', err)
        toast.error('AI generation failed')
      } finally {
        setLoadingChat(false)
      }
    },
    [paper, loadingChat, selectedUiSimilar, keywords, messages, backendPaperId, ingestionStatus, deepMode],
  )

  // FIX #3 (continued): handleSubmit and handleInputKeyDown now pass `deepMode`
  // so that typing a question in the text box also uses the full PDF when enabled.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const question = input
    setInput('')
    await sendQuestion(question, deepMode)
  }

  const handleInputKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    if (!input.trim() || loadingChat) return
    const question = input
    setInput('')
    await sendQuestion(question, deepMode)
  }

  const handleClearChat = () => {
    if (!paper) return
    clearPersistedChat(paper.id)
    setMessages([])
  }

  if (loadingOptions || loadingPaper) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Chat with Paper</h1>
        <ChatMessageSkeleton />
      </div>
    )
  }

  if (!paper && paperOptions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Chat with Paper</h1>
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No bookmarked papers. Bookmark a paper first.</p>
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Chat with Paper</h1>
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Paper not found. Try selecting another paper.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Chat with Paper</h1>
        <p className="text-muted-foreground">AI research assistant specialized for this paper</p>
      </div>

      <div className="w-full max-w-md">
        <Select value={selectedPaperId} onValueChange={setSelectedPaperId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a paper..." />
          </SelectTrigger>
          <SelectContent>
            {paperOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col min-h-[680px]">
          <div className="p-4 border-b border-border flex flex-wrap gap-2 items-center">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.deep ? 'default' : 'outline'}
                className="text-xs"
                onClick={() => void sendQuestion(action.prompt, Boolean(action.deep) || deepMode)}
                disabled={loadingChat}
              >
                {action.label}
              </Button>
            ))}

            {/* FIX #3 (continued): Deep Mode toggle button. When ON (default), every
                question — typed or clicked — will use the full PDF via RAG.
                When OFF, only the abstract is sent (faster, uses no FastAPI). */}
            <Button
              size="sm"
              variant={deepMode ? 'default' : 'outline'}
              className="text-xs ml-auto gap-1.5"
              onClick={() => setDeepMode((prev) => !prev)}
              title={deepMode ? 'Full PDF mode is ON — click to use abstract only' : 'Abstract mode — click to enable full PDF'}
            >
              <Zap size={12} />
              {deepMode ? 'Full PDF: ON' : 'Full PDF: OFF'}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* RAG Pipeline Status Banner */}
            {ingestionStatus !== 'ready' && ingestionStatus !== 'not_ingested' && (
              <div className="mx-2 mb-3 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span>
                  Preparing paper for AI chat&nbsp;—&nbsp;
                  <span className="font-medium capitalize">{ingestionStatus.replace(/_/g, ' ')}</span>
                  &hellip;
                </span>
              </div>
            )}
            {ingestionStatus === 'failed' && (
              <div className="mx-2 mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                ⚠ Paper ingestion failed. Chat will use legacy PDF extraction.
              </div>
            )}
            {ingestionStatus === 'ready' && backendPaperId && (
              <div className="mx-2 mb-3 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                ✓ Paper indexed — using persistent RAG with citations.
              </div>
            )}
            {backendStatus === 'abstract_only' && deepMode && (
              <div className="mx-2 mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                <strong>⚠ AI Backend Offline</strong> — The FastAPI server is not running.
                Answers are based on the abstract only, not the full PDF.
                Start the backend with <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">uvicorn main:app --reload</code> for full-paper answers.
              </div>
            )}

            {backendStatus === 'full_text' && (
              <div className="mx-2 mb-3 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
                ℹ Using full PDF text (RAG index not ready yet — answers may be slower to load on first query).
              </div>
            )}

            {backendStatus === 'rag' && (
              <div className="mx-2 mb-3 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                ✓ Using full PDF with smart retrieval (RAG active).
              </div>
            )}

            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Start by asking a question about this paper.</p>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>

                  {message.role === 'assistant' && (
                    <div className="mt-3 space-y-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => void navigator.clipboard.writeText(message.content)}
                      >
                        <Copy size={12} className="mr-1" />
                        Copy
                      </Button>

                      {/* Citations from new RAG pipeline */}
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {message.citations.map((citation) => (
                              <button
                                key={citation.chunk_id}
                                onClick={() =>
                                  setExpandedCitationId((prev) =>
                                    prev === citation.chunk_id ? null : citation.chunk_id
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground hover:bg-muted transition-colors"
                                title={citation.snippet}
                              >
                                <span className="font-medium">p.{citation.page}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="max-w-[120px] truncate">{citation.section}</span>
                              </button>
                            ))}
                          </div>
                          {/* Expanded snippet preview */}
                          {message.citations.map((citation) =>
                            expandedCitationId === citation.chunk_id ? (
                              <div
                                key={`expanded-${citation.chunk_id}`}
                                className="mt-1 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
                              >
                                <span className="font-medium block mb-1">
                                  {citation.section} — Page {citation.page}
                                </span>
                                {citation.snippet}…
                              </div>
                            ) : null
                          )}
                        </div>
                      )}

                      {message.followUps && message.followUps.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium">Suggested Questions:</p>
                          <div className="flex max-w-full flex-wrap gap-2">
                            {message.followUps.map((followUp) => (
                              <Button
                                key={followUp}
                                size="sm"
                                variant="outline"
                                className="h-auto max-w-full whitespace-normal break-words py-1 text-left text-xs"
                                // FIX #3 (continued): Follow-up questions now also respect deepMode.
                                // Previously these always called sendQuestion(followUp) with no deep mode,
                                // so clicking a suggested question would only use the abstract.
                                onClick={() => void sendQuestion(followUp, deepMode)}
                                disabled={loadingChat}
                              >
                                {followUp}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loadingChat && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {deepMode ? 'Connecting to AI backend...' : 'Analyzing abstract...'}
                </p>
                <ChatMessageSkeleton />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="mb-3 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleClearChat} disabled={loadingChat}>
                Clear Chat
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                rows={1}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.currentTarget.style.height = 'auto'
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
                }}
                onKeyDown={(e) => void handleInputKeyDown(e)}
                placeholder={
                  ingestionStatus !== 'ready' && ingestionStatus !== 'not_ingested' && ingestionStatus !== 'failed'
                    ? `Paper is being prepared (${ingestionStatus})... please wait`
                    : 'Ask about methodology, limitations, applications, comparisons...'
                }
                disabled={loadingChat || (ingestionStatus !== 'ready' && ingestionStatus !== 'not_ingested' && ingestionStatus !== 'failed')}
                className="max-h-52 min-h-10 resize-none"
              />
              <Button type="submit" disabled={loadingChat || !input.trim()}>
                <Send size={16} />
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <h3 className="text-lg font-semibold text-card-foreground">{paper.title}</h3>
            <p className="text-sm text-muted-foreground">{paper.authors.join(', ')}</p>
            <Link href={`/paper/${paper.id}`} className="text-sm text-primary hover:underline">
              Open paper details
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-semibold text-card-foreground">AI Summary</h3>
            </div>
            {loadingSummary ? (
              <p className="text-sm text-muted-foreground">Generating summary...</p>
            ) : aiSummary ? (
              <>
                <p className="line-clamp-9 whitespace-pre-line text-sm text-muted-foreground">{aiSummary}</p>
                <Button size="sm" variant="outline" onClick={() => setSummaryOpen(true)}>
                  Open Summary
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Summary not available.</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <h3 className="font-semibold text-card-foreground">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {loadingInsights ? (
                <p className="text-sm text-muted-foreground">Analyzing papers...</p>
              ) : keywords.length > 0 ? (
                keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-block px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No keywords available.</p>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <h3 className="font-semibold text-card-foreground">Similar Papers</h3>
            {loadingInsights ? (
              <p className="text-sm text-muted-foreground">Analyzing papers...</p>
            ) : selectedUiSimilar.length > 0 ? (
              <ul className="space-y-2">
                {selectedUiSimilar.map((item) => (
                  <li key={item.id}>
                    <Link href={`/paper/${item.id}`} className="text-sm text-primary hover:underline line-clamp-2">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No similar papers found.</p>
            )}
          </div>

          {mlWarning && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
              {mlWarning}
            </div>
          )}
        </aside>
      </div>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Paper Summary</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto rounded-md border border-border bg-secondary/30 p-4">
            <div className="max-h-[300px] overflow-y-auto">
              {aiSummary ? (
                renderMarkdownSummary(aiSummary)
              ) : (
                <p className="text-sm text-muted-foreground">Summary not available.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSummaryOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
