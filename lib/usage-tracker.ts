import { prisma } from "./prisma"

type SubscriptionTier = "FREE" | "BASIS" | "PRO"

const MONTHLY_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 1,
  BASIS: 10,
  PRO: Infinity  // Unlimitiert, aber wir tracken trotzdem
}

export interface UsageStatus {
  allowed: boolean
  currentCount: number
  limit: number
  remaining: number
  tier: string
  resetDate: Date
}

export async function checkUsageLimit(userId: string): Promise<UsageStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      monthlyApplicationCount: true,
      usageResetDate: true,
      subscriptionStatus: true
    }
  })
  
  if (!user) throw new Error("User not found")
  
  // Check if subscription is active (for paid tiers)
  if (user.subscriptionTier !== "FREE" && user.subscriptionStatus !== "ACTIVE") {
    // Downgrade to FREE limits if subscription inactive
    return {
      allowed: user.monthlyApplicationCount < MONTHLY_LIMITS.FREE,
      currentCount: user.monthlyApplicationCount,
      limit: MONTHLY_LIMITS.FREE,
      remaining: Math.max(0, MONTHLY_LIMITS.FREE - user.monthlyApplicationCount),
      tier: "FREE",
      resetDate: user.usageResetDate
    }
  }
  
  // Check if monthly reset needed
  const now = new Date()
  const resetDate = new Date(user.usageResetDate)
  const monthsSinceReset = 
    (now.getFullYear() - resetDate.getFullYear()) * 12 + 
    (now.getMonth() - resetDate.getMonth())
  
  let currentCount = user.monthlyApplicationCount
  
  if (monthsSinceReset >= 1) {
    // Reset monthly count
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyApplicationCount: 0,
        usageResetDate: now
      }
    })
    currentCount = 0
  }
  
  const limit = MONTHLY_LIMITS[user.subscriptionTier as SubscriptionTier]
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentCount)
  
  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
    remaining,
    tier: user.subscriptionTier,
    resetDate: monthsSinceReset >= 1 ? now : user.usageResetDate
  }
}

export async function incrementUsage(
  userId: string, 
  applicationId: string,
  action: string = "APPLICATION_CREATED"
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        monthlyApplicationCount: { increment: 1 }
      }
    }),
    prisma.usageLog.create({
      data: {
        userId,
        applicationId,
        action
      }
    })
  ])
}

export async function decrementUsage(
  userId: string,
  applicationId: string
): Promise<void> {
  // Find the usage log entry
  const usageLog = await prisma.usageLog.findFirst({
    where: {
      userId,
      applicationId,
      action: "APPLICATION_CREATED"
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  if (usageLog) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          monthlyApplicationCount: { decrement: 1 }
        }
      }),
      prisma.usageLog.delete({
        where: { id: usageLog.id }
      })
    ])
  }
}

// WICHTIG: Regenerationen im gleichen Chat zählen NICHT gegen das Limit
export async function logRegeneration(
  userId: string,
  applicationId: string,
  type: "CV_REGENERATED" | "COVER_LETTER_GENERATED"
): Promise<void> {
  await prisma.usageLog.create({
    data: {
      userId,
      applicationId,
      action: type
    }
  })
  // Kein increment von monthlyApplicationCount!
}

