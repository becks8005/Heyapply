import { anthropic } from "./anthropic"
import { JobPosting } from "./job-scraper"

interface ProfileData {
  tagline?: string
  summary?: string
  skills: Array<{ name: string; category: string }>
  experiences: Array<{
    jobTitle: string
    company: string
    bullets?: string[]
    startDate?: Date | string
    endDate?: Date | string | null
    isCurrent?: boolean
  }>
  education: Array<{
    degree: string
    institution: string
  }>
  languages: Array<{ name: string; level: string }>
}

export interface MatchResult {
  score: number // 0-100
  reasons: string[]
  strengths: string[]
  weaknesses: string[]
}

interface SeniorityInfo {
  level: 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE' | 'UNKNOWN'
  confidence: number // 0-1
  indicators: string[]
  totalYears: number
}

interface IndustryExperience {
  industries: string[] // z.B. ['IT', 'Finance', 'Consulting']
  primaryIndustry: string | null
}

/**
 * Berechnet die gesamte Berufserfahrung in Jahren
 */
function calculateTotalYearsOfExperience(
  experiences: Array<{
    startDate?: Date | string
    endDate?: Date | string | null
    isCurrent?: boolean
  }>
): number {
  let totalMonths = 0
  const now = new Date()

  for (const exp of experiences) {
    if (!exp.startDate) continue

    const start = typeof exp.startDate === 'string' ? new Date(exp.startDate) : exp.startDate
    if (isNaN(start.getTime())) continue

    const end = exp.isCurrent 
      ? now 
      : (exp.endDate ? (typeof exp.endDate === 'string' ? new Date(exp.endDate) : exp.endDate) : now)
    
    if (isNaN(end.getTime())) continue

    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    totalMonths += Math.max(0, months)
  }

  return Math.floor(totalMonths / 12)
}

/**
 * Extrahiert das Seniority-Level aus dem Profil
 */
function extractSeniorityFromProfile(profile: ProfileData): SeniorityInfo {
  const jobTitles = profile.experiences.map(e => e.jobTitle.toLowerCase())
  const totalYears = calculateTotalYearsOfExperience(profile.experiences)
  
  const indicators: string[] = []
  let level: SeniorityInfo['level'] = 'UNKNOWN'
  
  // Executive-Level Keywords
  const executiveKeywords = ['ceo', 'cto', 'cfo', 'president', 'vp', 'vice president', 'head of', 'director', 'geschäftsführer', 'geschäftsführerin', 'vorstand']
  const leadKeywords = ['lead', 'principal', 'architect', 'chief', 'leitend']
  const seniorKeywords = ['senior', 'sr.', 'sr ', 'erfahren', 'erfahrene', 'experienced']
  const juniorKeywords = ['junior', 'jr.', 'jr ', 'trainee', 'intern', 'praktikant', 'graduate', 'entry', 'associate']
  const midKeywords = ['middle', 'regular', 'standard', 'specialist'] // Weniger spezifisch
  
  const hasExecutive = jobTitles.some(title => 
    executiveKeywords.some(kw => title.includes(kw))
  )
  const hasLead = jobTitles.some(title => 
    leadKeywords.some(kw => title.includes(kw))
  )
  const hasSenior = jobTitles.some(title => 
    seniorKeywords.some(kw => title.includes(kw))
  )
  const hasJunior = jobTitles.some(title => 
    juniorKeywords.some(kw => title.includes(kw))
  )
  
  // Bestimme Seniority basierend auf Keywords und Erfahrung
  if (hasExecutive || (totalYears >= 15 && hasLead)) {
    level = 'EXECUTIVE'
    indicators.push(hasExecutive ? 'Executive Keywords' : `${totalYears}+ Jahre mit Lead-Erfahrung`)
  } else if (hasLead || (totalYears >= 10 && hasSenior)) {
    level = 'LEAD'
    indicators.push(hasLead ? 'Lead-Keywords' : `${totalYears}+ Jahre mit Senior-Erfahrung`)
  } else if (hasSenior || totalYears >= 5) {
    level = 'SENIOR'
    indicators.push(totalYears >= 5 ? `${totalYears}+ Jahre Erfahrung` : 'Senior Keywords')
  } else if (totalYears >= 2 && !hasJunior) {
    level = 'MID'
    indicators.push(`${totalYears} Jahre Erfahrung`)
  } else if (hasJunior || totalYears < 2) {
    level = hasJunior ? 'JUNIOR' : 'ENTRY'
    indicators.push(hasJunior ? 'Junior Keywords' : '< 2 Jahre Erfahrung')
  } else if (totalYears === 0) {
    level = 'ENTRY'
    indicators.push('Keine Berufserfahrung')
  }
  
  // Fallback: Wenn nur Tagline/Summary verfügbar, versuche dort zu erkennen
  if (level === 'UNKNOWN' && (profile.tagline || profile.summary)) {
    const allText = `${profile.tagline || ''} ${profile.summary || ''}`.toLowerCase()
    
    if (executiveKeywords.some(kw => allText.includes(kw))) {
      level = 'EXECUTIVE'
      indicators.push('Executive Keywords in Tagline/Summary')
    } else if (leadKeywords.some(kw => allText.includes(kw))) {
      level = 'LEAD'
      indicators.push('Lead-Keywords in Tagline/Summary')
    } else if (seniorKeywords.some(kw => allText.includes(kw))) {
      level = 'SENIOR'
      indicators.push('Senior Keywords in Tagline/Summary')
    }
  }
  
  return {
    level,
    confidence: indicators.length > 0 ? 0.8 : 0.5,
    indicators,
    totalYears
  }
}

