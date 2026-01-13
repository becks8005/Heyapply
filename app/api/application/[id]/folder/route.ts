import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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
    const { folderId } = body

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

    // Verify folder ownership if folderId provided
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      })

      if (!folder || folder.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        )
      }
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        folderId: folderId || null,
      },
    })

    return NextResponse.json({ application: updated })
  } catch (error) {
    console.error("Application folder update error:", error)
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Ordners" },
      { status: 500 }
    )
  }
}

