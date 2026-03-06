# Skill: Paiements (Stripe & Paytech)

## Quand utiliser ce skill
- Intégration Stripe/Paytech
- Gestion des abonnements
- Webhooks de paiement
- Stripe Connect pour restaurants

---

## Architecture Paiements

```
┌─────────────────────────────────────────────────────────────┐
│                        IZIRESTO                              │
│  Reçoit les paiements des LICENCES (Stripe/Paytech)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       REVENDEUR                              │
│  Facture ses clients (hors plateforme ou via Stripe)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      RESTAURANT                              │
│  Reçoit les paiements des commandes (Stripe Connect)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Stripe - Configuration

### Variables d'environnement
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Service Stripe
```typescript
// src/services/stripe.service.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const stripeService = {
  // Créer un customer
  async createCustomer(email: string, name: string, metadata?: Record<string, string>) {
    return stripe.customers.create({
      email,
      name,
      metadata,
    })
  },

  // Créer un abonnement licence
  async createLicenseSubscription(
    customerId: string,
    priceId: string,
    trialDays?: number
  ) {
    return stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      ...(trialDays && { trial_period_days: trialDays }),
    })
  },

  // Mettre à jour un abonnement (upgrade/downgrade)
  async updateSubscription(subscriptionId: string, newPriceId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    return stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    })
  },

  // Annuler un abonnement
  async cancelSubscription(subscriptionId: string, immediately = false) {
    if (immediately) {
      return stripe.subscriptions.cancel(subscriptionId)
    }
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  },

  // Créer une session de paiement (checkout)
  async createCheckoutSession(params: {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
    mode: 'subscription' | 'payment'
    metadata?: Record<string, string>
  }) {
    return stripe.checkout.sessions.create({
      customer: params.customerId,
      line_items: [{ price: params.priceId, quantity: 1 }],
      mode: params.mode,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    })
  },

  // Portail client (gérer abonnement)
  async createPortalSession(customerId: string, returnUrl: string) {
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
  },

  // Récupérer les factures
  async getInvoices(customerId: string, limit = 10) {
    return stripe.invoices.list({
      customer: customerId,
      limit,
    })
  },
}
```

---

## Stripe Connect (Restaurants)

### Onboarding Restaurant
```typescript
// src/services/stripe-connect.service.ts
export const stripeConnectService = {
  // Créer un compte Connect
  async createConnectedAccount(email: string, businessName: string) {
    return stripe.accounts.create({
      type: 'express',
      email,
      business_profile: {
        name: businessName,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
  },

  // Lien d'onboarding
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    return stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })
  },

  // Vérifier le statut du compte
  async getAccountStatus(accountId: string) {
    const account = await stripe.accounts.retrieve(accountId)
    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    }
  },

  // Créer un paiement pour une commande
  async createPaymentIntent(params: {
    amount: number
    currency: string
    connectedAccountId: string
    applicationFeePercent?: number
    metadata?: Record<string, string>
  }) {
    const applicationFee = params.applicationFeePercent
      ? Math.round(params.amount * (params.applicationFeePercent / 100))
      : 0

    return stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: params.connectedAccountId,
      },
      metadata: params.metadata,
    })
  },

  // Dashboard du restaurant
  async createLoginLink(accountId: string) {
    return stripe.accounts.createLoginLink(accountId)
  },
}
```

---

## Webhooks Stripe

### Route Webhook
```typescript
// src/routes/webhooks/stripe.routes.ts
import { Router } from 'express'
import express from 'express'
import { stripeWebhookController } from '@/controllers/webhooks/stripe.controller'

const router = Router()

// Important: raw body pour vérification signature
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  stripeWebhookController.handleWebhook
)

