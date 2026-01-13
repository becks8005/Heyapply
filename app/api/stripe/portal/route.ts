import { auth } from "@/lib/auth"
import { createBillingPortalSession } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const portalSession = await createBillingPortalSession(
      session.user.id,
      `${process.env.NEXTAUTH_URL}/settings/billing`
    )

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Portal error:", error)
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Portal-Session" },
      { status: 500 }
    )
  }
}

