"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface ConflictDialogProps {
  open: boolean
  conflicts: any
  newData: any
  onResolve: (resolutions: any) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConflictDialog({
  open,
  conflicts,
  newData,
  onResolve,
  onCancel,
  isLoading = false,
}: ConflictDialogProps) {
  const [resolutions, setResolutions] = useState<any>({})

  const handleFieldResolution = (category: string, field: string, choice: "current" | "new") => {
    setResolutions((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: choice,
      },
    }))
  }

  const handleResolve = () => {
    onResolve(resolutions)
  }

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      firstName: "Vorname",
      lastName: "Nachname",
      email: "E-Mail",
      phone: "Telefon",
      city: "Stadt",
      country: "Land",
      linkedInUrl: "LinkedIn URL",
      tagline: "Tagline",
      summary: "Zusammenfassung",
      profileImageUrl: "Profilbild",
    }
    return labels[field] || field
  }

  const getSourceLabel = (source: string): string => {
    if (source === "cv") return "CV-Upload"
    if (source === "linkedin") return "LinkedIn"
    return source
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Konflikte gefunden
          </DialogTitle>
          <DialogDescription>
            Es wurden unterschiedliche Informationen gefunden. Bitte wählen Sie für jedes Feld,
            welche Version Sie behalten möchten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {conflicts.user && (
            <div>
              <h3 className="font-semibold mb-3">Benutzerdaten</h3>
              <div className="space-y-4">
                {Object.entries(conflicts.user).map(([field, conflict]: [string, any]) => (
                  <div key={field} className="border rounded-lg p-4 space-y-3">
                    <label className="font-medium text-sm">{getFieldLabel(field)}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          resolutions.user?.[field] === "current"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleFieldResolution("user", field, "current")}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="radio"
                            name={`user-${field}`}
                            checked={resolutions.user?.[field] === "current"}
                            onChange={() => handleFieldResolution("user", field, "current")}
                            className="mt-1"
                          />
                          <span className="text-sm font-medium">Aktuell (gespeichert)</span>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">
                          {conflict.current || "(leer)"}
                        </p>
                      </div>
                      <div
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          resolutions.user?.[field] === "new"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleFieldResolution("user", field, "new")}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="radio"
                            name={`user-${field}`}
                            checked={resolutions.user?.[field] === "new"}
                            onChange={() => handleFieldResolution("user", field, "new")}
                            className="mt-1"
                          />
                          <span className="text-sm font-medium">
                            Neu ({getSourceLabel(newData.source)})
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">
                          {conflict.new || "(leer)"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {conflicts.profile && (
            <div>
              <h3 className="font-semibold mb-3">Profildaten</h3>
              <div className="space-y-4">
                {Object.entries(conflicts.profile).map(([field, conflict]: [string, any]) => (
                  <div key={field} className="border rounded-lg p-4 space-y-3">
                    <label className="font-medium text-sm">{getFieldLabel(field)}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          resolutions.profile?.[field] === "current"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleFieldResolution("profile", field, "current")}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="radio"
                            name={`profile-${field}`}
                            checked={resolutions.profile?.[field] === "current"}
                            onChange={() => handleFieldResolution("profile", field, "current")}
                            className="mt-1"
                          />
                          <span className="text-sm font-medium">Aktuell (gespeichert)</span>
                        </div>
                        <p className="text-sm text-gray-600 ml-6 break-words">
                          {field === "summary" && conflict.current
                            ? conflict.current.substring(0, 200) + "..."
                            : conflict.current || "(leer)"}
                        </p>
                      </div>
                      <div
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          resolutions.profile?.[field] === "new"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleFieldResolution("profile", field, "new")}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="radio"
                            name={`profile-${field}`}
                            checked={resolutions.profile?.[field] === "new"}
                            onChange={() => handleFieldResolution("profile", field, "new")}
                            className="mt-1"
                          />
                          <span className="text-sm font-medium">
                            Neu ({getSourceLabel(newData.source)})
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 ml-6 break-words">
                          {field === "summary" && conflict.new
                            ? conflict.new.substring(0, 200) + "..."
                            : conflict.new || "(leer)"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button onClick={handleResolve} disabled={isLoading}>
            {isLoading ? "Wird verarbeitet..." : "Übernehmen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

