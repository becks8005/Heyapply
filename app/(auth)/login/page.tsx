import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/shared/logo"

export default function LoginPage() {
  return (
    <div className="w-full max-w-[400px] px-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="lg" />
        </div>
        <p className="text-[var(--text-muted)]">Melde dich an, um fortzufahren</p>
      </div>
      <LoginForm />
    </div>
  )
}

