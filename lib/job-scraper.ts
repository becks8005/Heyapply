import { anthropic } from "./anthropic"
import * as cheerio from "cheerio"

export interface JobPosting {
  jobTitle: string
  company: string
  location?: string
  description: string
  requirements: string[]
  niceToHave?: string[]
  contactPerson?: string
}

export async function scrapeJobPosting(url: string): Promise<JobPosting> {
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured. Please set it in your .env.local file.")
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    })

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error(`LinkedIn requires authentication. Status: ${response.status}`)
      }
      throw new Error(`Failed to fetch job posting: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Normalize URL for detection (remove query parameters for detection, but keep them for fetching)
    const urlForDetection = url.split("?")[0]
    
    // Detect platform
    const isJobsCh = urlForDetection.includes("jobs.ch")
    const isLinkedIn = urlForDetection.includes("linkedin.com/jobs")

    if (isJobsCh) {
      return await scrapeJobsCh($, html, url)
    } else if (isLinkedIn) {
      return await scrapeLinkedIn($, html, url)
    } else {
      // Generic scraper using AI
      return await scrapeGeneric($, html, url)
    }
  } catch (error: any) {
    console.error("Job scraping error:", error)
    // Re-throw with more context
    if (error.message) {
      throw error
    }
    throw new Error(`Job scraping failed: ${error.toString()}`)
  }
}

async function scrapeJobsCh($: cheerio.CheerioAPI, html: string, url: string): Promise<JobPosting> {
  // Try to extract structured data
  let jobTitle = ""
  let company = ""
  let location = ""
  let description = ""

  // Common jobs.ch selectors
  jobTitle = $("h1").first().text().trim() || 
             $("[data-testid='job-title']").text().trim() ||
             $(".job-title").text().trim()

  company = $("[data-testid='company-name']").text().trim() ||
            $(".company-name").text().trim() ||
            $("h2").first().text().trim()

  location = $("[data-testid='job-location']").text().trim() ||
             $(".job-location").text().trim()

  // Get description - try multiple selectors
  const descriptionSelectors = [
    "[data-testid='job-description']",
    ".job-description",
    ".description",
    ".job-content",
    "article",
  ]

  for (const selector of descriptionSelectors) {
    const text = $(selector).text().trim()
    if (text.length > 100) {
      description = text
      break
    }
  }

  // If we couldn't extract enough, use AI
  if (!jobTitle || !company || description.length < 200) {
    return await scrapeGeneric($, html, url)
  }

  // Use AI to extract requirements
  const requirements = await extractRequirements(description)

  return {
    jobTitle: jobTitle.trim(),
    company: company.trim(),
    location: location.trim() || undefined,
    description,
    requirements: requirements.requirements,
    niceToHave: requirements.niceToHave,
  }
}

async function scrapeLinkedIn($: cheerio.CheerioAPI, html: string, url: string): Promise<JobPosting> {
  // Check if page requires login (LinkedIn often shows login prompts)
  const bodyText = $("body").text().trim().toLowerCase()
  const requiresLogin = bodyText.includes("sign in") || 
                       bodyText.includes("join linkedin") ||
                       bodyText.includes("anmelden") ||
                       html.includes("challenge") ||
                       html.includes("captcha") ||
                       $("form[action*='login']").length > 0 ||
                       $("form[action*='challenge']").length > 0

  // If page requires login or has very little content, use generic scraper
  if (requiresLogin || bodyText.length < 500) {
    console.log("LinkedIn page requires login or has insufficient content, using generic scraper")
    return await scrapeGeneric($, html, url)
  }

  // LinkedIn job posting structure
  let jobTitle = ""
  let company = ""
  let location = ""
  let description = ""

  // Try to find job title - more selectors
  jobTitle = $("h1").first().text().trim() ||
             $(".top-card-layout__title").text().trim() ||
             $("[data-test-id='job-title']").text().trim() ||
             $("h1.jobs-unified-top-card__job-title").text().trim() ||
             $("h1.job-details-jobs-unified-top-card__job-title").text().trim() ||
             $("h1.job-details-jobs-unified-top-card__job-title-link").text().trim()

  // Try to find company - more selectors
  company = $(".top-card-layout__company-name").text().trim() ||
            $("[data-test-id='job-company']").text().trim() ||
            $("a.topcard__org-name-link").text().trim() ||
            $("a.jobs-unified-top-card__company-name").text().trim() ||
            $("a.job-details-jobs-unified-top-card__company-name").text().trim() ||
            $("span.jobs-unified-top-card__company-name").text().trim()

  // Try to find location - more selectors
  location = $(".topcard__flavor--bullet").first().text().trim() ||
             $(".top-card-layout__subtitle").text().trim() ||
             $(".jobs-unified-top-card__primary-description").text().trim() ||
             $(".job-details-jobs-unified-top-card__primary-description").text().trim()

  // Get description - more selectors
  const descriptionSelectors = [
    ".show-more-less-html__markup",
    ".description__text",
    "[data-test-id='job-description']",
    ".jobs-description__text",
    ".jobs-description-content__text",
    ".jobs-box__html-content",
    "#job-details",
    ".jobs-description__text--stretch",
  ]

  for (const selector of descriptionSelectors) {
    const text = $(selector).text().trim()
    if (text.length > 100) {
      description = text
      break
    }
  }

  // If we couldn't extract enough, use AI
  if (!jobTitle || !company || description.length < 200) {
    console.log("LinkedIn extraction insufficient, falling back to generic scraper")
    return await scrapeGeneric($, html, url)
  }

  // Use AI to extract requirements
  const requirements = await extractRequirements(description)

  return {
    jobTitle: jobTitle.trim(),
    company: company.trim(),
    location: location.trim() || undefined,
    description,
    requirements: requirements.requirements,
    niceToHave: requirements.niceToHave,
  }
}

async function scrapeGeneric($: cheerio.CheerioAPI, html: string, url: string): Promise<JobPosting> {
  // Remove scripts, styles, etc.
  $("script, style, nav, header, footer, aside").remove()
  
  // Get main content
  const text = $("body").text().trim()
  
  // Use AI to extract structured data
  if (!anthropic) {
    throw new Error("Anthropic API ist nicht konfiguriert")
  }
  
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Analysiere das folgende Stelleninserat und extrahiere alle relevanten Informationen.

URL: ${url}

HTML-Inhalt:
---
${text.substring(0, 30000)}
---

Extrahiere die folgenden Informationen im JSON-Format:

{
  "jobTitle": "string (exakter Jobtitel)",
  "company": "string (Firmenname)",
  "location": "string oder null (Standort)",
  "description": "string (vollständige Stellenbeschreibung)",
  "requirements": ["string", "string", ...] (Liste der Anforderungen),
  "niceToHave": ["string", "string", ...] (optional: Nice-to-have Anforderungen),
  "contactPerson": "string oder null (Name der Kontaktperson falls erwähnt)"
}

WICHTIG:
- Extrahiere ALLE Anforderungen aus dem Text
- Unterscheide zwischen "Muss"-Anforderungen und "Nice-to-have"
- Wenn keine explizite Unterscheidung vorhanden ist, liste alle als "requirements"
- Kontaktperson nur wenn explizit erwähnt`
    }]
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type")
  }

  // Extract JSON
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("Could not parse job posting")
  }

  return JSON.parse(jsonMatch[0]) as JobPosting
}

async function extractRequirements(description: string): Promise<{
  requirements: string[]
  niceToHave: string[]
}> {
  if (!anthropic) {
    throw new Error("Anthropic API ist nicht konfiguriert")
  }
  
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `Analysiere die folgende Stellenbeschreibung und extrahiere die Anforderungen.

Stellenbeschreibung:
---
${description.substring(0, 10000)}
---

Liste alle Anforderungen auf und unterscheide zwischen:
- Muss-Anforderungen (requirements)
- Nice-to-have Anforderungen (niceToHave)

Antworte im JSON-Format:
{
  "requirements": ["Anforderung 1", "Anforderung 2", ...],
  "niceToHave": ["Nice-to-have 1", "Nice-to-have 2", ...]
}`
    }]
  })

  const content = response.content[0]
  if (content.type !== "text") {
    return { requirements: [], niceToHave: [] }
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { requirements: [], niceToHave: [] }
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return { requirements: [], niceToHave: [] }
  }
}

