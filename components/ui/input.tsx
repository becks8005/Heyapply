import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius-md)] border bg-[var(--bg-card)] px-3.5 py-2 text-sm text-[var(--text-primary)] transition-all duration-150",
          "placeholder:text-[var(--text-placeholder)]",
          "hover:border-[var(--border-strong)]",
          "focus:outline-none focus:border-[var(--accent-500)] focus:ring-[3px] focus:ring-[rgba(240,249,65,0.15)]",
          "disabled:cursor-not-allowed disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-placeholder)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
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
Input.displayName = "Input"

export { Input }

