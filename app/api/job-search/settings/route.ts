import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    let jobSearch = await prisma.jobSearch.findUnique({
      where: { userId },
    })

    if (!jobSearch) {
      return NextResponse.json({ settings: null })
    }

    return NextResponse.json({
      settings: {
        ...jobSearch,
        keywords: jobSearch.keywords ? JSON.parse(jobSearch.keywords) : null,
        manualJobTitles: jobSearch.manualJobTitles ? JSON.parse(jobSearch.manualJobTitles) : null,
      },
    })
  } catch (error: any) {
    console.error("Error fetching job search settings:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden der Einstellungen" },
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

    const userId = session.user.id
    const body = await req.json()
    const {
      searchJobsCh,
      searchLinkedIn,
      frequency,
      location,
      isActive,
      manualJobTitles,
      manualLocation,
    } = body

    const jobSearch = await prisma.jobSearch.upsert({
      where: { userId },
      create: {
        userId,
        searchJobsCh: searchJobsCh ?? false, // Default to false (use Adzuna)
        searchLinkedIn: searchLinkedIn ?? false, // Default to false (use Adzuna)
        frequency: frequency || "DAILY",
        location: location || null,
        isActive: isActive ?? true,
        manualJobTitles: manualJobTitles ? JSON.stringify(manualJobTitles) : null,
        manualLocation: manualLocation || null,
      },
      update: {
        ...(searchJobsCh !== undefined && { searchJobsCh }),
        ...(searchLinkedIn !== undefined && { searchLinkedIn }),
        ...(frequency && { frequency }),
        ...(location !== undefined && { location }),
        ...(isActive !== undefined && { isActive }),
        ...(manualJobTitles !== undefined && { manualJobTitles: manualJobTitles ? JSON.stringify(manualJobTitles) : null }),
        ...(manualLocation !== undefined && { manualLocation }),
      },
    })

    return NextResponse.json({
      settings: {
        ...jobSearch,
        keywords: jobSearch.keywords ? JSON.parse(jobSearch.keywords) : null,
        manualJobTitles: jobSearch.manualJobTitles ? JSON.parse(jobSearch.manualJobTitles) : null,
      },
    })
  } catch (error: any) {
    console.error("Error updating job search settings:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Speichern der Einstellungen" },
      { status: 500 }
    )
  }
}
