import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkUsageLimit } from "@/lib/usage-tracker"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has uploaded a CV
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { originalCvUrl: true },
    })

    if (!profile || !profile.originalCvUrl) {
      return NextResponse.json(
        {
          error: "NO_CV_UPLOADED",
          message: "Bitte lade zuerst deinen CV hoch, bevor du eine Bewerbung erstellst",
        },
        { status: 403 }
      )
    }

    // Check usage limit
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

    const body = await req.json()
    const { jobUrl, folderId } = body

    // Create application
    // NOTE: Usage is NOT incremented here - it will be incremented only after successful analysis
    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        folderId: folderId || null,
        jobUrl: jobUrl || null,
        jobTitle: "Neue Bewerbung",
        company: "",
        status: "DRAFT",
        chatMessages: "[]",
        jobRequirements: "[]",
        jobNiceToHave: "[]",
      },
    })

    return NextResponse.json({ application })
  } catch (error) {
    console.error("Application creation error:", error)
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Bewerbung" },
      { status: 500 }
    )
  }
}

