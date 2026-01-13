"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-page)]">
          <div className="max-w-md w-full card-base p-8 text-center">
            <AlertCircle className="h-12 w-12 text-[var(--error-text)] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Etwas ist schiefgelaufen
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              {error.message || "Ein unerwarteter Fehler ist aufgetreten."}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={reset} variant="default">
                Erneut versuchen
              </Button>
              <Button onClick={() => window.location.href = "/"} variant="outline">
                Zur Startseite
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}


