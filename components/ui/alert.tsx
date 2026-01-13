import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-[var(--radius-lg)] border p-4 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-5 [&>svg]:w-5",
  {
    variants: {
      variant: {
        default: "bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-primary)] [&>svg]:text-[var(--text-muted)]",
        success: "bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)] [&>svg]:text-[var(--success-text)]",
        warning: "bg-[var(--warning-bg)] border-[var(--warning-border)] text-[var(--warning-text)] [&>svg]:text-[var(--warning-text)]",
        destructive: "bg-[var(--error-bg)] border-[var(--error-border)] text-[var(--error-text)] [&>svg]:text-[var(--error-text)]",
        info: "bg-[var(--info-bg)] border-[var(--info-border)] text-[var(--info-text)] [&>svg]:text-[var(--info-text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-tight text-[14px]", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm leading-relaxed [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

