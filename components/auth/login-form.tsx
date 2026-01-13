"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error === "EMAIL_NOT_VERIFIED") {
        toast({
          title: "E-Mail nicht bestätigt",
          description: "Bitte bestätige zuerst deine E-Mail-Adresse.",
          variant: "destructive",
        })
      } else if (result?.error) {
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: "Ungültige Anmeldedaten.",
          variant: "destructive",
        })
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-base space-y-5">
      <div>
        <label htmlFor="email" className="input-label">
          E-Mail
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@beispiel.ch"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="password" className="input-label">
          Passwort
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>
      <div className="text-right">
        <Link 
          href="/forgot-password" 
          className="text-sm font-medium text-[var(--accent-600)] hover:text-[var(--accent-700)] transition-colors"
        >
          Passwort vergessen?
        </Link>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Anmelden...
          </>
        ) : (
          "Anmelden"
        )}
      </Button>
      <div className="text-center text-sm text-[var(--text-muted)]">
        Noch kein Konto?{" "}
        <Link 
          href="/register" 
          className="font-medium text-[var(--accent-600)] hover:text-[var(--accent-700)] transition-colors"
        >
          Registrieren
        </Link>
      </div>
    </form>
  )
}

