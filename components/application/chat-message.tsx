"use client"

import { Bot, User } from "lucide-react"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? "bg-[var(--accent-500)]" : "bg-[var(--bg-muted)]"
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-[#080808]" />
        ) : (
          <Bot className="h-4 w-4 text-[var(--text-secondary)]" />
        )}
      </div>
      <div className={`flex-1 ${isUser ? "text-right" : ""}`}>
        <div className={`inline-block rounded-lg px-4 py-2 ${
          isUser 
            ? "bg-[var(--accent-500)] text-[#080808]" 
            : "bg-[var(--bg-muted)] text-[var(--text-primary)]"
        }`}>
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
        {timestamp && (
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {new Date(timestamp).toLocaleTimeString("de-CH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  )
}

