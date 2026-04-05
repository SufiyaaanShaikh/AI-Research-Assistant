import { NextResponse } from 'next/server'

import { generateWithGroq } from '@/lib/groq'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatPaperRequest = {
  paper_context?: string
  chat_history?: ChatMessage[]
  user_question?: string
  pdf_url?: string
  deep_mode?: boolean
}

type RagChunk = {
  text?: string
  chunk_text?: string
  section?: string
  page?: number
  score?: number
}

type ChatResponsePayload = {
  answer: string
  followUpQuestions: string[]
}

// FIX #4: Added a two-tier context strategy for deep mode:
//   Tier 1 — RAG query (/rag-query): Returns semantically ranked chunks, best
//             for targeted questions. Used first.
//   Tier 2 — Full text extract (/extract-pdf-text): Returns the whole PDF as
//             plain text (capped at 80K chars to stay within Groq's context
//             window). Used as fallback when the RAG endpoint is unavailable or
//             returns empty chunks.
// Previously, a failed RAG call silently fell back to only the abstract, which
// is why the AI said "The paper does not provide Table 1" — it literally never
// saw that section. Now when RAG fails, the full text is tried next.
const ML_API_BASE = 'http://localhost:8000'
const FULL_TEXT_CHAR_LIMIT = 80_000

function stripCodeFences(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
}

function parseChatResponse(text: string): ChatResponsePayload {
  const cleaned = stripCodeFences(text)
  try {
    const parsed = JSON.parse(cleaned) as Partial<ChatResponsePayload>
    return {
      answer: parsed.answer?.trim() || 'No answer generated.',
      followUpQuestions: (parsed.followUpQuestions ?? []).slice(0, 3),
    }
  } catch {
    const answerMatch = cleaned.match(/"answer"\s*:\s*"([\s\S]*?)"/)
    const extractedAnswer = answerMatch?.[1]?.replace(/\\"/g, '"').trim()
    return {
      answer: extractedAnswer || 'No answer generated.',
      followUpQuestions: [],
    }
  }
}

async function fetchRagChunks(pdfUrl: string, question: string): Promise<RagChunk[]> {
  try {
    const ragResponse = await fetch(`${ML_API_BASE}/rag-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_url: pdfUrl, question }),
    })
    console.log('RAG query response status:', ragResponse.status)
    if (!ragResponse.ok) return []
    const ragData = (await ragResponse.json()) as { context_chunks?: RagChunk[] }
    return ragData.context_chunks ?? []
  } catch (err) {
    console.warn('RAG endpoint unavailable:', err)
    return []
  }
}

async function fetchFullText(pdfUrl: string): Promise<string> {
  try {
    const textResponse = await fetch(`${ML_API_BASE}/extract-pdf-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_url: pdfUrl }),
    })
    if (!textResponse.ok) return ''
    const textData = (await textResponse.json()) as { text?: string }
    return (textData.text ?? '').slice(0, FULL_TEXT_CHAR_LIMIT)
  } catch (err) {
    console.warn('Full text endpoint unavailable:', err)
    return ''
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatPaperRequest
    const rawPaperContext = body.paper_context?.trim()
    const userQuestion = body.user_question?.trim()
    const pdfUrl = body.pdf_url?.trim()
    const deepMode = Boolean(body.deep_mode)
    const history = body.chat_history ?? []

    if (!rawPaperContext || !userQuestion) {
      return NextResponse.json(
        { error: 'Missing required fields: paper_context and user_question' },
        { status: 400 },
      )
    }

    const metadataContext = rawPaperContext
    let contextText = ''

    if (deepMode && pdfUrl) {
      // Tier 1: Try RAG (semantically ranked chunks — best for targeted questions)
      const ragChunks = await fetchRagChunks(pdfUrl, userQuestion)
      console.log('RAG RAW RESPONSE:', ragChunks)
      console.log('RAG chunks returned:', ragChunks.length)

      if (ragChunks.length > 0) {
        contextText = ragChunks
          .map(
            (chunk, index) =>
              `[Excerpt ${index + 1}]\nSection: ${chunk.section ?? 'Unknown'}\nPage: ${chunk.page ?? 'Unknown'}\n\n${chunk.text ?? chunk.chunk_text ?? ''}`,
          )
          .join('\n\n')
        console.log('Using RAG context, length:', contextText.length)
      } else {
        // Tier 2: RAG returned nothing — fall back to full PDF text extract.
        // This handles the common case where FastAPI is running but the RAG
        // pipeline returns 0 chunks (e.g. embedding model not yet loaded),
        // as well as when /rag-query is temporarily unavailable.
        console.log('RAG returned 0 chunks, falling back to full text extraction...')
        contextText = await fetchFullText(pdfUrl)
        if (contextText) {
          console.log('Using full text context, length:', contextText.length)
        } else {
          console.log('Full text also unavailable, falling back to abstract metadata')
        }
      }
    }

    // Final fallback: if both RAG and full-text extraction failed or deep mode is
    // off, use the paper metadata (title + abstract + keywords) that was passed in.
    if (!contextText.trim()) {
      contextText = metadataContext
    }

    console.log('CONTEXT PREVIEW:', contextText.slice(0, 500))
    console.log('Context length:', contextText.length)

    const historyText = history
      .slice(-20)
      .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
      .join('\n')

    const prompt = `You are an academic research assistant.

You are given excerpts from a research paper.

Your job is to answer the user question using these excerpts.

Rules:

1. Always prioritize information from tables, figures, and experiment sections.
2. If the question references results or benchmarks, analyze the table values carefully.
3. Combine multiple excerpts when necessary.
4. Only say information is missing if the paper truly does not contain it.

Paper excerpts:
${contextText}

Chat history:
${historyText || 'No prior history'}

User question:
${userQuestion}

Return STRICT JSON:
{
 "answer": "clear academic explanation",
 "followUpQuestions": [
  "follow up question 1",
  "follow up question 2",
  "follow up question 3"
 ]
}`

    const rawResponse = await generateWithGroq(prompt)
    const response = parseChatResponse(rawResponse)

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({
      answer: 'Sorry, something went wrong while analyzing the paper.',
      followUpQuestions: [],
    })
  }
}