import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error("Applications fetch error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Bewerbungen" },
      { status: 500 }
    )
  }
}
