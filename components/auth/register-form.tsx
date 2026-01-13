"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 8) {
      toast({
        title: "Fehler",
        description: "Das Passwort muss mindestens 8 Zeichen lang sein.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Registrierung erfolgreich",
          description: data.message,
        })
        router.push("/verify-email")
      } else {
        toast({
          title: "Registrierung fehlgeschlagen",
          description: data.error || "Ein Fehler ist aufgetreten.",
          variant: "destructive",
        })
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="input-label">
            Vorname
          </label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Max"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="input-label">
            Nachname
          </label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Muster"
            required
            disabled={isLoading}
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="input-label">
          E-Mail
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
          required
          disabled={isLoading}
          minLength={8}
        />
        <p className="input-helper">Mindestens 8 Zeichen</p>
      </div>
      <div>
        <label htmlFor="confirmPassword" className="input-label">
          Passwort bestätigen
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Registrieren...
          </>
        ) : (
          "Registrieren"
        )}
      </Button>
      <div className="text-center text-sm text-[var(--text-muted)]">
        Bereits ein Konto?{" "}
        <Link 
          href="/login" 
          className="font-medium text-[var(--accent-600)] hover:text-[var(--accent-700)] transition-colors"
        >
          Anmelden
        </Link>
      </div>
    </form>
  )
}