/**
 * Extrahiert Branchen-Erfahrung aus dem Profil
 */
function extractIndustryFromProfile(profile: ProfileData): IndustryExperience {
  const industries: Set<string> = new Set()
  
  // Analysiere Job-Titel, Firmen, Skills für Branchen-Indikatoren
  const allText = [
    profile.tagline || '',
    profile.summary || '',
    ...profile.experiences.map(e => `${e.jobTitle} ${e.company}`),
    ...profile.skills.map(s => s.name)
  ].join(' ').toLowerCase()
  
  // Branchen-Keywords (erweitert)
  const industryKeywords: Record<string, string[]> = {
    'IT': ['software', 'developer', 'engineer', 'programmer', 'coding', 'python', 'java', 'javascript', 'typescript', 'it', 'tech', 'technology', 'devops', 'full stack', 'backend', 'frontend', 'web development', 'mobile app', 'system administrator', 'network engineer', 'cybersecurity', 'information technology', 'head of it', 'cto', 'chief technology', 'it manager', 'it infrastructure', 'it governance', 'software development', 'application development', 'web developer', 'app developer', 'cloud engineer', 'data engineer', 'machine learning engineer', 'ai engineer'],
    'Finance': ['finance', 'banking', 'investment', 'bank', 'trading', 'risk', 'compliance', 'aml', 'ctf', 'financial', 'portfolio', 'asset management', 'wealth management', 'private banking'],
    'Consulting': ['consulting', 'consultant', 'beratung', 'advisor', 'advisory', 'strategy consulting', 'management consulting'],
    'Legal': ['legal', 'law', 'jurist', 'anwalt', 'recht', 'regulatory', 'compliance officer', 'legal counsel', 'attorney'],
    'Marketing': ['marketing', 'branding', 'advertising', 'pr', 'public relations', 'digital marketing', 'content marketing', 'social media'],
    'Sales': ['sales', 'vertrieb', 'business development', 'account manager', 'account executive', 'sales manager'],
    'HR': ['hr', 'human resources', 'recruiting', 'talent', 'personnel', 'recruiter', 'hr manager'],
    'Healthcare': ['healthcare', 'medical', 'pharma', 'health', 'medizin', 'pharmaceutical', 'hospital', 'clinic'],
    'Manufacturing': ['manufacturing', 'production', 'operations', 'supply chain', 'logistics', 'quality assurance'],
    'Education': ['education', 'teaching', 'university', 'school', 'bildung', 'pädagoge', 'professor', 'lecturer'],
    'Real Estate': ['real estate', 'immobilien', 'property', 'facility management', 'real estate agent'],
    'Retail': ['retail', 'handel', 'store', 'merchandising', 'retail management'],
    'Media': ['media', 'journalism', 'journalist', 'editor', 'publishing', 'broadcasting'],
    'Telecommunications': ['telecommunications', 'telecom', 'network operator', 'telco'],
    'Energy': ['energy', 'renewable energy', 'solar', 'wind energy', 'utilities'],
    'Automotive': ['automotive', 'automobil', 'car', 'vehicle', 'mobility'],
  }
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(kw => allText.includes(kw))) {
      industries.add(industry)
    }
  }
  
  // Bestimme primäre Branche basierend auf meisten Erfahrungen
  const industryCounts: Record<string, number> = {}
  for (const exp of profile.experiences) {
    const expText = `${exp.jobTitle} ${exp.company}`.toLowerCase()
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(kw => expText.includes(kw))) {
        industryCounts[industry] = (industryCounts[industry] || 0) + 1
      }
    }
  }
  
  const primaryIndustry = Object.entries(industryCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null
  
  return {
    industries: Array.from(industries),
    primaryIndustry
  }
}

