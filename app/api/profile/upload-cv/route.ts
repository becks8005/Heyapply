import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase, getSupabaseConfigError, isSupabaseConfigured } from "@/lib/supabase"
import { parseCV } from "@/lib/document-parser"
import { saveFileLocally, isLocalStorageAvailable } from "@/lib/local-storage"
import { getAnthropicConfigError, isAnthropicConfigured } from "@/lib/anthropic"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Nur PDF, DOCX oder PPTX erlaubt" },
        { status: 400 }
      )
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Datei zu gross (max. 10 MB)" },
        { status: 400 }
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${session.user.id}/${Date.now()}-${file.name}`
    const fileType = file.type.includes("pdf") ? "pdf" : 
                     file.type.includes("word") ? "docx" : "pptx"

    let publicUrl: string

    // Versuche zuerst Supabase, dann lokale Speicherung (nur Development)
    if (isSupabaseConfigured(true)) {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase!.storage
        .from("cvs")
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        
        // Spezifische Fehlermeldungen für häufige Probleme
        let errorMessage = "Fehler beim Hochladen der Datei"
        if (uploadError.message?.includes("Bucket not found")) {
          errorMessage = "Storage Bucket 'cvs' wurde nicht gefunden. Bitte erstelle den Bucket in deinem Supabase Dashboard."
        } else if (uploadError.message?.includes("new row violates row-level security")) {
          errorMessage = "Storage Bucket 'cvs' ist nicht öffentlich. Bitte aktiviere 'Public bucket' in Supabase Storage Settings."
        } else if (uploadError.message) {
          errorMessage = `Upload-Fehler: ${uploadError.message}`
        }
        
        return NextResponse.json(
          { 
            error: errorMessage,
            errorCode: "UPLOAD_FAILED",
            details: process.env.NODE_ENV === "development" ? uploadError.message : undefined
          },
          { status: 500 }
        )
      }

      const { data: { publicUrl: supabaseUrl } } = supabase!.storage
        .from("cvs")
        .getPublicUrl(fileName)
      publicUrl = supabaseUrl
    } else {
      // Fallback: Lokale Speicherung (nur Development)
      const localUrl = await saveFileLocally(fileBuffer, fileName, "cvs")
      if (!localUrl) {
        const supabaseError = getSupabaseConfigError("CV-Upload", true)
        return NextResponse.json(
          { 
            error: supabaseError + " Lokale Speicherung ist nicht verfügbar.",
            errorCode: "SUPABASE_NOT_CONFIGURED",
            helpUrl: "/SETUP-FREE-TIERS.md#1-supabase-file-storage---free-tier"
          },
          { status: 503 } // Service Unavailable
        )
      }
      publicUrl = localUrl
    }

    // Check if Anthropic is configured before parsing
    if (!isAnthropicConfigured()) {
      const anthropicError = getAnthropicConfigError()
      return NextResponse.json(
        { 
          error: anthropicError || "Anthropic API ist nicht konfiguriert",
          errorCode: "ANTHROPIC_NOT_CONFIGURED",
        },
        { status: 503 }
      )
    }

    // Parse CV
    const parsedProfile = await parseCV(fileBuffer, file.type)

    // Get current user and profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        experiences: { orderBy: { order: "asc" } },
        education: { orderBy: { order: "asc" } },
        skills: { orderBy: { order: "asc" } },
        languages: { orderBy: { order: "asc" } },
        certifications: { orderBy: { order: "asc" } },
      }
    })

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: session.user.id },
        include: {
          experiences: { orderBy: { order: "asc" } },
          education: { orderBy: { order: "asc" } },
          skills: { orderBy: { order: "asc" } },
          languages: { orderBy: { order: "asc" } },
          certifications: { orderBy: { order: "asc" } },
        }
      })
    }

    // Check for conflicts
    const conflicts: any = {}
    const newData: any = {
      source: "cv",
      originalCvUrl: publicUrl,
      originalCvType: fileType,
      user: {
        firstName: parsedProfile.firstName || null,
        lastName: parsedProfile.lastName || null,
      },
      profile: {
        email: parsedProfile.email || null,
        phone: parsedProfile.phone || null,
        city: parsedProfile.city || null,
        country: parsedProfile.country || "Schweiz",
        linkedInUrl: parsedProfile.linkedInUrl || null,
        tagline: parsedProfile.tagline || null,
        summary: parsedProfile.summary || null,
      },
      experiences: parsedProfile.experiences,
      education: parsedProfile.education,
      skills: parsedProfile.skills,
      languages: parsedProfile.languages,
      certifications: parsedProfile.certifications,
    }

    // Check user field conflicts
    if (parsedProfile.firstName && user?.firstName && 
        parsedProfile.firstName.trim().toLowerCase() !== user.firstName.trim().toLowerCase()) {
      conflicts.user = conflicts.user || {}
      conflicts.user.firstName = {
        current: user.firstName,
        new: parsedProfile.firstName,
      }
    }

    if (parsedProfile.lastName && user?.lastName && 
        parsedProfile.lastName.trim().toLowerCase() !== user.lastName.trim().toLowerCase()) {
      conflicts.user = conflicts.user || {}
      conflicts.user.lastName = {
        current: user.lastName,
        new: parsedProfile.lastName,
      }
    }

    // Check profile field conflicts
    if (parsedProfile.email && profile.email && 
        parsedProfile.email.trim().toLowerCase() !== profile.email.trim().toLowerCase()) {
      conflicts.profile = conflicts.profile || {}
      conflicts.profile.email = {
        current: profile.email,
        new: parsedProfile.email,
      }
    }

    if (parsedProfile.phone && profile.phone && 
        parsedProfile.phone.trim() !== profile.phone.trim()) {
      conflicts.profile = conflicts.profile || {}
      conflicts.profile.phone = {
        current: profile.phone,
        new: parsedProfile.phone,
      }
    }

    if (parsedProfile.city && profile.city && 
        parsedProfile.city.trim().toLowerCase() !== profile.city.trim().toLowerCase()) {
      conflicts.profile = conflicts.profile || {}
      conflicts.profile.city = {
        current: profile.city,
        new: parsedProfile.city,
      }
    }

    if (parsedProfile.country && profile.country && 
        parsedProfile.country.trim().toLowerCase() !== profile.country.trim().toLowerCase()) {
      conflicts.profile = conflicts.profile || {}
      conflicts.profile.country = {
        current: profile.country,
        new: parsedProfile.country,
      }
    }

    if (parsedProfile.linkedInUrl && profile.linkedInUrl && 
        parsedProfile.linkedInUrl.trim() !== profile.linkedInUrl.trim()) {
      conflicts.profile = conflicts.profile || {}
      conflicts.profile.linkedInUrl = {
        current: profile.linkedInUrl,
        new: parsedProfile.linkedInUrl,
      }
    }

    if (parsedProfile.tagline && profile.tagline && 
        parsedProfile.tagline.trim() !== profile.tagline.trim()) {
      conflicts.profile = conflicts.profile || {}
      conflicts.profile.tagline = {
        current: profile.tagline,
        new: parsedProfile.tagline,
      }
    }

    if (parsedProfile.summary && profile.summary && 
        parsedProfile.summary.trim() !== profile.summary.trim()) {
      conflicts.profile = conflicts.profile || {}
      conflicts.profile.summary = {
        current: profile.summary,
        new: parsedProfile.summary,
      }
    }

    // If there are conflicts, return them for user resolution
    if (Object.keys(conflicts).length > 0) {
      return NextResponse.json({
        hasConflicts: true,
        conflicts,
        newData,
      }, { status: 409 }) // 409 Conflict
    }

    // No conflicts - proceed with update
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: parsedProfile.firstName || undefined,
        lastName: parsedProfile.lastName || undefined,
      }
    })

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        originalCvUrl: publicUrl,
        originalCvType: fileType,
        email: parsedProfile.email,
        phone: parsedProfile.phone,
        city: parsedProfile.city,
        country: parsedProfile.country || "Schweiz",
        linkedInUrl: parsedProfile.linkedInUrl,
        tagline: parsedProfile.tagline,
        summary: parsedProfile.summary,
      }
    })

    // Delete old experiences, education, etc.
    await Promise.all([
      prisma.experience.deleteMany({ where: { profileId: profile.id } }),
      prisma.education.deleteMany({ where: { profileId: profile.id } }),
      prisma.skill.deleteMany({ where: { profileId: profile.id } }),
      prisma.language.deleteMany({ where: { profileId: profile.id } }),
      prisma.certification.deleteMany({ where: { profileId: profile.id } }),
    ])

    // Helper function to parse dates from various formats
    const parseDate = (dateStr: string | number | undefined | null, fallbackToNow = false): Date | null => {
      if (!dateStr && dateStr !== 0) return fallbackToNow ? new Date() : null
      
      // Convert to string if it's a number
      const dateStrString = String(dateStr)
      
      // Try various date formats
      // Format: MM/YYYY (e.g., "01/2024")
      const mmYYYYMatch = dateStrString.match(/^(\d{1,2})\/(\d{4})$/)
      if (mmYYYYMatch) {
        const month = parseInt(mmYYYYMatch[1], 10) - 1
        const year = parseInt(mmYYYYMatch[2], 10)
        return new Date(year, month, 1)
      }
      
      // Format: YYYY-MM (e.g., "2024-01")
      const yyyyMMMatch = dateStrString.match(/^(\d{4})-(\d{1,2})$/)
      if (yyyyMMMatch) {
        const year = parseInt(yyyyMMMatch[1], 10)
        const month = parseInt(yyyyMMMatch[2], 10) - 1
        return new Date(year, month, 1)
      }
      
      // Format: YYYY (e.g., "2024")
      const yyyyMatch = dateStrString.match(/^(\d{4})$/)
      if (yyyyMatch) {
        return new Date(parseInt(yyyyMatch[1], 10), 0, 1)
      }
      
      // Format: Month YYYY (e.g., "January 2024", "Jan 2024")
      const monthNameMatch = dateStrString.match(/^(\w+)\s+(\d{4})$/)
      if (monthNameMatch) {
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                          'july', 'august', 'september', 'october', 'november', 'december']
        const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                            'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        const monthStr = monthNameMatch[1].toLowerCase()
        let monthIndex = monthNames.indexOf(monthStr)
        if (monthIndex === -1) monthIndex = shortMonths.indexOf(monthStr)
        if (monthIndex !== -1) {
          return new Date(parseInt(monthNameMatch[2], 10), monthIndex, 1)
        }
      }
      
      // Try standard Date parse as fallback
      const parsed = new Date(dateStrString)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
      
      // If nothing works, return current date for start dates (required) or null
      return fallbackToNow ? new Date() : null
    }

    const toDateSafe = (dateStr: string | undefined | null, required = false): Date | null => {
      const d = parseDate(dateStr, required)
      if (!d) return required ? new Date() : null
      return isNaN(d.getTime()) ? (required ? new Date() : null) : d
    }

    const experiences = Array.isArray(parsedProfile.experiences) ? parsedProfile.experiences : []
    const educationItems = Array.isArray(parsedProfile.education) ? parsedProfile.education : []
    const skills = Array.isArray(parsedProfile.skills) ? parsedProfile.skills : []
    const languages = Array.isArray(parsedProfile.languages) ? parsedProfile.languages : []
    const certifications = Array.isArray(parsedProfile.certifications) ? parsedProfile.certifications : []

    // Create experiences
    if (experiences.length > 0) {
      await prisma.experience.createMany({
        data: experiences.map((exp, idx) => {
          const bulletsArray = Array.isArray(exp.bullets)
            ? exp.bullets.filter(Boolean).map(String)
            : exp.bullets
              ? [String(exp.bullets)]
              : []

          return {
          profileId: profile.id,
          jobTitle: exp.jobTitle,
          company: exp.company,
          location: exp.location,
          startDate: toDateSafe(exp.startDate, true)!,
          endDate: toDateSafe(exp.endDate, false),
          isCurrent: exp.isCurrent,
            bullets: JSON.stringify(bulletsArray),
          order: idx,
          }
        })
      })
    }

    // Create education
    if (educationItems.length > 0) {
      await prisma.education.createMany({
        data: educationItems.map((edu, idx) => ({
          profileId: profile.id,
          degree: edu.degree,
          institution: edu.institution,
          location: edu.location,
          startDate: toDateSafe(edu.startDate, false),
          endDate: toDateSafe(edu.endDate, false),
          grade: edu.grade,
          order: idx,
        }))
      })
    }

    // Create skills
    if (parsedProfile.skills.length > 0) {
      await prisma.skill.createMany({
        data: parsedProfile.skills.map((skill, idx) => ({
          profileId: profile.id,
          name: skill.name,
          category: skill.category,
          order: idx,
        }))
      })
    }

    // Create languages
    if (parsedProfile.languages.length > 0) {
      await prisma.language.createMany({
        data: parsedProfile.languages.map((lang, idx) => ({
          profileId: profile.id,
          name: lang.name,
          level: lang.level,
          order: idx,
        }))
      })
    }

    // Create certifications
    if (parsedProfile.certifications.length > 0) {
      await prisma.certification.createMany({
        data: parsedProfile.certifications.map((cert, idx) => ({
          profileId: profile.id,
          name: cert.name,
          issuer: cert.issuer,
          year: cert.year,
          order: idx,
        }))
      })
    }

    // Fetch complete profile
    const updatedProfile = await prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        experiences: { orderBy: { order: "asc" } },
        education: { orderBy: { order: "asc" } },
        skills: { orderBy: { order: "asc" } },
        languages: { orderBy: { order: "asc" } },
        certifications: { orderBy: { order: "asc" } },
      }
    })

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error("CV upload error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log detailed error for debugging
    console.error("CV upload error details:", {
      message: errorMessage,
      stack: errorStack,
      type: typeof error,
    })
    
    return NextResponse.json(
      { 
        error: "Fehler beim Verarbeiten des CVs",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

