import { NextResponse } from 'next/server'

import { generateWithGroq } from '@/lib/groq'

type CompareInputPaper = {
  title?: string
  summary?: string
}

type CompareRequest = {
  papers?: CompareInputPaper[]
  paper1?: CompareInputPaper
  paper2?: CompareInputPaper
}

type ComparisonRow = {
  title: string
  objective: string
  method: string
  strengths: string
  weaknesses: string
  useCases: string
}

function stripCodeFences(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
}

function parseComparisonRows(text: string): ComparisonRow[] {
  const parsed = JSON.parse(stripCodeFences(text)) as ComparisonRow[]
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid comparison format from Groq')
  }

  return parsed.map((row) => ({
    title: row.title ?? 'Unknown',
    objective: row.objective ?? 'N/A',
    method: row.method ?? 'N/A',
    strengths: row.strengths ?? 'N/A',
    weaknesses: row.weaknesses ?? 'N/A',
    useCases: row.useCases ?? 'N/A',
  }))
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompareRequest
    const normalizedPapers = body.papers
      ? body.papers
      : [body.paper1, body.paper2].filter(Boolean) as CompareInputPaper[]

    const validPapers = normalizedPapers.filter(
      (paper): paper is Required<CompareInputPaper> =>
        Boolean(paper?.title?.trim()) && Boolean(paper?.summary?.trim()),
    )

    if (validPapers.length < 2 || validPapers.length > 4) {
      return NextResponse.json(
        { error: 'Provide between 2 and 4 papers with title and summary' },
        { status: 400 },
      )
    }

    const paperBlocks = validPapers
      .map(
        (paper, index) => `Paper ${index + 1}:
Title: ${paper.title}
Abstract: ${paper.summary}`,
      )
      .join('\n\n')

    const prompt = `Compare the following research papers.

For each paper analyze:
Objective
Methodology
Strengths
Weaknesses
Use Cases

Return result as structured comparison.

${paperBlocks}

Return ONLY valid JSON as an array of objects with keys:
title, objective, method, strengths, weaknesses, useCases.`

    const rawComparison = await generateWithGroq(prompt)
    const rows = parseComparisonRows(rawComparison)

    return NextResponse.json({ comparison: rawComparison, rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json(
      { error: 'Failed to generate comparison', details: message },
      { status: 500 },
    )
  }
}
