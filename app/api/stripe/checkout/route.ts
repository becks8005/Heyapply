import { auth } from "@/lib/auth"
import { createCheckoutSession } from "@/lib/stripe"
import Stripe from "stripe"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // #region agent log: stripe-checkout-entry
  fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'build-stripe',hypothesisId:'S2',location:'app/api/stripe/checkout/route.ts:POST',message:'Checkout POST entry',data:{},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

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

