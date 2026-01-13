"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Kein Token gefunden")
      return
    }

    fetch(`/api/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus("success")
          setMessage(data.message || "E-Mail erfolgreich bestätigt")
          setTimeout(() => router.push("/login"), 3000)
        } else {
          setStatus("error")
          setMessage(data.error || "Fehler bei der Verifizierung")
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage("Ein Fehler ist aufgetreten")
      })
  }, [token, router])

  return (
    <div className="w-full max-w-[400px] px-6">
      <div className="text-center mb-8">
        <h1 className="text-page-title mb-2">E-Mail bestätigen</h1>
      </div>
      <div className="card-base text-center">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 rounded-full bg-[var(--accent-50)] flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-6 h-6 text-[var(--accent-600)] animate-spin" />
            </div>
            <p className="text-[var(--text-muted)]">Bestätige deine E-Mail-Adresse...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-[var(--success-text)]" />
            </div>
            <p className="text-[var(--text-primary)] font-medium mb-2">{message}</p>
            <p className="text-sm text-[var(--text-muted)]">Du wirst weitergeleitet...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 rounded-full bg-[var(--error-bg)] flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-[var(--error-text)]" />
            </div>
            <p className="text-[var(--text-primary)] font-medium mb-6">{message}</p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Zur Anmeldung
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

