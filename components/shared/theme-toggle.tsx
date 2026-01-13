"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  isSidebarOpen?: boolean
}

export function ThemeToggle({ className, isSidebarOpen = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className={cn(
          "group relative flex items-center rounded-[var(--radius-md)] transition-all duration-150",
          isSidebarOpen ? "gap-3 px-3 h-10 w-full" : "justify-center h-10 w-10 mx-auto",
          "text-[var(--text-secondary)]",
          className
        )}
        aria-label="Theme umschalten"
      >
        <Sun size={20} strokeWidth={1.5} className="flex-shrink-0" />
      </button>
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative flex items-center rounded-[var(--radius-md)] transition-all duration-150",
        isSidebarOpen ? "gap-3 px-3 h-10 w-full" : "justify-center h-10 w-10 mx-auto",
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)] focus-visible:ring-offset-2",
        className
      )}
      aria-label={isDark ? "Zu Light Mode wechseln" : "Zu Dark Mode wechseln"}
    >
      {isDark ? (
        <Sun size={20} strokeWidth={1.5} className="flex-shrink-0" />
      ) : (
        <Moon size={20} strokeWidth={1.5} className="flex-shrink-0" />
      )}
      {isSidebarOpen && (
        <span className="text-sm font-normal">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
      
      {/* Tooltip for collapsed state */}
      {!isSidebarOpen && (
        <div className={cn(
          "absolute left-full ml-2 px-2.5 py-1.5 rounded-[var(--radius-md)]",
          "bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm whitespace-nowrap",
          "opacity-0 pointer-events-none group-hover:opacity-100",
          "transition-opacity duration-150 z-50",
          "shadow-[var(--shadow-md)]"
        )}>
          {isDark ? "Zu Light Mode wechseln" : "Zu Dark Mode wechseln"}
        </div>
      )}
    </button>
  )
}