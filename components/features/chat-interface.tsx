'use client'

import { useState } from 'react'
import { ChatMessage } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  loading?: boolean
}

export function ChatInterface({ messages, onSendMessage, loading }: ChatInterfaceProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-muted-foreground">Start a conversation...</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask about the paper..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button 
            type="submit" 
            disabled={loading || !input.trim()}
            size="sm"
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
    </div>
  )
}
