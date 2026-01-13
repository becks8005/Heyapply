import { anthropic } from "./anthropic"
import * as cheerio from "cheerio"
import { scrapeJobPosting, JobPosting } from "./job-scraper"

interface ProfileData {
  tagline?: string
  summary?: string
  skills: Array<{ name: string; category: string }>
  experiences: Array<{
    jobTitle: string
    company: string
  }>
  city?: string
  country?: string
}

export interface SearchKeywords {
  primary: string[] // Hauptsuchbegriffe (Job-Titel)
  secondary: string[] // Zusätzliche Begriffe (Skills, Technologien)
  location?: string
}

/**
 * Generiert Suchbegriffe basierend auf dem CV-Profil
 */
export async function generateSearchKeywords(profile: ProfileData): Promise<SearchKeywords> {
  try {
    const skillsList = profile.skills.map(s => s.name).join(", ")
    const experienceTitles = profile.experiences.map(e => e.jobTitle).join(", ")
    
    const profileText = `
Tagline: ${profile.tagline || ""}
Summary: ${profile.summary || ""}
Skills: ${skillsList}
Erfahrungen: ${experienceTitles}
Standort: ${profile.city || ""}, ${profile.country || ""}
`

    if (!anthropic) {
      return getFallbackKeywords(profile)
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Basierend auf dem folgenden CV-Profil, generiere KURZE, FOKUSSIERTE Suchbegriffe für die Job-Suche.

CV-Profil:
${profileText}

Generiere Suchbegriffe im JSON-Format:
{
  "primary": ["Job-Titel 1", "Job-Titel 2", ...] (2-3 KURZE Job-Titel, max. 2 Wörter pro Titel, z.B. "Software Engineer", "Product Manager", NICHT "Regulatory Compliance Specialist AI Governance Officer"),
  "secondary": ["Skill 1", "Skill 2", ...] (3-5 KURZE Skills/Technologien, max. 2 Wörter pro Skill),
  "location": "Stadt oder Region" (z.B. "Zürich", "Schweiz", oder null wenn nicht relevant)
}

WICHTIG:
- Primary: NUR 2-3 KURZE Job-Titel (max. 2 Wörter), die zum Profil passen
- Secondary: NUR 3-5 KURZE Skills (max. 2 Wörter), keine langen Phrasen
- KEINE langen zusammengesetzten Begriffe wie "Regulatory Compliance Specialist" - stattdessen "Compliance" oder "Regulatory"
- Location: Nur wenn im Profil angegeben, sonst null`
      }]
    })

    const content = response.content[0]
    if (content.type !== "text") {
      return getFallbackKeywords(profile)
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return getFallbackKeywords(profile)
    }

    try {
      return JSON.parse(jsonMatch[0]) as SearchKeywords
    } catch {
      return getFallbackKeywords(profile)
    }
  } catch (error) {
    console.error("Error generating search keywords:", error)
    return getFallbackKeywords(profile)
  }
}

function getFallbackKeywords(profile: ProfileData): SearchKeywords {
  const primary: string[] = []
  const secondary: string[] = []

  // Extract from experiences
  profile.experiences.forEach(exp => {
    if (exp.jobTitle && !primary.includes(exp.jobTitle)) {
      primary.push(exp.jobTitle)
    }
  })

  // Extract from tagline
  if (profile.tagline) {
    const taglineWords = profile.tagline.split(/[\s,]+/).filter(w => w.length > 3)
    taglineWords.forEach(word => {
      if (!primary.includes(word) && word.length > 4) {
        primary.push(word)
      }
    })
  }

  // Extract from skills
  profile.skills.forEach(skill => {
    if (skill.name && !secondary.includes(skill.name)) {
      secondary.push(skill.name)
    }
  })

  return {
    primary: primary.slice(0, 5),
    secondary: secondary.slice(0, 10),
    location: profile.city || profile.country || undefined
  }
}

/**
 * Sucht Jobs über die Adzuna API (Schweiz)
 * Returns job data directly (no need to scrape)
 */
export async function searchAdzunaJobs(keywords: SearchKeywords): Promise<Array<{ url: string; job: JobPosting | null }>> {
  const results: Array<{ url: string; job: JobPosting | null }> = []
  
  
  try {
    const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID
    const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY
    
    
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      console.error("❌ Adzuna API credentials not configured")
      console.error("   Please add ADZUNA_APP_ID and ADZUNA_APP_KEY to your .env.local file")
      return []
    }
    
    if (ADZUNA_APP_ID === "" || ADZUNA_APP_KEY === "") {
      console.error("❌ Adzuna API credentials are empty")
      console.error("   Please fill in ADZUNA_APP_ID and ADZUNA_APP_KEY in your .env.local file")
      return []
    }

    // Build multiple search queries - Adzuna works better with shorter, focused queries
    // Try each primary keyword separately, then combine top 2
    const location = keywords.location || "Schweiz"
    const country = "ch" // Schweiz
    
    const searchQueries: string[] = []
    
    // Add individual primary keywords
    keywords.primary.slice(0, 3).forEach(keyword => {
      searchQueries.push(keyword)
    })
    
    // Add combination of top 2 keywords
    if (keywords.primary.length >= 2) {
      searchQueries.push(keywords.primary.slice(0, 2).join(" "))
    }
    
    // Fallback if no keywords
    if (searchQueries.length === 0) {
      searchQueries.push("Software Engineer")
    }
    
    
    // Perform multiple searches and combine results
    const allJobs = new Map<string, any>() // Use Map to avoid duplicates by URL
    
    for (const searchTerms of searchQueries.slice(0, 3)) { // Limit to 3 searches to avoid rate limits
      
      const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`)
      url.searchParams.set("app_id", ADZUNA_APP_ID)
      url.searchParams.set("app_key", ADZUNA_APP_KEY)
      url.searchParams.set("what", searchTerms)
      url.searchParams.set("where", location)
      url.searchParams.set("results_per_page", "10") // Get 10 per query
      url.searchParams.set("max_days_old", "30") // Letzte 30 Tage
      url.searchParams.set("sort_by", "date") // Neueste zuerst

      console.log("Searching Adzuna:", url.toString().replace(ADZUNA_APP_ID, "***").replace(ADZUNA_APP_KEY, "***"))

      try {
        const response = await fetch(url.toString(), {
          headers: {
            "Accept": "application/json",
          },
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => "")
          console.error("❌ Adzuna API error:", response.status)
          console.error("   Response:", errorText.substring(0, 200))
          continue // Try next query
        }

        const data = await response.json()
        
        
        if (data.results && Array.isArray(data.results)) {
          console.log(`✅ Adzuna: Found ${data.results.length} jobs for "${searchTerms}"`)
          
          // Add jobs to map (deduplicate by URL)
          data.results.forEach((job: any) => {
            const jobUrl = job.redirect_url || job.url || ""
            if (jobUrl && !allJobs.has(jobUrl)) {
              allJobs.set(jobUrl, job)
            }
          })
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error searching Adzuna for "${searchTerms}":`, error)
        continue
      }
    }
    
    
    // If no results found with specific keywords, try fallback generic keywords
    if (allJobs.size === 0) {
      console.log("ℹ️  Adzuna: No results found, trying fallback generic keywords...")
      
      
      // Generate fallback keywords by extracting simpler terms
      const fallbackQueries: string[] = []
      
      // Extract single words from compound job titles
      for (const keyword of keywords.primary) {
        const words = keyword.split(/\s+/)
        for (const word of words) {
          // Only use meaningful words (not articles, prepositions, etc.)
          if (word.length >= 4 && !['the', 'and', 'for', 'with', 'von', 'und', 'für', 'mit'].includes(word.toLowerCase())) {
            if (!fallbackQueries.includes(word)) {
              fallbackQueries.push(word)
            }
          }
        }
      }
      
      // Add generic Swiss job market keywords based on secondary skills
      const genericTerms = ['Manager', 'Analyst', 'Consultant', 'Engineer', 'Developer', 'Specialist']
      for (const term of genericTerms) {
        if (!fallbackQueries.includes(term)) {
          fallbackQueries.push(term)
        }
      }
      
      
      // Try fallback queries (limit to 4 to avoid rate limits)
      for (const searchTerms of fallbackQueries.slice(0, 4)) {
        const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`)
        url.searchParams.set("app_id", ADZUNA_APP_ID)
        url.searchParams.set("app_key", ADZUNA_APP_KEY)
        url.searchParams.set("what", searchTerms)
        url.searchParams.set("where", "Schweiz") // Use broader location for fallback
        url.searchParams.set("results_per_page", "15")
        url.searchParams.set("max_days_old", "30")
        url.searchParams.set("sort_by", "date")

        console.log("Searching Adzuna (fallback):", url.toString().replace(ADZUNA_APP_ID, "***").replace(ADZUNA_APP_KEY, "***"))

        try {
          const response = await fetch(url.toString(), {
            headers: { "Accept": "application/json" },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.results && Array.isArray(data.results)) {
              console.log(`✅ Adzuna (fallback): Found ${data.results.length} jobs for "${searchTerms}"`)
              data.results.forEach((job: any) => {
                const jobUrl = job.redirect_url || job.url || ""
                if (jobUrl && !allJobs.has(jobUrl)) {
                  allJobs.set(jobUrl, job)
                }
              })
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Error searching Adzuna fallback for "${searchTerms}":`, error)
        }
      }
      
    }
    
    if (allJobs.size === 0) {
      console.log("ℹ️  Adzuna: No results found for any query (including fallback)")
      return []
    }
    
    console.log(`✅ Adzuna: Found ${allJobs.size} unique jobs total`)
    
    // Convert Map values to array
    const data = { results: Array.from(allJobs.values()) }

    // Convert Adzuna job format to our JobPosting format
    results.push(...data.results.map((adzunaJob: any) => {
      try {
        const job: JobPosting = {
          jobTitle: adzunaJob.title || "",
          company: adzunaJob.company?.display_name || "Unbekannt",
          location: adzunaJob.location?.display_name || location,
          description: adzunaJob.description || "",
          requirements: extractRequirements(adzunaJob.description || ""),
          niceToHave: [],
        }
        
        return {
          url: adzunaJob.redirect_url || adzunaJob.url || "",
          job,
        }
      } catch (error) {
        console.error("Error parsing Adzuna job:", error)
        return { url: adzunaJob.redirect_url || "", job: null }
      }
    }))


    return results
  } catch (error) {
    console.error("Error searching Adzuna:", error)
    return []
  }
}

/**
 * Extracts requirements from job description (simple heuristic)
 */
function extractRequirements(description: string): string[] {
  const requirements: string[] = []
  const lines = description.split("\n")
  
  let inRequirementsSection = false
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    if (lowerLine.includes("anforderungen") || lowerLine.includes("requirements") || 
        lowerLine.includes("qualifikation") || lowerLine.includes("qualification")) {
      inRequirementsSection = true
      continue
    }
    
    if (inRequirementsSection) {
      if (line.trim().startsWith("-") || line.trim().startsWith("•") || line.trim().match(/^\d+\./)) {
        const req = line.trim().replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "").trim()
        if (req.length > 10) {
          requirements.push(req)
        }
      }
      
      // Stop at next section
      if (lowerLine.includes("wir bieten") || lowerLine.includes("we offer") ||
          lowerLine.includes("über uns") || lowerLine.includes("about us")) {
        break
      }
    }
  }
  
  return requirements.slice(0, 10) // Limit to 10 requirements
}

/**
 * Sucht Jobs auf jobs.ch (DEPRECATED - use Adzuna instead)
 */
export async function searchJobsCh(keywords: SearchKeywords): Promise<string[]> {
  const jobUrls: string[] = []
  
  try {
    // Build search URL for jobs.ch
    // jobs.ch uses query parameters for search
    const searchTerms = [...keywords.primary, ...keywords.secondary.slice(0, 3)].join(" ")
    const location = keywords.location || ""
    
    // Construct jobs.ch search URL
    const searchUrl = new URL("https://www.jobs.ch/de/jobs/")
    searchUrl.searchParams.set("q", searchTerms)
    if (location) {
      searchUrl.searchParams.set("location", location)
    }

    console.log("Searching jobs.ch:", searchUrl.toString())

    const response = await fetch(searchUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    })

    if (!response.ok) {
      console.error("jobs.ch search failed:", response.status)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract job URLs from search results
    // jobs.ch typically uses links like /de/jobs/job-id/
    $("a[href*='/de/jobs/']").each((_, element) => {
      const href = $(element).attr("href")
      if (href && href.includes("/de/jobs/") && !href.includes("?") && !href.includes("#")) {
        const fullUrl = href.startsWith("http") ? href : `https://www.jobs.ch${href}`
        if (!jobUrls.includes(fullUrl) && fullUrl.match(/\/de\/jobs\/[^\/]+\/$/)) {
          jobUrls.push(fullUrl)
        }
      }
    })

    // Also try data attributes or other selectors
    $("[data-job-id], [data-job-url]").each((_, element) => {
      const jobId = $(element).attr("data-job-id")
      const jobUrl = $(element).attr("data-job-url")
      if (jobUrl && !jobUrls.includes(jobUrl)) {
        jobUrls.push(jobUrl)
      } else if (jobId) {
        const url = `https://www.jobs.ch/de/jobs/${jobId}/`
        if (!jobUrls.includes(url)) {
          jobUrls.push(url)
        }
      }
    })

    // Limit to first 20 results
    return jobUrls.slice(0, 20)
  } catch (error) {
    console.error("Error searching jobs.ch:", error)
    return []
  }
}

/**
 * Sucht Jobs auf LinkedIn
 * Note: LinkedIn requires authentication for most searches
 */
export async function searchLinkedIn(keywords: SearchKeywords): Promise<string[]> {
  const jobUrls: string[] = []
  
  try {
    // Build LinkedIn Jobs search URL
    const searchTerms = keywords.primary.join(" ")
    const location = keywords.location || "Switzerland"
    
    const searchUrl = new URL("https://www.linkedin.com/jobs/search/")
    searchUrl.searchParams.set("keywords", searchTerms)
    searchUrl.searchParams.set("location", location)
    searchUrl.searchParams.set("f_TPR", "r86400") // Last 24 hours

    console.log("Searching LinkedIn:", searchUrl.toString())

    const response = await fetch(searchUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    })

    if (!response.ok) {
      console.error("LinkedIn search failed:", response.status)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Check if login required
    if (html.includes("sign in") || html.includes("anmelden") || html.includes("challenge")) {
      console.log("LinkedIn requires authentication")
      return []
    }

    // Extract job URLs from LinkedIn search results
    $("a[href*='/jobs/view/']").each((_, element) => {
      const href = $(element).attr("href")
      if (href) {
        const fullUrl = href.startsWith("http") ? href : `https://www.linkedin.com${href}`
        if (!jobUrls.includes(fullUrl) && fullUrl.includes("/jobs/view/")) {
          jobUrls.push(fullUrl)
        }
      }
    })

    // Also try base-card-link selector
    $("a.base-card__full-link").each((_, element) => {
      const href = $(element).attr("href")
      if (href) {
        const fullUrl = href.startsWith("http") ? href : `https://www.linkedin.com${href}`
        if (!jobUrls.includes(fullUrl) && fullUrl.includes("/jobs/")) {
          jobUrls.push(fullUrl)
        }
      }
    })

    // Limit to first 20 results
    return jobUrls.slice(0, 20)
  } catch (error) {
    console.error("Error searching LinkedIn:", error)
    return []
  }
}

/**
 * Fetches and scrapes job details from URLs
 */
export async function fetchJobDetails(urls: string[]): Promise<Array<{ url: string; job: JobPosting | null }>> {
  const results: Array<{ url: string; job: JobPosting | null }> = []
  
  // Process in batches to avoid rate limiting
  const batchSize = 5
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000))
          const job = await scrapeJobPosting(url)
          return { url, job }
        } catch (error) {
          console.error(`Error scraping job ${url}:`, error)
          return { url, job: null }
        }
      })
    )
    results.push(...batchResults)
  }
  
  return results
}
