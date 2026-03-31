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
    let ragChunks: RagChunk[] = []
    if (deepMode && pdfUrl) {
      try {
        const ragResponse = await fetch('http://localhost:8000/rag-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdf_url: pdfUrl, question: userQuestion }),
        })
        console.log('RAG query response status:', ragResponse.status)
        if (ragResponse.ok) {
          const ragData = (await ragResponse.json()) as { context_chunks?: RagChunk[] }
          ragChunks = ragData.context_chunks ?? []
        }
      } catch {
        // Fall back to non-RAG context on FastAPI/network errors.
      }
    }
    console.log("RAG RAW RESPONSE:", ragChunks)
    let contextText = ragChunks
      .map(
        (chunk, index) =>
          `[Excerpt ${index + 1}]
Section: ${chunk.section ?? 'Unknown'}
Page: ${chunk.page ?? 'Unknown'}

${chunk.text ?? chunk.chunk_text ?? ''}`,
      )
      .join('\n\n')

    if (!contextText.trim()) {
      contextText = metadataContext
    }
    console.log("CONTEXT PREVIEW:", contextText.slice(0, 500))
    console.log('RAG chunks returned:', ragChunks.length)
    console.log('Context length:', contextText.length)
    console.log("CHUNK TEXT FIELD:", ragChunks[0]?.text)
    console.log("CHUNK CHUNK_TEXT FIELD:", ragChunks[0]?.chunk_text)
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
