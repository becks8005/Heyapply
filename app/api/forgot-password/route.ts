import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/resend"
import { nanoid } from "nanoid"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ 
        success: true,
        message: "Falls diese E-Mail-Adresse existiert, wurde ein Reset-Link gesendet."
      })
    }
    
    // Create reset token
    const token = nanoid(32)
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expires
      }
    })
    
    // Send reset email
    await sendPasswordResetEmail(email, token)
    
    return NextResponse.json({ 
      success: true,
      message: "Falls diese E-Mail-Adresse existiert, wurde ein Reset-Link gesendet."
    })
    
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

