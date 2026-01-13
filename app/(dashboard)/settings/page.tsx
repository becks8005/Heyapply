"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user")
      if (res.ok) {
        const data = await res.json()
        setFormData({
          firstName: data.user?.firstName || "",
          lastName: data.user?.lastName || "",
          email: data.user?.email || "",
        })
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update via profile API
      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      })

      if (!res.ok) throw new Error("Failed to update")

      toast({
        title: "Erfolg",
        description: "Einstellungen wurden gespeichert",
      })
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-page-title mb-1">Einstellungen</h1>
        <p className="text-[var(--text-muted)]">
          Verwalte deine Kontoeinstellungen
        </p>
      </div>

      <div className="card-base max-w-xl">
        <h2 className="text-section-title mb-5">Persönliche Informationen</h2>
        <div className="space-y-5">
          <div>
            <label className="input-label">Vorname</label>
            <Input
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label">Nachname</label>
            <Input
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label">E-Mail</label>
            <Input
              type="email"
              value={formData.email}
              disabled
            />
            <p className="input-helper">
              E-Mail-Adresse kann nicht geändert werden
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

