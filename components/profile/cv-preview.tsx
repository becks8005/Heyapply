"use client"

interface CVPreviewProps {
  profile: any
  user: any
  highlightedSection?: string | null
}

export function CVPreview({ profile, user, highlightedSection }: CVPreviewProps) {
  if (!profile && !user) {
    return (
      <div className="bg-gray-50 rounded-lg p-12 text-center">
        <p className="text-gray-500">Lade dein Profil, um eine Vorschau zu sehen</p>
      </div>
    )
  }

  const firstName = user?.firstName || ""
  const lastName = user?.lastName || ""
  const tagline = profile?.tagline || ""
  const email = profile?.email || user?.email || ""
  const phone = profile?.phone || ""
  const city = profile?.city || ""
  const country = profile?.country || "Schweiz"
  const linkedInUrl = profile?.linkedInUrl || ""
  const summary = profile?.summary || ""
  const experiences = profile?.experiences || []
  const education = profile?.education || []
  const certifications = profile?.certifications || []
  const languages = profile?.languages || []
  const skills = profile?.skills || []

  // Group skills by category
  const skillsByCategory = skills.reduce((acc: any, skill: any) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill.name)
    return acc
  }, {})

  // Detect language from CV content (check section titles and content)
  const isGerman = (() => {
    const cvText = `${summary} ${tagline}`.toLowerCase()
    const germanKeywords = ["profil", "erfahrung", "ausbildung", "zertifizierungen", "sprachen", "kompetenzen", "heute"]
    const englishKeywords = ["profile", "experience", "education", "certifications", "languages", "skills", "present"]
    // Check if German keywords are present and no English keywords
    const hasGerman = germanKeywords.some(keyword => cvText.includes(keyword))
    const hasEnglish = englishKeywords.some(keyword => cvText.includes(keyword))
    // Default to German if ambiguous
    return hasGerman || (!hasEnglish && !hasGerman)
  })()

  // Section titles based on language
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
    // If already in MM/YYYY format, return as is
    if (typeof date === "string" && /^\d{2}\/\d{4}$/.test(date)) {
      return date
    }
    // Try to parse as Date
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) {
      // If parsing failed, try to parse MM/YYYY format manually
      if (typeof date === "string") {
        const parts = date.split("/")
        if (parts.length === 2) {
          return date // Return as is if it looks like MM/YYYY
        }
      }
      return ""
    }
    // Format as MM/YYYY with slash instead of dot
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${month}/${year}`
  }

  const formatYear = (date: Date | string | null) => {
    if (!date) return ""
    const d = typeof date === "string" ? new Date(date) : date
    return d.getFullYear().toString()
  }

  // Helper function to check if a section should be highlighted
  const normalizedHighlighted = highlightedSection?.toLowerCase().trim() || ""
  
  const isTaglineHighlighted = normalizedHighlighted.includes("tagline")
  const isSummaryHighlighted = normalizedHighlighted.includes("zusammenfassung") || 
                                normalizedHighlighted.includes("summary") || 
                                normalizedHighlighted.includes("profil")
  const isExperienceHighlighted = normalizedHighlighted.includes("erfahrung") || 
                                   normalizedHighlighted.includes("experience")
  const isSkillsHighlighted = normalizedHighlighted.includes("fähigkeit") || 
                              normalizedHighlighted.includes("kompetenz") || 
                              normalizedHighlighted.includes("skill")

  return (
    <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto" style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
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
            <p 
              className={`text-sm text-gray-600 mb-3 whitespace-nowrap transition-all duration-200 ${
                isTaglineHighlighted ? "bg-yellow-200 px-2 py-1 rounded" : ""
              }`} 
              style={{ fontSize: "14px" }}
            >
              {tagline}
            </p>
          )}
          <div className="text-gray-600 flex flex-wrap gap-2" style={{ fontSize: "10px" }}>
            {city && country && <span>{city}, {country}</span>}
            {email && <span>| {email}</span>}
            {phone && <span>| {phone}</span>}
            {linkedInUrl && <span>| {linkedInUrl}</span>}
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <section className={`mb-8 transition-all duration-200 ${isSummaryHighlighted ? "bg-yellow-100 px-4 py-3 rounded-lg" : ""}`}>
          <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-2 pb-1 border-b border-gray-900" style={{ fontSize: "13px" }}>{sectionTitles.profile}</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap" style={{ fontSize: "10px" }}>{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className={`mb-8 transition-all duration-200 ${isExperienceHighlighted ? "bg-yellow-100 px-4 py-3 rounded-lg" : ""}`}>
          <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-4 pb-1 border-b border-gray-900" style={{ fontSize: "13px" }}>{sectionTitles.experience}</h2>
          <div className="space-y-6">
            {experiences.map((exp: any, idx: number) => {
              // Parse bullets from JSON string to array
              let bullets: string[] = [];
              if (exp.bullets) {
                if (Array.isArray(exp.bullets)) {
                  bullets = exp.bullets;
                } else if (typeof exp.bullets === 'string') {
                  try {
                    bullets = JSON.parse(exp.bullets);
                  } catch (e) {
                    bullets = [];
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
                    {bullets.map((bullet: string, bulletIdx: number) => (
                      <li key={bulletIdx} className="text-gray-700" style={{ fontSize: "10px" }}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            )})}
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
        <section className={`transition-all duration-200 ${isSkillsHighlighted ? "bg-yellow-100 px-4 py-3 rounded-lg" : ""}`}>
          <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-4 pb-1 border-b border-gray-900" style={{ fontSize: "13px" }}>{sectionTitles.skills}</h2>
          <div className="space-y-2">
            {Object.entries(skillsByCategory).map(([category, items]: [string, any]) => (
              <div 
                key={category} 
                className={`text-gray-700 transition-all duration-200 ${isSkillsHighlighted ? "bg-yellow-200 px-2 py-1 rounded" : ""}`} 
                style={{ fontSize: "10px" }}
              >
                <span className="font-semibold">{category}:</span>{" "}
                <span>{items.join(" | ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

