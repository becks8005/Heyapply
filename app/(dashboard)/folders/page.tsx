"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Plus, Folder, Trash2, Edit2 } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function FoldersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [folders, setFolders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [folderColor, setFolderColor] = useState("#6366f1")
  const [isCreating, setIsCreating] = useState(false)

  const colors = [
    "#6366f1", // Indigo
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#f43f5e", // Rose
    "#ef4444", // Red
    "#f59e0b", // Amber
    "#10b981", // Green
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
  ]

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    try {
      const res = await fetch("/api/folders")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setFolders(data.folders)
    } catch (error) {
      console.error("Error fetching folders:", error)
      toast({
        title: "Fehler",
        description: "Ordner konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib einen Ordnernamen ein",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: folderName.trim(),
          color: folderColor,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Erstellen")
      }

      const data = await res.json()
      setFolders([...folders, data.folder])
      setShowCreateDialog(false)
      setFolderName("")
      setFolderColor("#6366f1")
      
      toast({
        title: "Erfolg",
        description: "Ordner erfolgreich erstellt",
      })
    } catch (error: any) {
      console.error("Create folder error:", error)
      toast({
        title: "Fehler",
        description: error.message || "Ordner konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchtest du diesen Ordner wirklich löschen?")) return

    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      setFolders(folders.filter((f) => f.id !== id))
      toast({
        title: "Erfolg",
        description: "Ordner erfolgreich gelöscht",
      })
    } catch (error) {
      console.error("Delete folder error:", error)
      toast({
        title: "Fehler",
        description: "Ordner konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Ordner</DialogTitle>
            <DialogDescription>
              Erstelle einen neuen Ordner zum Organisieren deiner Bewerbungen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="z.B. Tech-Firmen"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Farbe</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFolderColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      folderColor === color ? "border-gray-900" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Erstelle...
                </>
              ) : (
                "Erstellen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ordner</h1>
            <p className="text-[var(--text-secondary)]">
              Organisiere deine Bewerbungen in Ordnern
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Ordner
          </Button>
        </div>

        {folders.length === 0 ? (
          <div className="card-base p-12 text-center">
            <Folder className="h-12 w-12 text-[var(--text-disabled)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)] mb-4">Noch keine Ordner erstellt</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Ersten Ordner erstellen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="card-base p-6 hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
                onClick={() => router.push(`/folders/${folder.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: folder.color }}
                  >
                    <Folder className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        // TODO: Implement edit
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(folder.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1 text-[var(--text-primary)]">{folder.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {folder._count?.applications || 0} Bewerbung{folder._count?.applications !== 1 ? "en" : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

