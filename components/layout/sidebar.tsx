"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  Plus, 
  LayoutDashboard,
  User, 
  Settings,
  CreditCard,
  LogOut,
  PanelLeft,
  FileText,
  X,
  Briefcase
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/stores/sidebar-store"
import { signOut, useSession } from "next-auth/react"
import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle, setOpen } = useSidebarStore()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
      // On mobile, close sidebar by default
      if (window.innerWidth < 1024) {
        setOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [setOpen])

  // Keyboard shortcut: ⌘. to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault()
        toggle()
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggle])
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile || !isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('aside') && !target.closest('[data-sidebar-toggle]')) {
        setOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, isOpen, setOpen])
  
  const navItems = [
    { 
      href: "/application/new", 
      icon: Plus, 
      label: "Neue Bewerbung",
      highlight: true 
    },
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/applications", icon: FileText, label: "Meine Bewerbungen" },
    { href: "/jobs", icon: Briefcase, label: "Entdeckte Jobs" },
    { href: "/profile", icon: User, label: "Profil" },
    { href: "/settings", icon: Settings, label: "Einstellungen" },
    { href: "/settings/billing", icon: CreditCard, label: "Abo & Zahlung" },
  ]

  // Get user initials
  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <aside className="w-[52px] lg:w-[52px] h-full bg-[var(--bg-sidebar)] flex flex-col border-r border-[var(--border-default)]">
        <div className="h-full" />
      </aside>
    )
  }
  
  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          "h-full bg-[var(--bg-sidebar)] flex flex-col relative border-r border-[var(--border-default)]",
          "transition-all duration-200 ease-out",
          // Mobile: fixed overlay with full width
          isMobile && "fixed left-0 top-0 z-50 shadow-[var(--shadow-lg)] w-[260px]",
          isMobile && (isOpen ? "translate-x-0" : "-translate-x-full"),
          // Desktop: inline with width transition
          !isMobile && "relative",
          !isMobile && (isOpen ? "w-[260px]" : "w-[52px]")
        )}
      >
        {/* Toggle Button */}
        <div className="p-2 flex items-center justify-between">
          <button
            onClick={toggle}
            className={cn(
              "group relative",
              "h-10 w-10 rounded-[var(--radius-md)]",
              "flex items-center justify-center",
              "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
              "transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)] focus-visible:ring-offset-2"
            )}
            aria-label={isOpen ? "Seitenleiste schließen" : "Seitenleiste öffnen"}
            data-sidebar-toggle
          >
            {isMobile ? (
              <X size={20} strokeWidth={1.5} />
            ) : (
              <PanelLeft size={20} strokeWidth={1.5} />
            )}
            
            {/* Tooltip - only on desktop */}
            {!isMobile && (
              <div className={cn(
                "absolute left-full ml-2 px-2.5 py-1.5 rounded-[var(--radius-md)]",
                "bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm whitespace-nowrap",
                "opacity-0 pointer-events-none group-hover:opacity-100",
                "transition-opacity duration-150",
                "shadow-[var(--shadow-md)]",
                "flex items-center gap-2 z-50"
              )}>
                <span>{isOpen ? "Seitenleiste schließen" : "Seitenleiste öffnen"}</span>
                <kbd className="px-1.5 py-0.5 text-xs rounded bg-[var(--bg-muted)] text-[var(--text-secondary)] font-mono">⌘.</kbd>
              </div>
            )}
          </button>
          
          {/* Mobile: Show logo next to close button */}
          {isMobile && isOpen && (
            <Link href="/" className="flex items-center">
              <Logo size="md" />
            </Link>
          )}
        </div>

      {/* Logo - only when expanded on desktop */}
      {isOpen && !isMobile && (
        <div className="px-4 pb-4 pt-1">
          <Link href="/" className="flex items-center">
            <Logo size="md" />
          </Link>
        </div>
      )}
      
      {/* Navigation */}
      <nav className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar",
        isOpen ? "px-3" : "px-1.5"
      )}>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/" 
              ? pathname === "/" 
              : pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center rounded-[var(--radius-md)] transition-all duration-150",
                  isOpen ? "gap-3 px-3 h-10" : "justify-center h-10 w-10 mx-auto",
                  isActive
                    ? "bg-[rgba(240,249,65,0.15)] text-[var(--accent-500)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
                  item.highlight && !isActive && 
                    "bg-[var(--accent-500)] text-[#080808] hover:bg-[var(--accent-500)]/90 hover:text-[#080808]"
                )}
              >
                <item.icon size={20} strokeWidth={1.5} className="flex-shrink-0" />
                {isOpen && (
                  <span className={cn(
                    "text-sm truncate",
                    isActive ? "font-medium" : "font-normal"
                  )}>{item.label}</span>
                )}
                
                {/* Tooltip for collapsed state */}
                {!isOpen && (
                  <div className={cn(
                    "absolute left-full ml-2 px-2.5 py-1.5 rounded-[var(--radius-md)]",
                    "bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm whitespace-nowrap",
                    "opacity-0 pointer-events-none group-hover:opacity-100",
                    "transition-opacity duration-150 z-50",
                    "shadow-[var(--shadow-md)]"
                  )}>
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
      
      {/* Theme Toggle */}
      <div className={cn(
        "border-t border-[var(--border-default)]",
        isOpen ? "p-3" : "p-2"
      )}>
        <ThemeToggle isSidebarOpen={isOpen} />
      </div>

      {/* User Profile & Logout */}
      <div className={cn(
        "border-t border-[var(--border-default)]",
        isOpen ? "p-3" : "p-2"
      )}>
        {/* Logout Button */}
        <button
          onClick={() => signOut()}
          className={cn(
            "group relative w-full flex items-center rounded-[var(--radius-md)] transition-all duration-150",
            isOpen ? "gap-3 px-3 h-10" : "justify-center h-10 w-10 mx-auto",
            "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          )}
        >
          <LogOut size={20} strokeWidth={1.5} className="flex-shrink-0" />
          {isOpen && (
            <span className="text-sm font-normal">Abmelden</span>
          )}
          
          {/* Tooltip for collapsed state */}
          {!isOpen && (
            <div className={cn(
              "absolute left-full ml-2 px-2.5 py-1.5 rounded-[var(--radius-md)]",
              "bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm whitespace-nowrap",
              "opacity-0 pointer-events-none group-hover:opacity-100",
              "transition-opacity duration-150 z-50",
              "shadow-[var(--shadow-md)]"
            )}>
              Abmelden
            </div>
          )}
        </button>

        {/* User Avatar */}
        <div className={cn(
          "mt-2 flex items-center rounded-[var(--radius-md)]",
          isOpen ? "gap-3 px-3 py-2" : "justify-center py-2"
        )}>
          <div className={cn(
            "flex items-center justify-center rounded-full bg-[var(--accent-100)] text-[var(--accent-700)] font-semibold text-sm",
            "w-8 h-8 flex-shrink-0"
          )}>
            {userInitials}
          </div>
          {isOpen && session?.user?.name && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                {session.user.name}
              </span>
              <span className="text-xs text-[var(--text-muted)]">Pro-Plan</span>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  )
}
