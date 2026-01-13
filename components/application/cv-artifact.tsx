"use client"

import { CVPreview } from "@/components/profile/cv-preview"
import { Info } from "lucide-react"

interface CVArtifactProps {
  cv: any
  profile: any
  user: any
  highlightedSection?: string | null
}

export function CVArtifact({ cv, profile, user, highlightedSection }: CVArtifactProps) {
  if (!cv) {
    return (
      <div className="bg-[var(--bg-muted)] rounded-lg p-12 text-center">
        <p className="text-[var(--text-muted)]">Noch kein CV generiert</p>
      </div>
    )
  }

  // Merge CV data with profile/user for preview
  const mergedProfile = {
    ...profile,
    tagline: cv.header?.tagline || profile?.tagline,
    summary: cv.summary || profile?.summary,
    experiences: cv.experiences || profile?.experiences || [],
    education: cv.education || profile?.education || [],
    certifications: cv.certifications || profile?.certifications || [],
    languages: cv.languages || profile?.languages || [],
    skills: cv.skills ? cv.skills.flatMap((s: any) => 
      (s.items || []).map((item: string) => ({
        name: item,
        category: s.category || "",
      }))
    ) : profile?.skills || [],
  }

  const mergedUser = {
    ...user,
    firstName: cv.header?.firstName || user?.firstName,
    lastName: cv.header?.lastName || user?.lastName,
    profileImageUrl: user?.profileImageUrl,
  }

  return (
    <div className="overflow-auto">
      <CVPreview profile={mergedProfile} user={mergedUser} highlightedSection={highlightedSection} />
      <div className="mt-4 p-3 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-default)] flex items-start gap-2 max-w-4xl mx-auto">
        <Info className="h-4 w-4 text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[var(--text-secondary)]">
          Hinweis: Die PDF-Version wird in Seiten aufgeteilt; Abstände und Seitenumbrüche können sich von der Bildschirmansicht unterscheiden.
        </p>
      </div>
    </div>
  )
}

