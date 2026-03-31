export function ContentSkeleton() {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="h-8 bg-secondary rounded-lg w-3/4 animate-pulse" />
      
      {/* Paragraphs */}
      <div className="space-y-2">
        <div className="h-4 bg-secondary rounded-lg w-full animate-pulse" />
        <div className="h-4 bg-secondary rounded-lg w-5/6 animate-pulse" />
        <div className="h-4 bg-secondary rounded-lg w-4/5 animate-pulse" />
      </div>

      {/* Spacing */}
      <div className="h-6" />

      {/* Content Block */}
      <div className="space-y-3 border-l-4 border-primary pl-4 py-2">
        <div className="h-5 bg-secondary rounded-lg w-1/2 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-secondary rounded-lg w-full animate-pulse" />
          <div className="h-3 bg-secondary rounded-lg w-full animate-pulse" />
          <div className="h-3 bg-secondary rounded-lg w-3/4 animate-pulse" />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-secondary rounded-lg p-4 h-40 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export function PaperCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-3 animate-pulse">
      <div className="h-6 bg-secondary rounded-lg w-5/6" />
      <div className="h-4 bg-secondary rounded-lg w-4/5" />
      <div className="space-y-2">
        <div className="h-3 bg-secondary rounded-lg w-full" />
        <div className="h-3 bg-secondary rounded-lg w-5/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-6 bg-secondary rounded-full w-16" />
        <div className="h-6 bg-secondary rounded-full w-16" />
        <div className="h-6 bg-secondary rounded-full w-16" />
      </div>
      <div className="flex justify-between pt-2">
        <div className="h-4 bg-secondary rounded-lg w-24" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-secondary rounded-lg" />
          <div className="h-8 w-8 bg-secondary rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function IdeaCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-secondary rounded-lg w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-secondary rounded-lg w-full" />
        <div className="h-3 bg-secondary rounded-lg w-5/6" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="h-3 bg-secondary rounded-lg w-1/2" />
          <div className="h-3 bg-secondary rounded-lg w-full" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-secondary rounded-lg w-1/2" />
          <div className="h-3 bg-secondary rounded-lg w-full" />
        </div>
      </div>
      <div className="h-8 bg-secondary rounded-lg" />
    </div>
  )
}

export function ChatMessageSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-secondary rounded-lg w-5/6" />
        <div className="h-4 bg-secondary rounded-lg w-4/5" />
        <div className="h-4 bg-secondary rounded-lg w-3/4" />
      </div>
    </div>
  )
}
