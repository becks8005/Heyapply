import { auth } from "@/lib/auth"
import { checkUsageLimit } from "@/lib/usage-tracker"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const usageStatus = await checkUsageLimit(session.user.id)
    return NextResponse.json(usageStatus)
  } catch (error) {
    console.error("Usage fetch error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Nutzungsdaten" },
      { status: 500 }
    )
  }
}

