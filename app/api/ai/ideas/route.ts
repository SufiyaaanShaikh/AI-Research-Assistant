import { NextResponse } from 'next/server'

import { generateWithGroq } from '@/lib/groq'
import type { ResearchIdea } from '@/lib/types'

type IdeasRequest = {
  topic?: string
}

type IdeaPayload = {
  title?: string
  problemStatement?: string
  proposedMethod?: string
  dataset?: string
  potentialImpact?: string
}

function stripCodeFences(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
}

function parseIdeas(text: string): ResearchIdea[] {
  const normalized = stripCodeFences(text)
  const parsed = JSON.parse(normalized) as IdeaPayload[]

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid ideas format from Groq')
  }

  return parsed.slice(0, 4).map((idea, index) => ({
    id: String(index + 1),
    topic: idea.title?.trim() || `Idea ${index + 1}`,
    description: idea.problemStatement?.trim() || 'N/A',
    dataset: idea.dataset?.trim() || 'Not specified',
    methodology: idea.proposedMethod?.trim() || 'Not specified',
    potentialImpact: idea.potentialImpact?.trim() || 'Not specified',
    relatedFields: [idea.title?.trim() || 'General'],
  }))
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IdeasRequest
    const topic = body.topic?.trim()

    if (!topic) {
      return NextResponse.json({ error: 'Missing required field: topic' }, { status: 400 })
    }

    const prompt = `Generate 4 innovative research ideas about the topic below.

Each idea must contain:

Title
Problem Statement
Proposed Method
Dataset (if applicable)
Potential Impact

Topic:
${topic}

Return ONLY valid JSON as an array of objects with keys:
title, problemStatement, proposedMethod, dataset, potentialImpact.`

    const rawIdeas = await generateWithGroq(prompt)
    const ideas = parseIdeas(rawIdeas)

    return NextResponse.json({ ideas })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json(
      { error: 'Failed to generate research ideas', details: message },
      { status: 500 },
    )
  }
}
