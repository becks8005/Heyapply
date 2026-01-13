"use client"

import { useState, useRef, useEffect } from "react"
import { Info } from "lucide-react"

interface CoverLetterArtifactProps {
  coverLetter: string | null
  profile: any
  user: any
  jobTitle: string
  company: string
  contactPerson?: string | null
  cvTagline?: string | null
  cvData?: any // CV data object (parsed JSON)
  onSave?: (content: string) => Promise<void>
}

export function CoverLetterArtifact({
  coverLetter,
  profile,
  user,
  jobTitle,
  company,
  contactPerson,
  cvTagline,
  cvData,
  onSave,
}: CoverLetterArtifactProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(coverLetter || "")
  const [isSaving, setIsSaving] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize content when coverLetter changes
  useEffect(() => {
    if (contentRef.current && coverLetter) {
      // Only update if we're not currently editing (to avoid cursor jumps)
      if (!isEditing) {
        contentRef.current.innerText = coverLetter
        setEditedContent(coverLetter)
      }
    }
  }, [coverLetter, isEditing])

  if (!coverLetter) {
    return (
      <div className="bg-[var(--bg-muted)] rounded-lg p-12 text-center">
        <p className="text-[var(--text-muted)] mb-4">Noch kein Anschreiben generiert</p>
      </div>
    )
  }

  const handleContentChange = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerText || ""
      setEditedContent(newContent)
      setIsEditing(true)

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Auto-save after 1.5 seconds of inactivity
      saveTimeoutRef.current = setTimeout(() => {
        handleSave()
      }, 1500)
    }
  }

  const handleSave = async () => {
    if (!contentRef.current || !onSave) return

    const newContent = contentRef.current.innerText || ""
    
    // Only save if content actually changed
    if (newContent === coverLetter) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(newContent)
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving cover letter:", error)
      // Revert on error
      if (contentRef.current) {
        contentRef.current.innerText = coverLetter || ""
        setEditedContent(coverLetter || "")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl+S or Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault()
      handleSave()
    }
    // Cancel on Escape
    if (e.key === "Escape") {
      e.preventDefault()
      if (contentRef.current) {
        contentRef.current.innerText = coverLetter || ""
        setEditedContent(coverLetter || "")
        setIsEditing(false)
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }

  // Use CV header data if available, otherwise fall back to profile/user data (same logic as CVArtifact)
  const firstName = cvData?.header?.firstName || user?.firstName || ""
  const lastName = cvData?.header?.lastName || user?.lastName || ""
  const tagline = cvData?.header?.tagline || cvTagline || profile?.tagline || ""
  const email = cvData?.header?.email || profile?.email || user?.email || ""
  const phone = cvData?.header?.phone || profile?.phone || ""
  // Parse location from CV header (format: "City, Country") or construct from profile
  const cvLocation = cvData?.header?.location || null
  const city = profile?.city || ""
  const country = profile?.country || "Schweiz"
  const location = cvLocation || (city && country ? `${city}, ${country}` : city || "")
  const linkedInUrl = cvData?.header?.linkedIn || profile?.linkedInUrl || ""

  // Detect language from cover letter
  const isEnglish = coverLetter.toLowerCase().includes("dear") || 
                    coverLetter.toLowerCase().includes("best regards") ||
                    coverLetter.toLowerCase().includes("kind regards")

  // Format date based on language
  const formatDate = () => {
    const now = new Date()
    const day = now.getDate()
    const month = isEnglish 
      ? now.toLocaleDateString("en-US", { month: "long" })
      : now.toLocaleDateString("de-CH", { month: "long" })
    const year = now.getFullYear()
    return `${day}. ${month} ${year}`
  }

  return (
    <div>
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Header - same as CVPreview */}
        <div className="flex items-start gap-6 mb-8">
          {user?.profileImageUrl && (
            <img
              src={user.profileImageUrl}
              alt={`${firstName} ${lastName}`}
              className="w-20 h-20 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-black mb-1" style={{ fontSize: "20px", color: "#000000" }}>
              {firstName} {lastName}
            </h1>
            {tagline && (
              <p className="text-sm text-gray-600 mb-3 whitespace-nowrap" style={{ fontSize: "14px" }}>
                {tagline}
              </p>
            )}
            <div className="text-gray-600 flex flex-wrap gap-2" style={{ fontSize: "10px" }}>
              {location && <span>{location}</span>}
              {email && <span>| {email}</span>}
              {phone && <span>| {phone}</span>}
              {linkedInUrl && <span>| {linkedInUrl}</span>}
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="text-right mb-6 text-gray-700" style={{ fontSize: "10px" }}>
          {city ? `${city}, ` : ""}
          {formatDate()}
        </div>

        {/* Subject - detect language */}
        <div className="mb-6">
          <p className="font-bold text-gray-900" style={{ fontSize: "13px" }}>
            {isEnglish ? `Application for ${jobTitle}` : `Bewerbung als ${jobTitle}`}
          </p>
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-2 min-h-[200px] cursor-text whitespace-pre-wrap"
          style={{ fontSize: "10px" }}
        />
        {isSaving && (
          <div className="text-xs text-blue-600 mt-2">Speichere...</div>
        )}
        {isEditing && !isSaving && (
          <div className="text-xs text-gray-500 mt-2">Änderungen werden automatisch gespeichert (oder Escape zum Abbrechen)</div>
        )}
      </div>
      <div className="mt-4 p-3 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-default)] flex items-start gap-2 max-w-4xl mx-auto">
        <Info className="h-4 w-4 text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[var(--text-secondary)]">
          Hinweis: Die PDF-Version wird in Seiten aufgeteilt; Abstände und Seitenumbrüche können sich von der Bildschirmansicht unterscheiden.
        </p>
      </div>
    </div>
  )
}

