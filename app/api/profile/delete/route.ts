import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current profile to find CV URL
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 })
    }

    // Delete CV file from Supabase Storage if it exists
    if (profile.originalCvUrl && isSupabaseConfigured()) {
      try {
        // Extract file path from URL
        // Format: https://[project].supabase.co/storage/v1/object/public/cvs/[userId]/[filename]
        const urlParts = profile.originalCvUrl.split('/cvs/')
        if (urlParts.length > 1) {
          const filePath = `cvs/${urlParts[1]}`
          const { error: deleteError } = await supabase!.storage
            .from("cvs")
            .remove([urlParts[1]])

          if (deleteError) {
            console.error("Error deleting CV file from storage:", deleteError)
            // Continue with deletion even if file deletion fails
          }
        }
      } catch (storageError) {
        console.error("Error accessing Supabase storage:", storageError)
        // Continue with deletion even if storage access fails
      }
    }

    // Delete all related data in parallel
    await Promise.all([
      prisma.experience.deleteMany({ where: { profileId: profile.id } }),
      prisma.education.deleteMany({ where: { profileId: profile.id } }),
      prisma.skill.deleteMany({ where: { profileId: profile.id } }),
      prisma.language.deleteMany({ where: { profileId: profile.id } }),
      prisma.certification.deleteMany({ where: { profileId: profile.id } }),
    ])

    // Reset profile fields (keep the profile record itself)
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        email: null,
        phone: null,
        address: null,
        city: null,
        country: null,
        linkedInUrl: null,
        tagline: null,
        summary: null,
        originalCvUrl: null,
        originalCvType: null,
      }
    })

    // Reset user profile image fields (profileImageUrl and profileImageCrop are in User model)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profileImageUrl: null,
        profileImageCrop: null,
      }
    })

    // Fetch empty profile to return
    const emptyProfile = await prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        experiences: { orderBy: { order: "asc" } },
        education: { orderBy: { order: "asc" } },
        skills: { orderBy: { order: "asc" } },
        languages: { orderBy: { order: "asc" } },
        certifications: { orderBy: { order: "asc" } },
      }
    })

    return NextResponse.json({ profile: emptyProfile })
  } catch (error) {
    console.error("Profile delete error:", error)
    return NextResponse.json(
      { 
        error: "Fehler beim Löschen des Profils",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

