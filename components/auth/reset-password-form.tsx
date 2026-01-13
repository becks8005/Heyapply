"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      toast({
        title: "Fehler",
        description: "Kein Token gefunden.",
        variant: "destructive",
      })
    }
  }, [token, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast({
        title: "Fehler",
        description: "Kein Token gefunden.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: "Fehler",
        description: "Das Passwort muss mindestens 8 Zeichen lang sein.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: data.message,
        })
        router.push("/login")
      } else {
        toast({
          title: "Fehler",
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
      <div>
        <label htmlFor="password" className="input-label">
          Neues Passwort
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || !token}>
        {isLoading ? "Zurücksetzen..." : "Passwort zurücksetzen"}
      </Button>
      <div className="text-center text-sm text-[var(--text-muted)]">
        <Link 
          href="/login" 
          className="font-medium text-[var(--accent-600)] hover:text-[var(--accent-700)] transition-colors"
        >
          Zur Anmeldung
        </Link>
      </div>
    </form>
  )
}

