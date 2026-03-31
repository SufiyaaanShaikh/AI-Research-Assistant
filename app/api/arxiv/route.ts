import { NextRequest, NextResponse } from 'next/server'

const ARXIV_BASE_URL = 'https://export.arxiv.org/api/query'

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i += 1) {
    const response = await fetch(url, {
      headers: { Accept: 'application/atom+xml' },
      cache: 'no-store',
    })

    if (response.status !== 429) {
      return response
    }

    const delay = 2 ** i * 1000
    await wait(delay)
  }

  throw new Error('arXiv API rate limit exceeded after retries')
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim()

  if (!id) {
    return NextResponse.json({ error: 'Missing id query parameter' }, { status: 400 })
  }

  const upstreamUrl = `${ARXIV_BASE_URL}?id_list=${encodeURIComponent(id)}`

  try {
    const response = await fetchWithRetry(upstreamUrl)
    const text = await response.text()

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': 'application/atom+xml; charset=utf-8',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
