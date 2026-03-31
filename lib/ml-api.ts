const ML_API_BASE_URL = 'http://localhost:8000'

export type MLPaper = {
  id: string
  title: string
  summary: string
}

type SimilarResponse = {
  similar: MLPaper[]
}

type KeywordsResponse = {
  keywords: string[]
}

type ClustersResponse = {
  clusters: Record<string, MLPaper[]>
}

type PDFTextResponse = {
  text: string
}

async function postJson<TResponse>(path: string, payload: unknown): Promise<TResponse> {
  const response = await fetch(`${ML_API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`ML API request failed: ${response.status}`)
  }

  return response.json() as Promise<TResponse>
}

export async function getSimilarPapers(targetPaper: MLPaper, papers: MLPaper[]): Promise<MLPaper[]> {
  const data = await postJson<SimilarResponse>('/similar-papers', {
    target_paper: targetPaper,
    papers,
  })
  return data.similar ?? []
}

export async function extractKeywords(text: string): Promise<string[]> {
  const data = await postJson<KeywordsResponse>('/keywords', { text })
  return data.keywords ?? []
}

export async function clusterPapers(papers: MLPaper[]): Promise<Record<string, MLPaper[]>> {
  const data = await postJson<ClustersResponse>('/cluster-papers', { papers })
  return data.clusters ?? {}
}

export async function extractFullPaperText(pdfUrl: string): Promise<string> {
  const data = await postJson<PDFTextResponse>('/extract-pdf-text', { pdf_url: pdfUrl })
  return data.text ?? ''
}
