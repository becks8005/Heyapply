"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, FileText, Building2, MapPin, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface Application {
  id: string
  jobTitle: string
  company: string
  jobLocation?: string
  status: string
  createdAt: string
  updatedAt: string
  folder?: {
    id: string
    name: string
    color: string
  }
}

type FunnelStatus = "ALL" | "DRAFT" | "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED"

const FunnelStatusLabels: Record<FunnelStatus, string> = {
  ALL: "Alle",
  DRAFT: "Bewerbung erstellt",
  APPLIED: "Beworben",
  INTERVIEW: "Interview",
  OFFER: "Angebot",
  REJECTED: "Absage",
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [funnelStatus, setFunnelStatus] = useState<FunnelStatus>("ALL")

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/applications")
      if (!res.ok) throw new Error("Failed to fetch applications")
      const data = await res.json()
      // Sort by createdAt desc (newest first)
      const sorted = (data.applications || []).sort(
        (a: Application, b: Application) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setApplications(sorted)
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter applications based on search and funnel status
  const filteredApplications = applications.filter((app) => {
    // Filter by funnel status
    if (funnelStatus !== "ALL" && app.status !== funnelStatus) {
      return false
    }

    // Filter by search query (company, job title, location)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesCompany = app.company.toLowerCase().includes(query)
      const matchesJobTitle = app.jobTitle.toLowerCase().includes(query)
      const matchesLocation = app.jobLocation?.toLowerCase().includes(query)
      return matchesCompany || matchesJobTitle || matchesLocation
    }

    return true
  })

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "badge-neutral"
      case "APPLIED":
        return "badge-info"
      case "INTERVIEW":
        return "badge-warning"
      case "OFFER":
        return "badge-success"
      case "REJECTED":
        return "badge-error"
      default:
        return "badge-neutral"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-page-title mb-1">Meine Bewerbungen</h1>
        <p className="text-sm text-[var(--text-muted)]">Verwalte und filtere alle deine Bewerbungen</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        {/* Filter Tabs and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Funnel Status Filter - Tabs */}
          <div className="flex-1 w-full sm:w-auto">
            <div className="flex flex-wrap gap-1">
              {Object.entries(FunnelStatusLabels).map(([value, label]) => {
                const isActive = funnelStatus === value
                return (
                  <button
                    key={value}
                    onClick={() => setFunnelStatus(value as FunnelStatus)}
                    className={cn(
                      "px-4 h-9 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)] focus-visible:ring-offset-2",
                      "text-[var(--text-muted)] bg-transparent",
                      "hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]",
                      isActive
                        ? "bg-[#424727] text-[#DFFF00]"
                        : ""
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto sm:min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-placeholder)]" />
            <Input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-[var(--text-muted)]">
          {filteredApplications.length} von {applications.length} Bewerbungen
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-500)]" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="empty-state card-base">
          <FileText className="empty-state-icon" />
          <p className="empty-state-title">
            {searchQuery || funnelStatus !== "ALL"
              ? "Keine Bewerbungen gefunden"
              : "Noch keine Bewerbungen"}
          </p>
          <p className="empty-state-description">
            {searchQuery || funnelStatus !== "ALL"
              ? "Versuche andere Suchbegriffe oder Filter"
              : "Erstelle deine erste Bewerbung"}
          </p>
          {!searchQuery && funnelStatus === "ALL" && (
            <Link href="/application/new">
              <Button>Neue Bewerbung erstellen</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => (
            <Link
              key={app.id}
              href={`/application/${app.id}`}
              className="block p-4 sm:p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] transition-all duration-150"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0 w-full">
                  {/* Job Title and Company */}
                  <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-card-title truncate mb-1">
                        {app.jobTitle}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--text-muted)] flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium truncate">
                          {app.company}
                        </span>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <span className={cn("flex-shrink-0 text-[10px] sm:text-xs", getStatusBadgeClass(app.status))}>
                      {FunnelStatusLabels[app.status as FunnelStatus] || 
                        (app.status === "ACCEPTED" ? "Angenommen" : app.status)}
                    </span>
                  </div>

                  {/* Location and Dates */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-[var(--text-muted)] mt-2 sm:mt-3">
                    {app.jobLocation && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{app.jobLocation}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Erstellt: {formatDate(app.createdAt)}</span>
                    </div>
                    {app.folder && (
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: app.folder.color }}
                        />
                        <span>{app.folder.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
