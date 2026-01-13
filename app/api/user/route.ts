import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        monthlyApplicationCount: true,
        usageResetDate: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("User fetch error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Benutzerdaten" },
      { status: 500 }
    )
  }
}

