"use client"

import { useState, useRef, useEffect } from "react"
import { CVPreview } from "@/components/profile/cv-preview"
import { Info } from "lucide-react"

interface CVArtifactEditableProps {
  cv: any
  profile: any
  user: any
  highlightedSection?: string | null
  onSave?: (cvData: any) => Promise<void>
}

export function CVArtifactEditable({ 
  cv, 
  profile, 
  user, 
  highlightedSection,
  onSave 
}: CVArtifactEditableProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editedValue, setEditedValue] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [localCv, setLocalCv] = useState(cv)
  const editRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLocalCv(cv)
  }, [cv])

  // Initialize contentEditable content when editing starts
  useEffect(() => {
    if (editingField && editRef.current) {
      editRef.current.innerText = editedValue
      // Focus and select all text
      editRef.current.focus()
      const range = document.createRange()
      range.selectNodeContents(editRef.current)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [editingField])

  if (!localCv) {
    return (
      <div className="bg-[var(--bg-muted)] rounded-lg p-12 text-center">
        <p className="text-[var(--text-muted)]">Noch kein CV generiert</p>
      </div>
    )
  }

  // Merge CV data with profile/user for preview
  const mergedProfile = {
    ...profile,
    tagline: localCv.header?.tagline || profile?.tagline,
    summary: localCv.summary || profile?.summary,
    experiences: localCv.experiences || profile?.experiences || [],
    education: localCv.education || profile?.education || [],
    certifications: localCv.certifications || profile?.certifications || [],
    languages: localCv.languages || profile?.languages || [],
    skills: localCv.skills ? localCv.skills.flatMap((s: any) => 
      (s.items || []).map((item: string) => ({
        name: item,
        category: s.category || "",
      }))
    ) : profile?.skills || [],
  }

  const mergedUser = {
    ...user,
    firstName: localCv.header?.firstName || user?.firstName,
    lastName: localCv.header?.lastName || user?.lastName,
    profileImageUrl: user?.profileImageUrl,
  }

  const handleStartEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditedValue(currentValue)
  }

  const handleSaveField = async () => {
    if (!editingField || !onSave) {
      setEditingField(null)
      return
    }

    // Clear timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    const updatedCv = { ...localCv }
    
    // Update based on field path
    if (editingField === "tagline") {
      if (!updatedCv.header) updatedCv.header = {}
      updatedCv.header.tagline = editedValue
    } else if (editingField === "summary") {
      updatedCv.summary = editedValue
    } else if (editingField.startsWith("exp-")) {
      // Format: "exp-{index}-bullet-{bulletIndex}" or "exp-{index}-jobTitle" etc.
      const parts = editingField.split("-")
      const expIndex = parseInt(parts[1])
      if (parts[2] === "bullet") {
        const bulletIndex = parseInt(parts[3])
        if (!updatedCv.experiences[expIndex].bullets) {
          updatedCv.experiences[expIndex].bullets = []
        }
        updatedCv.experiences[expIndex].bullets[bulletIndex] = editedValue
      }
    }

    // Only save if value changed
    const currentValue = getFieldValue(editingField, localCv)
    if (editedValue === currentValue) {
      setEditingField(null)
      return
    }

    setIsSaving(true)
    try {
      await onSave(updatedCv)
      setLocalCv(updatedCv)
      setEditingField(null)
    } catch (error) {
      console.error("Error saving CV:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const getFieldValue = (field: string, cvData: any): string => {
    if (field === "tagline") return cvData.header?.tagline || ""
    if (field === "summary") return cvData.summary || ""
    if (field.startsWith("exp-")) {
      const parts = field.split("-")
      const expIndex = parseInt(parts[1])
      if (parts[2] === "bullet") {
        const bulletIndex = parseInt(parts[3])
        return cvData.experiences[expIndex]?.bullets?.[bulletIndex] || ""
      }
    }
    return ""
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveField()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setEditingField(null)
      setEditedValue(getFieldValue(field, localCv))
    }
  }

  // Render editable version with inline editing
  const firstName = mergedUser.firstName || ""
  const lastName = mergedUser.lastName || ""
  const tagline = mergedProfile.tagline || ""
  const summary = mergedProfile.summary || ""
  const experiences = mergedProfile.experiences || []
  const education = mergedProfile.education || []
  const certifications = mergedProfile.certifications || []
  const languages = mergedProfile.languages || []
  const skills = mergedProfile.skills || []

  // Group skills by category
  const skillsByCategory = skills.reduce((acc: any, skill: any) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill.name)
    return acc
  }, {})

  // Detect language
  const isGerman = (() => {
    const cvText = `${summary} ${tagline}`.toLowerCase()
    const germanKeywords = ["profil", "erfahrung", "ausbildung", "zertifizierungen", "sprachen", "kompetenzen", "heute"]
    const englishKeywords = ["profile", "experience", "education", "certifications", "languages", "skills", "present"]
    const hasGerman = germanKeywords.some(keyword => cvText.includes(keyword))
    const hasEnglish = englishKeywords.some(keyword => cvText.includes(keyword))
    return hasGerman || (!hasEnglish && !hasGerman)
  })()

  const sectionTitles = {
    profile: isGerman ? "PROFIL" : "PROFILE",
    experience: isGerman ? "ERFAHRUNG" : "EXPERIENCE",
    education: isGerman ? "AUSBILDUNG" : "EDUCATION",
    certifications: isGerman ? "ZERTIFIZIERUNGEN" : "CERTIFICATIONS",
    languages: isGerman ? "SPRACHEN" : "LANGUAGES",
    skills: isGerman ? "KOMPETENZEN" : "SKILLS",
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return ""
    if (typeof date === "string" && /^\d{2}\/\d{4}$/.test(date)) {
      return date
    }
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) {
      if (typeof date === "string") {
        const parts = date.split("/")
        if (parts.length === 2) {
          return date
        }
      }
      return ""
    }
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${month}/${year}`
  }

  const formatYear = (date: Date | string | null) => {
    if (!date) return ""
    const d = typeof date === "string" ? new Date(date) : date
    return d.getFullYear().toString()
  }

  const normalizedHighlighted = highlightedSection?.toLowerCase().trim() || ""
  const isTaglineHighlighted = normalizedHighlighted.includes("tagline")
  const isSummaryHighlighted = normalizedHighlighted.includes("zusammenfassung") || 
                                normalizedHighlighted.includes("summary") || 
                                normalizedHighlighted.includes("profil")
  const isExperienceHighlighted = normalizedHighlighted.includes("erfahrung") || 
                                   normalizedHighlighted.includes("experience")

  return (
    <div className="overflow-auto">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          {mergedUser.profileImageUrl && (
            <img
              src={mergedUser.profileImageUrl}
              alt={`${firstName} ${lastName}`}
              className="w-20 h-20 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 mb-1" style={{ fontSize: "20px" }}>
              {firstName} {lastName}
            </h1>
            {editingField === "tagline" ? (
              <div
                ref={editRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleSaveField}
                onKeyDown={(e) => handleKeyDown(e, "tagline")}
                onInput={(e) => setEditedValue(e.currentTarget.innerText || "")}
                className="text-sm text-gray-600 mb-3 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5 cursor-text"
                style={{ fontSize: "14px" }}
              />
            ) : (
              <div
                onClick={() => handleStartEdit("tagline", tagline)}
                className={`text-sm text-gray-600 mb-3 whitespace-nowrap transition-all duration-200 cursor-text hover:bg-gray-100 rounded px-1 py-0.5 ${
                  isTaglineHighlighted ? "bg-yellow-200 px-2 py-1 rounded" : ""
                }`}
                style={{ fontSize: "14px" }}
                title="Klicken zum Bearbeiten"
              >
                {tagline || <span className="text-gray-400">Tagline (klicken zum Bearbeiten)</span>}
              </div>
            )}
            <div className="text-gray-600 flex flex-wrap gap-2" style={{ fontSize: "10px" }}>
              {profile?.city && profile?.country && <span>{profile.city}, {profile.country}</span>}
              {profile?.email && <span>| {profile.email}</span>}
              {profile?.phone && <span>| {profile.phone}</span>}
              {profile?.linkedInUrl && <span>| {profile.linkedInUrl}</span>}
            </div>
          </div>
        </div>

        {/* Summary */}
        {editingField === "summary" ? (
          <section className="mb-8">
            <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-2 pb-1 border-b border-gray-900" style={{ fontSize: "13px" }}>{sectionTitles.profile}</h2>
            <div
              ref={editRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleSaveField}
              onKeyDown={(e) => handleKeyDown(e, "summary")}
              onInput={(e) => setEditedValue(e.currentTarget.innerText || "")}
              className="text-gray-700 leading-relaxed whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 cursor-text min-h-[50px]"
              style={{ fontSize: "10px" }}
            />
          </section>
        ) : summary ? (
          <section className={`mb-8 transition-all duration-200 ${isSummaryHighlighted ? "bg-yellow-100 px-4 py-3 rounded-lg" : ""}`}>
            <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-2 pb-1 border-b border-gray-900" style={{ fontSize: "13px" }}>{sectionTitles.profile}</h2>
            <div
              onClick={() => handleStartEdit("summary", summary)}
              className="text-gray-700 leading-relaxed whitespace-pre-wrap cursor-text hover:bg-gray-100 rounded px-2 py-1"
              style={{ fontSize: "10px" }}
              title="Klicken zum Bearbeiten"
            >
              {summary}
            </div>
          </section>
        ) : null}

        {/* Experience */}
        {experiences.length > 0 && (
          <section className={`mb-8 transition-all duration-200 ${isExperienceHighlighted ? "bg-yellow-100 px-4 py-3 rounded-lg" : ""}`}>
            <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-4 pb-1 border-b border-gray-900" style={{ fontSize: "13px" }}>{sectionTitles.experience}</h2>
            <div className="space-y-6">
              {experiences.map((exp: any, idx: number) => {
                let bullets: string[] = []
                if (exp.bullets) {
                  if (Array.isArray(exp.bullets)) {
                    bullets = exp.bullets
                  } else if (typeof exp.bullets === 'string') {
                    try {
                      bullets = JSON.parse(exp.bullets)
                    } catch (e) {
                      bullets = []
                    }
                  }
                }
                return (
                  <div key={idx} className={isExperienceHighlighted ? "bg-yellow-200 px-3 py-2 rounded transition-all duration-200" : ""}>
                    <div className="mb-2" style={{ fontSize: "10px" }}>
                      <span className="font-semibold text-gray-900">{exp.jobTitle}</span>
                      {exp.company && <span className="text-gray-700"> | {exp.company}</span>}
                      {exp.location && <span className="text-gray-700"> | {exp.location}</span>}
                      <span className="text-gray-700">
                        {" | "}
                        {formatDate(exp.startDate)}
                        {(exp.isCurrent || (!exp.endDate && exp.isCurrent !== false)) ? (isGerman ? " - Heute" : " - Present") : exp.endDate ? ` - ${formatDate(exp.endDate)}` : ""}
                      </span>
                    </div>
                    {bullets.length > 0 && (
                      <ul className="list-disc list-outside space-y-1 pl-6">
                        {bullets.map((bullet: string, bulletIdx: number) => {
                          const fieldKey = `exp-${idx}-bullet-${bulletIdx}`
                          return editingField === fieldKey ? (
                            <li key={bulletIdx} className="text-gray-700" style={{ fontSize: "10px" }}>
                              <div
                                ref={editRef}
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={handleSaveField}
                                onKeyDown={(e) => handleKeyDown(e, fieldKey)}
                                onInput={(e) => setEditedValue(e.currentTarget.innerText || "")}
                                className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5 cursor-text"
                              />
                            </li>
                          ) : (
                            <li 
                              key={bulletIdx} 
                              className="text-gray-700 cursor-text hover:bg-gray-100 rounded px-1 py-0.5" 
                              style={{ fontSize: "10px" }}
                              onClick={() => handleStartEdit(fieldKey, bullet)}
                              title="Klicken zum Bearbeiten"
                            >
                              {bullet}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mb-8">
            <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-4 pb-1 border-b border-gray-900" style={{ fontSize: "13px" }}>{sectionTitles.education}</h2>
            <div className="space-y-2">
              {education.map((edu: any, idx: number) => (
                <div key={idx} className="text-gray-700" style={{ fontSize: "10px" }}>
                  <span className="font-semibold">{edu.degree}</span>
                  {edu.grade && <span> ({edu.grade})</span>}
                  {edu.institution && <span> | {edu.institution}</span>}
                  {edu.location && <span> | {edu.location}</span>}
                  {(edu.startDate || edu.endDate) && (
                    <span>
                      {" | "}
                      {edu.startDate ? formatYear(edu.startDate) : ""}
                      {edu.endDate ? ` - ${formatYear(edu.endDate)}` : ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <section className="mb-8">
            <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-4 pb-1 border-b border-gray-900" style={{ fontSize: "13px" }}>{sectionTitles.certifications}</h2>
            <div className="space-y-2">
              {certifications.map((cert: any, idx: number) => (
                <div key={idx} className="text-gray-700" style={{ fontSize: "10px" }}>
                  <span className="font-semibold">{cert.name}</span>
                  {cert.issuer && <span> | {cert.issuer}</span>}
                  {cert.year && <span> | {cert.year}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <section className="mb-8">
            <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-2 pb-1 border-b border-gray-900" style={{ fontSize: "13px" }}>{sectionTitles.languages}</h2>
            <div className="text-gray-700" style={{ fontSize: "10px" }}>
              {languages.map((lang: any, idx: number) => (
                <span key={idx}>
                  {lang.name} ({lang.level})
                  {idx < languages.length - 1 && " | "}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {Object.keys(skillsByCategory).length > 0 && (
          <section>
            <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-4 pb-1 border-b border-gray-900" style={{ fontSize: "13px" }}>{sectionTitles.skills}</h2>
            <div className="space-y-2">
              {Object.entries(skillsByCategory).map(([category, items]: [string, any]) => (
                <div key={category} className="text-gray-700" style={{ fontSize: "10px" }}>
                  <span className="font-semibold">{category}:</span>{" "}
                  <span>{items.join(" | ")}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      {isSaving && (
        <div className="text-center text-sm text-blue-600 mt-4">Speichere...</div>
      )}
      <div className="mt-4 p-3 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-default)] flex items-start gap-2 max-w-4xl mx-auto">
        <Info className="h-4 w-4 text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[var(--text-secondary)]">
          Hinweis: Klicken Sie auf Textfelder zum Bearbeiten. Die PDF-Version wird in Seiten aufgeteilt; Abstände und Seitenumbrüche können sich von der Bildschirmansicht unterscheiden.
        </p>
      </div>
    </div>
  )
}
