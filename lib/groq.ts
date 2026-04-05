const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

type GroqOptions = {
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

export async function generateWithGroq(
  prompt: string,
  options: GroqOptions = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  const { systemPrompt, maxTokens, temperature } = options

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens ?? 2048,
      temperature: temperature ?? 0.1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq API request failed: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as GroqResponse
  const text = data.choices?.[0]?.message?.content?.trim()

  if (!text) {
    throw new Error('Groq API returned an empty response')
  }

  return text
}
