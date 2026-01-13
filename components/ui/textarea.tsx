import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-[var(--radius-md)] border bg-[var(--bg-card)] px-3.5 py-3 text-sm text-[var(--text-primary)] transition-all duration-150 resize-y",
          "placeholder:text-[var(--text-placeholder)]",
          "hover:border-[var(--border-strong)]",
          "focus:outline-none focus:border-[var(--accent-500)] focus:ring-[3px] focus:ring-[rgba(240,249,65,0.15)]",
          "disabled:cursor-not-allowed disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-placeholder)]",
          error 
            ? "border-[var(--error-text)] focus:border-[var(--error-text)] focus:ring-[rgba(220,38,38,0.1)]" 
            : "border-[var(--border-default)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

