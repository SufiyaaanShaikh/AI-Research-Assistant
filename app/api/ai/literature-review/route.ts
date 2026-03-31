import { NextResponse } from 'next/server'

import { generateWithGroq } from '@/lib/groq'

type LiteratureReviewRequest = {
  topic?: string
}

type LiteratureReviewResponse = {
  overview: string
  keyPapersContributions: string
  currentTrends: string
  researchGaps: string
  futureDirections: string
}

function stripCodeFences(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
}

function parseLiteratureReview(text: string): LiteratureReviewResponse {
  const parsed = JSON.parse(stripCodeFences(text)) as Partial<LiteratureReviewResponse>

  return {
    overview: parsed.overview ?? 'N/A',
    keyPapersContributions: parsed.keyPapersContributions ?? 'N/A',
    currentTrends: parsed.currentTrends ?? 'N/A',
    researchGaps: parsed.researchGaps ?? 'N/A',
    futureDirections: parsed.futureDirections ?? 'N/A',
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LiteratureReviewRequest
    const topic = body.topic?.trim()

    if (!topic) {
      return NextResponse.json({ error: 'Missing required field: topic' }, { status: 400 })
    }

    const prompt = `Generate a structured literature review for this research topic: ${topic}.

The output must include:
- Overview
- Key Papers & Contributions
- Current Trends
- Research Gaps
- Future Directions

Return ONLY valid JSON with keys:
overview, keyPapersContributions, currentTrends, researchGaps, futureDirections.`

    const rawReview = await generateWithGroq(prompt)
    const review = parseLiteratureReview(rawReview)

    return NextResponse.json({ review })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json(
      { error: 'Failed to generate literature review', details: message },
      { status: 500 },
    )
  }
}
