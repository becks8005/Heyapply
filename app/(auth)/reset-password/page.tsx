import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

function ResetPasswordContent() {
  return (
    <div className="w-full max-w-[400px] px-6">
      <div className="text-center mb-8">
        <h1 className="text-page-title mb-2">Passwort zurücksetzen</h1>
      </div>
      <ResetPasswordForm />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[400px] px-6">
        <div className="text-center mb-8">
          <h1 className="text-page-title mb-2">Passwort zurücksetzen</h1>
        </div>
        <div className="card-base text-center">
          <p className="text-[var(--text-muted)]">Laden...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

