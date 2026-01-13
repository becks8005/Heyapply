import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * Erstellt eine neue Application aus einem DiscoveredJob
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params

    // Get discovered job
    const discoveredJob = await prisma.discoveredJob.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!discoveredJob) {
      return NextResponse.json({ error: "Job nicht gefunden" }, { status: 404 })
    }

    // Check if application already exists
    if (discoveredJob.applicationId) {
      const existingApp = await prisma.application.findUnique({
        where: { id: discoveredJob.applicationId },
      })
      if (existingApp) {
        return NextResponse.json({
          application: existingApp,
          message: "Application existiert bereits",
        })
      }
    }

    // Create new application
    const application = await prisma.application.create({
      data: {
        userId,
        jobUrl: discoveredJob.jobUrl,
        jobTitle: discoveredJob.jobTitle,
        company: discoveredJob.company,
        jobLocation: discoveredJob.location,
        jobDescription: discoveredJob.description,
        jobRequirements: discoveredJob.requirements,
        jobNiceToHave: discoveredJob.niceToHave,
        status: "DRAFT",
      },
    })

    // Update discovered job
    await prisma.discoveredJob.update({
      where: { id },
      data: {
        applicationId: application.id,
        status: "APPLIED",
      },
    })

    return NextResponse.json({
      application,
      message: "Application erstellt",
    })
  } catch (error: any) {
    console.error("Error creating application from job:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen der Application" },
      { status: 500 }
    )
  }
}
