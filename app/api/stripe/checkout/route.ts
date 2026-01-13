import { auth } from "@/lib/auth"
import { createCheckoutSession } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { tier } = body

    if (!tier || !["BASIS", "PRO"].includes(tier)) {
      return NextResponse.json(
        { error: "Ungültiger Plan" },
        { status: 400 }
      )
    }

    const checkoutSession = await createCheckoutSession(
      session.user.id,
      tier,
      `${process.env.NEXTAUTH_URL}/settings/billing`
    )

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Checkout-Session" },
      { status: 500 }
    )
  }
}

