import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: 
          "bg-[var(--accent-500)] text-[#080808] hover:bg-[var(--accent-500)]/90 active:bg-[var(--accent-500)]/80 disabled:bg-[var(--border-default)] disabled:text-[var(--text-placeholder)] rounded-[var(--radius-md)]",
        destructive:
          "bg-[var(--error-text)] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] disabled:bg-[var(--border-default)] disabled:text-[var(--text-placeholder)] rounded-[var(--radius-md)]",
        outline:
          "border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] hover:border-[var(--border-strong)] active:bg-[var(--bg-hover)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-placeholder)] rounded-[var(--radius-md)]",
        secondary:
          "bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] hover:border-[var(--border-strong)] active:bg-[var(--bg-hover)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-placeholder)] rounded-[var(--radius-md)]",
        ghost: 
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:bg-[var(--bg-muted)] disabled:text-[var(--text-placeholder)] rounded-[var(--radius-md)]",
        link: 
          "text-[var(--accent-500)] underline-offset-4 hover:underline hover:text-[var(--accent-500)]/80 disabled:text-[var(--text-placeholder)]",
        "destructive-ghost":
          "bg-transparent text-[var(--error-text)] hover:bg-[var(--error-bg)] active:bg-[var(--error-bg)] disabled:text-[var(--text-placeholder)] rounded-[var(--radius-md)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

