import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-[400px] px-6">
      <div className="text-center mb-8">
        <h1 className="text-page-title mb-2">Passwort zurücksetzen</h1>
      </div>
      <ResetPasswordForm />
    </div>
  )
}

