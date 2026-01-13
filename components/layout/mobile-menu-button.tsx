"use client"

import { PanelLeft } from "lucide-react"
import { useSidebarStore } from "@/stores/sidebar-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function MobileMenuButton() {
  const { toggle } = useSidebarStore()
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      className={cn(
        "h-10 w-10 rounded-[var(--radius-md)]",
        "bg-[var(--bg-card)] border-[var(--border-default)]",
        "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
        "shadow-[var(--shadow-md)]",
        "lg:hidden"
      )}
      aria-label="Menü öffnen"
      data-sidebar-toggle
    >
      <PanelLeft size={20} strokeWidth={1.5} />
    </Button>
  )
}
