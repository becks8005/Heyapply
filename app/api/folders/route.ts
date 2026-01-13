import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folders = await prisma.folder.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ folders })
  } catch (error) {
    console.error("Folders fetch error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Ordner" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, color } = body

    if (!name) {
      return NextResponse.json(
        { error: "Ordnername erforderlich" },
        { status: 400 }
      )
    }

    const folder = await prisma.folder.create({
      data: {
        userId: session.user.id,
        name,
        color: color || "#6366f1",
      },
    })

    return NextResponse.json({ folder })
  } catch (error: any) {
    console.error("Folder creation error:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ein Ordner mit diesem Namen existiert bereits" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Ordners" },
      { status: 500 }
    )
  }
}

