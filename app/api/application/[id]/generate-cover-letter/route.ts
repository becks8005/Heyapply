import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { anthropic, getAnthropicConfigError } from "@/lib/anthropic"
import { COVER_LETTER_SYSTEM_PROMPT } from "@/prompts/cover-letter-system-prompt"
import { logRegeneration } from "@/lib/usage-tracker"
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

    const body = await req.json()

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
        { error: "Profil nicht gefunden" },
        { status: 400 }
      )
    }

    const profile = application.user.profile
    const user = application.user

    // Get tagline from generated CV if available, otherwise from profile
    let cvTagline = profile.tagline || ""
    if (application.generatedCv) {
      try {
        const generatedCv = typeof application.generatedCv === 'string' 
          ? JSON.parse(application.generatedCv) 
          : application.generatedCv
        cvTagline = generatedCv?.header?.tagline || profile.tagline || ""
      } catch (error) {
        console.error("Error parsing generated CV:", error)
        // Fallback to profile tagline if CV parsing fails
        cvTagline = profile.tagline || ""
      }
    }

    // Build profile summary for cover letter
    const profileSummary = {
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      tagline: cvTagline, // Use CV tagline instead of profile tagline
      email: profile.email || user.email || "",
      phone: profile.phone || "",
      location: `${profile.city || ""}, ${profile.country || "Schweiz"}`.trim(),
      linkedIn: profile.linkedInUrl || "",
      summary: profile.summary || "",
      keyExperiences: profile.experiences.slice(0, 3).map((exp) => {
        let bullets: string[] = []
        try {
          bullets = exp.bullets ? JSON.parse(exp.bullets) : []
        } catch (error) {
          console.error("Error parsing experience bullets:", error)
          bullets = []
        }
        return {
          jobTitle: exp.jobTitle,
          company: exp.company,
          bullets: bullets.slice(0, 2),
        }
      }),
      keySkills: profile.skills.slice(0, 10).map((s) => s.name),
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

    // Combine job description and requirements for analysis
    const jobDescription = application.jobDescription || ""
    let jobRequirements: string[] = []
    try {
      jobRequirements = application.jobRequirements ? JSON.parse(application.jobRequirements) : []
    } catch (error) {
      console.error("Error parsing job requirements:", error)
      jobRequirements = []
    }
    const fullJobPosting = `${jobDescription}\n\n${jobRequirements.join("\n")}`

    // Extract contact person if available
    const contactPerson = application.contactPerson || null
    // Extract first name from contact person if available
    const contactFirstName = contactPerson ? contactPerson.split(' ')[0] : null

    // Generate cover letter
    const response = await anthropic!.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: COVER_LETTER_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Create a cover letter for this application.

CANDIDATE PROFILE:
Name: ${profileSummary.name}
Tagline: ${profileSummary.tagline}
Summary: ${profileSummary.summary}

Key Experiences:
${profileSummary.keyExperiences.map((exp) => 
  `${exp.jobTitle} at ${exp.company}:\n${exp.bullets.join("\n")}`
).join("\n\n")}

Key Skills: ${profileSummary.keySkills.join(", ")}

JOB POSTING:
Title: ${application.jobTitle}
Company: ${application.company}
Location: ${application.jobLocation || "Not specified"}

Full Job Posting Text:
${fullJobPosting}

IMPORTANT INSTRUCTIONS FOR GREETING AND LANGUAGE:
1. Analyze the job posting to determine its language (German or English)
2. Write the cover letter in the SAME language as the job posting
3. For German postings:
   - Check if the reader is addressed with "Sie" (formal) or "du" (informal) in the job posting
   ${contactPerson ? `- CRITICAL: The contact person is "${contactPerson}". If the job posting uses "du" (informal), you MUST start the cover letter with "Lieber ${contactFirstName}" (NOT "Liebes ${application.company}-Team"). If the job posting uses "Sie" (formal), use "Sehr geehrter Herr ${contactPerson.split(' ').slice(-1)[0]}" or "Sehr geehrte Frau ${contactPerson.split(' ').slice(-1)[0]}".` : "- No specific contact person was found. Check the job posting text for any contact person mentioned."}
   - Use the appropriate greeting based on these findings:
     * "Sie" + no contact: "Sehr geehrte Damen und Herren"
     * "Sie" + contact person: "Sehr geehrter Herr [Lastname]" or "Sehr geehrte Frau [Lastname]"
     * "du" + no contact: "Liebes ${application.company}-Team"
     ${contactFirstName ? `     * "du" + contact person (${contactPerson}): "Lieber ${contactFirstName}" (MANDATORY - you MUST use this exact greeting if "du" is used)` : `     * "du" + contact person: "Lieber [Firstname]"`}
   - CRITICAL PRONOUN RULE - MANDATORY CONSISTENCY:
     * If greeting is "Liebes ${application.company}-Team" (plural): You MUST use PLURAL pronouns throughout the ENTIRE cover letter: "ihr", "euch", "euer", "eure", "euren", "eurem", etc. NEVER use singular "du", "dir", "dich", "dein", "deine", etc.
     * If greeting is "Lieber ${contactFirstName || '[Firstname]'}" (singular): You MUST use SINGULAR pronouns throughout the ENTIRE cover letter: "du", "dir", "dich", "dein", "deine", "deinem", etc. NEVER use plural "ihr", "euch", etc.
     * If greeting is "Sehr geehrte..." (formal): You MUST use formal "Sie", "Ihnen", "Ihr", "Ihre", etc. throughout the ENTIRE cover letter
     * THE PRONOUNS IN THE GREETING MUST MATCH THE PRONOUNS USED THROUGHOUT THE ENTIRE TEXT - NO EXCEPTIONS!
4. For English postings:
   - Use "Dear ${application.company} Team" (e.g., "Dear ${application.company} Team")
   - Only use a personal name if a contact person is clearly mentioned and it's appropriate

Create a compelling, personal cover letter that shows why the candidate is perfect for this position.`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }


    const coverLetter = content.text.trim()

    // Detect language from cover letter
    const isEnglish = coverLetter.toLowerCase().includes("dear") || 
                      coverLetter.toLowerCase().includes("best regards") ||
                      coverLetter.toLowerCase().includes("kind regards")

    // Generate structured insights/explanation
    // WICHTIG: Erklärungen sollen IMMER auf Deutsch sein, unabhängig von der Sprache des Anschreibens
    const insightsPrompt = `Erstelle eine strukturierte Erklärung für das generierte Anschreiben. 
    
Das Anschreiben wurde für diese Stelle generiert: "${application.jobTitle}" bei ${application.company}

Generiertes Anschreiben:
${coverLetter}

Erstelle eine verständliche Erklärung in DEUTSCH für Durchschnitts-User, die erklärt:
1. Warum die Anrede gewählt wurde (formell/informell, mit/ohne Kontaktperson)
2. Welche Sprache verwendet wurde und warum
3. Welche Hauptargumente im Anschreiben verwendet wurden
4. Wie die Erfahrungen des Bewerbers mit der Stelle verknüpft wurden
5. Weitere wichtige Anpassungen

Antworte NUR mit diesem JSON-Format (keine zusätzlichen Erklärungen):
\`\`\`json
{
  "sections": [
    {
      "title": "Anrede & Sprache",
      "icon": "file-text",
      "points": [
        "Kurze, verständliche Erklärung Punkt 1",
        "Kurze, verständliche Erklärung Punkt 2"
      ]
    },
    {
      "title": "Hauptargumente",
      "icon": "lightbulb",
      "points": [
        "Erklärung welche Argumente verwendet wurden"
      ]
    },
    {
      "title": "Erfahrungen",
      "icon": "briefcase",
      "points": [
        "Erklärung wie Erfahrungen verknüpft wurden"
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

    let coverLetterInsights = null
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
          coverLetterInsights = JSON.parse(insightsJsonText)
        }
      }
    } catch (error) {
      console.error("Error generating cover letter insights:", error)
      // Fallback: Create basic insights structure (always in German)
      coverLetterInsights = {
        sections: [
          {
            title: "Anrede & Sprache",
            icon: "file-text",
            points: [
              `Das Anschreiben wurde auf ${isEnglish ? "Englisch" : "Deutsch"} verfasst, passend zur Sprache des Stelleninserats.`
            ]
          }
        ]
      }
    }

    // Update application
    const existingMessages = application.chatMessages 
      ? JSON.parse(application.chatMessages) 
      : []
    const coverLetterInsightsString = coverLetterInsights ? JSON.stringify(coverLetterInsights) : null
    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        coverLetter,
        coverLetterInsights: coverLetterInsightsString,
        status: "COMPLETE",
        chatMessages: JSON.stringify([
          ...existingMessages,
          {
            role: "assistant",
            content: "Anschreiben wurde erfolgreich generiert.",
            timestamp: new Date().toISOString(),
          },
        ]),
      },
    })

    // Log regeneration
    await logRegeneration(session.user.id, params.id, "COVER_LETTER_GENERATED")

    // Parse chatMessages and coverLetterInsights before returning
    const parsedApplication = {
      ...updated,
      chatMessages: updated.chatMessages 
        ? (typeof updated.chatMessages === 'string' 
            ? JSON.parse(updated.chatMessages) 
            : updated.chatMessages)
        : [],
      coverLetterInsights: updated.coverLetterInsights
        ? (typeof updated.coverLetterInsights === 'string'
            ? JSON.parse(updated.coverLetterInsights)
            : updated.coverLetterInsights)
        : null
    }

    return NextResponse.json({
      application: parsedApplication,
      coverLetter,
    })
  } catch (error) {
    console.error("Cover letter generation error:", error)
    return NextResponse.json(
      { error: "Fehler beim Generieren des Anschreibens" },
      { status: 500 }
    )
  }
}

