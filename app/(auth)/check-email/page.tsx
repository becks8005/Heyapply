"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Mail, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const email = searchParams.get("email")
  const [isResending, setIsResending] = useState(false)

  const handleResend = async () => {
    if (!email) return
    
    setIsResending(true)
    try {
      const response = await fetch("/api/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "E-Mail erneut versendet",
          description: "Bitte prüfe dein Postfach.",
        })
      } else {
        toast({
          title: "Fehler",
          description: data.error || "E-Mail konnte nicht erneut versendet werden.",
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
      setIsResending(false)
    }
  }

  return (
    <div className="card-base text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--accent-50)] flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8 text-[var(--accent-600)]" />
      </div>
      
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
        Prüfe dein Postfach
      </h2>
      
      <p className="text-[var(--text-muted)] mb-2">
        Wir haben eine Bestätigungs-E-Mail an
      </p>
      {email && (
        <p className="text-[var(--text-primary)] font-medium mb-6">
          {email}
        </p>
      )}
      
      <div className="bg-[var(--bg-secondary)] rounded-lg p-4 mb-6 text-left">
        <p className="text-sm text-[var(--text-muted)] mb-2">
          <strong className="text-[var(--text-primary)]">Nächste Schritte:</strong>
        </p>
        <ol className="text-sm text-[var(--text-muted)] space-y-1 list-decimal list-inside">
          <li>Öffne dein E-Mail-Postfach</li>
          <li>Klicke auf den Bestätigungslink in der E-Mail</li>
          <li>Melde dich dann mit deinen Zugangsdaten an</li>
        </ol>
      </div>

      <div className="space-y-3">
        {email && (
          <Button
            onClick={handleResend}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird versendet...
              </>
            ) : (
              "E-Mail erneut versenden"
            )}
          </Button>
        )}
        
        <Button
          onClick={() => router.push("/login")}
          className="w-full"
        >
          Zur Anmeldung
        </Button>
      </div>

      <p className="text-xs text-[var(--text-muted)] mt-6">
        Keine E-Mail erhalten? Prüfe auch deinen Spam-Ordner.
      </p>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <div className="w-full max-w-[500px] px-6">
      <div className="text-center mb-8">
        <h1 className="text-page-title mb-2">E-Mail bestätigen</h1>
      </div>
      <Suspense fallback={
        <div className="card-base text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-50)] flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-[var(--accent-600)] animate-spin" />
          </div>
          <p className="text-[var(--text-muted)]">Laden...</p>
        </div>
      }>
        <CheckEmailContent />
      </Suspense>
    </div>
  )
}