export { router as stripeWebhookRoutes }
```

### Controller Webhook
```typescript
// src/controllers/webhooks/stripe.controller.ts
import { Request, Response } from 'express'
import Stripe from 'stripe'
import { stripe } from '@/services/stripe.service'
import { prisma } from '@iziresto/database'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const stripeWebhookController = {
  async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed')
      return res.status(400).send('Webhook Error')
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
          break

        case 'invoice.paid':
          await handleInvoicePaid(event.data.object as Stripe.Invoice)
          break

        case 'invoice.payment_failed':
          await handleInvoiceFailed(event.data.object as Stripe.Invoice)
          break

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      res.json({ received: true })
    } catch (error) {
      console.error('Webhook handler error:', error)
      res.status(500).json({ error: 'Webhook handler failed' })
    }
  },
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { organizationId, planId } = session.metadata || {}

  if (organizationId && planId) {
    // Créer/mettre à jour la licence
    const plan = await prisma.licensePlan.findUnique({ where: { id: planId } })
    
    if (plan) {
      await prisma.license.create({
        data: {
          planId,
          status: 'ACTIVE',
          paymentProvider: 'STRIPE',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          organizations: {
            connect: { id: organizationId },
          },
        },
      })

      await prisma.resellerOrganization.update({
        where: { id: organizationId },
        data: { status: 'ACTIVE' },
      })
    }
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  const license = await prisma.license.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (license) {
    await prisma.licensePayment.create({
      data: {
        licenseId: license.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'SUCCEEDED',
        provider: 'STRIPE',
        providerPaymentId: invoice.payment_intent as string,
        invoiceUrl: invoice.hosted_invoice_url,
        paidAt: new Date(),
      },
    })

    await prisma.license.update({
      where: { id: license.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
      },
    })
  }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  await prisma.license.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: 'PAST_DUE' },
  })

  // TODO: Envoyer email de relance
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.license.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.license.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'CANCELLED' },
  })

  // Désactiver les sites du revendeur
  const license = await prisma.license.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { organizations: true },
  })

  if (license) {
    for (const org of license.organizations) {
      await prisma.site.updateMany({
        where: { organizationId: org.id },
        data: { status: 'SUSPENDED' },
      })
    }
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { orderId } = paymentIntent.metadata || {}

  if (orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentIntentId: paymentIntent.id,
        paidAt: new Date(),
      },
    })
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status) {
  const map: Record<string, string> = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELLED',
    unpaid: 'UNPAID',
    trialing: 'TRIALING',
    paused: 'PAUSED',
  }
  return map[status] || 'ACTIVE'
}
```

---

## Paytech (Afrique)

### Service Paytech
```typescript
// src/services/paytech.service.ts
const PAYTECH_API_URL = 'https://paytech.sn/api'

export const paytechService = {
  async createPayment(params: {
    amount: number
    currency: string
    description: string
    successUrl: string
    cancelUrl: string
    ipnUrl: string
    metadata?: Record<string, string>
  }) {
    const response = await fetch(`${PAYTECH_API_URL}/payment/request-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': process.env.PAYTECH_API_KEY!,
        'API_SECRET': process.env.PAYTECH_SECRET_KEY!,
      },
      body: JSON.stringify({
        item_name: params.description,
        item_price: params.amount,
        currency: params.currency,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        ipn_url: params.ipnUrl,
        custom_field: JSON.stringify(params.metadata),
      }),
    })

    return response.json()
  },

  verifySignature(payload: string, signature: string): boolean {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', process.env.PAYTECH_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex')
    
    return signature === expectedSignature
  },
}
```

---

## Frontend - Checkout

### Composant Checkout
```typescript
// components/billing/CheckoutButton.tsx
'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api-client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutButtonProps {
  planId: string
  priceId: string
  billingCycle: 'monthly' | 'yearly'
}

export function CheckoutButton({ planId, priceId, billingCycle }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const { data } = await api.reseller.createCheckoutSession({
        planId,
        priceId,
        billingCycle,
      })

      const stripe = await stripePromise
      await stripe?.redirectToCheckout({ sessionId: data.sessionId })
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Redirection...' : 'Souscrire'}
    </Button>
  )
}
```

### Stripe Elements (Paiement inline)
```typescript
// components/checkout/PaymentForm.tsx
'use client'

import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    })

    if (submitError) {
      setError(submitError.message || 'Une erreur est survenue')
    } else {
      onSuccess()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? 'Traitement...' : 'Payer'}
      </Button>
    </form>
  )
}

export function PaymentForm({ clientSecret, onSuccess }: { 
  clientSecret: string
  onSuccess: () => void 
}) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm onSuccess={onSuccess} />
    </Elements>
  )
}
```
