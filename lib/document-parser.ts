import { anthropic } from "./anthropic"

interface ParsedProfile {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  city?: string
  country?: string
  linkedInUrl?: string
  tagline?: string
  summary?: string
  experiences: Array<{
    jobTitle: string
    company: string
    location?: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    bullets: string[]
  }>
  education: Array<{
    degree: string
    institution: string
    location?: string
    startDate?: string
    endDate?: string
    grade?: string
  }>
  skills: Array<{
    name: string
    category: string
  }>
  languages: Array<{
    name: string
    level: string
  }>
  certifications: Array<{
    name: string
    issuer?: string
    year?: number
  }>
}

export async function parseCV(
  fileBuffer: Buffer, 
  fileType: string,
  extractedText?: string
): Promise<ParsedProfile> {
  try {
    const text = extractedText || await extractTextFromDocument(fileBuffer, fileType)
    
    if (!text || text.trim().length === 0) {
      throw new Error("Could not extract text from document. The file might be corrupted or empty.")
    }
    
    if (!anthropic) {
      throw new Error("Anthropic API is not configured. Please check your ANTHROPIC_API_KEY environment variable.")
    }
    
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `Analysiere den folgenden CV-Text und extrahiere ALLE Informationen in ein strukturiertes JSON-Format.

CV Text:
---
${text.substring(0, 50000)}
---

Extrahiere die Daten in folgendes JSON-Format (antworte NUR mit dem JSON, keine Erklärungen):

{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string (mit Ländervorwahl)",
  "city": "string",
  "country": "string",
  "linkedInUrl": "string oder null",
  "tagline": "string (die Zeile unter dem Namen, z.B. 'Senior Consultant')",
  "summary": "string (der Profil/Summary Abschnitt)",
  "experiences": [
    {
      "jobTitle": "string",
      "company": "string",
      "location": "string",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY oder null wenn aktuell",
      "isCurrent": boolean,
      "bullets": ["bullet1", "bullet2", ...]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string oder null",
      "startDate": "YYYY oder null",
      "endDate": "YYYY oder null",
      "grade": "string oder null (z.B. 'magna cum laude')"
    }
  ],
  "skills": [
    {
      "name": "string (einzelner Skill)",
      "category": "string (Kategorie wie 'Strategieentwicklung', 'Digitale Transformation')"
    }
  ],
  "languages": [
    {
      "name": "string",
      "level": "string (z.B. 'Muttersprache', 'C1', 'B2')"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string oder null",
      "year": number oder null
    }
  ]
}

WICHTIG:
- Behalte die Originalsprache bei (Deutsch/Englisch)
- Extrahiere JEDEN Bullet Point vollständig
- Achte auf das Datumsformat: MM/YYYY für Erfahrungen, YYYY für Ausbildung
- Bei "Heute" oder "Aktuell": endDate = null, isCurrent = true
- Skills gruppieren nach Kategorien wie im Original-CV`
      }]
    })
    
    if (!response.content || response.content.length === 0) {
      throw new Error("Empty response from Anthropic API")
    }
    
    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error(`Unexpected response type: ${content.type}`)
    }
    
    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error(`Could not parse CV structure. Response: ${content.text.substring(0, 200)}`)
    }
    
    try {
      return JSON.parse(jsonMatch[0]) as ParsedProfile
    } catch (parseError) {
      throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Unknown error during CV parsing: ${String(error)}`)
  }
}

async function extractTextFromDocument(
  buffer: Buffer, 
  fileType: string
): Promise<string> {
  if (fileType === "application/pdf") {
    const pdfParse = await import("pdf-parse")
    const data = await pdfParse.default(buffer)
    return data.text
  }
  
  if (fileType.includes("word") || fileType.includes("docx")) {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  
  if (fileType.includes("powerpoint") || fileType.includes("pptx") || fileType.includes("ppt")) {
    const officeparser = await import("officeparser")
    const text = await officeparser.parseOfficeAsync(buffer)
    return text
  }
  
  throw new Error(`Unsupported file type: ${fileType}`)
}

