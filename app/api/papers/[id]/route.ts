import { NextResponse } from 'next/server'

import { getArxivPaperById } from '@/lib/arxiv'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params

  if (!id?.trim()) {
    return NextResponse.json({ error: 'Missing paper id' }, { status: 400 })
  }

  try {
    const paper = await getArxivPaperById(id)

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
    }

    return NextResponse.json({ paper })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json(
      { error: 'Failed to fetch paper from Arxiv', details: message },
      { status: 500 },
    )
  }
}
