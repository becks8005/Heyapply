import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase, getSupabaseConfigError, isSupabaseConfigured } from "@/lib/supabase"
import { saveFileLocally, isLocalStorageAvailable } from "@/lib/local-storage"
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

    // Validate file type (images only)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif"
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Nur Bilddateien erlaubt (JPEG, PNG, WebP, GIF)" },
        { status: 400 }
      )
    }

    // Validate file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Datei zu gross (max. 5 MB)" },
        { status: 400 }
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${session.user.id}/profile-${Date.now()}.${file.type.split('/')[1] || 'jpg'}`
    
    let publicUrl: string

    // Versuche zuerst Supabase, dann lokale Speicherung (nur Development)
    if (isSupabaseConfigured(true)) {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase!.storage
        .from("profile-images")
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        
        // Spezifische Fehlermeldungen für häufige Probleme
        let errorMessage = "Fehler beim Hochladen der Datei"
        if (uploadError.message?.includes("Bucket not found")) {
          errorMessage = "Storage Bucket 'profile-images' wurde nicht gefunden. Bitte erstelle den Bucket in deinem Supabase Dashboard."
        } else if (uploadError.message?.includes("new row violates row-level security")) {
          errorMessage = "Storage Bucket 'profile-images' ist nicht öffentlich. Bitte aktiviere 'Public bucket' in Supabase Storage Settings."
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
        .from("profile-images")
        .getPublicUrl(fileName)
      publicUrl = supabaseUrl
    } else {
      // Fallback: Lokale Speicherung (nur Development)
      const localUrl = await saveFileLocally(fileBuffer, fileName, "profile-images")
      if (!localUrl) {
        const supabaseError = getSupabaseConfigError("Profilbild-Upload", true)
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

    // Get crop data if provided
    const cropDataStr = formData.get("cropData") as string | null
    let cropData = null
    if (cropDataStr) {
      try {
        cropData = JSON.parse(cropDataStr)
      } catch (e) {
        // Ignore invalid crop data
      }
    }

    // Update user with profile image URL and crop data
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profileImageUrl: publicUrl,
        profileImageCrop: cropData ? JSON.stringify(cropData) : null
      }
    })

    // Fetch updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    return NextResponse.json({ 
      user: updatedUser,
      profileImageUrl: publicUrl,
      profileImageCrop: cropData
    })
  } catch (error: any) {
    console.error("Profile image upload error:", error)
    return NextResponse.json(
      { 
        error: error.message || "Fehler beim Hochladen des Profilbilds",
        errorCode: "UPLOAD_FAILED"
      },
      { status: 500 }
    )
  }
}

