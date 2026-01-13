"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2 } from "lucide-react"

export function ForgotPasswordForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSent(true)
        toast({
          title: "E-Mail gesendet",
          description: data.message,
        })
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

  if (sent) {
    return (
      <div className="card-base text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-[var(--success-text)]" />
        </div>
        <p className="text-[var(--text-primary)] font-medium mb-2">
          E-Mail gesendet
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Falls diese E-Mail-Adresse existiert, wurde ein Reset-Link gesendet.
        </p>
        <Link href="/login">
          <Button className="w-full">Zur Anmeldung</Button>
        </Link>
      </div>
    )
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
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Senden...
          </>
        ) : (
          "Reset-Link senden"
        )}
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