/**
 * Extrahiert das Seniority-Level aus einem Job-Titel
 */
function extractJobSeniority(jobTitle: string): SeniorityInfo['level'] {
  const title = jobTitle.toLowerCase()
  
  if (title.match(/\b(intern|praktikant|praktikum|graduate|entry|trainee|associate level)\b/)) return 'ENTRY'
  if (title.match(/\b(junior|jr\.|jr\s)\b/)) return 'JUNIOR'
  if (title.match(/\b(head|chief|director|vp|vice president|ceo|cto|cfo|geschäftsführer|geschäftsführerin|vorstand|executive)\b/)) return 'EXECUTIVE'
  if (title.match(/\b(lead|principal|architect|leitend|team lead|tech lead)\b/)) return 'LEAD'
  if (title.match(/\b(senior|sr\.|sr\s|erfahren|experienced)\b/)) return 'SENIOR'
  
  return 'MID' // Default wenn nicht klar erkennbar
}

/**
 * Erkennt Seniority-Mismatch zwischen Profil und Job
 */
function detectSeniorityMismatch(
  profileLevel: SeniorityInfo['level'], 
  jobLevel: SeniorityInfo['level']
): 'OK' | 'WARNING' | 'CRITICAL' {
  const levelOrder = ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']
  const profileIdx = levelOrder.indexOf(profileLevel)
  const jobIdx = levelOrder.indexOf(jobLevel)
  const diff = Math.abs(profileIdx - jobIdx)
  
  // Kritisch: > 2 Levels Unterschied (z.B. SENIOR Profil + ENTRY Position)
  if (diff > 2) return 'CRITICAL'
  // Warning: 2 Levels Unterschied (z.B. SENIOR Profil + MID Position)
  if (diff === 2) return 'WARNING'
  
  return 'OK'
}

/**
 * Extrahiert die Branche aus Job-Titel und Beschreibung
 */
function extractJobIndustry(jobTitle: string, description: string): string | null {
  const text = `${jobTitle} ${description}`.toLowerCase()
  
  const industryKeywords: Record<string, string[]> = {
    'IT': ['software', 'developer', 'engineer', 'programmer', 'coding', 'it', 'tech', 'technology', 'devops', 'full stack', 'backend', 'frontend', 'system administrator', 'network engineer', 'cybersecurity', 'information technology', 'head of it', 'cto', 'chief technology', 'it manager', 'it infrastructure', 'it governance', 'software development', 'application development', 'web developer', 'app developer', 'cloud engineer', 'data engineer', 'machine learning engineer', 'ai engineer'],
    'Finance': ['finance', 'banking', 'investment', 'bank', 'financial', 'trading', 'risk', 'compliance', 'aml', 'ctf', 'portfolio', 'asset management', 'wealth management', 'private banking'],
    'Consulting': ['consulting', 'consultant', 'beratung', 'advisor', 'advisory', 'strategy consulting'],
    'Legal': ['legal', 'law', 'jurist', 'anwalt', 'recht', 'compliance officer', 'legal counsel', 'attorney', 'regulatory'],
    'Marketing': ['marketing', 'branding', 'advertising', 'pr', 'public relations', 'digital marketing'],
    'Sales': ['sales', 'vertrieb', 'business development', 'account manager', 'account executive'],
    'HR': ['hr', 'human resources', 'recruiting', 'talent', 'personnel', 'recruiter'],
    'Healthcare': ['healthcare', 'medical', 'pharma', 'health', 'medizin', 'pharmaceutical', 'hospital'],
    'Manufacturing': ['manufacturing', 'production', 'operations', 'supply chain', 'logistics'],
    'Education': ['education', 'teaching', 'university', 'school', 'bildung'],
  }
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      return industry
    }
  }
  
  return null // Branchenübergreifend oder unbekannt
}

/**
 * Prüft ob relevante Skills vorhanden sind trotz Branchen-Mismatch
 */
function hasRelevantSkills(job: JobPosting, profile: ProfileData): boolean {
  const jobText = `${job.description} ${job.requirements?.join(' ') || ''}`.toLowerCase()
  const profileSkills = profile.skills.map(s => s.name.toLowerCase())
  
  // Wenn mindestens 3 Skills matchen, könnte es trotz Branchen-Mismatch relevant sein
  const matchingSkills = profileSkills.filter(skill => {
    // Exact match oder Teilstring-Match
    return jobText.includes(skill) || skill.split(/\s+/).some(word => 
      word.length > 3 && jobText.includes(word)
    )
  })
  return matchingSkills.length >= 3
}

