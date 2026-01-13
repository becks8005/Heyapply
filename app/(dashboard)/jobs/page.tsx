"use client"

import { useEffect, useState, useRef } from "react"
import { Search, Filter, ExternalLink, CheckCircle2, Eye, Archive, Sparkles, Loader2, X, Wand2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DiscoveredJob {
  id: string
  jobUrl: string
  jobTitle: string
  company: string
  location?: string
  description?: string
  matchScore?: number
  matchReasons?: string
  status: "NEW" | "VIEWED" | "APPLIED" | "ARCHIVED"
  source: "jobs.ch" | "linkedin"
  discoveredAt: string
  applicationId?: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<DiscoveredJob[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [jobTitles, setJobTitles] = useState<string[]>([])
  const [newJobTitle, setNewJobTitle] = useState("")
  const [location, setLocation] = useState("")
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [filter, setFilter] = useState<{
    status?: string
    source?: string
    minScore?: number
  }>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const { toast } = useToast()

  const hasAutoSearchedRef = useRef(false)
  const isAutoSearchingRef = useRef(false)

  useEffect(() => {
    loadJobs()
  }, [filter])

  const loadJobs = async (skipAutoSearch: boolean = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.status) params.set("status", filter.status)
      if (filter.source) params.set("source", filter.source)
      if (filter.minScore) params.set("minScore", filter.minScore.toString())

      const response = await fetch(`/api/job-search/jobs?${params.toString()}`)
      if (!response.ok) throw new Error("Fehler beim Laden der Jobs")

      const data = await response.json()
      const loadedJobs = data.jobs || []
      setJobs(loadedJobs)
      
      
      // Auto-start search if no jobs found and we haven't auto-searched yet
      if (!skipAutoSearch && loadedJobs.length === 0 && !hasAutoSearchedRef.current && !searching && !isAutoSearchingRef.current) {
        hasAutoSearchedRef.current = true // Set synchronously using ref
        isAutoSearchingRef.current = true // Prevent parallel searches
        
        // Auto-start search with AI-generated keywords
        try {
          setSearching(true)
          
          const searchResponse = await fetch("/api/job-search/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              manualJobTitles: undefined,
              manualLocation: undefined,
            }),
          })


          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            toast({
              title: "Suche abgeschlossen",
              description: `${searchData.jobsFound} neue Jobs gefunden`,
            })
            
            // Reload jobs after search
            await loadJobs(true) // Skip auto-search on reload
          } else {
            const errorData = await searchResponse.json().catch(() => ({}))
          }
        } catch (error: any) {
          console.error("Auto-search error:", error)
          // Silently fail - user can manually start search
        } finally {
          setSearching(false)
          isAutoSearchingRef.current = false // Reset flag
        }
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Laden der Jobs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAISuggestions = async () => {
    try {
      setLoadingSuggestions(true)
      
      // First check if we have saved settings
      const settingsResponse = await fetch("/api/job-search/settings")
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        if (settingsData.settings?.keywords?.primary && settingsData.settings.keywords.primary.length > 0) {
          setJobTitles(settingsData.settings.keywords.primary.slice(0, 3))
          if (settingsData.settings.keywords.location) {
            setLocation(settingsData.settings.keywords.location)
          }
          setLoadingSuggestions(false)
          return
        }
      }
      
      // If no saved keywords, trigger a search to generate them (but don't actually search)
      // We'll just use the profile to generate keywords
      const response = await fetch("/api/job-search/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateKeywordsOnly: true }),
      })
      
      if (response.ok) {
        // Reload settings to get generated keywords
        const newSettingsResponse = await fetch("/api/job-search/settings")
        if (newSettingsResponse.ok) {
          const newSettingsData = await newSettingsResponse.json()
          if (newSettingsData.settings?.keywords?.primary) {
            setJobTitles(newSettingsData.settings.keywords.primary.slice(0, 3))
            if (newSettingsData.settings.keywords.location) {
              setLocation(newSettingsData.settings.keywords.location)
            }
          }
        }
      } else {
        throw new Error("Fehler beim Generieren der Vorschläge")
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Laden der Vorschläge",
        variant: "destructive",
      })
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const startSearch = async (manualJobTitles?: string[], manualLocation?: string, showDialog: boolean = false) => {
    try {
      setSearching(true)
      if (showDialog) {
        setShowSearchDialog(false)
      }
      
      const response = await fetch("/api/job-search/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualJobTitles: manualJobTitles || (showDialog ? jobTitles : undefined),
          manualLocation: manualLocation || (showDialog ? location : undefined),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler bei der Job-Suche")
      }

      const data = await response.json()
      toast({
        title: "Suche abgeschlossen",
        description: `${data.jobsFound} neue Jobs gefunden`,
      })

      await loadJobs()
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Fehler bei der Job-Suche",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  const addJobTitle = () => {
    if (newJobTitle.trim() && !jobTitles.includes(newJobTitle.trim())) {
      setJobTitles([...jobTitles, newJobTitle.trim()])
      setNewJobTitle("")
    }
  }

  const removeJobTitle = (title: string) => {
    setJobTitles(jobTitles.filter(t => t !== title))
  }

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const response = await fetch(`/api/job-search/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Fehler beim Aktualisieren")

      await loadJobs()
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const applyToJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/job-search/jobs/${jobId}/apply`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Fehler beim Erstellen der Application")

      const data = await response.json()
      toast({
        title: "Application erstellt",
        description: "Du wirst zur Application weitergeleitet...",
      })

      // Redirect to application
      window.location.href = `/application/${data.application.id}`
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      job.jobTitle.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query)
    )
  })

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      // Scroll to top of jobs section
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500/10 text-blue-500"
      case "VIEWED":
        return "bg-yellow-500/10 text-yellow-500"
      case "APPLIED":
        return "bg-green-500/10 text-green-500"
      case "ARCHIVED":
        return "bg-gray-500/10 text-gray-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NEW":
        return "Neu"
      case "VIEWED":
        return "Angesehen"
      case "APPLIED":
        return "Beworben"
      case "ARCHIVED":
        return "Archiviert"
      default:
        return status
    }
  }

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-500"
    if (score >= 70) return "text-green-500"
    if (score >= 50) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--border-default)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Entdeckte Jobs
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Jobs, die zu deinem Profil passen
            </p>
          </div>
          <Button
            onClick={() => setShowSearchDialog(true)}
            disabled={searching}
            className="bg-[var(--accent-500)] text-[#080808] hover:bg-[var(--accent-500)]/90"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Jobs suchen
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Jobs durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
            />
          </div>

          <select
            value={filter.status || ""}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
          >
            <option value="">Alle Status</option>
            <option value="NEW">Neu</option>
            <option value="VIEWED">Angesehen</option>
            <option value="APPLIED">Beworben</option>
            <option value="ARCHIVED">Archiviert</option>
          </select>

          <select
            value={filter.source || ""}
            onChange={(e) => setFilter({ ...filter, source: e.target.value || undefined })}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
          >
            <option value="">Alle Quellen</option>
            <option value="jobs.ch">jobs.ch</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Sparkles className="h-12 w-12 text-[var(--text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              Keine Jobs gefunden
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Starte eine Suche, um passende Jobs zu finden
            </p>
            <Button
              onClick={() => setShowSearchDialog(true)}
              disabled={searching}
              className="bg-[var(--accent-500)] text-[#080808] hover:bg-[var(--accent-500)]/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Jobs suchen
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {paginatedJobs.map((job) => {
              const matchReasons = job.matchReasons
                ? JSON.parse(job.matchReasons)
                : []
              
              // Helper function to shorten match reasons
              const shortenReason = (reason: string): string => {
                // Remove common prefixes
                let cleaned = reason.replace(/^(?:Starke|Tiefe|Umfangreiche|Massive|Völlig|Keine)\s+/, "")
                
                // Extract degree/education mentions (e.g., "Master of Law (magna cum laude)")
                // Handle both "Master of Law (magna cum laude)" and "Master of Law" separately
                const degreeMatch = cleaned.match(/Master of (?:Law|Science|Arts|Business|Engineering|Computer Science|MBA|Finance|Public Administration|International Relations)(?:\s*\(([^)]+)\))?/i)
                if (degreeMatch) {
                  const fullMatch = degreeMatch[0]
                  // Check if there are honors in parentheses after the degree
                  const honorsMatch = cleaned.match(/Master of [^()]+\(([^)]+)\)/i)
                  const honors = honorsMatch ? ` (${honorsMatch[1]})` : ""
                  
                  // Extract the field name (everything after "of" until parentheses or end)
                  const fieldMatch = fullMatch.match(/of\s+([^(]+)/i)
                  if (fieldMatch) {
                    const field = fieldMatch[1].trim()
                    return `Master ${field}${honors}`
                  }
                  // Fallback: just use the full match
                  return fullMatch + honors
                }
                
                // Alternative: "juristischer Hintergrund mit Master of Law (magna cum laude)"
                const altDegreeMatch = cleaned.match(/mit\s+Master of ([^(]+)(?:\s*\(([^)]+)\))?/i)
                if (altDegreeMatch) {
                  const field = altDegreeMatch[1].trim()
                  const honors = altDegreeMatch[2] ? ` (${altDegreeMatch[2]})` : ""
                  return `Master ${field}${honors}`
                }
                
                // Look for "juristische Ausbildung" or similar educational background
                // Check before degree extraction to prioritize simpler explanation
                const juristischMatch = cleaned.match(/juristisch(?:er|e|en|em)?\s+(?:Hintergrund|Ausbildung|Bildung)/i)
                if (juristischMatch) {
                  return "Juristische Ausbildung"
                }
                
                // Extract years of experience (e.g., "8+ Jahre Erfahrung")
                const expMatch = cleaned.match(/(\d+)\+?\s*Jahre/i)
                if (expMatch) {
                  const years = expMatch[1]
                  // Try to find the domain
                  const domainPatterns = [
                    /(?:Erfahrung|Expertise|Spezialisierung)\s+(?:in|mit)\s+([^,\.]+)/i,
                    /(?:in|mit)\s+([A-Z][^,\.]+(?:Consulting|Management|Development|Engineering|Compliance|Governance|Risk|Finance|Banking))/i,
                  ]
                  for (const pattern of domainPatterns) {
                    const domainMatch = cleaned.match(pattern)
                    if (domainMatch && domainMatch[1].trim().length < 30) {
                      return `${years}+ Jahre ${domainMatch[1].trim()}`
                    }
                  }
                  return `${years}+ Jahre Erfahrung`
                }
                
                // Extract specific skills/technologies (e.g., "Expertise in AML/CTF-Frameworks")
                const skillPatterns = [
                  /(?:Expertise|Erfahrung|Kenntnisse)\s+(?:in|mit|von)\s+(?:der|dem|deren)?\s*([A-Z][^,\.]+)/i,
                  /(?:Starker|Tiefe)\s+([A-Z][^,\.]+)/i,
                ]
                for (const pattern of skillPatterns) {
                  const skillMatch = cleaned.match(pattern)
                  if (skillMatch && skillMatch[1]) {
                    const skill = skillMatch[1].trim()
                    // Skip if too long or contains common filler words
                    if (skill.length < 40 && !skill.match(/^(?:Hintergrund|Fokus|Approach|Expertise|Erfahrung)$/i)) {
                      return skill
                    }
                  }
                }
                
                // Extract key phrases (e.g., "Data-driven Compliance Approach")
                const keyPhraseMatch = cleaned.match(/([A-Z][a-z]+(?:-[a-z]+)?\s+(?:driven|oriented|based|focused|expertise|approach|knowledge|skills|experience))(?:\s+[a-z]+)?/i)
                if (keyPhraseMatch && keyPhraseMatch[1].length < 50) {
                  return keyPhraseMatch[1].trim()
                }
                
                // Extract first meaningful phrase (before first comma, colon, or period)
                const firstPhrase = cleaned.split(/[,:.]/)[0].trim()
                if (firstPhrase.length > 10 && firstPhrase.length < 60) {
                  return firstPhrase
                }
                
                // Fallback: first 50 characters, removing leading non-alphabetic chars
                const truncated = cleaned.substring(0, 50).replace(/^[^A-Za-z]*/, "").trim()
                return truncated + (cleaned.length > 50 ? "..." : "")
              }
              
              return (
                <div
                  key={job.id}
                  className="flex flex-col p-5 rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-[var(--accent-500)]/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2 line-clamp-2">
                          {job.jobTitle}
                        </h3>
                        {job.matchScore !== null && job.matchScore !== undefined && (
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${getScoreColor(
                              job.matchScore
                            )} bg-current/10 mb-2`}
                          >
                            {job.matchScore}% Match
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] mb-3">
                      <span className="font-medium text-[var(--text-primary)]">
                        {job.company}
                      </span>
                      {job.location && (
                        <>
                          <span>•</span>
                          <span>{job.location}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="capitalize">{job.source}</span>
                    </div>
                    
                    {job.description && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-3 mb-3">
                        {job.description.substring(0, 150)}...
                      </p>
                    )}
                    
                    {matchReasons.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-[var(--text-muted)] mb-2">
                          Warum dieser Job passt:
                        </p>
                        <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                          {matchReasons.slice(0, 3).map((reason: string, idx: number) => (
                            <li key={idx} className="line-clamp-2">
                              • {shortenReason(reason)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-[var(--border-default)]">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {getStatusLabel(job.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.status !== "VIEWED" && job.status !== "APPLIED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateJobStatus(job.id, "VIEWED")}
                          className="flex-1 min-w-[100px] text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Angesehen
                        </Button>
                      )}
                      {job.status !== "APPLIED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyToJob(job.id)}
                          className="flex-1 min-w-[100px] text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Bewerben
                        </Button>
                      )}
                      {job.status !== "ARCHIVED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateJobStatus(job.id, "ARCHIVED")}
                          className="flex-1 min-w-[100px] text-xs"
                        >
                          <Archive className="h-3 w-3 mr-1" />
                          Archivieren
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(job.jobUrl, "_blank")}
                        className="flex-1 min-w-[100px] text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Öffnen
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-[var(--border-default)]">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[var(--text-muted)]">
                    Zeige {startIndex + 1}-{Math.min(endIndex, filteredJobs.length)} von {filteredJobs.length} Jobs
                  </span>
                  <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPage" className="text-sm text-[var(--text-muted)]">
                      Pro Seite:
                    </label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                    >
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="text-sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Zurück
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 7) {
                        pageNum = i + 1
                      } else if (currentPage <= 4) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i
                      } else {
                        pageNum = currentPage - 3 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`text-sm min-w-[2.5rem] ${
                            currentPage === pageNum
                              ? "bg-[var(--accent-500)] text-[#080808] hover:bg-[var(--accent-500)]/90"
                              : ""
                          }`}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="text-sm"
                  >
                    Weiter
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Jobs suchen</DialogTitle>
            <DialogDescription>
              Gib Job-Titel und Ort ein, oder lade AI-Vorschläge basierend auf deinem Profil
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Job Titles */}
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
                Job-Titel
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="z.B. Software Engineer"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addJobTitle()
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                />
                <Button
                  onClick={addJobTitle}
                  variant="outline"
                  size="sm"
                  disabled={!newJobTitle.trim()}
                >
                  Hinzufügen
                </Button>
              </div>
              
              {/* Job Title Tags */}
              {jobTitles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {jobTitles.map((title, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)]"
                    >
                      {title}
                      <button
                        onClick={() => removeJobTitle(title)}
                        className="hover:text-[var(--text-muted)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
                Ort
              </label>
              <input
                type="text"
                placeholder="z.B. Zürich oder Schweiz"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
              />
            </div>

            {/* AI Suggestions Button */}
            <Button
              onClick={loadAISuggestions}
              disabled={loadingSuggestions}
              variant="outline"
              className="w-full"
            >
              {loadingSuggestions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lade Vorschläge...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI-Vorschläge basierend auf Profil laden
                </>
              )}
            </Button>

            {/* Search Button */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setShowSearchDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => startSearch(jobTitles.length > 0 ? jobTitles : undefined, location || undefined, true)}
                disabled={searching || (jobTitles.length === 0 && !location)}
                className="flex-1 bg-[var(--accent-500)] text-[#080808] hover:bg-[var(--accent-500)]/90"
              >
                {searching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Suche läuft...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Jobs suchen
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
