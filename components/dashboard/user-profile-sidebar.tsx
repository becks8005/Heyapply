"use client"

import Link from "next/link"
import Image from "next/image"
import { Edit, Briefcase, GraduationCap, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UserProfileSidebarProps {
  user: any
  profile: any
}

export function UserProfileSidebar({ user, profile }: UserProfileSidebarProps) {
  const firstName = user?.firstName || ""
  const lastName = user?.lastName || ""
  const fullName = `${firstName} ${lastName}`.trim() || "Benutzer"
  const tagline = profile?.tagline || ""
  const experiences = profile?.experiences || []
  const education = profile?.education || []
  const certifications = profile?.certifications || []
  const skills = profile?.skills || []

  // Format date range
  const formatDateRange = (startDate: Date | string | null, endDate: Date | string | null, isCurrent: boolean) => {
    if (!startDate) return ""
    
    const start = new Date(startDate)
    const startFormatted = start.toLocaleDateString("de-DE", { month: "short", year: "numeric" })
    
    if (isCurrent || !endDate) {
      return `${startFormatted} - Heute`
    }
    
    const end = new Date(endDate)
    const endFormatted = end.toLocaleDateString("de-DE", { month: "short", year: "numeric" })
    return `${startFormatted} - ${endFormatted}`
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (firstName) {
      return firstName[0].toUpperCase()
    }
    return "U"
  }

  return (
    <div className="card-base self-start w-full">
      {/* Profile Header */}
      <div className="relative mb-4 sm:mb-5">
        <div className="absolute inset-0 bg-[var(--bg-card)] rounded-[var(--radius-lg)] -z-10"></div>
        <div className="p-4 sm:p-6 flex flex-col items-center">
          {user?.profileImageUrl ? (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 sm:mb-4 ring-4 ring-[var(--bg-card)] shadow-[var(--shadow-sm)]">
              <Image
                src={user.profileImageUrl}
                alt={fullName}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--accent-500)] flex items-center justify-center text-[#080808] text-lg sm:text-xl font-semibold mb-3 sm:mb-4 ring-4 ring-[var(--bg-card)] shadow-[var(--shadow-sm)]">
              {getInitials()}
            </div>
          )}
          <h3 className="text-card-title mb-0.5 text-white text-center">{fullName}</h3>
          {tagline && (
            <p className="text-xs sm:text-sm text-[var(--text-muted)] text-center">{tagline}</p>
          )}
        </div>
      </div>

      {/* Edit Profile Button */}
      <Link href="/profile" className="block mb-4 sm:mb-6">
        <Button variant="outline" className="w-full text-xs sm:text-sm gap-2">
          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          Profil bearbeiten
        </Button>
      </Link>

      {/* Experience */}
      {experiences.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h4 className="text-overline mb-2 sm:mb-3">Erfahrung</h4>
          <div className="space-y-3 sm:space-y-4">
            {experiences.map((exp: any, index: number) => (
              <div key={exp.id || index} className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--radius-md)] bg-[var(--bg-muted)] flex items-center justify-center">
                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent-500)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] mb-0.5">{exp.jobTitle}</p>
                  <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] mb-0.5">
                    {exp.company}
                    {exp.location && (
                      <span className="text-[var(--text-muted)]"> • {exp.location}</span>
                    )}
                  </p>
                  <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                    {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h4 className="text-overline mb-2 sm:mb-3">Ausbildung</h4>
          <div className="space-y-3 sm:space-y-4">
            {education.map((edu: any, index: number) => (
              <div key={edu.id || index} className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--radius-md)] bg-[var(--bg-muted)] flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent-500)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] mb-0.5">{edu.degree}</p>
                  <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] mb-0.5">{edu.institution}</p>
                  {edu.location && (
                    <p className="text-[10px] sm:text-xs text-[var(--text-muted)] mb-0.5">{edu.location}</p>
                  )}
                  {edu.startDate && (
                    <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                      {formatDateRange(edu.startDate, edu.endDate, false)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h4 className="text-overline mb-2 sm:mb-3">Zertifikate</h4>
          <div className="space-y-3">
            {certifications.map((cert: any, index: number) => (
              <div key={cert.id || index} className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--radius-md)] bg-[var(--bg-muted)] flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent-500)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] mb-0.5">{cert.name}</p>
                  {cert.issuer && (
                    <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] mb-0.5">{cert.issuer}</p>
                  )}
                  {cert.year && (
                    <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">{cert.year}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <h4 className="text-overline mb-2 sm:mb-3">Kompetenzen</h4>
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 8).map((skill: any, index: number) => (
              <span
                key={skill.id || index}
                className="badge-neutral text-[10px] sm:text-xs"
              >
                {skill.name}
              </span>
            ))}
            {skills.length > 8 && (
              <span className="badge-neutral text-[10px] sm:text-xs">
                +{skills.length - 8}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
