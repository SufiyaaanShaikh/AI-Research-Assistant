import { NextRequest, NextResponse } from 'next/server'

import { searchArxiv } from '@/lib/arxiv'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required query parameter: q' },
      { status: 400 },
    )
  }

  try {
    const papers = await searchArxiv(query)
    return NextResponse.json({ papers })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json(
      { error: 'Failed to fetch papers from Arxiv', details: message },
      { status: 500 },
    )
  }
}
