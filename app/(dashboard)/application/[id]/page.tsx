"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ChatMessage } from "@/components/application/chat-message"
import { CVArtifact } from "@/components/application/cv-artifact"
import { CVArtifactEditable } from "@/components/application/cv-artifact-editable"
import { CoverLetterArtifact } from "@/components/application/cover-letter-artifact"
import { CVInsightsDisplay } from "@/components/application/cv-insights-display"
import { Loader2, Send, Download, FileText, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface UsageStatus {
  allowed: boolean
  currentCount: number
  limit: number
  remaining: number
  tier: string
  resetDate: Date
}

export default function ApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [application, setApplication] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isGeneratingCV, setIsGeneratingCV] = useState(false)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [showCVConfirmDialog, setShowCVConfirmDialog] = useState(false)
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null)
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"cv" | "cover-letter">("cv")
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Redirect to /application/new if the id is "new"
    if (params.id === "new") {
      router.replace("/application/new")
      return
    }
    fetchApplication()
    fetchUsageStatus()
  }, [params.id, router])

  // Early return if id is "new" to prevent rendering
  if (params.id === "new") {
    return null
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [application?.chatMessages])


  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/application/${params.id}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setApplication(data.application)
    } catch (error) {
      console.error("Error fetching application:", error)
      toast({
        title: "Fehler",
        description: "Bewerbung konnte nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsageStatus = async () => {
    try {
      const res = await fetch("/api/user/usage")
      if (!res.ok) throw new Error("Failed to fetch usage")
      const data = await res.json()
      setUsageStatus(data)
    } catch (error) {
      console.error("Error fetching usage status:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return

    const userMessage = message.trim()
    setMessage("")
    setIsSending(true)

    try {
      const res = await fetch(`/api/application/${params.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!res.ok) throw new Error("Failed to send message")

      const data = await res.json()
      setApplication(data.application)
    } catch (error) {
      console.error("Chat error:", error)
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht gesendet werden",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleGenerateCVClick = () => {
    setShowCVConfirmDialog(true)
  }

  const handleGenerateCV = async () => {
    setShowCVConfirmDialog(false)
    setIsGeneratingCV(true)
    try {
      const res = await fetch(`/api/application/${params.id}/generate-cv`, {
        method: "POST",
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        if (res.status === 403 && errorData.errorCode === "USAGE_LIMIT_EXCEEDED") {
          // Refresh usage status to show updated limit
          await fetchUsageStatus()
          toast({
            title: "Limit erreicht",
            description: errorData.error || "Sie haben Ihr monatliches Limit erreicht.",
            variant: "destructive",
          })
          return
        }
        throw new Error(errorData.error || "Failed to generate CV")
      }

      const data = await res.json()
      setApplication(data.application)
      
      // Refresh usage status after generation
      await fetchUsageStatus()
      
      toast({
        title: "Erfolg",
        description: "CV wurde erfolgreich generiert",
      })
    } catch (error) {
      console.error("CV generation error:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "CV konnte nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingCV(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true)
    try {
      const res = await fetch(`/api/application/${params.id}/generate-cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        if (res.status === 403 && errorData.errorCode === "USAGE_LIMIT_EXCEEDED") {
          // Refresh usage status to show updated limit
          await fetchUsageStatus()
          toast({
            title: "Limit erreicht",
            description: errorData.error || "Sie haben Ihr monatliches Limit erreicht.",
            variant: "destructive",
          })
          return
        }
        throw new Error(errorData.error || "Failed to generate cover letter")
      }

      const data = await res.json()
      setApplication(data.application)
      
      // Refresh usage status after generation
      await fetchUsageStatus()
      
      toast({
        title: "Erfolg",
        description: "Anschreiben wurde erfolgreich generiert",
      })
    } catch (error) {
      console.error("Cover letter generation error:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Anschreiben konnte nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }

  const handleDownloadPDF = async (type: "cv" | "cover-letter") => {
    try {
      const res = await fetch(`/api/application/${params.id}/download-pdf?type=${type}`)
      if (!res.ok) throw new Error("Failed to download PDF")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = type === "cv" 
        ? `CV_${application.user?.firstName || ""}${application.user?.lastName || ""}_${application.company}.pdf`
        : `Anschreiben_${application.user?.firstName || ""}${application.user?.lastName || ""}_${application.company}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Erfolg",
        description: "PDF wurde heruntergeladen",
      })
    } catch (error) {
      console.error("PDF download error:", error)
      toast({
        title: "Fehler",
        description: "PDF konnte nicht heruntergeladen werden",
        variant: "destructive",
      })
    }
  }

  const handleSaveCoverLetter = async (content: string) => {
    try {
      const res = await fetch(`/api/application/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter: content }),
      })

      if (!res.ok) throw new Error("Failed to save cover letter")

      const data = await res.json()
      // Parse the application data like GET route does
      const parsedApplication = {
        ...data.application,
        chatMessages: data.application.chatMessages 
          ? (typeof data.application.chatMessages === 'string' 
              ? JSON.parse(data.application.chatMessages) 
              : data.application.chatMessages)
          : [],
        generatedCv: data.application.generatedCv
          ? (typeof data.application.generatedCv === 'string'
              ? JSON.parse(data.application.generatedCv)
              : data.application.generatedCv)
          : null,
        cvInsights: data.application.cvInsights
          ? (typeof data.application.cvInsights === 'string'
              ? JSON.parse(data.application.cvInsights)
              : data.application.cvInsights)
          : null,
        coverLetterInsights: data.application.coverLetterInsights
          ? (typeof data.application.coverLetterInsights === 'string'
              ? JSON.parse(data.application.coverLetterInsights)
              : data.application.coverLetterInsights)
          : null
      }
      setApplication(parsedApplication)
    } catch (error) {
      console.error("Error saving cover letter:", error)
      toast({
        title: "Fehler",
        description: "Anschreiben konnte nicht gespeichert werden",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleSaveCV = async (cvData: any) => {
    try {
      const res = await fetch(`/api/application/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedCv: JSON.stringify(cvData) }),
      })

      if (!res.ok) throw new Error("Failed to save CV")

      const data = await res.json()
      // Parse the application data like GET route does
      const parsedApplication = {
        ...data.application,
        chatMessages: data.application.chatMessages 
          ? (typeof data.application.chatMessages === 'string' 
              ? JSON.parse(data.application.chatMessages) 
              : data.application.chatMessages)
          : [],
        generatedCv: data.application.generatedCv
          ? (typeof data.application.generatedCv === 'string'
              ? JSON.parse(data.application.generatedCv)
              : data.application.generatedCv)
          : null,
        cvInsights: data.application.cvInsights
          ? (typeof data.application.cvInsights === 'string'
              ? JSON.parse(data.application.cvInsights)
              : data.application.cvInsights)
          : null,
        coverLetterInsights: data.application.coverLetterInsights
          ? (typeof data.application.coverLetterInsights === 'string'
              ? JSON.parse(data.application.coverLetterInsights)
              : data.application.coverLetterInsights)
          : null
      }
      setApplication(parsedApplication)
    } catch (error) {
      console.error("Error saving CV:", error)
      toast({
        title: "Fehler",
        description: "CV konnte nicht gespeichert werden",
        variant: "destructive",
      })
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-[var(--text-muted)]">Bewerbung nicht gefunden</p>
      </div>
    )
  }

  const chatMessages = (application.chatMessages || []) as any[]
  const hasCV = !!application.generatedCv
  const hasCoverLetter = !!application.coverLetter
  // Parse insights if they are JSON strings
  let cvInsights = null
  if (application.cvInsights) {
    try {
      cvInsights = typeof application.cvInsights === 'string' 
        ? JSON.parse(application.cvInsights) 
        : application.cvInsights
    } catch (error) {
      console.error("Error parsing CV insights:", error)
      cvInsights = null
    }
  }
  let coverLetterInsights = null
  if (application.coverLetterInsights) {
    try {
      coverLetterInsights = typeof application.coverLetterInsights === 'string' 
        ? JSON.parse(application.coverLetterInsights) 
        : application.coverLetterInsights
    } catch (error) {
      console.error("Error parsing cover letter insights:", error)
      coverLetterInsights = null
    }
  }
  
  // Determine which insights to show based on active tab
  const currentInsights = activeTab === "cv" ? cvInsights : coverLetterInsights
  // Show insights panel if:
  // - CV tab is active AND CV exists AND has insights, OR
  // - Cover letter tab is active (always show insights panel, even if cover letter not generated yet)
  const showInsights = (activeTab === "cv" && hasCV && cvInsights) || 
                       (activeTab === "cover-letter")

  const formatUsageDisplay = () => {
    if (!usageStatus || usageStatus.tier === "PRO") return null
    
    const remaining = usageStatus.remaining
    const limit = usageStatus.limit
    const bewerbungenText = limit === 1 ? "Bewerbung" : "Bewerbungen"
    
    return `Verfügbar: ${remaining} / ${limit} ${bewerbungenText}`
  }

  const getUsageWarning = () => {
    if (!usageStatus || usageStatus.tier === "PRO") return null
    
    if (usageStatus.remaining === 0) {
      return "Sie haben keine Bewerbungen mehr für diesen Monat übrig."
    }
    
    if (usageStatus.remaining === 1) {
      return "Dies ist Ihre letzte verfügbare Bewerbung für diesen Monat."
    }
    
    return null
  }

  return (
    <>
      <Dialog open={showCVConfirmDialog} onOpenChange={setShowCVConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CV generieren</DialogTitle>
            <DialogDescription>
              Möchten Sie wirklich einen neuen CV generieren?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {usageStatus && usageStatus.tier !== "PRO" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-blue-900">
                      Diese Aktion verbraucht eine Bewerbung
                    </p>
                    <p className="text-sm text-blue-700">
                      {formatUsageDisplay() ? (
                        <>
                          {formatUsageDisplay()} für diesen Monat.
                        </>
                      ) : (
                        "Lade Nutzungsinformationen..."
                      )}
                    </p>
                    {getUsageWarning() && (
                      <p className="text-sm font-medium text-orange-700 mt-2">
                        ⚠️ {getUsageWarning()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCVConfirmDialog(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleGenerateCV} 
              disabled={isGeneratingCV || (usageStatus?.remaining === 0 && usageStatus?.tier !== "PRO")}
            >
              {isGeneratingCV ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                "CV generieren"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-full flex flex-col bg-[#0C0C0C]">
        {/* Header */}
        <div className="border-b bg-[#0C0C0C] border-[var(--border-default)] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{application.jobTitle}</h1>
              <p className="text-[var(--text-secondary)]">{application.company}</p>
            </div>
            <div className="flex items-center gap-4">
              {usageStatus && usageStatus.tier !== "PRO" && (() => {
                const remaining = usageStatus.remaining
                const limit = usageStatus.limit
                const bewerbungenText = limit === 1 ? "Bewerbung" : "Bewerbungen"
                return (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-muted)] px-3 py-1.5 rounded-md border border-[var(--border-default)]">
                    <Info className="h-4 w-4 text-[var(--text-muted)]" />
                    <span>
                      Verfügbar: <span className="font-semibold text-[var(--text-primary)]">{remaining}</span> / <span className="font-semibold text-[var(--text-primary)]">{limit}</span> {bewerbungenText}
                      {usageStatus.remaining === 0 && (
                        <span className="ml-2 text-[var(--error-text)] font-medium">(Limit erreicht)</span>
                      )}
                    </span>
                  </div>
                )
              })()}
              <div className="flex gap-2">
                {hasCV && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPDF("cv")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CV als PDF
                  </Button>
                )}
                {hasCoverLetter && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPDF("cover-letter")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Anschreiben als PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-[#0C0C0C]">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col bg-[#0C0C0C] border-r border-[var(--border-default)]">
                {showInsights ? (
                  <>
                    {/* Insights Content */}
                    {activeTab === "cover-letter" && !hasCoverLetter ? (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-[var(--text-muted)] py-12">
                          <p className="mb-4">Bitte generiere zuerst das Anschreiben</p>
                          {usageStatus && usageStatus.tier !== "PRO" && (() => {
                            const remaining = usageStatus.remaining
                            const limit = usageStatus.limit
                            const bewerbungenText = limit === 1 ? "Bewerbung" : "Bewerbungen"
                            return (
                              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                                <Info className="h-4 w-4" />
                                <span>
                                  Verfügbar: <span className="font-semibold">{remaining}</span> / <span className="font-semibold">{limit}</span> {bewerbungenText}
                                  {usageStatus.remaining === 0 && (
                                    <span className="ml-2 text-[var(--error-text)]">(Limit erreicht)</span>
                                  )}
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    ) : (
                      <CVInsightsDisplay 
                        insights={currentInsights} 
                        onSectionHover={setHighlightedSection}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="border-b border-[var(--border-default)] px-6 py-4">
                      <h2 className="font-semibold text-[var(--text-primary)]">Chat</h2>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-auto p-6 space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-[var(--text-muted)] py-12">
                          <p className="mb-4">Starte die Generierung des CVs</p>
                          {usageStatus && usageStatus.tier !== "PRO" && (() => {
                            const remaining = usageStatus.remaining
                            const limit = usageStatus.limit
                            const bewerbungenText = limit === 1 ? "Bewerbung" : "Bewerbungen"
                            return (
                              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                                <Info className="h-4 w-4" />
                                <span>
                                  Verfügbar: <span className="font-semibold">{remaining}</span> / <span className="font-semibold">{limit}</span> {bewerbungenText}
                                  {usageStatus.remaining === 0 && (
                                    <span className="ml-2 text-[var(--error-text)]">(Limit erreicht)</span>
                                  )}
                                </span>
                              </div>
                            )
                          })()}
                          <Button onClick={handleGenerateCVClick} disabled={isGeneratingCV}>
                            {isGeneratingCV ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generiere CV...
                              </>
                            ) : (
                              "CV generieren"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <>
                          {chatMessages.map((msg: any, idx: number) => (
                            <ChatMessage
                              key={idx}
                              role={msg.role}
                              content={msg.content}
                              timestamp={msg.timestamp}
                            />
                          ))}
                          <div ref={chatEndRef} />
                        </>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="border-t border-[var(--border-default)] p-4">
                      <div className="flex gap-2">
                        <Input
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                          placeholder="Nachricht eingeben..."
                          disabled={isSending}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={isSending || !message.trim()}
                        >
                          {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col bg-[#0C0C0C]">
                {/* Artifact Header */}
                <div className="border-b border-[var(--border-default)] bg-[#0C0C0C] px-6 py-4">
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "cv" | "cover-letter")} className="w-full">
                    <TabsList>
                      <TabsTrigger value="cv">
                        <FileText className="h-4 w-4 mr-2" />
                        CV
                      </TabsTrigger>
                      <TabsTrigger value="cover-letter">
                        <FileText className="h-4 w-4 mr-2" />
                        Anschreiben
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cv" className="mt-4">
                      {!hasCV ? (
                        <div className="text-center py-12 bg-[#0C0C0C]">
                          <p className="text-[var(--text-muted)] mb-4">Noch kein CV generiert</p>
                          {usageStatus && usageStatus.tier !== "PRO" && (() => {
                            const remaining = usageStatus.remaining
                            const limit = usageStatus.limit
                            const bewerbungenText = limit === 1 ? "Bewerbung" : "Bewerbungen"
                            return (
                              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                                <Info className="h-4 w-4" />
                                <span>
                                  Verfügbar: <span className="font-semibold">{remaining}</span> / <span className="font-semibold">{limit}</span> {bewerbungenText}
                                  {usageStatus.remaining === 0 && (
                                    <span className="ml-2 text-[var(--error-text)]">(Limit erreicht)</span>
                                  )}
                                </span>
                              </div>
                            )
                          })()}
                          <Button onClick={handleGenerateCVClick} disabled={isGeneratingCV}>
                            {isGeneratingCV ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generiere CV...
                              </>
                            ) : (
                              "CV generieren"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-auto p-6 bg-[#0C0C0C]">
                          {(() => {
                            // Parse CV data if it's a string
                            let cvData = null
                            if (application.generatedCv) {
                              try {
                                cvData = typeof application.generatedCv === 'string' 
                                  ? JSON.parse(application.generatedCv) 
                                  : application.generatedCv
                              } catch (error) {
                                console.error("Error parsing CV:", error)
                                cvData = null
                              }
                            }
                            return (
                              <CVArtifactEditable
                                cv={cvData}
                                profile={application.user?.profile}
                                user={application.user}
                                highlightedSection={highlightedSection}
                                onSave={handleSaveCV}
                              />
                            )
                          })()}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="cover-letter" className="mt-4">
                      {!hasCoverLetter ? (
                        <div className="text-center py-12 bg-[#0C0C0C]">
                          <p className="text-[var(--text-muted)] mb-4">Noch kein Anschreiben generiert</p>
                          <Button
                            onClick={handleGenerateCoverLetter}
                            disabled={isGeneratingCoverLetter}
                          >
                            {isGeneratingCoverLetter ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generiere Anschreiben...
                              </>
                            ) : (
                              "Anschreiben generieren"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-auto p-6 bg-[#0C0C0C]">
                          {(() => {
                            // Parse CV data to pass to cover letter component
                            let cvData = null
                            let cvTagline = null
                            if (hasCV && application.generatedCv) {
                              try {
                                cvData = typeof application.generatedCv === 'string' 
                                  ? JSON.parse(application.generatedCv) 
                                  : application.generatedCv
                                cvTagline = cvData?.header?.tagline || null
                              } catch (error) {
                                console.error("Error parsing CV for cover letter:", error)
                              }
                            }
                            return (
                              <CoverLetterArtifact
                                coverLetter={application.coverLetter}
                                profile={application.user?.profile}
                                user={application.user}
                                jobTitle={application.jobTitle}
                                company={application.company}
                                contactPerson={application.contactPerson || null}
                                cvTagline={cvTagline}
                                cvData={cvData}
                                onSave={handleSaveCoverLetter}
                              />
                            )
                          })()}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </>
  )
}

