import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { scrapeJobPosting } from "@/lib/job-scraper"
import { incrementUsage, checkUsageLimit } from "@/lib/usage-tracker"
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
    const { jobUrl } = body

    if (!jobUrl) {
      return NextResponse.json(
        { error: "Job-URL erforderlich" },
        { status: 400 }
      )
    }

    // Verify application belongs to user
    const application = await prisma.application.findUnique({
      where: { id: params.id },
    })

    if (!application || application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Check usage limit again (in case it changed since creation)
    const usageStatus = await checkUsageLimit(session.user.id)
    if (!usageStatus.allowed) {
      return NextResponse.json(
        {
          error: "LIMIT_REACHED",
          message: "Du hast dein monatliches Limit erreicht",
          usageStatus,
        },
        { status: 403 }
      )
    }

    // Scrape job posting
    const jobPosting = await scrapeJobPosting(jobUrl)

    // Update application
    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        jobUrl,
        jobTitle: jobPosting.jobTitle,
        company: jobPosting.company,
        jobLocation: jobPosting.location,
        jobDescription: jobPosting.description,
        jobRequirements: JSON.stringify(jobPosting.requirements),
        jobNiceToHave: JSON.stringify(jobPosting.niceToHave || []),
        contactPerson: jobPosting.contactPerson,
        chatMessages: JSON.stringify([
          {
            role: "assistant",
            content: `Ich habe das Stelleninserat für die Position "${jobPosting.jobTitle}" bei "${jobPosting.company}" analysiert. Ich erstelle jetzt einen optimierten CV, der auf deinem Profil basiert und auf die Anforderungen dieser Stelle zugeschnitten ist...`,
            timestamp: new Date().toISOString(),
          },
        ]),
      },
    })

    // Increment usage ONLY after successful analysis
    await incrementUsage(session.user.id, application.id)

    return NextResponse.json({
      application: updated,
      jobPosting,
    })
  } catch (error: any) {
    console.error("Job analysis error:", error)
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      status: error.status,
      statusText: error.statusText,
    })
    
    // Provide more specific error messages
    let errorMessage = "Fehler beim Analysieren des Stelleninserats"
    
    // Check for API key issues
    if (error.message?.includes("api_key") || error.message?.includes("authentication") || error.status === 401) {
      errorMessage = "API-Schlüssel-Fehler: Bitte überprüfe deine ANTHROPIC_API_KEY in der .env.local Datei."
    } else if (error.message?.includes("Failed to fetch") || error.status === 403 || error.status === 401) {
      errorMessage = "Die Job-URL konnte nicht geladen werden. LinkedIn könnte eine Anmeldung erfordern. Bitte versuche es mit einer anderen URL oder stelle sicher, dass die Stelle öffentlich zugänglich ist."
    } else if (error.message?.includes("Could not parse")) {
      errorMessage = "Die Job-Informationen konnten nicht ausgelesen werden. Bitte versuche es mit einer anderen URL."
    } else if (error.message?.includes("rate limit") || error.status === 429) {
      errorMessage = "API-Rate-Limit erreicht. Bitte versuche es später erneut."
    } else if (error.status === 500 || error.message?.includes("Internal Server Error")) {
      errorMessage = "Ein Serverfehler ist aufgetreten. Bitte versuche es später erneut."
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

