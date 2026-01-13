import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function sendVerificationEmail(
  email: string, 
  token: string, 
  firstName?: string
) {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  RESEND_API_KEY nicht konfiguriert. E-Mail-Verifizierung wird übersprungen. User kann direkt einloggen.")
    }
    return
  }
  
  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`
  
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Heyapply <noreply@heyapply.ch>",
    to: email,
    subject: "Bestätige deine E-Mail-Adresse",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Willkommen bei Heyapply!</h1>
        <p>Hallo ${firstName || ""},</p>
        <p>Vielen Dank für deine Registrierung. Bitte bestätige deine E-Mail-Adresse, indem du auf den folgenden Link klickst:</p>
        <p style="margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            E-Mail bestätigen
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Dieser Link ist 24 Stunden gültig.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.
        </p>
      </div>
    `
  })
}

export async function sendPasswordResetEmail(
  email: string, 
  token: string
) {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  RESEND_API_KEY nicht konfiguriert. Passwort-Reset-E-Mail wird nicht versendet.")
    }
    return
  }
  
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`
  
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Heyapply <noreply@heyapply.ch>",
    to: email,
    subject: "Passwort zurücksetzen",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Passwort zurücksetzen</h1>
        <p>Du hast angefragt, dein Passwort zurückzusetzen. Klicke auf den folgenden Link:</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Passwort zurücksetzen
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Dieser Link ist 1 Stunde gültig.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
        </p>
      </div>
    `
  })
}

