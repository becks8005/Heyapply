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

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const source = searchParams.get("source")
    const minScore = searchParams.get("minScore")
    const sortBy = searchParams.get("sortBy") || "matchScore" // matchScore, discoveredAt, company

    const where: any = { userId }
    
    if (status) {
      where.status = status
    }
    
    if (source) {
      where.source = source
    }
    
    if (minScore) {
      where.matchScore = { gte: parseFloat(minScore) }
    }

    const orderBy: any = {}
    if (sortBy === "matchScore") {
      orderBy.matchScore = "desc"
    } else if (sortBy === "discoveredAt") {
      orderBy.discoveredAt = "desc"
    } else if (sortBy === "company") {
      orderBy.company = "asc"
    }

    let jobs = await prisma.discoveredJob.findMany({
      where,
      orderBy,
      take: 100,
    })

    // Zusätzliche Filterung: Entferne Jobs mit offensichtlichen kritischen Mismatches
    // Dies hilft, Jobs zu filtern, die vor den Verbesserungen gespeichert wurden
    jobs = jobs.filter(job => {
      // Filtere IT-Positionen mit niedrigem Score (wahrscheinlich ohne IT-Erfahrung)
      const isITPosition: boolean = !!(job.jobTitle.toLowerCase().includes('it') ||
                          job.jobTitle.toLowerCase().includes('head of it') ||
                          job.jobTitle.toLowerCase().includes('cto') ||
                          job.jobTitle.toLowerCase().includes('information technology') ||
                          (job.description && (
                            job.description.toLowerCase().includes('it governance') ||
                            job.description.toLowerCase().includes('cybersecurity') ||
                            job.description.toLowerCase().includes('software engineer') ||
                            job.description.toLowerCase().includes('developer')
                          )))
      
      // Prüfe Weaknesses für kritische Mismatches
      let hasCriticalMismatch = false
      if (job.matchReasons) {
        try {
          const reasons = typeof job.matchReasons === 'string' ? JSON.parse(job.matchReasons) : job.matchReasons
          const reasonsText: string = Array.isArray(reasons) ? reasons.join(' ').toLowerCase() : String(reasons || '').toLowerCase()
          
          hasCriticalMismatch = !!(reasonsText.includes('it-position ohne it-erfahrung') ||
                               reasonsText.includes('kritischer seniority-mismatch') ||
                               reasonsText.includes('branchen-mismatch') ||
                               reasonsText.includes('keine relevante it-erfahrung') ||
                               (isITPosition && reasonsText.includes('keine it-erfahrung')))
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // IT-Positionen mit Score < 50 oder kritischem Mismatch werden gefiltert
      if (isITPosition && (
        (job.matchScore !== null && job.matchScore !== undefined && job.matchScore < 50) ||
        hasCriticalMismatch
      )) {
        return false
      }
      
      // Filtere auch andere Jobs mit sehr niedrigem Score oder kritischem Mismatch
      if ((job.matchScore !== null && job.matchScore !== undefined && job.matchScore < 35) ||
          (hasCriticalMismatch && job.matchScore !== null && job.matchScore !== undefined && job.matchScore < 60)) {
        return false
      }
      
      return true
    })

    return NextResponse.json({ jobs })
  } catch (error: any) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden der Jobs" },
      { status: 500 }
    )
  }
}
