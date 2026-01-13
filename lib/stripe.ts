import Stripe from "stripe"
import { prisma } from "./prisma"

let stripeClient: Stripe | null = null

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY

  // #region agent log: stripe-get-start
  fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'build-stripe',hypothesisId:'S1',location:'lib/stripe.ts:getStripe',message:'Stripe getStripe called',data:{hasKey:!!key,cached:!!stripeClient,nodeEnv:process.env.NODE_ENV},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY")
  }

  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
    })
  }

  return stripeClient
}

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
  const stripe = getStripe()
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
  const stripe = getStripe()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.stripeCustomerId) throw new Error("No Stripe customer")
  
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl
  })
  
  return session
}

