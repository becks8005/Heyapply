import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { conflicts, newData, resolutions } = body

    if (!newData || !resolutions) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

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

    // Apply resolutions
    const userUpdate: any = {}
    const profileUpdate: any = {}

    if (newData.source === "cv") {
      // CV upload resolution
      if (resolutions.user) {
        if (resolutions.user.firstName === "new") {
          userUpdate.firstName = newData.user.firstName
        } else if (resolutions.user.firstName === "current" && user?.firstName) {
          userUpdate.firstName = user.firstName
        }

        if (resolutions.user.lastName === "new") {
          userUpdate.lastName = newData.user.lastName
        } else if (resolutions.user.lastName === "current" && user?.lastName) {
          userUpdate.lastName = user.lastName
        }
      } else {
        // No conflicts, use new data
        if (newData.user.firstName) userUpdate.firstName = newData.user.firstName
        if (newData.user.lastName) userUpdate.lastName = newData.user.lastName
      }

      if (resolutions.profile) {
        if (resolutions.profile.email === "new") {
          profileUpdate.email = newData.profile.email
        } else if (resolutions.profile.email === "current" && profile.email) {
          profileUpdate.email = profile.email
        }

        if (resolutions.profile.phone === "new") {
          profileUpdate.phone = newData.profile.phone
        } else if (resolutions.profile.phone === "current" && profile.phone) {
          profileUpdate.phone = profile.phone
        }

        if (resolutions.profile.city === "new") {
          profileUpdate.city = newData.profile.city
        } else if (resolutions.profile.city === "current" && profile.city) {
          profileUpdate.city = profile.city
        }

        if (resolutions.profile.country === "new") {
          profileUpdate.country = newData.profile.country
        } else if (resolutions.profile.country === "current" && profile.country) {
          profileUpdate.country = profile.country
        }

        if (resolutions.profile.linkedInUrl === "new") {
          profileUpdate.linkedInUrl = newData.profile.linkedInUrl
        } else if (resolutions.profile.linkedInUrl === "current" && profile.linkedInUrl) {
          profileUpdate.linkedInUrl = profile.linkedInUrl
        }

        if (resolutions.profile.tagline === "new") {
          profileUpdate.tagline = newData.profile.tagline
        } else if (resolutions.profile.tagline === "current" && profile.tagline) {
          profileUpdate.tagline = profile.tagline
        }

        if (resolutions.profile.summary === "new") {
          profileUpdate.summary = newData.profile.summary
        } else if (resolutions.profile.summary === "current" && profile.summary) {
          profileUpdate.summary = profile.summary
        }
      } else {
        // No conflicts, use new data
        if (newData.profile.email) profileUpdate.email = newData.profile.email
        if (newData.profile.phone) profileUpdate.phone = newData.profile.phone
        if (newData.profile.city) profileUpdate.city = newData.profile.city
        if (newData.profile.country) profileUpdate.country = newData.profile.country
        if (newData.profile.linkedInUrl) profileUpdate.linkedInUrl = newData.profile.linkedInUrl
        if (newData.profile.tagline) profileUpdate.tagline = newData.profile.tagline
        if (newData.profile.summary) profileUpdate.summary = newData.profile.summary
      }

      // Always update CV URL and type
      profileUpdate.originalCvUrl = newData.originalCvUrl
      profileUpdate.originalCvType = newData.originalCvType

      // Update user
      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: userUpdate
        })
      }

      // Update profile
      if (Object.keys(profileUpdate).length > 0) {
        await prisma.profile.update({
          where: { id: profile.id },
          data: profileUpdate
        })
      }

      // Delete old experiences, education, etc.
      await Promise.all([
        prisma.experience.deleteMany({ where: { profileId: profile.id } }),
        prisma.education.deleteMany({ where: { profileId: profile.id } }),
        prisma.skill.deleteMany({ where: { profileId: profile.id } }),
        prisma.language.deleteMany({ where: { profileId: profile.id } }),
        prisma.certification.deleteMany({ where: { profileId: profile.id } }),
      ])

      // Create new experiences, education, etc.
      if (newData.experiences && newData.experiences.length > 0) {
        await prisma.experience.createMany({
          data: newData.experiences.map((exp: any, idx: number) => ({
            profileId: profile.id,
            jobTitle: exp.jobTitle,
            company: exp.company,
            location: exp.location,
            startDate: new Date(exp.startDate + "-01"),
            endDate: exp.endDate ? new Date(exp.endDate + "-01") : null,
            isCurrent: exp.isCurrent,
            bullets: JSON.stringify(exp.bullets),
            order: idx,
          }))
        })
      }

      if (newData.education && newData.education.length > 0) {
        await prisma.education.createMany({
          data: newData.education.map((edu: any, idx: number) => ({
            profileId: profile.id,
            degree: edu.degree,
            institution: edu.institution,
            location: edu.location,
            startDate: edu.startDate ? new Date(edu.startDate + "-01-01") : null,
            endDate: edu.endDate ? new Date(edu.endDate + "-12-31") : null,
            grade: edu.grade,
            order: idx,
          }))
        })
      }

      if (newData.skills && newData.skills.length > 0) {
        await prisma.skill.createMany({
          data: newData.skills.map((skill: any, idx: number) => ({
            profileId: profile.id,
            name: skill.name,
            category: skill.category,
            order: idx,
          }))
        })
      }

      if (newData.languages && newData.languages.length > 0) {
        await prisma.language.createMany({
          data: newData.languages.map((lang: any, idx: number) => ({
            profileId: profile.id,
            name: lang.name,
            level: lang.level,
            order: idx,
          }))
        })
      }

      if (newData.certifications && newData.certifications.length > 0) {
        await prisma.certification.createMany({
          data: newData.certifications.map((cert: any, idx: number) => ({
            profileId: profile.id,
            name: cert.name,
            issuer: cert.issuer,
            year: cert.year,
            order: idx,
          }))
        })
      }
    } else if (newData.source === "linkedin") {
      // LinkedIn resolution
      if (resolutions.user) {
        if (resolutions.user.firstName === "new") {
          userUpdate.firstName = newData.user.firstName
        } else if (resolutions.user.firstName === "current" && user?.firstName) {
          userUpdate.firstName = user.firstName
        }

        if (resolutions.user.lastName === "new") {
          userUpdate.lastName = newData.user.lastName
        } else if (resolutions.user.lastName === "current" && user?.lastName) {
          userUpdate.lastName = user.lastName
        }
      } else {
        // No conflicts, use new data
        if (newData.user.firstName) userUpdate.firstName = newData.user.firstName
        if (newData.user.lastName) userUpdate.lastName = newData.user.lastName
      }

      // Always update profile image and LinkedIn tokens
      if (newData.user.profileImageUrl) {
        userUpdate.profileImageUrl = newData.user.profileImageUrl
      }
      userUpdate.linkedInAccessToken = newData.linkedInAccessToken
      userUpdate.linkedInProfileUrl = newData.linkedInProfileUrl

      if (resolutions.profile) {
        if (resolutions.profile.linkedInUrl === "new") {
          profileUpdate.linkedInUrl = newData.profile.linkedInUrl
        } else if (resolutions.profile.linkedInUrl === "current" && profile.linkedInUrl) {
          profileUpdate.linkedInUrl = profile.linkedInUrl
        }
      } else {
        // No conflicts, use new data
        if (newData.profile.linkedInUrl) profileUpdate.linkedInUrl = newData.profile.linkedInUrl
      }

      // Update user
      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: userUpdate
        })
      }

      // Update profile
      if (Object.keys(profileUpdate).length > 0) {
        await prisma.profile.update({
          where: { id: profile.id },
          data: profileUpdate
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

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    return NextResponse.json({ 
      profile: updatedProfile,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Conflict resolution error:", error)
    return NextResponse.json(
      { error: "Fehler beim Lösen der Konflikte" },
      { status: 500 }
    )
  }
}

