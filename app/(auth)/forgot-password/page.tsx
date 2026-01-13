import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { Logo } from "@/components/shared/logo"

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-[400px] px-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="lg" />
        </div>
        <h1 className="text-page-title mb-2">Passwort vergessen</h1>
        <p className="text-[var(--text-muted)]">Gib deine E-Mail-Adresse ein</p>
      </div>
      <ForgotPasswordForm />
    </div>
  )
}

