import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { matchJobToProfile } from "@/lib/job-matcher"
import { scrapeJobPosting, JobPosting } from "@/lib/job-scraper"
import { NextResponse } from "next/server"

/**
 * Re-matches all jobs for the current user with improved matching logic
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: true,
        experiences: true,
        education: true,
        languages: true,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: "Kein Profil gefunden" },
        { status: 400 }
      )
    }

    // Build profile data
    const profileData = {
      tagline: profile.tagline || undefined,
      summary: profile.summary || undefined,
      skills: profile.skills,
      experiences: profile.experiences.map(exp => ({
        jobTitle: exp.jobTitle,
        company: exp.company,
        bullets: exp.bullets ? (typeof exp.bullets === 'string' ? JSON.parse(exp.bullets) : exp.bullets) : undefined,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
      })),
      education: profile.education,
      languages: profile.languages,
    }

    // Get all jobs for user
    const jobs = await prisma.discoveredJob.findMany({
      where: { userId },
      take: 100, // Limit to 100 jobs to avoid timeout
    })

    let rematchedCount = 0
    let filteredCount = 0
    let errorCount = 0

    // Re-match each job
    for (const job of jobs) {
      try {
        // Re-scrape job details to get fresh data
        const jobPosting = await scrapeJobPosting(job.jobUrl)
        
        // Re-match with improved logic
        const matchResult = await matchJobToProfile(jobPosting, profileData)

        // Check if job should be filtered out
        const isITPosition = jobPosting.jobTitle.toLowerCase().includes('it') ||
                            jobPosting.jobTitle.toLowerCase().includes('head of it') ||
                            jobPosting.jobTitle.toLowerCase().includes('cto') ||
                            jobPosting.jobTitle.toLowerCase().includes('information technology') ||
                            jobPosting.description.toLowerCase().includes('it governance') ||
                            jobPosting.description.toLowerCase().includes('cybersecurity') ||
                            jobPosting.description.toLowerCase().includes('software engineer') ||
                            jobPosting.description.toLowerCase().includes('developer')
        
        const hasCriticalMismatch = matchResult.weaknesses?.some(w => 
          w.toLowerCase().includes('it-position ohne it-erfahrung') ||
          w.toLowerCase().includes('kritischer seniority-mismatch') ||
          w.toLowerCase().includes('branchen-mismatch')
        )

        // Filter out jobs with critical mismatches or low scores
        if (matchResult.score < 40 || (hasCriticalMismatch && matchResult.score < 60) || (isITPosition && matchResult.score < 50)) {
          // Delete job if it has critical mismatch
          await prisma.discoveredJob.delete({
            where: { id: job.id }
          })
          filteredCount++
          continue
        }

        // Update job with new match results
        await prisma.discoveredJob.update({
          where: { id: job.id },
          data: {
            jobTitle: jobPosting.jobTitle,
            company: jobPosting.company,
            location: jobPosting.location,
            description: jobPosting.description,
            requirements: jobPosting.requirements ? JSON.stringify(jobPosting.requirements) : null,
            niceToHave: jobPosting.niceToHave ? JSON.stringify(jobPosting.niceToHave) : null,
            matchScore: matchResult.score,
            matchReasons: JSON.stringify(matchResult.reasons),
            updatedAt: new Date(),
          },
        })

        rematchedCount++

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error: any) {
        console.error(`Error re-matching job ${job.id}:`, error)
        errorCount++
        continue
      }
    }

    return NextResponse.json({
      message: "Re-Matching abgeschlossen",
      rematched: rematchedCount,
      filtered: filteredCount,
      errors: errorCount,
      total: jobs.length,
    })
  } catch (error: any) {
    console.error("Re-matching error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Re-Matching" },
      { status: 500 }
    )
  }
}
