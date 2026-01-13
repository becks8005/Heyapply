import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLinkedInAuthUrl, exchangeCodeForToken, getLinkedInProfile } from "@/lib/linkedin"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")

    if (action === "auth-url") {
      // Generate auth URL
      const state = nanoid()
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/profile/linkedin?action=callback`
      const authUrl = getLinkedInAuthUrl(redirectUri, state)

      // Store state in session/cookie (simplified - in production use proper session storage)
      return NextResponse.json({ authUrl, state })
    }

    if (action === "callback") {
      const code = searchParams.get("code")
      const state = searchParams.get("state")

      if (!code) {
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=no_code`)
      }

      const redirectUri = `${process.env.NEXTAUTH_URL}/api/profile/linkedin?action=callback`
      const { accessToken } = await exchangeCodeForToken(code, redirectUri)
      const linkedInData = await getLinkedInProfile(accessToken)

      // Get current user and profile
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      const profile = await prisma.profile.findUnique({
        where: { userId: session.user.id }
      })

      // Check for conflicts
      const conflicts: any = {}
      const newData: any = {
        source: "linkedin",
        user: {
          firstName: linkedInData.firstName || null,
          lastName: linkedInData.lastName || null,
          profileImageUrl: linkedInData.profilePictureUrl || null,
        },
        profile: {
          linkedInUrl: linkedInData.profileUrl || null,
        },
        linkedInAccessToken: accessToken,
        linkedInProfileUrl: linkedInData.profileUrl,
      }

      // Check user field conflicts
      if (linkedInData.firstName && user?.firstName && 
          linkedInData.firstName.trim().toLowerCase() !== user.firstName.trim().toLowerCase()) {
        conflicts.user = conflicts.user || {}
        conflicts.user.firstName = {
          current: user.firstName,
          new: linkedInData.firstName,
        }
      }

      if (linkedInData.lastName && user?.lastName && 
          linkedInData.lastName.trim().toLowerCase() !== user.lastName.trim().toLowerCase()) {
        conflicts.user = conflicts.user || {}
        conflicts.user.lastName = {
          current: user.lastName,
          new: linkedInData.lastName,
        }
      }

      // Check profile field conflicts
      if (linkedInData.profileUrl && profile?.linkedInUrl && 
          linkedInData.profileUrl.trim() !== profile.linkedInUrl.trim()) {
        conflicts.profile = conflicts.profile || {}
        conflicts.profile.linkedInUrl = {
          current: profile.linkedInUrl,
          new: linkedInData.profileUrl,
        }
      }

      // If there are conflicts, store them in cookie and redirect
      if (Object.keys(conflicts).length > 0) {
        // Store conflict data in cookie via API route
        const { cookies } = await import("next/headers")
        const cookieStore = await cookies()
        cookieStore.set(`linkedin-conflict-${session.user.id}`, JSON.stringify({ conflicts, newData }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 10, // 10 minutes
        })

        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/profile?linkedin=conflict`
        )
      }

      // No conflicts - proceed with update
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          firstName: linkedInData.firstName || undefined,
          lastName: linkedInData.lastName || undefined,
          profileImageUrl: linkedInData.profilePictureUrl || undefined,
          linkedInAccessToken: accessToken,
          linkedInProfileUrl: linkedInData.profileUrl,
        }
      })

      if (profile) {
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            linkedInUrl: linkedInData.profileUrl,
          }
        })
      }

      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?linkedin=connected`)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("LinkedIn error:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=linkedin_failed`)
  }
}

