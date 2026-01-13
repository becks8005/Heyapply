import { RegisterForm } from "@/components/auth/register-form"
import { Logo } from "@/components/shared/logo"

export default function RegisterPage() {
  return (
    <div className="w-full max-w-[400px] px-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="lg" />
        </div>
        <p className="text-[var(--text-muted)]">Erstelle ein Konto</p>
      </div>
      <RegisterForm />
    </div>
  )
}

