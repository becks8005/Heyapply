"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CVUpload } from "@/components/profile/cv-upload"
import { ProfileForm } from "@/components/profile/profile-form"
import { ImageCropper } from "@/components/profile/image-cropper"
import { ConflictDialog } from "@/components/profile/conflict-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Linkedin, Upload, Loader2, CheckCircle2, FileText, AlertCircle, Trash2 } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [croppingImage, setCroppingImage] = useState<string | null>(null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [conflictData, setConflictData] = useState<any>(null)
  const [isResolvingConflict, setIsResolvingConflict] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")

  // Check if profile is empty (no meaningful data)
  // Show empty state only if profile doesn't exist or has absolutely no data
  const isProfileEmpty = () => {
    if (!profile) return true
    
    // Check if profile has any meaningful content
    const hasExperiences = profile.experiences && profile.experiences.length > 0
    const hasEducation = profile.education && profile.education.length > 0
    const hasSummary = profile.summary && profile.summary.trim().length > 0
    const hasSkills = profile.skills && profile.skills.length > 0
    const hasTagline = profile.tagline && profile.tagline.trim().length > 0
    const hasPhone = profile.phone && profile.phone.trim().length > 0
    const hasCity = profile.city && profile.city.trim().length > 0
    
    // If profile exists but has no meaningful data, show empty state
    // This helps guide first-time users
    return !hasExperiences && !hasEducation && !hasSummary && !hasSkills && !hasTagline && !hasPhone && !hasCity
  }


  useEffect(() => {
    fetchProfile()
    
    // Check for LinkedIn success
    if (searchParams.get("linkedin") === "connected") {
      toast({
        title: "Erfolg",
        description: "LinkedIn erfolgreich verbunden. Die Felder wurden automatisch ausgefüllt - bitte überprüfe und passe sie bei Bedarf an.",
        duration: 6000,
      })
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 10000)
      router.replace("/profile")
    }

    // Check for LinkedIn conflicts
    if (searchParams.get("linkedin") === "conflict") {
      fetchLinkedInConflict()
    }
  }, [searchParams])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      if (!res.ok) throw new Error("Failed to fetch profile")
      const data = await res.json()
      setProfile(data.profile)
      setUser(data.user)
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Fehler",
        description: "Profil konnte nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLinkedInConflict = async () => {
    try {
      const res = await fetch("/api/profile/linkedin-conflict")
      if (res.ok) {
        const data = await res.json()
        setConflictData(data)
        router.replace("/profile")
      }
    } catch (error) {
      console.error("Error fetching LinkedIn conflict:", error)
    }
  }

  const handleCVUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/profile/upload-cv", {
        method: "POST",
        body: formData,
      })

      if (res.status === 409) {
        // Conflicts detected
        const data = await res.json()
        setConflictData(data)
        setIsUploading(false)
        return
      }

      if (!res.ok) {
        const error = await res.json()
        
        // Spezifische Fehlerbehandlung
        if (error.errorCode === "SUPABASE_NOT_CONFIGURED") {
          toast({
            title: "Supabase nicht konfiguriert",
            description: error.error + " Siehe SETUP-FREE-TIERS.md für Anleitung.",
            variant: "destructive",
            duration: 8000,
          })
          throw new Error(error.error)
        }
        
        if (error.errorCode === "ANTHROPIC_NOT_CONFIGURED") {
          toast({
            title: "Anthropic API nicht konfiguriert",
            description: error.error + " Siehe SETUP-FREE-TIERS.md für Anleitung.",
            variant: "destructive",
            duration: 8000,
          })
          throw new Error(error.error)
        }
        
        throw new Error(error.error || error.details || "Upload fehlgeschlagen")
      }

      const data = await res.json()
      setProfile(data.profile)
      
      toast({
        title: "Erfolg",
        description: "CV erfolgreich hochgeladen und analysiert. Die Felder wurden automatisch ausgefüllt - bitte überprüfe und passe sie bei Bedarf an.",
        duration: 6000,
      })
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 10000)
    } catch (error: any) {
      console.error("CV upload error:", error)
      
      // Bereits behandelte Fehler (z.B. Supabase-Config) haben bereits einen Toast
      if (!error.message?.includes("Supabase")) {
        toast({
          title: "Upload fehlgeschlagen",
          description: error.message || "CV konnte nicht hochgeladen werden. Bitte versuche es erneut.",
          variant: "destructive",
          duration: 6000,
        })
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleConflictResolve = async (resolutions: any) => {
    setIsResolvingConflict(true)
    try {
      const res = await fetch("/api/profile/resolve-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conflicts: conflictData.conflicts,
          newData: conflictData.newData,
          resolutions,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Konfliktlösung fehlgeschlagen")
      }

      const data = await res.json()
      setProfile(data.profile)
      if (data.user) {
        setUser(data.user)
      }
      setConflictData(null)

      const isCV = conflictData.newData.source === "cv"
      toast({
        title: "Erfolg",
        description: isCV 
          ? "CV erfolgreich hochgeladen und analysiert. Die Felder wurden automatisch ausgefüllt - bitte überprüfe und passe sie bei Bedarf an."
          : "LinkedIn erfolgreich verbunden. Die Felder wurden automatisch ausgefüllt - bitte überprüfe und passe sie bei Bedarf an.",
        duration: 6000,
      })
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 10000)
    } catch (error: any) {
      console.error("Conflict resolution error:", error)
      toast({
        title: "Fehler",
        description: error.message || "Konflikt konnte nicht gelöst werden",
        variant: "destructive",
      })
    } finally {
      setIsResolvingConflict(false)
    }
  }

  const handleConflictCancel = () => {
    setConflictData(null)
    setIsUploading(false)
  }

  const handleLinkedInConnect = async () => {
    try {
      const res = await fetch("/api/profile/linkedin?action=auth-url")
      if (!res.ok) throw new Error("Failed to get auth URL")
      const data = await res.json()
      window.location.href = data.authUrl
    } catch (error) {
      console.error("LinkedIn connect error:", error)
      toast({
        title: "Fehler",
        description: "LinkedIn-Verbindung fehlgeschlagen",
        variant: "destructive",
      })
    }
  }

  const handleProfileImageUpload = async (file: File) => {
    setProfileImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setCroppingImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (cropData: {
    x: number
    y: number
    width: number
    height: number
    zoom: number
  }) => {
    if (!profileImageFile) return

    try {
      // Upload image via API route (server-side)
      const formData = new FormData()
      formData.append("file", profileImageFile)
      formData.append("cropData", JSON.stringify(cropData))

      const res = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        
        // Spezifische Fehlerbehandlung
        if (error.errorCode === "SUPABASE_NOT_CONFIGURED") {
          toast({
            title: "Supabase nicht konfiguriert",
            description: error.error + " Siehe SETUP-FREE-TIERS.md für Anleitung.",
            variant: "destructive",
            duration: 8000,
          })
          return
        }
        
        throw new Error(error.error || "Upload fehlgeschlagen")
      }

      const data = await res.json()

      // Update local state
      if (data.user) {
        setUser(data.user)
      }

      setCroppingImage(null)
      setProfileImageFile(null)

      toast({
        title: "Erfolg",
        description: "Profilbild erfolgreich aktualisiert",
      })
    } catch (error) {
      console.error("Image upload error:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Profilbild konnte nicht hochgeladen werden",
        variant: "destructive",
      })
    }
  }

  const handleProfileUpdate = async (updates: any) => {
    setIsSaving(true)
    try {
      const currentData = {
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: profile?.phone || "",
        email: profile?.email || user?.email || "",
        city: profile?.city || "",
        country: profile?.country || "Schweiz",
        linkedInUrl: profile?.linkedInUrl || "",
        tagline: profile?.tagline || "",
        summary: profile?.summary || "",
        experiences: profile?.experiences || [],
        education: profile?.education || [],
        skills: profile?.skills || [],
        languages: profile?.languages || [],
        certifications: profile?.certifications || [],
        ...updates,
      }

      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Update fehlgeschlagen")
      }

      const data = await res.json()
      setProfile(data.profile)
      
      if (data.user) {
        setUser(data.user)
      }

      toast({
        title: "Erfolg",
        description: "Profil erfolgreich aktualisiert",
      })
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast({
        title: "Fehler",
        description: error.message || "Profil konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProfile = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch("/api/profile/delete", {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        const errorMessage = error.details || error.error || "Löschen fehlgeschlagen"
        console.error("Delete error:", error)
        throw new Error(errorMessage)
      }

      const data = await res.json()
      setProfile(data.profile)
      setShowDeleteDialog(false)

      toast({
        title: "Erfolg",
        description: "Profil erfolgreich zurückgesetzt. Du kannst jetzt einen neuen CV hochladen.",
        duration: 6000,
      })
    } catch (error: any) {
      console.error("Profile delete error:", error)
      toast({
        title: "Fehler",
        description: error.message || "Profil konnte nicht gelöscht werden",
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      setIsDeleting(false)
    }
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-600)]" />
      </div>
    )
  }

  return (
    <>
      {conflictData && (
        <ConflictDialog
          open={!!conflictData}
          conflicts={conflictData.conflicts}
          newData={conflictData.newData}
          onResolve={handleConflictResolve}
          onCancel={handleConflictCancel}
          isLoading={isResolvingConflict}
        />
      )}

      {croppingImage && (
        <ImageCropper
          image={croppingImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCroppingImage(null)
            setProfileImageFile(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Profil wirklich zurücksetzen?</DialogTitle>
            <DialogDescription className="pt-2">
              Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Profildaten werden permanent gelöscht:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Alle persönlichen Informationen (E-Mail, Telefon, Stadt, etc.)</li>
              <li>Alle Berufserfahrungen</li>
              <li>Alle Ausbildungen</li>
              <li>Alle Skills</li>
              <li>Alle Sprachen</li>
              <li>Alle Zertifikate</li>
              <li>Der hochgeladene CV</li>
            </ul>
            <p className="mt-4 text-sm font-medium text-gray-900">
              Dein Profil wird wieder leer sein und du kannst einen neuen CV hochladen.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProfile}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird gelöscht...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ja, alles löschen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-full">
        <div className="h-full overflow-auto p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto custom-scrollbar">
          {isProfileEmpty() ? (
            <>
              {/* Step Indicators - nur bei Schritt 1 */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-500)] text-white">
                  <span className="font-medium text-sm">1</span>
                  <span className="font-medium text-sm">Lebenslauf importieren</span>
                </div>
                <div className="w-8 h-px bg-[var(--border-default)]"></div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]">
                  <span className="font-medium text-sm">2</span>
                  <span className="font-medium text-sm">Informationen prüfen</span>
                </div>
              </div>
            {/* Step 1: Import CV */}
            <div className="space-y-6">
              <div>
                <h1 className="text-page-title mb-2">Lebenslauf importieren</h1>
                <p className="text-[var(--text-muted)]">
                  Wähle die aktuellste und vollständigste Quelle aus, um deine Informationen automatisch auszufüllen.
                </p>
              </div>

              {/* Upload Area */}
              <div className="card-base p-6 sm:p-8 lg:p-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Lebenslauf hochladen
                    </TabsTrigger>
                    <TabsTrigger value="linkedin">
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn verbinden
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-0">
                    <CVUpload onUpload={handleCVUpload} isUploading={isUploading} />
                  </TabsContent>
                  <TabsContent value="linkedin" className="mt-0">
                    <div className="text-center space-y-4 py-8">
                      <div className="w-16 h-16 rounded-full bg-[var(--info-bg)] flex items-center justify-center mx-auto">
                        <Linkedin className="h-8 w-8 text-[var(--info-text)]" />
                      </div>
                      <div>
                        <h3 className="text-section-title mb-3">Mit LinkedIn verbinden</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                          LinkedIn erlaubt nur Zugriff auf Name, E-Mail und Profilbild. Für vollständige CV-Daten wie Berufserfahrung und Ausbildung empfehlen wir, deinen CV als PDF hochzuladen.
                        </p>
                        <Button 
                          onClick={() => {
                            handleLinkedInConnect()
                          }} 
                          size="lg"
                        >
                          <Linkedin className="h-5 w-5 mr-2" />
                          Mit LinkedIn verbinden
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Success Message */}
              {showSuccessMessage && (
                <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-[var(--radius-lg)] p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[var(--success-text)] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--success-text)] mb-1">Felder automatisch ausgefüllt!</h3>
                    <p className="text-sm text-[var(--success-text)]/80">
                      Deine Daten wurden erfolgreich importiert. Scrolle nach unten, um die Felder zu überprüfen und bei Bedarf anzupassen.
                    </p>
                  </div>
                </div>
              )}

              {/* Supabase Configuration Warning */}
              {!isSupabaseConfigured() && (
                <div className="bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-[var(--radius-lg)] p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[var(--warning-text)] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--warning-text)] mb-1">File Upload nicht verfügbar</h3>
                    <p className="text-sm text-[var(--warning-text)]/80 mb-2">
                      Supabase ist nicht konfiguriert. CV- und Profilbild-Upload funktionieren nicht. Siehe SETUP-FREE-TIERS.md für Anleitung.
                    </p>
                    <p className="text-xs text-[var(--warning-text)]/60">
                      Benötigt: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY
                    </p>
                  </div>
                </div>
              )}
            </div>
            </>
          ) : (
            <div className="space-y-8">
              {/* Step 2: Review Information */}
              <div>
                <h1 className="text-page-title mb-2">Informationen prüfen</h1>
                <p className="text-[var(--text-muted)]">
                  Überprüfe und passe deine Profilinformationen bei Bedarf an.
                </p>
              </div>

              {/* Success Message Banner */}
              {showSuccessMessage && (
                <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-[var(--radius-lg)] p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[var(--success-text)] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--success-text)] mb-1">Felder automatisch ausgefüllt!</h3>
                    <p className="text-sm text-[var(--success-text)]/80">
                      Bitte überprüfe die untenstehenden Felder und passe sie bei Bedarf an.
                    </p>
                  </div>
                </div>
              )}

              {/* Profile Image */}
              <div className="mb-6">
                <label className="input-label">Profilbild</label>
                <div className="flex items-center gap-4">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profilbild"
                      className="w-20 h-20 rounded-[var(--radius-lg)] object-cover border border-[var(--border-default)]"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-[var(--radius-lg)] bg-[var(--bg-muted)] border border-[var(--border-default)] flex items-center justify-center">
                      <Upload className="h-8 w-8 text-[var(--text-placeholder)]" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onClick={(e) => {
                        (e.currentTarget as HTMLInputElement).value = ""
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleProfileImageUpload(file)
                      }}
                      className="hidden"
                      id="profile-image-upload"
                    />
                    <label htmlFor="profile-image-upload">
                      <Button variant="outline" asChild>
                        <span>Bild auswählen</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <ProfileForm
                profile={profile}
                user={user}
                onChange={handleProfileUpdate}
              />

              {/* Save Button */}
              <div className="mt-8 space-y-4">
                <Button
                  onClick={() => handleProfileUpdate({})}
                  disabled={isSaving}
                  size="lg"
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    "Profil speichern"
                  )}
                </Button>
                
                <div className="border-t border-[var(--border-default)] pt-4">
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="destructive-ghost"
                    size="lg"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Profil komplett zurücksetzen
                  </Button>
                  <p className="text-xs text-[var(--text-muted)] text-center mt-2">
                    Alle Profildaten, Berufserfahrungen, Ausbildung, Skills und der hochgeladene CV werden gelöscht.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

