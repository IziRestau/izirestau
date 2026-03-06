import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { authenticate } from '../../middlewares/auth.middleware'
import { platformSupportRoutes } from './support.routes'
import { platformRestaurantsRoutes } from './restaurants.routes'
import { platformResellersRoutes } from './resellers.routes'
import { platformUsersRoutes } from './users.routes'

const router = Router()

router.use(authenticate)

async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId
  if (!userId) {
    return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  })

  if (!user?.isSuperAdmin) {
    return next(new AppError('Acces refuse', 403, 'FORBIDDEN'))
  }

  next()
}

router.use(requireSuperAdmin)

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      totalResellers,
      activeResellers,
      totalUsers,
      openTickets,
      totalLicenses,
      activeLicenses,
      recentResellers,
      recentTickets,
      newUsersThisMonth,
      newUsersThisWeek,
      newUsersToday,
    ] = await Promise.all([
      prisma.resellerOrganization.count(),
      prisma.resellerOrganization.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_REPLY'] } } }),
      prisma.license.count(),
      prisma.license.count({ where: { status: 'ACTIVE' } }),
      prisma.resellerOrganization.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.supportTicket.findMany({
        where: { ticketType: 'RESELLER_TO_PLATFORM' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          createdAt: true,
          resellerOrg: { select: { name: true } },
        },
      }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    ])

    res.json({
      success: true,
      data: {
        totalResellers,
        activeResellers,
        totalUsers,
        openTickets,
        totalLicenses,
        activeLicenses,
        totalRevenue: 0,
        recentResellers,
        recentTickets,
        newUsersThisMonth,
        newUsersThisWeek,
        newUsersToday,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/licenses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, planId, sortBy = 'createdAt', sortOrder = 'desc', page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (planId && planId !== 'all') {
      where.planId = planId
    }

    if (search && typeof search === 'string') {
      where.organizations = {
        some: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      }
    }

    const orderBy: any = {}
    if (sortBy === 'sitesUsed') {
      orderBy.sitesUsed = sortOrder
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          plan: true,
          organizations: { select: { id: true, name: true, email: true, status: true } },
        },
      }),
      prisma.license.count({ where }),
    ])

    res.json({
      success: true,
      data: licenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/licenses/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, active, trialing, pastDue, cancelled] = await Promise.all([
      prisma.license.count(),
      prisma.license.count({ where: { status: 'ACTIVE' } }),
      prisma.license.count({ where: { status: 'TRIALING' } }),
      prisma.license.count({ where: { status: 'PAST_DUE' } }),
      prisma.license.count({ where: { status: 'CANCELLED' } }),
    ])

    res.json({
      success: true,
      data: { total, active, trialing, pastDue, cancelled },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/licenses/plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { includeInactive } = req.query
    const where = includeInactive === 'true' ? {} : { isActive: true }
    
    const plans = await prisma.licensePlan.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { licenses: true } },
      },
    })

    res.json({ success: true, data: plans })
  } catch (error) {
    next(error)
  }
})

router.post('/licenses/plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      slug,
      description,
      maxSites,
      maxUsersPerSite,
      priceMonthly,
      priceYearly,
      currency,
      hasCustomDomain,
      hasAdvancedAnalytics,
      hasPrioritySupport,
      hasWhiteLabel,
      hasApiAccess,
      isPopular,
      sortOrder,
    } = req.body

    if (!name || !slug || !maxSites || !priceMonthly || !priceYearly) {
      return next(new AppError('Champs requis manquants', 400, 'VALIDATION_ERROR'))
    }

    const existingPlan = await prisma.licensePlan.findUnique({ where: { slug } })
    if (existingPlan) {
      return next(new AppError('Un plan avec ce slug existe deja', 400, 'DUPLICATE_SLUG'))
    }

    const plan = await prisma.licensePlan.create({
      data: {
        name,
        slug,
        description,
        maxSites: parseInt(maxSites, 10),
        maxUsersPerSite: parseInt(maxUsersPerSite || '5', 10),
        priceMonthly: parseFloat(priceMonthly),
        priceYearly: parseFloat(priceYearly),
        currency: currency || 'EUR',
        hasCustomDomain: hasCustomDomain || false,
        hasAdvancedAnalytics: hasAdvancedAnalytics || false,
        hasPrioritySupport: hasPrioritySupport || false,
        hasWhiteLabel: hasWhiteLabel || false,
        hasApiAccess: hasApiAccess || false,
        isPopular: isPopular || false,
        sortOrder: parseInt(sortOrder || '0', 10),
      },
    })

    res.status(201).json({ success: true, data: plan, message: 'Plan cree' })
  } catch (error) {
    next(error)
  }
})

