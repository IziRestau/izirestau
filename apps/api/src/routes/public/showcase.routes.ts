import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { monerooService } from '../../services/moneroo.service'

const router = Router()

const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  planId: z.string(),
  billingCycle: z.number().min(1).optional(), // Nombre de mois
})

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10),
  planId: z.string().optional(),
})

// GET /showcase/:slug - Infos publiques revendeur
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params

    const organization = await prisma.resellerOrganization.findFirst({
      where: {
        OR: [
          { slug },
          { customDomain: slug },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        email: true,
        phone: true,
        website: true,
        customDomain: true,
      }
    })

    if (!organization) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    const showcase = await prisma.resellerShowcase.findUnique({
      where: { organizationId: organization.id }
    })

    if (!showcase?.isEnabled) {
      return next(new AppError('Vitrine non disponible', 404, 'SHOWCASE_NOT_AVAILABLE'))
    }

    res.json({
      success: true,
      data: {
        organization: {
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
          primaryColor: organization.primaryColor,
          email: organization.email,
          phone: organization.phone,
          website: organization.website,
        },
        showcase: {
          // Nouvelles configurations avancées
          heroConfig: showcase.heroConfig,
          productConfig: showcase.productConfig,
          howItWorksConfig: showcase.howItWorksConfig,
          benefitsConfig: showcase.benefitsConfig,
          pricingConfig: showcase.pricingConfig,
          testimonialsConfig: showcase.testimonialsConfig,
          faqConfig: showcase.faqConfig,
          contactConfig: showcase.contactConfig,
          footerConfig: showcase.footerConfig,
          sectionsOrder: showcase.sectionsOrder,
          globalStyles: showcase.globalStyles,
          template: showcase.template,
          metaTitle: showcase.metaTitle,
          metaDescription: showcase.metaDescription,
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /showcase/:slug/plans - Plans publics
router.get('/:slug/plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params

    const organization = await prisma.resellerOrganization.findFirst({
      where: {
        OR: [
          { slug },
          { customDomain: slug },
        ],
        isActive: true,
      },
      select: { id: true }
    })

    if (!organization) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    const showcase = await prisma.resellerShowcase.findUnique({
      where: { organizationId: organization.id }
    })

    if (!showcase?.isEnabled) {
      return next(new AppError('Vitrine non disponible', 404, 'SHOWCASE_NOT_AVAILABLE'))
    }

    const plans = await prisma.resellerPlan.findMany({
      where: {
        organizationId: organization.id,
        isActive: true,
        isPublic: true,
        isArchived: false,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { price: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        currency: true,
        billingCycle: true,
        billingCycleLabel: true,
        isCustom: true,
        isPopular: true,
      }
    })

    res.json({
      success: true,
      data: plans.map(plan => ({
        ...plan,
        price: Number(plan.price),
      }))
    })
  } catch (error) {
    next(error)
  }
})

// POST /showcase/:slug/checkout - Initier paiement Moneroo
router.post('/:slug/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params

    const validation = checkoutSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const organization = await prisma.resellerOrganization.findFirst({
      where: {
        OR: [
          { slug },
          { customDomain: slug },
        ],
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        monerooSecretKey: true,
        monerooConfigured: true,
        customDomain: true,
      }
    })

    if (!organization) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    if (!organization.monerooConfigured || !organization.monerooSecretKey) {
      return next(new AppError('Paiement non configuré', 400, 'PAYMENT_NOT_CONFIGURED'))
    }

    const plan = await prisma.resellerPlan.findFirst({
      where: {
        id: data.planId,
        organizationId: organization.id,
        isActive: true,
        isPublic: true,
        isArchived: false,
        isCustom: false,
      }
    })

    if (!plan) {
      return next(new AppError('Plan non trouvé', 404, 'PLAN_NOT_FOUND'))
    }

    const amount = Number(plan.price)

    const onboardingExpires = new Date()
    onboardingExpires.setDate(onboardingExpires.getDate() + 7)

    const showcasePayment = await prisma.showcasePayment.create({
      data: {
        organizationId: organization.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        planId: plan.id,
        amount,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        status: 'PENDING',
        onboardingExpires,
      }
    })

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const returnUrl = monerooService.generateShowcaseReturnUrl(
      baseUrl,
      organization.slug,
      showcasePayment.onboardingToken
    )
    const webhookUrl = monerooService.generateShowcaseWebhookUrl(
      process.env.API_URL || 'http://localhost:4000'
    )

    const monerooResponse = await monerooService.initializePayment(
      {
        publicKey: '',
        secretKey: organization.monerooSecretKey,
      },
      {
        amount,
        currency: plan.currency,
        description: `Abonnement ${plan.name} - ${organization.name}`,
        return_url: returnUrl,
        customer: {
          email: data.email,
          first_name: data.firstName || 'Client',
          last_name: data.lastName || '',
          phone: data.phone,
        },
        metadata: {
          showcasePaymentId: showcasePayment.id,
          organizationId: organization.id,
          planId: plan.id,
        },
      }
    )

    await prisma.showcasePayment.update({
      where: { id: showcasePayment.id },
      data: {
        monerooPaymentId: monerooResponse.data.id,
        monerooStatus: 'pending',
      }
    })

    res.json({
      success: true,
      data: {
        checkoutUrl: monerooResponse.data.checkout_url,
        paymentId: showcasePayment.id,
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /showcase/:slug/contact - Formulaire contact (plan custom)
router.post('/:slug/contact', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params

    const validation = contactSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const organization = await prisma.resellerOrganization.findFirst({
      where: {
        OR: [
          { slug },
          { customDomain: slug },
        ],
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    })

    if (!organization) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    const showcase = await prisma.resellerShowcase.findUnique({
      where: { organizationId: organization.id }
    })

    if (!showcase?.isEnabled || !showcase.showContact) {
      return next(new AppError('Contact non disponible', 404, 'CONTACT_NOT_AVAILABLE'))
    }

    let plan = null
    if (data.planId) {
      plan = await prisma.resellerPlan.findFirst({
        where: {
          id: data.planId,
          organizationId: organization.id,
        },
        select: { id: true, name: true }
      })
    }

    console.log('=== SHOWCASE CONTACT ===')
    console.log('Organization:', organization.name)
    console.log('From:', data.email)
    console.log('Name:', `${data.firstName} ${data.lastName}`)
    console.log('Phone:', data.phone)
    console.log('Company:', data.company)
    console.log('Plan:', plan?.name || 'Non spécifié')
    console.log('Message:', data.message)
    console.log('========================')

    res.json({
      success: true,
      message: 'Message envoyé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

export { router as publicShowcaseRoutes }
