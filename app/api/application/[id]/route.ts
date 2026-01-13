import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrementUsage } from "@/lib/usage-tracker"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        folder: true,
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

    // Parse chatMessages, generatedCv, cvInsights, and coverLetterInsights if they are strings
    const parsedApplication = {
      ...application,
      chatMessages: application.chatMessages 
        ? (typeof application.chatMessages === 'string' 
            ? JSON.parse(application.chatMessages) 
            : application.chatMessages)
        : [],
      generatedCv: application.generatedCv
        ? (typeof application.generatedCv === 'string'
            ? JSON.parse(application.generatedCv)
            : application.generatedCv)
        : null,
      cvInsights: application.cvInsights
        ? (typeof application.cvInsights === 'string'
            ? JSON.parse(application.cvInsights)
            : application.cvInsights)
        : null,
      coverLetterInsights: application.coverLetterInsights
        ? (typeof application.coverLetterInsights === 'string'
            ? JSON.parse(application.coverLetterInsights)
            : application.coverLetterInsights)
        : null
    }

    return NextResponse.json({ application: parsedApplication })
  } catch (error) {
    console.error("Application fetch error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Bewerbung" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Verify ownership
    const existing = await prisma.application.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Update application
    const updated = await prisma.application.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json({ application: updated })
  } catch (error) {
    console.error("Application update error:", error)
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Bewerbung" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const application = await prisma.application.findUnique({
      where: { id: params.id },
    })

    if (!application || application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Decrement usage if this application was counted (i.e., if it was analyzed)
    // Only decrement if the application has been analyzed (has jobTitle other than default)
    if (application.jobTitle && application.jobTitle !== "Neue Bewerbung") {
      await decrementUsage(session.user.id, application.id).catch((err) => {
        console.error("Error decrementing usage:", err)
        // Don't fail the delete if decrement fails
      })
    }

    await prisma.application.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Application delete error:", error)
    return NextResponse.json(
      { error: "Fehler beim Löschen der Bewerbung" },
      { status: 500 }
    )
  }
}

