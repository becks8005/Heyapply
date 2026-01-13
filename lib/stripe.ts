import Stripe from "stripe"
import { prisma } from "./prisma"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia"
})

export const PRICES = {
  BASIS: {
    priceId: process.env.STRIPE_PRICE_BASIS!,
    amount: 999,  // CHF 9.99
    name: "Basis",
    applications: 10
  },
  PRO: {
    priceId: process.env.STRIPE_PRICE_PRO!,
    amount: 1999, // CHF 19.99
    name: "Pro",
    applications: "Unlimitiert"
  }
}

export async function createCheckoutSession(
  userId: string,
  tier: "BASIS" | "PRO",
  returnUrl: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")
  
  let customerId = user.stripeCustomerId
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId }
    })
    customerId = customer.id
    
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId }
    })
  }
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{
      price: PRICES[tier].priceId,
      quantity: 1
    }],
    success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=true`,
    metadata: { userId, tier },
    subscription_data: {
      metadata: { userId, tier }
    },
    allow_promotion_codes: true,
    billing_address_collection: "required",
    currency: "chf"
  })
  
  return session
}

export async function createBillingPortalSession(
  userId: string,
  returnUrl: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.stripeCustomerId) throw new Error("No Stripe customer")
  
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl
  })
  
  return session
}

