import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token und Passwort erforderlich" },
        { status: 400 }
      )
    }
    
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })
    
    if (!resetToken) {
      return NextResponse.json(
        { error: "Ungültiger Token" },
        { status: 400 }
      )
    }
    
    if (resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Token abgelaufen" },
        { status: 400 }
      )
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Update password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    })
    
    // Delete token
    await prisma.passwordResetToken.delete({
      where: { token }
    })
    
    return NextResponse.json({ 
      success: true,
      message: "Passwort erfolgreich zurückgesetzt"
    })
    
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}

