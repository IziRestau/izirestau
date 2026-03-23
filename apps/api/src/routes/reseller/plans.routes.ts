import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'

const router = Router()

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  currency: z.string().default('XOF'),
  billingCycle: z.coerce.number().min(1).max(36).default(1),
  billingCycleLabel: z.string().optional().nullable(),
  isCustom: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
})

const updatePlanSchema = createPlanSchema.partial()

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

// GET /reseller/plans - Liste des plans
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

    const { includeArchived } = req.query

    const plans = await prisma.resellerPlan.findMany({
      where: {
        organizationId: member.organizationId,
        ...(includeArchived !== 'true' && { isArchived: false }),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    })

    res.json({
      success: true,
      data: plans.map(plan => ({
        ...plan,
        price: Number(plan.price),
        subscribersCount: plan._count.subscriptions,
      }))
    })
  } catch (error) {
    next(error)
  }
})

// GET /reseller/plans/:id - Détail d'un plan
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
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

    const plan = await prisma.resellerPlan.findFirst({
      where: {
        id: req.params.id,
        organizationId: member.organizationId,
      },
      include: {
        subscriptions: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { subscriptions: true }
        }
      }
    })

    if (!plan) {
      return next(new AppError('Plan non trouvé', 404, 'PLAN_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        ...plan,
        price: Number(plan.price),
        subscribersCount: plan._count.subscriptions,
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /reseller/plans - Créer un plan
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
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

    const validation = createPlanSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    let slug = generateSlug(data.name)
    let counter = 1
    while (await prisma.resellerPlan.findFirst({
      where: { organizationId: member.organizationId, slug }
    })) {
      slug = `${generateSlug(data.name)}-${counter}`
      counter++
    }

    const plan = await prisma.resellerPlan.create({
      data: {
        organizationId: member.organizationId,
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        currency: data.currency,
        billingCycle: data.billingCycle,
        billingCycleLabel: data.billingCycleLabel,
        isCustom: data.isCustom,
        isPopular: data.isPopular,
        isPublic: data.isPublic,
        sortOrder: data.sortOrder,
      }
    })

    res.status(201).json({
      success: true,
      data: {
        ...plan,
        price: Number(plan.price),
      }
    })
  } catch (error) {
    next(error)
  }
})

// PUT /reseller/plans/:id - Modifier un plan
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
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

    const existingPlan = await prisma.resellerPlan.findFirst({
      where: {
        id: req.params.id,
        organizationId: member.organizationId,
      }
    })

    if (!existingPlan) {
      return next(new AppError('Plan non trouvé', 404, 'PLAN_NOT_FOUND'))
    }

    const validation = updatePlanSchema.safeParse(req.body)
    if (!validation.success) {
      console.error('Validation errors:', validation.error.errors)
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    let slug = existingPlan.slug
    if (data.name && data.name !== existingPlan.name) {
      slug = generateSlug(data.name)
      let counter = 1
      while (await prisma.resellerPlan.findFirst({
        where: { organizationId: member.organizationId, slug, id: { not: existingPlan.id } }
      })) {
        slug = `${generateSlug(data.name)}-${counter}`
        counter++
      }
    }

    const plan = await prisma.resellerPlan.update({
      where: { id: existingPlan.id },
      data: {
        ...(data.name !== undefined && { name: data.name, slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.billingCycle !== undefined && { billingCycle: data.billingCycle }),
        ...(data.billingCycleLabel !== undefined && { billingCycleLabel: data.billingCycleLabel }),
        ...(data.isCustom !== undefined && { isCustom: data.isCustom }),
        ...(data.isPopular !== undefined && { isPopular: data.isPopular }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      }
    })

    res.json({
      success: true,
      data: {
        ...plan,
        price: Number(plan.price),
      }
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /reseller/plans/:id - Archiver un plan
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

    const existingPlan = await prisma.resellerPlan.findFirst({
      where: {
        id: req.params.id,
        organizationId: member.organizationId,
      },
      include: {
        _count: {
          select: { subscriptions: { where: { status: 'ACTIVE' } } }
        }
      }
    })

    if (!existingPlan) {
      return next(new AppError('Plan non trouvé', 404, 'PLAN_NOT_FOUND'))
    }

    if (existingPlan._count.subscriptions > 0) {
      await prisma.resellerPlan.update({
        where: { id: existingPlan.id },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          isActive: false,
          isPublic: false,
        }
      })

      res.json({
        success: true,
        message: 'Plan archivé (des abonnements actifs existent)',
        archived: true,
      })
    } else {
      await prisma.resellerPlan.delete({
        where: { id: existingPlan.id }
      })

      res.json({
        success: true,
        message: 'Plan supprimé',
        deleted: true,
      })
    }
  } catch (error) {
    next(error)
  }
})

export { router as plansRoutes }