router.put('/licenses/plans/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const {
      name,
      slug,
      description,
      maxSites,
      maxUsersPerSite,
      priceMonthly,
      priceYearly,
      currency,
      hasCustomDomain,
      hasAdvancedAnalytics,
      hasPrioritySupport,
      hasWhiteLabel,
      hasApiAccess,
      isActive,
      isPopular,
      sortOrder,
    } = req.body

    const existingPlan = await prisma.licensePlan.findUnique({ where: { id } })
    if (!existingPlan) {
      return next(new AppError('Plan non trouve', 404, 'NOT_FOUND'))
    }

    if (slug && slug !== existingPlan.slug) {
      const duplicateSlug = await prisma.licensePlan.findUnique({ where: { slug } })
      if (duplicateSlug) {
        return next(new AppError('Un plan avec ce slug existe deja', 400, 'DUPLICATE_SLUG'))
      }
    }

    const plan = await prisma.licensePlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(maxSites !== undefined && { maxSites: parseInt(maxSites, 10) }),
        ...(maxUsersPerSite !== undefined && { maxUsersPerSite: parseInt(maxUsersPerSite, 10) }),
        ...(priceMonthly !== undefined && { priceMonthly: parseFloat(priceMonthly) }),
        ...(priceYearly !== undefined && { priceYearly: parseFloat(priceYearly) }),
        ...(currency !== undefined && { currency }),
        ...(hasCustomDomain !== undefined && { hasCustomDomain }),
        ...(hasAdvancedAnalytics !== undefined && { hasAdvancedAnalytics }),
        ...(hasPrioritySupport !== undefined && { hasPrioritySupport }),
        ...(hasWhiteLabel !== undefined && { hasWhiteLabel }),
        ...(hasApiAccess !== undefined && { hasApiAccess }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder, 10) }),
      },
    })

    res.json({ success: true, data: plan, message: 'Plan mis a jour' })
  } catch (error) {
    next(error)
  }
})

router.delete('/licenses/plans/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const plan = await prisma.licensePlan.findUnique({
      where: { id },
      include: { _count: { select: { licenses: true } } },
    })

    if (!plan) {
      return next(new AppError('Plan non trouve', 404, 'NOT_FOUND'))
    }

    if (plan._count.licenses > 0) {
      await prisma.licensePlan.update({
        where: { id },
        data: { isActive: false },
      })
      res.json({ success: true, message: 'Plan desactive (licences existantes)' })
    } else {
      await prisma.licensePlan.delete({ where: { id } })
      res.json({ success: true, message: 'Plan supprime' })
    }
  } catch (error) {
    next(error)
  }
})

// PUT /platform/licenses/:id - Modifier une licence
router.put('/licenses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { billingCycle, currentPeriodEnd } = req.body

    const license = await prisma.license.findUnique({ where: { id } })
    if (!license) {
      return next(new AppError('Licence non trouvee', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.license.update({
      where: { id },
      data: {
        ...(billingCycle !== undefined && { billingCycle }),
        ...(currentPeriodEnd !== undefined && { currentPeriodEnd: new Date(currentPeriodEnd) }),
      },
      include: { plan: true },
    })

    res.json({ success: true, data: updated, message: 'Licence mise a jour' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/licenses/:id/cancel - Annuler une licence
router.post('/licenses/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { immediate } = req.body

    const license = await prisma.license.findUnique({ where: { id } })
    if (!license) {
      return next(new AppError('Licence non trouvee', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.license.update({
      where: { id },
      data: immediate 
        ? { status: 'CANCELLED' }
        : { cancelAtPeriodEnd: true },
      include: { plan: true },
    })

    res.json({ 
      success: true, 
      data: updated, 
      message: immediate ? 'Licence annulee' : 'Licence sera annulee a la fin de la periode' 
    })
  } catch (error) {
    next(error)
  }
})

// POST /platform/licenses/:id/reactivate - Reactiver une licence
router.post('/licenses/:id/reactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const license = await prisma.license.findUnique({ where: { id } })
    if (!license) {
      return next(new AppError('Licence non trouvee', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.license.update({
      where: { id },
      data: { 
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
      },
      include: { plan: true },
    })

    res.json({ success: true, data: updated, message: 'Licence reactivee' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/licenses/:id/extend-trial - Prolonger l'essai
router.post('/licenses/:id/extend-trial', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { days = 7 } = req.body

    const license = await prisma.license.findUnique({ where: { id } })
    if (!license) {
      return next(new AppError('Licence non trouvee', 404, 'NOT_FOUND'))
    }

    const currentEnd = license.trialEnd || new Date()
    const newTrialEnd = new Date(currentEnd)
    newTrialEnd.setDate(newTrialEnd.getDate() + parseInt(days, 10))

    const updated = await prisma.license.update({
      where: { id },
      data: { 
        trialEnd: newTrialEnd,
        status: 'TRIALING',
      },
      include: { plan: true },
    })

    res.json({ success: true, data: updated, message: `Essai prolonge de ${days} jours` })
  } catch (error) {
    next(error)
  }
})

router.use('/support', platformSupportRoutes)
router.use('/restaurants', platformRestaurantsRoutes)
router.use('/resellers', platformResellersRoutes)
router.use('/users', platformUsersRoutes)

export { router as platformRoutes }
