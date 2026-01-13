import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSearchKeywords, searchAdzunaJobs, type SearchKeywords } from "@/lib/job-search"
import { matchJobToProfile } from "@/lib/job-matcher"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json().catch(() => ({}))
    const manualJobTitles = body.manualJobTitles as string[] | undefined
    const manualLocation = body.manualLocation as string | undefined
    const generateKeywordsOnly = body.generateKeywordsOnly as boolean | undefined


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
        { error: "Kein Profil gefunden. Bitte lade zuerst deinen CV hoch." },
        { status: 400 }
      )
    }

    // Get or create job search settings
    let jobSearch = await prisma.jobSearch.findUnique({
      where: { userId },
    })

    // If only generating keywords, handle that first
    if (generateKeywordsOnly) {
      let keywords: SearchKeywords
      
      if (!jobSearch) {
        // Generate keywords from profile
        const profileData = {
          tagline: profile.tagline || undefined,
          summary: profile.summary || undefined,
          skills: profile.skills,
          experiences: profile.experiences,
          city: profile.city || undefined,
          country: profile.country || undefined,
        }

        keywords = await generateSearchKeywords(profileData)

        jobSearch = await prisma.jobSearch.create({
          data: {
            userId,
            keywords: JSON.stringify(keywords),
            location: keywords.location,
            searchJobsCh: false, // Use Adzuna instead
            searchLinkedIn: false, // Use Adzuna instead
            frequency: "DAILY",
            isActive: true,
          },
        })
      } else {
        // If jobSearch exists, parse from existing
        keywords = jobSearch.keywords ? JSON.parse(jobSearch.keywords) : {
          primary: [],
          secondary: [],
          location: jobSearch.location || profile.city || profile.country || "Schweiz",
        }
      }

      return NextResponse.json({
        message: "Keywords generiert",
        keywords,
      })
    }

    // Get or create job search settings if not already done
    if (!jobSearch) {
      // Generate keywords from profile
      const profileData = {
        tagline: profile.tagline || undefined,
        summary: profile.summary || undefined,
        skills: profile.skills,
        experiences: profile.experiences,
        city: profile.city || undefined,
        country: profile.country || undefined,
      }

      const keywords = await generateSearchKeywords(profileData)

      jobSearch = await prisma.jobSearch.create({
        data: {
          userId,
          keywords: JSON.stringify(keywords),
          location: keywords.location,
          searchJobsCh: false, // Use Adzuna instead
          searchLinkedIn: false, // Use Adzuna instead
          frequency: "DAILY",
          isActive: true,
        },
      })
    }

    // Determine search keywords: Use manual if provided, otherwise AI-generated
    let keywords: SearchKeywords

    // Determine search keywords: Use manual if provided, otherwise AI-generated
    
    if (manualJobTitles && manualJobTitles.length > 0) {
      // Use manual search terms
      keywords = {
        primary: manualJobTitles,
        secondary: [],
        location: manualLocation || jobSearch.manualLocation || profile.city || profile.country || "Schweiz",
      }
      
      // Save manual search terms to settings
      await prisma.jobSearch.update({
        where: { userId },
        data: {
          manualJobTitles: JSON.stringify(manualJobTitles),
          manualLocation: manualLocation || jobSearch.manualLocation || null,
        },
      })
    } else if (jobSearch.manualJobTitles) {
      // Use saved manual search terms
      keywords = {
        primary: JSON.parse(jobSearch.manualJobTitles),
        secondary: [],
        location: jobSearch.manualLocation || jobSearch.location || profile.city || profile.country || "Schweiz",
      }
    } else {
      // Generate from profile using AI
      keywords = jobSearch.keywords 
        ? JSON.parse(jobSearch.keywords) 
        : await generateSearchKeywords({
            tagline: profile.tagline || undefined,
            summary: profile.summary || undefined,
            skills: profile.skills,
            experiences: profile.experiences,
            city: profile.city || undefined,
            country: profile.country || undefined,
          })
      
      // Save generated keywords if they were just created
      if (!jobSearch.keywords) {
        await prisma.jobSearch.update({
          where: { userId },
          data: {
            keywords: JSON.stringify(keywords),
            location: keywords.location || null,
          },
        })
      }
    }


    // Search Adzuna (replaces jobs.ch and LinkedIn scraping)
    const jobDetails = await searchAdzunaJobs(keywords)


    if (jobDetails.length === 0) {
      await prisma.jobSearch.update({
        where: { userId },
        data: { lastSearchAt: new Date() },
      })
      return NextResponse.json({
        message: "Keine Jobs gefunden",
        jobsFound: 0,
      })
    }

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

    const discoveredJobs = []
    let processedCount = 0
    let skippedCount = 0
    let existingCount = 0
    let errorCount = 0


    for (const { url, job } of jobDetails) {
      processedCount++
      
      if (!job) {
        skippedCount++
        continue
      }

      // Check if job already exists
      const existing = await prisma.discoveredJob.findUnique({
        where: {
          userId_jobUrl: {
            userId,
            jobUrl: url,
          },
        },
      })

      if (existing) {
        existingCount++
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

      try {

        // Match job to profile
        const matchResult = await matchJobToProfile(job, profileData)


        // Filter out jobs with very poor matches or critical mismatches
        // Check for critical mismatches in weaknesses and reasons
        const hasCriticalMismatch = matchResult.weaknesses?.some(w => 
          w.toLowerCase().includes('überqualifikation') || 
          w.toLowerCase().includes('unterqualifikation') ||
          w.toLowerCase().includes('seniority-mismatch') ||
          w.toLowerCase().includes('kritischer seniority') ||
          w.toLowerCase().includes('branchen-mismatch') ||
          w.toLowerCase().includes('keine relevante branchen-erfahrung') ||
          w.toLowerCase().includes('keine relevante branchen') ||
          w.toLowerCase().includes('head of it') ||
          w.toLowerCase().includes('it-manager') ||
          (w.toLowerCase().includes('it') && w.toLowerCase().includes('keine'))
        ) || matchResult.reasons?.some(r =>
          r.toLowerCase().includes('seniority-mismatch') ||
          r.toLowerCase().includes('nicht passendes seniority') ||
          r.toLowerCase().includes('branchen-mismatch') ||
          r.toLowerCase().includes('keine relevante erfahrung in it')
        ) || matchResult.weaknesses?.some(w => {
          // Check for IT-related positions without IT experience
          const isITPosition = job.jobTitle.toLowerCase().includes('it') || 
                              job.jobTitle.toLowerCase().includes('information technology') ||
                              job.description.toLowerCase().includes('it-infrastruktur') ||
                              job.description.toLowerCase().includes('it governance') ||
                              job.description.toLowerCase().includes('cybersecurity') ||
                              job.description.toLowerCase().includes('software engineer') ||
                              job.description.toLowerCase().includes('developer') ||
                              job.description.toLowerCase().includes('programmer')
          
          if (isITPosition) {
            // Check if profile has IT experience
            const hasITExperience = profileData.experiences.some(e => 
              e.jobTitle.toLowerCase().includes('it') ||
              e.jobTitle.toLowerCase().includes('software') ||
              e.jobTitle.toLowerCase().includes('developer') ||
              e.jobTitle.toLowerCase().includes('engineer') ||
              e.jobTitle.toLowerCase().includes('programmer') ||
              e.company.toLowerCase().includes('tech')
            ) || profileData.skills.some(s => 
              s.name.toLowerCase().includes('programming') ||
              s.name.toLowerCase().includes('software') ||
              s.name.toLowerCase().includes('development') ||
              s.name.toLowerCase().includes('it') ||
              s.name.toLowerCase().includes('cybersecurity')
            )
            
            return !hasITExperience
          }
          return false
        })

        // Filter out jobs with score < 40 OR critical mismatches even with higher scores
        if (matchResult.score < 40 || (hasCriticalMismatch && matchResult.score < 60)) {
          continue // Skip this job
        }

        // Determine source from URL
        let source = "adzuna"
        if (url.includes("jobs.ch")) {
          source = "jobs.ch"
        } else if (url.includes("linkedin.com")) {
          source = "linkedin"
        }


        // Create discovered job
        const discoveredJob = await prisma.discoveredJob.create({
          data: {
            userId,
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

        discoveredJobs.push(discoveredJob)
        
      } catch (error: any) {
        errorCount++
        console.error(`Error processing job ${job.jobTitle}:`, error)
        // Continue processing other jobs
        continue
      }
    }


    // Update job search
    await prisma.jobSearch.update({
      where: { userId },
      data: {
        lastSearchAt: new Date(),
        nextSearchAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    })

    return NextResponse.json({
      message: "Job-Suche abgeschlossen",
      jobsFound: discoveredJobs.length,
      totalUrls: jobDetails.length,
    })
  } catch (error: any) {
    console.error("Job search error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler bei der Job-Suche" },
      { status: 500 }
    )
  }
}
