'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IdeaCard } from '@/components/cards/idea-card'
import { ResearchIdea } from '@/lib/types'
import { Zap } from 'lucide-react'
import { IdeaCardSkeleton } from '@/components/skeletons/content-skeleton'
import { toast } from 'sonner'

export default function ResearchIdeasPage() {
  const [topic, setTopic] = useState('')
  const [ideas, setIdeas] = useState<ResearchIdea[]>([])
  const [loading, setLoading] = useState(false)

  const handleGenerateIdeas = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)

    try {
      const res = await fetch('/api/ai/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      })

      const data = (await res.json()) as { ideas?: ResearchIdea[]; error?: string }

      if (!res.ok || !data.ideas) {
        throw new Error(data.error || 'Failed to generate ideas')
      }

      setIdeas(data.ideas)
    } catch {
      setIdeas([])
      toast.error('AI generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyIdea = (idea: ResearchIdea) => {
    const ideaText = `
Topic: ${idea.topic}
Description: ${idea.description}
Dataset: ${idea.dataset}
Methodology: ${idea.methodology}
Potential Impact: ${idea.potentialImpact}
Related Fields: ${idea.relatedFields.join(', ')}
    `.trim()
    navigator.clipboard.writeText(ideaText)
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Research Ideas Generator
        </h1>
        <p className="text-muted-foreground">
          Generate innovative research ideas and proposals powered by AI
        </p>
      </div>

      {/* Topic Input */}
      <form onSubmit={handleGenerateIdeas} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Research Topic
          </label>
          <div className="flex gap-2 max-w-2xl">
            <Input
              type="text"
              placeholder="e.g., Machine Learning, Climate Science, Biomedical Engineering..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <Button
              type="submit"
              disabled={loading || !topic.trim()}
              className="gap-2 whitespace-nowrap"
            >
              <Zap size={16} />
              Generate
            </Button>
          </div>
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Generating ideas...</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <IdeaCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      {topic && !loading && ideas.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Generated ideas for: <span className="font-semibold text-foreground">"{topic}"</span>
        </div>
      )}

      {/* Ideas Grid */}
      {!loading && (
        <div>
          {ideas.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-4">Generated Ideas</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {ideas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onCopy={handleCopyIdea}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="bg-card border border-border rounded-lg p-10 text-center">
              <p className="text-muted-foreground">
                Enter a topic and click Generate to create research ideas.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
