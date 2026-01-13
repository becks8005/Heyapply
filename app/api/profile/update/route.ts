import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const profileUpdateSchema = z.object({
  // User fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().url().optional().nullable(),
  profileImageCrop: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    zoom: z.number(),
  }).optional().nullable(),

  // Profile fields
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  linkedInUrl: z.string().optional().nullable(), // Removed .url() - PDF imports may not include protocol
  tagline: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),

  // Experiences
  experiences: z.array(z.object({
    id: z.string().optional(),
    jobTitle: z.string(),
    company: z.string(),
    location: z.string().optional().nullable(),
    startDate: z.string(),
    endDate: z.string().optional().nullable(),
    isCurrent: z.boolean(),
    bullets: z.array(z.string()),
    order: z.number(),
  })).optional(),

  // Education
  education: z.array(z.object({
    id: z.string().optional(),
    degree: z.string(),
    institution: z.string(),
    location: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    grade: z.string().optional().nullable(),
    order: z.number(),
  })).optional(),

  // Skills
  skills: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    category: z.string(),
    order: z.number(),
  })).optional(),

  // Languages
  languages: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    level: z.string(),
    order: z.number(),
  })).optional(),

  // Certifications
  certifications: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    issuer: z.string().optional().nullable(),
    year: z.number().optional().nullable(),
    order: z.number(),
  })).optional(),
})

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = profileUpdateSchema.parse(body)

    // Update user
    const userUpdate: any = {}
    if (data.firstName !== undefined) userUpdate.firstName = data.firstName
    if (data.lastName !== undefined) userUpdate.lastName = data.lastName
    if (data.profileImageUrl !== undefined) userUpdate.profileImageUrl = data.profileImageUrl
    if (data.profileImageCrop !== undefined) userUpdate.profileImageCrop = data.profileImageCrop ? JSON.stringify(data.profileImageCrop) : null

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdate
      })
    }

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: session.user.id }
      })
    }

    // Update profile
    const profileUpdate: any = {}
    if (data.phone !== undefined) profileUpdate.phone = data.phone
    if (data.email !== undefined) profileUpdate.email = data.email
    if (data.address !== undefined) profileUpdate.address = data.address
    if (data.city !== undefined) profileUpdate.city = data.city
    if (data.country !== undefined) profileUpdate.country = data.country
    if (data.linkedInUrl !== undefined) profileUpdate.linkedInUrl = data.linkedInUrl
    if (data.tagline !== undefined) profileUpdate.tagline = data.tagline
    if (data.summary !== undefined) profileUpdate.summary = data.summary

    if (Object.keys(profileUpdate).length > 0) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: profileUpdate
      })
    }

    // Update experiences
    if (data.experiences !== undefined) {
      // Delete all existing
      await prisma.experience.deleteMany({ where: { profileId: profile.id } })
      
      // Create new ones
      if (data.experiences.length > 0) {
        await prisma.experience.createMany({
          data: data.experiences.map(exp => ({
            profileId: profile.id,
            jobTitle: exp.jobTitle,
            company: exp.company,
            location: exp.location,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            isCurrent: exp.isCurrent,
            bullets: JSON.stringify(exp.bullets),
            order: exp.order,
          }))
        })
      }
    }

    // Update education
    if (data.education !== undefined) {
      await prisma.education.deleteMany({ where: { profileId: profile.id } })
      if (data.education.length > 0) {
        await prisma.education.createMany({
          data: data.education.map(edu => ({
            profileId: profile.id,
            degree: edu.degree,
            institution: edu.institution,
            location: edu.location,
            startDate: edu.startDate ? new Date(edu.startDate) : null,
            endDate: edu.endDate ? new Date(edu.endDate) : null,
            grade: edu.grade,
            order: edu.order,
          }))
        })
      }
    }

    // Update skills
    if (data.skills !== undefined) {
      await prisma.skill.deleteMany({ where: { profileId: profile.id } })
      if (data.skills.length > 0) {
        await prisma.skill.createMany({
          data: data.skills.map(skill => ({
            profileId: profile.id,
            name: skill.name,
            category: skill.category,
            order: skill.order,
          }))
        })
      }
    }

    // Update languages
    if (data.languages !== undefined) {
      await prisma.language.deleteMany({ where: { profileId: profile.id } })
      if (data.languages.length > 0) {
        await prisma.language.createMany({
          data: data.languages.map(lang => ({
            profileId: profile.id,
            name: lang.name,
            level: lang.level,
            order: lang.order,
          }))
        })
      }
    }

    // Update certifications
    if (data.certifications !== undefined) {
      await prisma.certification.deleteMany({ where: { profileId: profile.id } })
      if (data.certifications.length > 0) {
        await prisma.certification.createMany({
          data: data.certifications.map(cert => ({
            profileId: profile.id,
            name: cert.name,
            issuer: cert.issuer,
            year: cert.year,
            order: cert.order,
          }))
        })
      }
    }

    // Fetch updated profile
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
    console.error("Profile update error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Daten", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Profils" },
      { status: 500 }
    )
  }
}

