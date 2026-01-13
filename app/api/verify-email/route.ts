import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  
  if (!token) {
    return NextResponse.json(
      { error: "Token fehlt" },
      { status: 400 }
    )
  }
  
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })
    
    if (!verificationToken) {
      return NextResponse.json(
        { error: "Ungültiger Token" },
        { status: 400 }
      )
    }
    
    if (verificationToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Token abgelaufen" },
        { status: 400 }
      )
    }
    
    // Verify email
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() }
    })
    
    // Delete token
    await prisma.verificationToken.delete({
      where: { token }
    })
    
    return NextResponse.json({ 
      success: true,
      message: "E-Mail erfolgreich bestätigt"
    })
    
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

