import { auth } from "@/lib/auth"
import { createBillingPortalSession } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // #region agent log: stripe-portal-entry
  fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'build-stripe',hypothesisId:'S3',location:'app/api/stripe/portal/route.ts:POST',message:'Portal POST entry',data:{},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

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