/**
 * Validiert und passt das Matching-Ergebnis basierend auf Seniority- und Branchen-Checks an
 */
function validateAndAdjustMatch(
  result: MatchResult,
  seniorityInfo: SeniorityInfo,
  jobSeniority: SeniorityInfo['level'],
  seniorityMismatch: 'OK' | 'WARNING' | 'CRITICAL',
  industryInfo: IndustryExperience,
  jobIndustry: string | null,
  industryMismatch: boolean,
  hasRelevantSkillsForJob: boolean,
  jobTitle?: string,
  jobDescription?: string
): MatchResult {
  let adjustedScore = result.score
  const adjustedReasons = [...(result.reasons || [])]
  const adjustedWeaknesses = [...(result.weaknesses || [])]
  
  // Prüfe auf IT-Mismatch explizit
  const isITPosition = jobIndustry === 'IT' || 
                       (jobTitle && (
                         jobTitle.toLowerCase().includes('it') ||
                         jobTitle.toLowerCase().includes('information technology') ||
                         jobTitle.toLowerCase().includes('cto') ||
                         jobTitle.toLowerCase().includes('head of it')
                       )) ||
                       (jobDescription && (
                         jobDescription.toLowerCase().includes('it-infrastruktur') ||
                         jobDescription.toLowerCase().includes('it governance') ||
                         jobDescription.toLowerCase().includes('cybersecurity') ||
                         jobDescription.toLowerCase().includes('software engineer') ||
                         jobDescription.toLowerCase().includes('developer')
                       ))
  
  const hasITExperience = industryInfo.industries.includes('IT')
  const itMismatch = isITPosition && !hasITExperience
  
  // Penalize for IT Mismatch (höchste Priorität)
  if (itMismatch && adjustedScore >= 40) {
    // IT-Position ohne IT-Erfahrung sollte Score < 40 haben
    adjustedScore = Math.min(adjustedScore, 35)
    if (!adjustedWeaknesses.some(w => w.toLowerCase().includes('it') && (w.toLowerCase().includes('keine') || w.toLowerCase().includes('erfahrung')))) {
      adjustedWeaknesses.push(`IT-Position ohne IT-Erfahrung: Keine relevante IT-Erfahrung vorhanden`)
    }
    if (!adjustedReasons.some(r => r.toLowerCase().includes('it'))) {
      adjustedReasons.push(`IT-Position erfordert IT-Erfahrung, aber Profil hat keine IT-Erfahrung`)
    }
  }
  
  // Penalize for Seniority Mismatch (falls AI es nicht erkannt hat)
  if (seniorityMismatch === 'CRITICAL' && adjustedScore >= 50) {
    // Kritischer Mismatch sollte Score < 40 haben
    adjustedScore = Math.min(adjustedScore, 35)
    if (!adjustedWeaknesses.some(w => w.toLowerCase().includes('seniority') || w.toLowerCase().includes('überqualifikation') || w.toLowerCase().includes('unterqualifikation'))) {
      adjustedWeaknesses.push(`Kritischer Seniority-Mismatch: ${seniorityInfo.level} Profil vs. ${jobSeniority} Position`)
    }
  } else if (seniorityMismatch === 'WARNING' && adjustedScore >= 70) {
    // Warning sollte Score leicht reduzieren
    adjustedScore = Math.min(adjustedScore, 65)
  }
  
  // Penalize for Industry Mismatch (falls AI es nicht erkannt hat, aber nicht für IT - das wurde schon behandelt)
  if (industryMismatch && !hasRelevantSkillsForJob && !itMismatch && adjustedScore >= 50) {
    // Branchen-Mismatch ohne relevante Skills sollte Score deutlich reduzieren
    adjustedScore = Math.max(0, adjustedScore - 30)
    if (!adjustedWeaknesses.some(w => w.toLowerCase().includes('branchen') || w.toLowerCase().includes('industry'))) {
      adjustedWeaknesses.push(`Branchen-Mismatch: Keine relevante Erfahrung in ${jobIndustry}`)
    }
  }
  
  // Zusätzliche Penalty für negative Indikatoren im AI-Output
  const reasonsText = result.reasons?.join(" ") || ""
  const weaknessesText = result.weaknesses?.join(" ") || ""
  const combinedText = (reasonsText + " " + weaknessesText).toLowerCase()
  
  const negativeIndicators = [
    "überqualifikation", "overqualified", "überqualifiziert",
    "rückwärtsschritt", "backward", "trainee", "intern", "graduate",
    "mismatch", "nicht passen", "fehlt", "unterschiedlich",
    "geringe übereinstimmung", "schlechte übereinstimmung",
    "unterqualifikation", "underqualified", "nicht qualifiziert"
  ]
  
  const hasNegativeIndicator = negativeIndicators.some(indicator => 
    combinedText.includes(indicator)
  )
  
  // Wenn negative Indikatoren vorhanden sind, weitere Penalty anwenden
  if (hasNegativeIndicator && adjustedScore >= 40) {
    adjustedScore = Math.max(0, adjustedScore - 15)
  }
  
  // Stelle sicher, dass Score in kritischen Fällen niedrig genug ist
  if (itMismatch) {
    adjustedScore = Math.min(adjustedScore, 35) // Max 35 bei IT-Mismatch
  } else if (seniorityMismatch === 'CRITICAL' || (industryMismatch && !hasRelevantSkillsForJob)) {
    adjustedScore = Math.min(adjustedScore, 45) // Max 45 bei anderen kritischen Mismatches
  }
  
  // Ensure score is between 0-100
  adjustedScore = Math.max(0, Math.min(100, adjustedScore))
  
  
  return {
    score: Math.round(adjustedScore),
    reasons: adjustedReasons,
    strengths: result.strengths || [],
    weaknesses: adjustedWeaknesses
  }
}

