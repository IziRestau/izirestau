import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { monerooService } from '../../services/moneroo.service'

const router = Router()

const createInvitationSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  amount: z.number().min(0),
  currency: z.string().default('XOF'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  planId: z.string().optional(),
  message: z.string().optional(),
})

// POST /reseller/invitations - Envoyer invitation custom
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            slug: true,
            name: true,
            monerooSecretKey: true,
            monerooConfigured: true,
            currency: true,
          }
        }
      }
    })

    if (!member) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    if (!['OWNER', 'ADMIN', 'SALES'].includes(member.role)) {
      return next(new AppError('Permission refusée', 403, 'FORBIDDEN'))
    }

    if (!member.organization.monerooConfigured || !member.organization.monerooSecretKey) {
      return next(new AppError('Veuillez configurer Moneroo', 400, 'MONEROO_NOT_CONFIGURED'))
    }

    const validation = createInvitationSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    let plan = null
    if (data.planId) {
      plan = await prisma.resellerPlan.findFirst({
        where: {
          id: data.planId,
          organizationId: member.organizationId,
        }
      })
    }

    const onboardingExpires = new Date()
    onboardingExpires.setDate(onboardingExpires.getDate() + 30)

    const showcasePayment = await prisma.showcasePayment.create({
      data: {
        organizationId: member.organizationId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        planId: plan?.id,
        amount: data.amount,
        currency: data.currency || member.organization.currency,
        billingCycle: data.billingCycle,
        status: 'PENDING',
        onboardingExpires,
      }
    })

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const returnUrl = monerooService.generateShowcaseReturnUrl(
      baseUrl,
      member.organization.slug,
      showcasePayment.onboardingToken
    )
    const webhookUrl = monerooService.generateShowcaseWebhookUrl(
      process.env.API_URL || 'http://localhost:4000'
    )

    const monerooResponse = await monerooService.initializePayment(
      {
        publicKey: '',
        secretKey: member.organization.monerooSecretKey,
      },
      {
        amount: data.amount,
        currency: data.currency || member.organization.currency,
        description: plan 
          ? `Abonnement ${plan.name} - ${member.organization.name}`
          : `Abonnement personnalisé - ${member.organization.name}`,
        return_url: returnUrl,
        customer: {
          email: data.email,
          first_name: data.firstName || 'Client',
          last_name: data.lastName || '',
          phone: data.phone,
        },
        metadata: {
          showcasePaymentId: showcasePayment.id,
          organizationId: member.organizationId,
          planId: plan?.id || '',
          type: 'custom_invitation',
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

    const paymentLink = monerooResponse.data.checkout_url

    console.log('=== CUSTOM INVITATION CREATED ===')
    console.log('Organization:', member.organization.name)
    console.log('Email:', data.email)
    console.log('Amount:', data.amount, data.currency)
    console.log('Plan:', plan?.name || 'Custom')
    console.log('Payment Link:', paymentLink)
    console.log('=================================')

    res.status(201).json({
      success: true,
      data: {
        id: showcasePayment.id,
        email: data.email,
        amount: data.amount,
        currency: data.currency,
        paymentLink,
        expiresAt: onboardingExpires,
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /reseller/invitations - Liste des invitations envoyées
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    const { status, page = '1', limit = '20' } = req.query

    const where: Record<string, unknown> = {
      organizationId: member.organizationId,
    }

    if (status && typeof status === 'string') {
      where.status = status
    }

    const [invitations, total] = await Promise.all([
      prisma.showcasePayment.findMany({
        where,
        include: {
          plan: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.showcasePayment.count({ where })
    ])

    res.json({
      success: true,
      data: invitations.map(inv => ({
        ...inv,
        amount: Number(inv.amount),
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      }
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /reseller/invitations/:id - Annuler une invitation
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true, role: true }
    })

    if (!member) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      return next(new AppError('Permission refusée', 403, 'FORBIDDEN'))
    }

    const invitation = await prisma.showcasePayment.findFirst({
      where: {
        id: req.params.id,
        organizationId: member.organizationId,
      }
    })

    if (!invitation) {
      return next(new AppError('Invitation non trouvée', 404, 'INVITATION_NOT_FOUND'))
    }

    if (invitation.status === 'COMPLETED') {
      return next(new AppError('Impossible d\'annuler une invitation complétée', 400, 'CANNOT_CANCEL_COMPLETED'))
    }

    await prisma.showcasePayment.update({
      where: { id: invitation.id },
      data: {
        status: 'EXPIRED',
      }
    })

    res.json({
      success: true,
      message: 'Invitation annulée',
    })
  } catch (error) {
    next(error)
  }
})

export { router as invitationsRoutes }
