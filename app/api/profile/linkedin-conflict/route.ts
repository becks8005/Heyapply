import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Store LinkedIn conflict data temporarily in encrypted cookie
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { conflicts, newData } = body

    // Store in cookie (encrypted by Next.js by default)
    const cookieStore = await cookies()
    cookieStore.set(`linkedin-conflict-${session.user.id}`, JSON.stringify({ conflicts, newData }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("LinkedIn conflict storage error:", error)
    return NextResponse.json({ error: "Failed to store conflict data" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cookieStore = await cookies()
    const conflictData = cookieStore.get(`linkedin-conflict-${session.user.id}`)

    if (!conflictData) {
      return NextResponse.json({ error: "No conflict data found" }, { status: 404 })
    }

    const data = JSON.parse(conflictData.value)

    // Delete cookie after reading
    cookieStore.delete(`linkedin-conflict-${session.user.id}`)

    return NextResponse.json(data)
  } catch (error) {
    console.error("LinkedIn conflict retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve conflict data" }, { status: 500 })
  }
}

