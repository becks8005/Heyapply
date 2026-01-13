import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { anthropic, getAnthropicConfigError } from "@/lib/anthropic"
import { CV_SYSTEM_PROMPT } from "@/prompts/cv-system-prompt"
import { checkUsageLimit, incrementUsage } from "@/lib/usage-tracker"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        user: {
          include: {
            profile: {
              include: {
                experiences: { orderBy: { order: "asc" } },
                education: { orderBy: { order: "asc" } },
                skills: { orderBy: { order: "asc" } },
                languages: { orderBy: { order: "asc" } },
                certifications: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    })

    if (!application || application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    if (!application.user.profile) {
      return NextResponse.json(
        { error: "Profil nicht gefunden. Bitte fülle zuerst dein Profil aus." },
        { status: 400 }
      )
    }

    // Check usage limit (only for non-PRO users)
    const usageStatus = await checkUsageLimit(session.user.id)
    if (!usageStatus.allowed && usageStatus.limit !== Infinity) {
      return NextResponse.json(
        { 
          error: `Sie haben Ihr monatliches Limit von ${usageStatus.limit} Generationen erreicht. Bitte upgraden Sie Ihren Plan oder warten Sie bis zum nächsten Monat.`,
          errorCode: "USAGE_LIMIT_EXCEEDED",
          usageStatus
        },
        { status: 403 }
      )
    }

    const profile = application.user.profile
    const user = application.user

    // Build profile data for AI
    const profileData = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      tagline: profile.tagline || "",
      email: profile.email || user.email || "",
      phone: profile.phone || "",
      location: `${profile.city || ""}, ${profile.country || "Schweiz"}`.trim(),
      linkedIn: profile.linkedInUrl || "",
      summary: profile.summary || "",
      experiences: profile.experiences.map((exp) => {
        const formatDate = (date: Date) => {
          const month = String(date.getMonth() + 1).padStart(2, "0")
          const year = date.getFullYear()
          return `${month}/${year}`
        }
        return {
          jobTitle: exp.jobTitle,
          company: exp.company,
          location: exp.location,
          startDate: formatDate(exp.startDate), // MM/YYYY
          endDate: exp.isCurrent ? null : exp.endDate ? formatDate(exp.endDate) : null,
          isCurrent: exp.isCurrent,
          bullets: exp.bullets ? JSON.parse(exp.bullets) : [],
        }
      }),
      education: profile.education.map((edu) => ({
        degree: edu.degree,
        institution: edu.institution,
        location: edu.location,
        startDate: edu.startDate ? edu.startDate.getFullYear().toString() : null,
        endDate: edu.endDate ? edu.endDate.getFullYear().toString() : null,
        grade: edu.grade,
      })),
      certifications: profile.certifications.map((cert) => ({
        name: cert.name,
        issuer: cert.issuer,
        year: cert.year,
      })),
      languages: profile.languages.map((lang) => ({
        name: lang.name,
        level: lang.level,
      })),
      skills: profile.skills.reduce((acc: any, skill: any) => {
        if (!acc[skill.category]) {
          acc[skill.category] = []
        }
        acc[skill.category].push(skill.name)
        return acc
      }, {}),
    }

    // Build job posting data
    const jobData = {
      title: application.jobTitle,
      company: application.company,
      location: application.jobLocation,
      description: application.jobDescription || "",
      requirements: application.jobRequirements ? JSON.parse(application.jobRequirements) : [],
      niceToHave: application.jobNiceToHave ? JSON.parse(application.jobNiceToHave) : [],
    }

    // Check if Anthropic is configured
    const anthropicError = getAnthropicConfigError()
    if (anthropicError) {
      return NextResponse.json(
        { 
          error: anthropicError,
          errorCode: "ANTHROPIC_NOT_CONFIGURED"
        },
        { status: 503 }
      )
    }

    // Build the full job posting text for language detection
    const fullJobPostingText = `
${jobData.title}
${jobData.description}
${jobData.requirements.join("\n")}
${jobData.niceToHave.join("\n")}
`.trim()

    // Extract data for the prompt
    const languagesList = profileData.languages.map((l: { name: string; level: string }) => `${l.name} (${l.level})`).join(", ") || "Keine angegeben"
    const certsList = profileData.certifications.map((c: { name: string }) => c.name).join(", ") || "Keine angegeben"

    // Detect language of job posting (simple heuristic)
    const germanIndicators = ['und', 'der', 'die', 'das', 'mit', 'für', 'bei', 'zur', 'zum', 'sowie', 'oder', 'einen', 'eine', 'einem', 'einer', 'dein', 'deine', 'wir', 'uns', 'Sie', 'Ihr', 'Ihre', 'du', 'bist', 'hast', 'kannst', 'bewirken', 'bringst']
    const textLower = fullJobPostingText.toLowerCase()
    const germanWordCount = germanIndicators.filter(word => textLower.includes(` ${word} `) || textLower.startsWith(`${word} `) || textLower.includes(` ${word}.`) || textLower.includes(` ${word},`)).length
    const isGerman = germanWordCount >= 3

    // Build user prompt with explicit examples
    const userPrompt = `AUFGABE: Erstelle einen CV für diese Bewerbung.

WICHTIGSTE REGEL: Der CV MUSS komplett auf ${isGerman ? "DEUTSCH" : "ENGLISCH"} sein, auch wenn die Profildaten auf Englisch sind!

TAGLINE-REGEL: Die aktuelle Tagline "${profileData.tagline}" passt NICHT zum Inserat "${jobData.title}". 
Du MUSST eine NEUE Tagline erstellen, die zum Inserat passt!

BEISPIEL für Tagline-Anpassung:
- Inserat sucht: "Strategie- und Portfoliomanager:in KMU"
- Bewerber war: "Regulatory Compliance Specialist" 
- FALSCH: "Regulatory Compliance & AI Governance Specialist" (Original übernommen)
- RICHTIG: "Strategie & Transformationsexperte" oder "Senior Strategy Consultant"

STELLENINSERAT:
${fullJobPostingText}

PROFIL DES BEWERBERS:
${JSON.stringify(profileData, null, 2)}

ANWEISUNGEN:
1. SPRACHE: Alles auf ${isGerman ? "DEUTSCH" : "ENGLISCH"} übersetzen!
2. TAGLINE: Neue Tagline erstellen die zu "${jobData.title}" passt (NICHT "${profileData.tagline}")
3. SUMMARY: Auf ${isGerman ? "Deutsch" : "Englisch"} schreiben, Keywords aus Inserat verwenden
4. BULLETS: Auf ${isGerman ? "Deutsch" : "Englisch"} übersetzen, Keywords integrieren
5. SKILLS: Kategorien passend zum Inserat benennen. WICHTIG: Jede Kategorie muss MEHRERE Kompetenzen enthalten (mindestens 3-5 pro Kategorie), getrennt durch " | " im Format: "Kategorie: Kompetenz 1 | Kompetenz 2 | Kompetenz 3 | ..."
6. SPRACHEN: Nur diese verwenden: ${languagesList}
7. ZERTIFIKATE: Nur diese verwenden: ${certsList}
${isGerman ? "8. FORMAT: ss statt ß (Schweizer Hochdeutsch)" : ""}

Antworte NUR mit dem JSON-Objekt im geforderten Format.`

    // Generate CV with Claude
    const response = await anthropic!.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: CV_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/```json\s*(\{[\s\S]*?\})\s*```/)
    const jsonText = jsonMatch ? jsonMatch[1] : content.text.match(/\{[\s\S]*\}/)?.[0]
    
    if (!jsonText) {
      throw new Error("Could not parse CV from response")
    }

    const generatedCv = JSON.parse(jsonText)
    const explanation = content.text.split("```")[2]?.trim() || content.text.split("```json")[1]?.split("```")[1]?.trim() || ""


    // POST-PROCESSING: Force tagline change if Claude didn't change it
    const originalTagline = profileData.tagline
    const generatedTagline = generatedCv.header?.tagline || ""
    
    // Check if tagline is still the same (case-insensitive, trimmed)
    if (generatedTagline.toLowerCase().trim() === originalTagline.toLowerCase().trim()) {
      
      // Extract keywords from job title
      const jobTitleLower = jobData.title.toLowerCase()
      let newTagline = ""
      
      // Try to create a new tagline based on job title and experiences
      if (jobTitleLower.includes("strategie") || jobTitleLower.includes("portfolio")) {
        // Check if user has strategy/consulting experience
        const hasStrategyExp = profileData.experiences.some((exp: any) => 
          exp.jobTitle.toLowerCase().includes("consultant") || 
          exp.jobTitle.toLowerCase().includes("architect") ||
          exp.jobTitle.toLowerCase().includes("strategie") ||
          exp.bullets.some((b: string) => b.toLowerCase().includes("strateg") || b.toLowerCase().includes("transformation"))
        )
        
        if (hasStrategyExp) {
          newTagline = isGerman ? "Strategie & Transformationsexperte" : "Strategy & Transformation Expert"
        } else {
          // Fallback: use most relevant experience
          const mostRecentExp = profileData.experiences[0]
          if (mostRecentExp) {
            newTagline = isGerman ? `${mostRecentExp.jobTitle} & Strategieberatung` : `${mostRecentExp.jobTitle} & Strategy Consulting`
          }
        }
      } else {
        // Generic fallback: use job title keywords + "Specialist"
        const keywords = jobData.title.split(/[\s-&]+/).filter((w: string) => w.length > 3).slice(0, 2)
        newTagline = isGerman ? `${keywords.join(" & ")} Spezialist` : `${keywords.join(" & ")} Specialist`
      }
      
      if (newTagline && generatedCv.header) {
        generatedCv.header.tagline = newTagline
      }
    }

    // POST-PROCESSING: Ensure isCurrent is correctly set for experiences
    if (generatedCv.experiences && Array.isArray(generatedCv.experiences)) {
      generatedCv.experiences.forEach((genExp: any, idx: number) => {
        // Match generated experience with original profile experience by index or job title
        const originalExp = profileData.experiences[idx] || 
          profileData.experiences.find((origExp: any) => 
            origExp.jobTitle.toLowerCase() === genExp.jobTitle?.toLowerCase() ||
            origExp.company.toLowerCase() === genExp.company?.toLowerCase()
          )
        
        if (originalExp) {
          // Set isCurrent based on original profile data
          genExp.isCurrent = originalExp.isCurrent
          // If isCurrent is true, ensure endDate is null
          if (genExp.isCurrent) {
            genExp.endDate = null
          }
        } else {
          // Fallback: if endDate is null or missing, assume it's current
          if (!genExp.endDate || genExp.endDate === null) {
            genExp.isCurrent = true
            genExp.endDate = null
          } else {
            genExp.isCurrent = false
          }
        }
      })
    }

    // POST-PROCESSING: Force German translation if needed
    if (isGerman && generatedCv.summary) {
      // Simple check: if summary contains English words that should be German
      const englishWords = ['the', 'and', 'with', 'for', 'years', 'experience', 'professional']
      const summaryLower = generatedCv.summary.toLowerCase()
      const hasEnglish = englishWords.some(word => summaryLower.includes(` ${word} `))
      // Note: If summary still contains English, Claude should have translated it
    }

    // Generate structured insights/explanation
    // WICHTIG: Erklärungen sollen IMMER auf Deutsch sein, unabhängig von der Sprache des CVs
    const insightsPrompt = `Erstelle eine strukturierte Erklärung für den generierten CV. 
    
Der CV wurde für diese Stelle generiert: "${jobData.title}" bei ${jobData.company}

Generierter CV:
${JSON.stringify(generatedCv, null, 2)}

Original Profil Tagline: "${profileData.tagline}"
Neue Tagline im CV: "${generatedCv.header?.tagline || ""}"

Erstelle eine verständliche Erklärung in DEUTSCH für Durchschnitts-User, die erklärt:
1. Warum die Tagline angepasst wurde und wie sie zur Stelle passt
2. Welche Keywords aus dem Inserat im Summary verwendet wurden
3. Wie die Erfahrungen/Bullets auf die Stelle zugeschnitten wurden
4. Welche Skills besonders hervorgehoben wurden und warum
5. Weitere wichtige Anpassungen

Antworte NUR mit diesem JSON-Format (keine zusätzlichen Erklärungen):
\`\`\`json
{
  "sections": [
    {
      "title": "Tagline",
      "icon": "tag",
      "points": [
        "Kurze, verständliche Erklärung Punkt 1",
        "Kurze, verständliche Erklärung Punkt 2"
      ]
    },
    {
      "title": "Zusammenfassung",
      "icon": "file-text",
      "points": [
        "Erklärung wie Keywords integriert wurden"
      ]
    },
    {
      "title": "Erfahrungen",
      "icon": "briefcase",
      "points": [
        "Erklärung wie Erfahrungen angepasst wurden"
      ]
    },
    {
      "title": "Kompetenzen",
      "icon": "star",
      "points": [
        "Erklärung welche Skills hervorgehoben wurden"
      ]
    }
  ]
}
\`\`\`

WICHTIG: 
- Maximal 3-4 Sections
- Jede Section hat 1-3 kurze, verständliche Punkte
- Verwende einfache Sprache, keine Fachbegriffe
- Erkläre WARUM etwas gemacht wurde, nicht nur WAS`

    let cvInsights = null
    try {
      const insightsResponse = await anthropic!.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: insightsPrompt,
          },
        ],
      })

      const insightsContent = insightsResponse.content[0]
      if (insightsContent.type === "text") {
        const insightsJsonMatch = insightsContent.text.match(/```json\s*(\{[\s\S]*?\})\s*```/)
        const insightsJsonText = insightsJsonMatch ? insightsJsonMatch[1] : insightsContent.text.match(/\{[\s\S]*\}/)?.[0]
        
        if (insightsJsonText) {
          cvInsights = JSON.parse(insightsJsonText)
        } else {
        }
      }
    } catch (error) {
      console.error("Error generating insights:", error)
      // Fallback: Create basic insights structure (always in German)
      cvInsights = {
        sections: [
          {
            title: "Tagline",
            icon: "tag",
            points: [
              `Die Tagline wurde von "${profileData.tagline}" zu "${generatedCv.header?.tagline || ""}" angepasst, um besser zur Stelle "${jobData.title}" zu passen.`
            ]
          }
        ]
      }
    }

    // Update application
    const existingMessages = application.chatMessages 
      ? JSON.parse(application.chatMessages) 
      : []
    let updated
    try {
      updated = await prisma.application.update({
        where: { id: params.id },
        data: {
          generatedCv: JSON.stringify(generatedCv),
          cvInsights: cvInsights ? JSON.stringify(cvInsights) : null,
          status: "CV_GENERATED",
          chatMessages: JSON.stringify([
            ...existingMessages,
            {
              role: "assistant",
              content: explanation || "CV wurde erfolgreich generiert.",
              timestamp: new Date().toISOString(),
            },
          ]),
        },
      })
    } catch (updateError) {
      throw updateError
    }

    // Increment usage count (only for non-PRO users)
    if (usageStatus.limit !== Infinity) {
      await incrementUsage(session.user.id, params.id, "CV_GENERATED")
    }

    // Parse chatMessages and generatedCv before returning
    const parsedApplication = {
      ...updated,
      chatMessages: updated.chatMessages 
        ? (typeof updated.chatMessages === 'string' 
            ? JSON.parse(updated.chatMessages) 
            : updated.chatMessages)
        : [],
      generatedCv: updated.generatedCv
        ? (typeof updated.generatedCv === 'string'
            ? JSON.parse(updated.generatedCv)
            : updated.generatedCv)
        : null,
      cvInsights: updated.cvInsights
        ? (typeof updated.cvInsights === 'string'
            ? JSON.parse(updated.cvInsights)
            : updated.cvInsights)
        : null
    }

    return NextResponse.json({
      application: parsedApplication,
      cv: generatedCv,
      explanation,
    })
  } catch (error) {
    console.error("CV generation error:", error)
    return NextResponse.json(
      { error: "Fehler beim Generieren des CVs" },
      { status: 500 }
    )
  }
}

