'use client'

import { ResearchIdea } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

interface IdeaCardProps {
  idea: ResearchIdea
  onCopy?: (idea: ResearchIdea) => void
}

export function IdeaCard({ idea, onCopy }: IdeaCardProps) {
  const handleCopy = () => {
    const text = `${idea.topic}\n\n${idea.description}`
    navigator.clipboard.writeText(text)
    toast.success('Idea copied to clipboard')
    onCopy?.(idea)
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {idea.topic}
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {idea.description}
        </p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Dataset</p>
            <p className="text-xs text-card-foreground">{idea.dataset}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Methodology</p>
            <p className="text-xs text-card-foreground">{idea.methodology}</p>
          </div>
        </div>

        {/* Impact */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Potential Impact</p>
          <p className="text-xs text-card-foreground">{idea.potentialImpact}</p>
        </div>

        {/* Related Fields */}
        <div className="flex flex-wrap gap-2 pt-2">
          {idea.relatedFields.map((field) => (
            <span
              key={field}
              className="inline-block px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
            >
              {field}
            </span>
          ))}
        </div>

        {/* Action */}
        <div className="pt-2">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-center gap-2 hover:bg-secondary"
            onClick={handleCopy}
          >
            <Copy size={14} />
            Copy Idea
          </Button>
        </div>
      </div>
    </div>
  )
}
