import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { hashPassword } from '../../utils/password'

const router = Router()

const completeOnboardingSchema = z.object({
  token: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  restaurantName: z.string().min(1),
  restaurantPhone: z.string().optional(),
  restaurantAddress: z.string().optional(),
})

function generateSubdomain(restaurantName: string): string {
  const base = restaurantName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20)
  
  const random = Math.random().toString(36).substring(2, 5)
  return `${base}-${random}`
}

// GET /showcase/onboarding/validate - Valider token onboarding
router.get('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.json({ success: true, data: { valid: false } })
    }

    const showcasePayment = await prisma.showcasePayment.findUnique({
      where: { onboardingToken: token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            priceMonthly: true,
            priceYearly: true,
            currency: true,
            features: true,
          }
        }
      }
    })

    if (!showcasePayment) {
      return res.json({ success: true, data: { valid: false, reason: 'TOKEN_NOT_FOUND' } })
    }

    if (showcasePayment.status !== 'PAID') {
      return res.json({ success: true, data: { valid: false, reason: 'PAYMENT_NOT_COMPLETED' } })
    }

    if (new Date() > showcasePayment.onboardingExpires) {
      return res.json({ success: true, data: { valid: false, reason: 'TOKEN_EXPIRED' } })
    }

    if (showcasePayment.status === 'COMPLETED') {
      return res.json({ success: true, data: { valid: false, reason: 'ALREADY_COMPLETED' } })
    }

    res.json({
      success: true,
      data: {
        valid: true,
        email: showcasePayment.email,
        firstName: showcasePayment.firstName,
        lastName: showcasePayment.lastName,
        phone: showcasePayment.phone,
        organization: showcasePayment.organization,
        plan: showcasePayment.plan ? {
          ...showcasePayment.plan,
          priceMonthly: Number(showcasePayment.plan.priceMonthly),
          priceYearly: showcasePayment.plan.priceYearly ? Number(showcasePayment.plan.priceYearly) : null,
        } : null,
        amount: Number(showcasePayment.amount),
        currency: showcasePayment.currency,
        billingCycle: showcasePayment.billingCycle,
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /showcase/onboarding/complete - Créer compte + restaurant + site
router.post('/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = completeOnboardingSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const showcasePayment = await prisma.showcasePayment.findUnique({
      where: { onboardingToken: data.token },
      include: {
        organization: true,
        plan: true,
      }
    })

    if (!showcasePayment) {
      return next(new AppError('Token invalide', 400, 'INVALID_TOKEN'))
    }

    if (showcasePayment.status !== 'PAID') {
      return next(new AppError('Paiement non complété', 400, 'PAYMENT_NOT_COMPLETED'))
    }

    if (new Date() > showcasePayment.onboardingExpires) {
      return next(new AppError('Token expiré', 400, 'TOKEN_EXPIRED'))
    }

    if (showcasePayment.email.toLowerCase() !== data.email.toLowerCase()) {
      return next(new AppError('Email ne correspond pas', 400, 'EMAIL_MISMATCH'))
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    })

    if (existingUser) {
      return next(new AppError('Un compte existe déjà avec cet email', 400, 'USER_EXISTS'))
    }

    const hashedPassword = await hashPassword(data.password)

    let subdomain = generateSubdomain(data.restaurantName)
    while (await prisma.site.findUnique({ where: { subdomain } })) {
      subdomain = generateSubdomain(data.restaurantName)
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          userType: 'RESTAURANT',
          emailVerified: true,
        }
      })

      const client = await tx.client.create({
        data: {
          organizationId: showcasePayment.organizationId,
          name: data.restaurantName,
          contactFirstName: data.firstName,
          contactLastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          status: 'ACTIVE',
          source: 'showcase',
        }
      })

      const restaurant = await tx.restaurant.create({
        data: {
          name: data.restaurantName,
          email: data.email.toLowerCase(),
          phone: data.restaurantPhone || data.phone || '',
          address: data.restaurantAddress || '',
          city: '',
          postalCode: '',
          country: 'FR',
        }
      })

      await tx.restaurantSettings.create({
        data: {
          restaurantId: restaurant.id,
          currency: showcasePayment.organization.currency,
        }
      })

      const site = await tx.site.create({
        data: {
          organizationId: showcasePayment.organizationId,
          clientId: client.id,
          subdomain,
          status: 'DRAFT',
          restaurantId: restaurant.id,
        }
      })

      await tx.restaurantStaff.create({
        data: {
          restaurantId: restaurant.id,
          userId: user.id,
          role: 'OWNER',
        }
      })

      const planSnapshot = showcasePayment.plan ? {
        id: showcasePayment.plan.id,
        name: showcasePayment.plan.name,
        priceMonthly: Number(showcasePayment.plan.priceMonthly),
        priceYearly: showcasePayment.plan.priceYearly ? Number(showcasePayment.plan.priceYearly) : null,
        currency: showcasePayment.plan.currency,
        features: showcasePayment.plan.features,
      } : null

      await tx.clientSubscription.create({
        data: {
          organizationId: showcasePayment.organizationId,
          clientId: client.id,
          planId: showcasePayment.planId,
          name: showcasePayment.plan?.name || 'Abonnement',
          amount: showcasePayment.amount,
          currency: showcasePayment.currency,
          billingCycle: showcasePayment.billingCycle,
          status: 'ACTIVE',
          startDate: new Date(),
          planSnapshot,
        }
      })

      await tx.showcasePayment.update({
        where: { id: showcasePayment.id },
        data: {
          status: 'COMPLETED',
          clientId: client.id,
          siteId: site.id,
        }
      })

      return { user, client, restaurant, site }
    })

    console.log('=== SHOWCASE ONBOARDING COMPLETED ===')
    console.log('User:', result.user.email)
    console.log('Restaurant:', result.restaurant.name)
    console.log('Subdomain:', result.site.subdomain)
    console.log('Organization:', showcasePayment.organization.name)
    console.log('=====================================')

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        userId: result.user.id,
        restaurantId: result.restaurant.id,
        siteId: result.site.id,
        subdomain: result.site.subdomain,
      }
    })
  } catch (error) {
    next(error)
  }
})

export { router as showcaseOnboardingRoutes }
