import { prisma } from "@/lib/prisma"
import { generateSearchKeywords, searchJobsCh, searchLinkedIn, fetchJobDetails } from "@/lib/job-search"
import { matchJobToProfile } from "@/lib/job-matcher"
import { NextResponse } from "next/server"

/**
 * Cron Job Endpoint für regelmäßige Job-Suche
 * Kann von Vercel Cron Jobs oder externen Services aufgerufen werden
 * 
 * Usage:
 * - Vercel: Füge zu vercel.json hinzu:
 *   "crons": [{
 *     "path": "/api/job-search/cron",
 *     "schedule": "0 9 * * *" // Täglich um 9 Uhr
 *   }]
 * 
 * - Extern: Rufe diesen Endpoint regelmäßig auf (z.B. mit cron-job.org)
 */
export async function GET(req: Request) {
  try {
    // Optional: API Key für Sicherheit
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Finde alle aktiven Job-Suchen
    const activeSearches = await prisma.jobSearch.findMany({
      where: {
        isActive: true,
        OR: [
          { nextSearchAt: { lte: new Date() } },
          { nextSearchAt: null },
        ],
      },
      include: {
        user: {
          include: {
            profile: {
              include: {
                skills: true,
                experiences: true,
                education: true,
                languages: true,
              },
            },
          },
        },
      },
    })

    if (activeSearches.length === 0) {
      return NextResponse.json({
        message: "Keine aktiven Job-Suchen gefunden",
        processed: 0,
      })
    }

    const results = []

    for (const jobSearch of activeSearches) {
      try {
        const user = jobSearch.user
        const profile = user.profile

        if (!profile) {
          console.log(`Skipping user ${user.id}: No profile found`)
          continue
        }

        // Generate or use existing keywords
        let keywords
        if (jobSearch.keywords) {
          keywords = JSON.parse(jobSearch.keywords)
        } else {
          const profileData = {
            tagline: profile.tagline || undefined,
            summary: profile.summary || undefined,
            skills: profile.skills,
            experiences: profile.experiences,
            city: profile.city || undefined,
            country: profile.country || undefined,
          }
          keywords = await generateSearchKeywords(profileData)
          
          // Save keywords
          await prisma.jobSearch.update({
            where: { id: jobSearch.id },
            data: { keywords: JSON.stringify(keywords) },
          })
        }

        const allJobUrls: string[] = []

        // Search jobs.ch
        if (jobSearch.searchJobsCh) {
          const jobsChUrls = await searchJobsCh(keywords)
          allJobUrls.push(...jobsChUrls)
        }

        // Search LinkedIn
        if (jobSearch.searchLinkedIn) {
          const linkedInUrls = await searchLinkedIn(keywords)
          allJobUrls.push(...linkedInUrls)
        }

        // Remove duplicates
        const uniqueUrls = Array.from(new Set(allJobUrls))

        if (uniqueUrls.length === 0) {
          // Update search time even if no jobs found
          const nextSearch = calculateNextSearch(jobSearch.frequency)
          await prisma.jobSearch.update({
            where: { id: jobSearch.id },
            data: {
              lastSearchAt: new Date(),
              nextSearchAt: nextSearch,
            },
          })
          continue
        }

        // Fetch job details (limit to 20 to avoid rate limiting)
        const urlsToFetch = uniqueUrls.slice(0, 20)
        const jobDetails = await fetchJobDetails(urlsToFetch)

        // Match jobs to profile
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

        let newJobsCount = 0

        for (const { url, job } of jobDetails) {
          if (!job) continue

          // Check if job already exists
          const existing = await prisma.discoveredJob.findUnique({
            where: {
              userId_jobUrl: {
                userId: user.id,
                jobUrl: url,
              },
            },
          })

          if (existing) {
            // Update existing job
            await prisma.discoveredJob.update({
              where: { id: existing.id },
              data: {
                jobTitle: job.jobTitle,
                company: job.company,
                location: job.location,
                description: job.description,
                requirements: job.requirements ? JSON.stringify(job.requirements) : null,
                niceToHave: job.niceToHave ? JSON.stringify(job.niceToHave) : null,
                updatedAt: new Date(),
              },
            })
            continue
          }

          // Match job to profile
          const matchResult = await matchJobToProfile(job, profileData)

          // Determine source
          const source = url.includes("jobs.ch") ? "jobs.ch" : "linkedin"

          // Create discovered job
          await prisma.discoveredJob.create({
            data: {
              userId: user.id,
              jobUrl: url,
              jobTitle: job.jobTitle,
              company: job.company,
              location: job.location,
              description: job.description,
              requirements: job.requirements ? JSON.stringify(job.requirements) : null,
              niceToHave: job.niceToHave ? JSON.stringify(job.niceToHave) : null,
              matchScore: matchResult.score,
              matchReasons: JSON.stringify(matchResult.reasons),
              source,
              status: "NEW",
            },
          })

          newJobsCount++
        }

        // Update job search
        const nextSearch = calculateNextSearch(jobSearch.frequency)
        await prisma.jobSearch.update({
          where: { id: jobSearch.id },
          data: {
            lastSearchAt: new Date(),
            nextSearchAt: nextSearch,
          },
        })

        results.push({
          userId: user.id,
          jobsFound: newJobsCount,
          totalUrls: uniqueUrls.length,
        })
      } catch (error: any) {
        console.error(`Error processing job search for user ${jobSearch.userId}:`, error)
        results.push({
          userId: jobSearch.userId,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      message: "Cron job completed",
      processed: activeSearches.length,
      results,
    })
  } catch (error: any) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Ausführen des Cron Jobs" },
      { status: 500 }
    )
  }
}

function calculateNextSearch(frequency: string): Date {
  const now = new Date()
  if (frequency === "WEEKLY") {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  } else {
    // DAILY
    return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}
