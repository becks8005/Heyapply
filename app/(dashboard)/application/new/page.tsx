"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function NewApplicationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [jobUrl, setJobUrl] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingCV, setIsGeneratingCV] = useState(false)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitInfo, setLimitInfo] = useState<any>(null)
  const [showCvDialog, setShowCvDialog] = useState(false)

  const handleCreate = async () => {
    if (!jobUrl.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib eine Job-URL ein",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      // Create application
      const createRes = await fetch("/api/application/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl: jobUrl.trim() }),
      })

      if (!createRes.ok) {
        const error = await createRes.json()
        if (error.error === "LIMIT_REACHED") {
          setLimitInfo(error.usageStatus)
          setShowLimitDialog(true)
          return
        }
        if (error.error === "NO_CV_UPLOADED") {
          setShowCvDialog(true)
          return
        }
        throw new Error(error.error || error.message || "Fehler beim Erstellen")
      }

      const { application } = await createRes.json()

      // Analyze job posting
      setIsAnalyzing(true)
      const analyzeRes = await fetch(`/api/application/${application.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl: jobUrl.trim() }),
      })

      if (!analyzeRes.ok) {
        const errorData = await analyzeRes.json().catch(() => ({}))
        
        // If limit was reached during analysis, show limit dialog
        if (errorData.error === "LIMIT_REACHED") {
          setLimitInfo(errorData.usageStatus)
          setShowLimitDialog(true)
          // Delete the application since analysis failed
          await fetch(`/api/application/${application.id}`, {
            method: "DELETE",
          }).catch(() => {}) // Ignore errors when deleting
          return
        }
        
        // Delete the application since analysis failed
        await fetch(`/api/application/${application.id}`, {
          method: "DELETE",
        }).catch(() => {}) // Ignore errors when deleting
        
        throw new Error(errorData.error || "Fehler beim Analysieren")
      }

      // Automatically generate CV
      setIsAnalyzing(false)
      setIsGeneratingCV(true)
      const cvRes = await fetch(`/api/application/${application.id}/generate-cv`, {
        method: "POST",
      })

      if (!cvRes.ok) {
        const errorData = await cvRes.json().catch(() => ({}))
        // CV generation failed, but we can still continue - user can regenerate manually
        console.error("CV generation failed:", errorData)
      } else {
      }

      // Redirect to application page
      router.push(`/application/${application.id}`)
    } catch (error: any) {
      console.error("Create application error:", error)
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Erstellen der Bewerbung",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
      setIsAnalyzing(false)
      setIsGeneratingCV(false)
    }
  }

  return (
    <>
      <Dialog open={showCvDialog} onOpenChange={setShowCvDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CV erforderlich</DialogTitle>
            <DialogDescription>
              Um eine Bewerbung zu erstellen, musst du zuerst deinen CV hochladen. Das System benötigt deine CV-Daten, um passende Bewerbungen zu generieren.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCvDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => router.push("/profile")}>
              Zum Profil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limit erreicht</DialogTitle>
            <DialogDescription>
              Du hast dein monatliches Limit erreicht. Upgrade auf Basis oder Pro, um mehr Bewerbungen zu erstellen.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Aktueller Plan: <strong>{limitInfo?.tier || "FREE"}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Verbrauch: {limitInfo?.currentCount || 0} von {limitInfo?.limit === Infinity ? "∞" : limitInfo?.limit || 1} Bewerbungen
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => router.push("/settings/billing")}>
              Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-page-title mb-2">Neue Bewerbung</h1>
            <p className="text-[var(--text-muted)]">
              Füge den Link zum Stelleninserat ein, um zu beginnen
            </p>
          </div>

          <div className="card-base space-y-5">
            <div>
              <label className="input-label">
                Link zum Stelleninserat
              </label>
              <Input
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="Link zu jobs.ch oder LinkedIn einfügen..."
                disabled={isCreating || isAnalyzing}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating && !isAnalyzing) {
                    handleCreate()
                  }
                }}
              />
              <p className="input-helper">
                Unterstützt: jobs.ch, LinkedIn Jobs
              </p>
            </div>

            <Button
              onClick={handleCreate}
              disabled={isCreating || isAnalyzing || isGeneratingCV || !jobUrl.trim()}
              size="lg"
              className="w-full"
            >
              {isGeneratingCV ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  CV wird generiert...
                </>
              ) : isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Stelle wird analysiert...
                </>
              ) : isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Bewerbung wird erstellt...
                </>
              ) : (
                "Analysieren"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

