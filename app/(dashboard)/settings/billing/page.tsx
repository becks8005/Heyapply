"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BillingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [usageStatus, setUsageStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      // Fetch user and usage status
      const [userRes, usageRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/user/usage"),
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json()
        setUsageStatus(usageData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (tier: "BASIS" | "PRO") => {
    setIsUpgrading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      if (!res.ok) throw new Error("Failed to create checkout")

      const data = await res.json()
      window.location.href = data.url
    } catch (error) {
      console.error("Upgrade error:", error)
      toast({
        title: "Fehler",
        description: "Upgrade konnte nicht gestartet werden",
        variant: "destructive",
      })
      setIsUpgrading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      })

      if (!res.ok) throw new Error("Failed to create portal session")

      const data = await res.json()
      window.location.href = data.url
    } catch (error) {
      console.error("Billing portal error:", error)
      toast({
        title: "Fehler",
        description: "Billing-Portal konnte nicht geöffnet werden",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-600)]" />
      </div>
    )
  }

  const currentTier = user?.subscriptionTier || "FREE"
  const currentCount = usageStatus?.currentCount || 0
  const limit = usageStatus?.limit || 1
  
  // Calculate next reset date: always one month after registration (createdAt)
  // Based on the day of registration, so it resets on the same day each month
  let nextResetDate = new Date()
  if (user?.createdAt) {
    const createdAt = new Date(user.createdAt)
    const now = new Date()
    // Calculate next reset date (same day next month)
    nextResetDate = new Date(createdAt)
    nextResetDate.setMonth(nextResetDate.getMonth() + 1)
    
    // If the next reset date is in the past, move to next month
    while (nextResetDate <= now) {
      nextResetDate.setMonth(nextResetDate.getMonth() + 1)
    }
  }

  const plans = [
    {
      name: "Free",
      price: "CHF 0.00",
      pricePerMonth: "0",
      applications: 1,
      features: [
        "1 Bewerbung pro Monat",
        "CV-Generierung",
        "Anschreiben-Generierung",
        "PDF-Export",
      ],
      current: currentTier === "FREE",
    },
    {
      name: "Basis",
      price: "CHF 9.99",
      pricePerMonth: "9.99",
      applications: 10,
      features: [
        "10 Bewerbungen pro Monat",
        "CV-Generierung",
        "Anschreiben-Generierung",
        "PDF-Export",
        "Prioritärer Support",
      ],
      current: currentTier === "BASIS",
    },
    {
      name: "Pro",
      price: "CHF 19.99",
      pricePerMonth: "19.99",
      applications: "Unlimitiert",
      features: [
        "Unbegrenzte Bewerbungen",
        "CV-Generierung",
        "Anschreiben-Generierung",
        "PDF-Export",
        "Prioritärer Support",
        "Erweiterte Features",
      ],
      current: currentTier === "PRO",
      highlighted: true,
    },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-page-title mb-1">Abo & Zahlung</h1>
        <p className="text-[var(--text-muted)]">
          Verwalte dein Abonnement und Zahlungsmethoden
        </p>
      </div>

      {/* Current Plan Info */}
      <div className="card-base mb-8">
        <h2 className="text-section-title mb-5">Aktueller Plan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-label mb-1">Plan</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {plans.find((p) => p.current)?.name || "Free"}
            </p>
          </div>
          <div>
            <p className="text-label mb-1">Verbrauch</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {currentCount} von {currentTier === "PRO" ? 99 : limit}
            </p>
          </div>
          <div>
            <p className="text-label mb-1">Nächste Zurücksetzung</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {nextResetDate.toLocaleDateString("de-CH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {currentTier !== "FREE" && (
            <div className="flex items-end">
              <Button variant="outline" onClick={handleManageBilling}>
                Abo verwalten
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "card-base flex flex-col",
              plan.current && "ring-2 ring-[var(--accent-500)]",
              plan.highlighted && !plan.current && "border-[var(--accent-200)]"
            )}
          >
            {plan.highlighted && (
              <div className="badge-success mb-4 self-start">Empfohlen</div>
            )}
            <div className="mb-5">
              <h3 className="text-card-title mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-[32px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  {plan.pricePerMonth}
                </span>
                <span className="text-[var(--text-muted)]">/Monat</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[var(--success-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-[var(--success-text)]" />
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>

            {plan.current ? (
              <Button disabled className="w-full">
                Aktueller Plan
              </Button>
            ) : (
              <Button
                onClick={() => handleUpgrade(plan.name.toUpperCase() as "BASIS" | "PRO")}
                disabled={isUpgrading}
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : currentTier === "FREE" ? (
                  "Upgrade"
                ) : plan.name === "Pro" ? (
                  "Upgrade"
                ) : (
                  "Downgrade"
                )}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