export async function matchJobToProfile(
  job: JobPosting,
  profile: ProfileData
): Promise<MatchResult> {
  try {
    // Extrahiere Seniority und Branche VOR dem AI-Matching
    const seniorityInfo = extractSeniorityFromProfile(profile)
    const industryInfo = extractIndustryFromProfile(profile)
    
    // Schnell-Check: Ist das Job-Title-Level passend?
    const jobSeniority = extractJobSeniority(job.jobTitle)
    const seniorityMismatch = detectSeniorityMismatch(seniorityInfo.level, jobSeniority)
    
    // Schnell-Check: Ist die Branche passend?
    const jobIndustry = extractJobIndustry(job.jobTitle, job.description)
    
    // Spezielle Behandlung für IT-Positionen: Prüfe explizit auf IT-Erfahrung
    const isITPosition = jobIndustry === 'IT' || 
                         job.jobTitle.toLowerCase().includes('it') ||
                         job.jobTitle.toLowerCase().includes('information technology') ||
                         job.jobTitle.toLowerCase().includes('cto') ||
                         job.jobTitle.toLowerCase().includes('head of it') ||
                         job.description.toLowerCase().includes('it-infrastruktur') ||
                         job.description.toLowerCase().includes('it governance') ||
                         job.description.toLowerCase().includes('cybersecurity') ||
                         job.description.toLowerCase().includes('software engineer') ||
                         job.description.toLowerCase().includes('developer')
    
    // Prüfe ob Profil IT-Erfahrung hat
    const hasITExperience = profile.experiences.some(e => 
      e.jobTitle.toLowerCase().includes('it') ||
      e.jobTitle.toLowerCase().includes('software') ||
      e.jobTitle.toLowerCase().includes('developer') ||
      e.jobTitle.toLowerCase().includes('engineer') ||
      e.jobTitle.toLowerCase().includes('programmer') ||
      e.jobTitle.toLowerCase().includes('tech') ||
      e.company.toLowerCase().includes('tech') ||
      e.company.toLowerCase().includes('software')
    ) || profile.skills.some(s => 
      s.name.toLowerCase().includes('programming') ||
      s.name.toLowerCase().includes('software') ||
      s.name.toLowerCase().includes('development') ||
      s.name.toLowerCase().includes('it') ||
      s.name.toLowerCase().includes('cybersecurity') ||
      s.name.toLowerCase().includes('python') ||
      s.name.toLowerCase().includes('java') ||
      s.name.toLowerCase().includes('javascript') ||
      s.name.toLowerCase().includes('typescript')
    ) || industryInfo.industries.includes('IT')
    
    // IT-spezifischer Mismatch: Wenn IT-Position aber keine IT-Erfahrung
    const itMismatch = isITPosition && !hasITExperience
    
    const industryMismatch = (jobIndustry && industryInfo.primaryIndustry && 
      jobIndustry !== industryInfo.primaryIndustry && 
      !industryInfo.industries.includes(jobIndustry)) || itMismatch
    
    // Prüfe ob relevante Skills vorhanden sind trotz Branchen-Mismatch
    // Für IT-Positionen ohne IT-Erfahrung gelten strengere Regeln
    const hasRelevantSkillsForJob = isITPosition && !hasITExperience 
      ? false // IT-Positionen ohne IT-Erfahrung werden nicht durch Skills gerettet
      : hasRelevantSkills(job, profile)
    
    // Wenn klarer Mismatch, sofort niedrigeren Score oder ausschließen
    if (seniorityMismatch === 'CRITICAL' || (industryMismatch && !hasRelevantSkillsForJob) || itMismatch) {
      const reasons: string[] = []
      const weaknesses: string[] = []
      
      if (seniorityMismatch === 'CRITICAL') {
        const levelNames: Record<string, string> = {
          'ENTRY': 'Einstieg/Intern',
          'JUNIOR': 'Junior',
          'MID': 'Mitte',
          'SENIOR': 'Senior',
          'LEAD': 'Lead',
          'EXECUTIVE': 'Executive/Director',
          'UNKNOWN': 'Unbekannt'
        }
        reasons.push(`Nicht passendes Seniority-Level: ${levelNames[seniorityInfo.level]} Profil vs. ${levelNames[jobSeniority]} Position`)
        weaknesses.push(
          jobSeniority === 'ENTRY' || jobSeniority === 'JUNIOR'
            ? `Position ist zu niedrig für dein Profil (Überqualifikation)`
            : `Position ist zu hoch für dein Profil (Unterqualifikation)`
        )
      }
      
      if (itMismatch) {
        reasons.push(`IT-Position ohne IT-Erfahrung: ${job.jobTitle}`)
        weaknesses.push(`Keine IT-Erfahrung vorhanden für IT-Position`)
      } else if (industryMismatch && !hasRelevantSkillsForJob) {
        reasons.push(`Branchen-Mismatch: Keine relevante Erfahrung in ${jobIndustry || 'der erforderlichen Branche'}`)
        weaknesses.push(`Keine relevante Branchen-Erfahrung vorhanden (Profil: ${industryInfo.primaryIndustry || 'verschiedene Branchen'}, Position: ${jobIndustry || 'unbekannte Branche'})`)
      }
      
      return {
        score: seniorityMismatch === 'CRITICAL' ? 15 : 30, // Sehr niedriger Score
        reasons,
        strengths: [],
        weaknesses
      }
    }
    
    // Build profile summary mit zusätzlichen Kontext-Informationen
    const skillsList = profile.skills.map(s => s.name).join(", ")
    const experienceTitles = profile.experiences.map(e => e.jobTitle).join(", ")
    const educationList = profile.education.map(e => `${e.degree} (${e.institution})`).join(", ")
    
    const profileSummary = `
Tagline: ${profile.tagline || "Nicht angegeben"}
Summary: ${profile.summary || "Nicht angegeben"}

Skills: ${skillsList || "Keine"}
Erfahrungen: ${experienceTitles || "Keine"}
Bildung: ${educationList || "Keine"}
Sprachen: ${profile.languages.map(l => `${l.name} (${l.level})`).join(", ") || "Keine"}

WICHTIG - Profil-Analyse:
Seniority-Level: ${seniorityInfo.level} (${seniorityInfo.indicators.join(", ")}, ${seniorityInfo.totalYears} Jahre Erfahrung)
Branchen-Erfahrung: ${industryInfo.primaryIndustry || "Verschiedene"} (${industryInfo.industries.join(", ") || "Keine"})
${seniorityMismatch === 'WARNING' ? `⚠️ WARNUNG: Seniority-Unterschied erkannt (${seniorityInfo.level} vs. ${jobSeniority})` : ''}
${industryMismatch && hasRelevantSkillsForJob ? `⚠️ INFO: Branchen-Unterschied, aber relevante Skills vorhanden` : ''}
`

    const jobDescription = `
Titel: ${job.jobTitle}
Firma: ${job.company}
Standort: ${job.location || "Nicht angegeben"}

Beschreibung:
${job.description}

Anforderungen:
${job.requirements?.join("\n") || "Keine"}

Nice-to-have:
${job.niceToHave?.join("\n") || "Keine"}
`

    if (!anthropic) {
      // Fallback: Return a basic match result if Anthropic is not configured
      return {
        score: 50,
        reasons: ["Anthropic API ist nicht konfiguriert"],
        strengths: [],
        weaknesses: []
      }
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Analysiere, wie gut das folgende Stelleninserat zum Profil des Bewerbers passt.

STELLENINSERAT:
${jobDescription}

BEWERBERPROFIL:
${profileSummary}

KRITISCHE ANFORDERUNGEN:
1. Seniority-Level-Match: Das Profil hat Level "${seniorityInfo.level}" (${seniorityInfo.totalYears} Jahre Erfahrung). Die Position sollte ähnliches Level haben (max. 1 Level Unterschied erlaubt).
   - ENTRY/JUNIOR → Nur ENTRY, JUNIOR oder MID akzeptabel
   - MID → JUNIOR, MID oder SENIOR akzeptabel
   - SENIOR → MID, SENIOR oder LEAD akzeptabel
   - LEAD/EXECUTIVE → Nur SENIOR, LEAD oder EXECUTIVE akzeptabel
   
   NICHT akzeptabel:
   - Senior-Profil (5+ Jahre) + Intern/Junior Position (Überqualifikation) → Score MUSS < 40 sein
   - Junior-Profil (< 2 Jahre) + Head/Director Position (Unterqualifikation) → Score MUSS < 40 sein

2. Branchen-Match: Das Profil hat Erfahrung in "${industryInfo.primaryIndustry || 'verschiedenen Branchen'}" (${industryInfo.industries.join(', ') || 'keine spezifische Branche'}).
   - Wenn Position eine spezifische Branche erfordert (z.B. IT, Finance) und Profil KEINE relevante Erfahrung hat → Score deutlich reduzieren (-30 Punkte)
   - SPEZIELLE REGEL FÜR IT-POSITIONEN: IT-Positionen (z.B. "Head of IT", "IT Manager", "CTO", "Software Engineer", "Developer") erfordern IT-Erfahrung. Wenn Profil KEINE IT-Erfahrung hat (keine IT-Job-Titel, keine IT-Skills, keine IT-Firmen) → Score MUSS < 40 sein
   - Wenn Position branchenübergreifend ist oder Profil relevante Skills hat → Keine Strafe (außer IT-Positionen!)
   - Branchenübergreifende Positionen (z.B. General Management, Consulting ohne IT-Fokus) sind meist OK

3. Skills & Erfahrung: Übliche Matching-Kriterien (Skills, Berufserfahrung, Bildung, Sprachen)

Bewerte die Übereinstimmung auf einer Skala von 0-100 und gib eine detaillierte Analyse.

Antworte im JSON-Format:
{
  "score": number (0-100, wie gut passt der Job),
  "reasons": ["Grund 1", "Grund 2", ...] (max. 5 Gründe),
  "strengths": ["Stärke 1", "Stärke 2", ...],
  "weaknesses": ["Schwäche 1", "Schwäche 2", ...]
}

BEWERTUNGSRICHTLINIEN:
- Score 70+: Gute Übereinstimmung (passendes Seniority, relevante Branche, viele Skills)
- Score 50-69: Teilweise Übereinstimmung (ähnliches Seniority, ähnliche Branche, einige Skills)
- Score 30-49: Schwache Übereinstimmung (Seniority-Mismatch ODER Branchen-Mismatch ODER fehlende Skills)
- Score 0-29: Sehr schlechte Übereinstimmung (mehrere kritische Mismatches)

WICHTIG: 
- Wenn Seniority-Mismatch (z.B. Senior-Profil + Intern Position) erkannt wird, MUSS der Score < 50 sein
- Wenn IT-Position (z.B. "Head of IT", "IT Manager", "Software Engineer") aber KEINE IT-Erfahrung im Profil → Score MUSS < 40 sein
- Wenn andere Branchen-Mismatch (z.B. keine Finance-Erfahrung + Finance-Position) erkannt wird, MUSS der Score < 50 sein`
      }]
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // Fallback: Simple scoring
      return calculateSimpleMatch(job, profile)
    }

    try {
      const result = JSON.parse(jsonMatch[0]) as MatchResult
      // Ensure score is between 0-100
      result.score = Math.max(0, Math.min(100, result.score || 0))
      
      
      // Validierung und Anpassung basierend auf Seniority- und Branchen-Mismatches
      const validatedResult = validateAndAdjustMatch(
        result,
        seniorityInfo,
        jobSeniority,
        seniorityMismatch,
        industryInfo,
        jobIndustry,
        industryMismatch,
        hasRelevantSkillsForJob,
        job.jobTitle,
        job.description
      )
      
      return validatedResult
    } catch {
      return calculateSimpleMatch(job, profile, seniorityInfo, industryInfo)
    }
  } catch (error) {
    console.error("Job matching error:", error)
    // Fallback to simple matching
    const seniorityInfo = extractSeniorityFromProfile(profile)
    const industryInfo = extractIndustryFromProfile(profile)
    return calculateSimpleMatch(job, profile, seniorityInfo, industryInfo)
  }
}

function calculateSimpleMatch(
  job: JobPosting,
  profile: ProfileData,
  seniorityInfo?: SeniorityInfo,
  industryInfo?: IndustryExperience
): MatchResult {
  let score = 0
  const reasons: string[] = []
  const strengths: string[] = []
  const weaknesses: string[] = []

  // Extrahiere Seniority und Branche falls nicht übergeben
  const profileSeniority = seniorityInfo || extractSeniorityFromProfile(profile)
  const profileIndustry = industryInfo || extractIndustryFromProfile(profile)
  
  // Check Seniority Match
  const jobSeniority = extractJobSeniority(job.jobTitle)
  const seniorityMismatch = detectSeniorityMismatch(profileSeniority.level, jobSeniority)
  
  if (seniorityMismatch === 'CRITICAL') {
    score -= 50 // Starke Penalty
    weaknesses.push(`Kritischer Seniority-Mismatch: ${profileSeniority.level} Profil vs. ${jobSeniority} Position`)
  } else if (seniorityMismatch === 'WARNING') {
    score -= 20 // Moderate Penalty
    weaknesses.push(`Seniority-Unterschied: ${profileSeniority.level} Profil vs. ${jobSeniority} Position`)
  } else {
    strengths.push(`Passendes Seniority-Level: ${profileSeniority.level}`)
    score += 10
  }

  // Check Industry Match
  const jobIndustry = extractJobIndustry(job.jobTitle, job.description)
  const industryMismatch = jobIndustry && profileIndustry.primaryIndustry && 
    jobIndustry !== profileIndustry.primaryIndustry && 
    !profileIndustry.industries.includes(jobIndustry)
  
  if (industryMismatch && !hasRelevantSkills(job, profile)) {
    score -= 30 // Branchen-Mismatch ohne relevante Skills
    weaknesses.push(`Branchen-Mismatch: Keine relevante Erfahrung in ${jobIndustry}`)
  } else if (jobIndustry && (profileIndustry.primaryIndustry === jobIndustry || profileIndustry.industries.includes(jobIndustry))) {
    score += 15
    strengths.push(`Relevante Branchen-Erfahrung: ${jobIndustry}`)
  }

  // Check skills match
  const jobText = `${job.description} ${job.requirements?.join(" ") || ""}`.toLowerCase()
  const profileSkills = profile.skills.map(s => s.name.toLowerCase())
  
  let matchingSkills = 0
  profileSkills.forEach(skill => {
    if (jobText.includes(skill)) {
      matchingSkills++
    }
  })

  if (matchingSkills > 0) {
    const skillMatchPercent = (matchingSkills / profileSkills.length) * 100
    score += Math.min(40, skillMatchPercent * 0.4)
    if (matchingSkills >= 3) {
      strengths.push(`${matchingSkills} relevante Skills gefunden`)
    }
  } else {
    weaknesses.push("Keine passenden Skills gefunden")
  }

  // Check experience match
  const experienceTitles = profile.experiences.map(e => e.jobTitle.toLowerCase())
  let matchingExperience = false
  experienceTitles.forEach(title => {
    if (jobText.includes(title) || job.jobTitle.toLowerCase().includes(title.split(" ")[0])) {
      matchingExperience = true
    }
  })

  if (matchingExperience) {
    score += 30
    strengths.push("Relevante Berufserfahrung vorhanden")
  } else {
    weaknesses.push("Keine direkte Berufserfahrung für diese Position")
  }

  // Check education (basic)
  if (profile.education.length > 0) {
    score += 10
  }

  // Check languages
  const jobLanguages = jobText.match(/(deutsch|englisch|french|spanish|italienisch)/gi) || []
  const profileLanguages = profile.languages.map(l => l.name.toLowerCase())
  const matchingLanguages = jobLanguages.filter(lang => 
    profileLanguages.some(pl => pl.includes(lang.toLowerCase()) || lang.toLowerCase().includes(pl))
  )

  if (matchingLanguages.length > 0) {
    score += 10
    strengths.push(`Sprachkenntnisse passen: ${matchingLanguages.join(", ")}`)
  }

  // Normalize score
  score = Math.min(100, Math.max(0, score))

  if (score >= 70) {
    reasons.push("Gute Übereinstimmung zwischen Profil und Stellenanforderungen")
  } else if (score >= 50) {
    reasons.push("Teilweise Übereinstimmung, einige Anforderungen erfüllt")
  } else {
    reasons.push("Geringe Übereinstimmung, viele Anforderungen fehlen")
  }

  return {
    score: Math.round(score),
    reasons,
    strengths,
    weaknesses
  }
}
