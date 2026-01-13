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
    const { name, color } = body

    // Verify ownership
    const folder = await prisma.folder.findUnique({
      where: { id: params.id },
    })

    if (!folder || folder.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      )
    }

    const updated = await prisma.folder.update({
      where: { id: params.id },
      data: {
        name: name || folder.name,
        color: color || folder.color,
      },
    })

    return NextResponse.json({ folder: updated })
  } catch (error) {
    console.error("Folder update error:", error)
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Ordners" },
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
    const folder = await prisma.folder.findUnique({
      where: { id: params.id },
    })

    if (!folder || folder.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      )
    }

    await prisma.folder.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Folder delete error:", error)
    return NextResponse.json(
      { error: "Fehler beim Löschen des Ordners" },
      { status: 500 }
    )
  }
}

