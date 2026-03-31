import { NextResponse } from 'next/server'

import { generateWithGroq } from '@/lib/groq'

type SummarizeRequest = {
  title?: string
  summary?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SummarizeRequest
    const title = body.title?.trim()
    const summary = body.summary?.trim()

    if (!title || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields: title and summary' },
        { status: 400 },
      )
    }

    const prompt = `Summarize the following research paper in a structured format.

Sections:
Overview
Key Contributions
Methodology
Results
Limitations

Paper Title:
${title}

Abstract:
${summary}`

    const generatedSummary = await generateWithGroq(prompt)
    return NextResponse.json({ summary: generatedSummary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json(
      { error: 'Failed to generate summary', details: message },
      { status: 500 },
    )
  }
}
