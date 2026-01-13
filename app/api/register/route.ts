import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/resend"
import { nanoid } from "nanoid"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, firstName, lastName } = body
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Alle Felder sind erforderlich" },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse" },
        { status: 400 }
      )
    }
    
    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Das Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert" },
        { status: 400 }
      )
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Check if email verification should be skipped (no Resend API key)
    const skipEmailVerification = !process.env.RESEND_API_KEY
    
    // Create user (auto-verify if no email service configured)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        emailVerified: skipEmailVerification ? new Date() : null,
      }
    })
    
    // If email verification is enabled, create token and send email
    if (!skipEmailVerification) {
      const token = nanoid(32)
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires
        }
      })
      
      // Send verification email
      try {
        await sendVerificationEmail(email, token, firstName)
      } catch (emailError) {
        console.error("Email sending error:", emailError)
      }
      
      return NextResponse.json({ 
        success: true,
        message: "Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.",
        requiresVerification: true
      })
    }
    
    // No email verification needed - user can login directly
    return NextResponse.json({ 
      success: true,
      message: "Registrierung erfolgreich! Du kannst dich jetzt anmelden.",
      requiresVerification: false
    })
    
  } catch (error: any) {
    console.error("Registration error:", error)
    
    // Provide more detailed error in development
    const isDevelopment = process.env.NODE_ENV === "development"
    const errorMessage = isDevelopment 
      ? `Ein Fehler ist aufgetreten: ${error?.message || String(error)}`
      : "Ein Fehler ist aufgetreten. Bitte versuche es später erneut."
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

