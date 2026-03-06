import { Router, Request, Response, NextFunction } from 'express'
import { prisma, EmailCampaignStatus } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'
import { getTargetedCustomers, TargetingRules } from '../../services/targeting.service'
import { sendCampaignEmails } from '../../services/email.service'

const router = Router()

router.use(loadStaff)
router.use(requireRole('OWNER', 'MANAGER'))

// ============================================
// STATS
// ============================================

// GET /restaurant/marketing/stats - Statistiques marketing globales
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const restaurantId = staff.restaurantId

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      couponsTotal,
      couponsActive,
      couponsUsedCount,
      promotionsTotal,
      promotionsActive,
      reviewsTotal,
      reviewsAvgRating,
      reviewsThisMonth,
      customersWithLoyalty,
      ordersWithCoupon,
    ] = await Promise.all([
      prisma.coupon.count({ where: { restaurantId } }),
      prisma.coupon.count({ where: { restaurantId, isActive: true } }),
      prisma.coupon.aggregate({
        where: { restaurantId },
        _sum: { usedCount: true },
      }),
      prisma.promotion.count({ where: { restaurantId } }),
      prisma.promotion.count({ where: { restaurantId, isActive: true } }),
      prisma.review.count({ where: { restaurantId } }),
      prisma.review.aggregate({
        where: { restaurantId },
        _avg: { rating: true },
      }),
      prisma.review.count({
        where: { restaurantId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.restaurantCustomer.count({
        where: { restaurantId, loyaltyPoints: { gt: 0 } },
      }),
      prisma.order.count({
        where: { restaurantId, couponId: { not: null } },
      }),
    ])

    res.json({
      success: true,
      data: {
        coupons: {
          total: couponsTotal,
          active: couponsActive,
          totalUsed: couponsUsedCount._sum.usedCount || 0,
        },
        promotions: {
          total: promotionsTotal,
          active: promotionsActive,
        },
        reviews: {
          total: reviewsTotal,
          avgRating: reviewsAvgRating._avg.rating ? Number(reviewsAvgRating._avg.rating.toFixed(1)) : null,
          thisMonth: reviewsThisMonth,
        },
        loyalty: {
          customersWithPoints: customersWithLoyalty,
        },
        orders: {
          withCoupon: ordersWithCoupon,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// COUPONS
// ============================================

const createCouponSchema = z.object({
  code: z.string().min(3).max(20).transform(val => val.toUpperCase()),
  description: z.string().max(500).optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED', 'FREE_ITEM']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerCustomer: z.number().int().positive().optional().default(1),
  appliesToAll: z.boolean().optional().default(true),
  productIds: z.array(z.string()).optional().default([]),
  categoryIds: z.array(z.string()).optional().default([]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

const updateCouponSchema = createCouponSchema.partial()

// GET /restaurant/marketing/coupons - Liste des coupons
router.get('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { search, status, page = '1', limit = '20' } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20))
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = { restaurantId: staff.restaurantId }

    if (search && typeof search === 'string') {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.coupon.count({ where }),
    ])

    res.json({
      success: true,
      data: coupons.map(c => ({
        id: c.id,
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        maxUses: c.maxUses,
        maxUsesPerCustomer: c.maxUsesPerCustomer,
        usedCount: c.usedCount,
        appliesToAll: c.appliesToAll,
        productIds: c.productIds,
        categoryIds: c.categoryIds,
        startDate: c.startDate,
        endDate: c.endDate,
        isActive: c.isActive,
        ordersCount: c._count.orders,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/marketing/coupons/:id - Détail d'un coupon
router.get('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const coupon = await prisma.coupon.findFirst({
      where: { id, restaurantId: staff.restaurantId },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            discount: true,
            createdAt: true,
            customer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: { orders: true },
        },
      },
    })

    if (!coupon) {
      return next(new AppError('Coupon non trouvé', 404, 'COUPON_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
        maxUses: coupon.maxUses,
        maxUsesPerCustomer: coupon.maxUsesPerCustomer,
        usedCount: coupon.usedCount,
        appliesToAll: coupon.appliesToAll,
        productIds: coupon.productIds,
        categoryIds: coupon.categoryIds,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        isActive: coupon.isActive,
        ordersCount: coupon._count.orders,
        recentOrders: coupon.orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          total: Number(o.total),
          discount: Number(o.discount),
          createdAt: o.createdAt,
          customer: o.customer,
        })),
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/marketing/coupons - Créer un coupon
router.post('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const data = createCouponSchema.parse(req.body)

    // Vérifier que le code n'existe pas déjà
    const existing = await prisma.coupon.findFirst({
      where: { restaurantId: staff.restaurantId, code: data.code },
    })

    if (existing) {
      return next(new AppError('Ce code promo existe déjà', 400, 'COUPON_CODE_EXISTS'))
    }

    const coupon = await prisma.coupon.create({
      data: {
        restaurantId: staff.restaurantId,
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxDiscount: data.maxDiscount,
        maxUses: data.maxUses,
        maxUsesPerCustomer: data.maxUsesPerCustomer,
        appliesToAll: data.appliesToAll,
        productIds: data.productIds,
        categoryIds: data.categoryIds,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        isActive: coupon.isActive,
        createdAt: coupon.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }
    next(error)
  }
})

// PUT /restaurant/marketing/coupons/:id - Modifier un coupon
router.put('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const data = updateCouponSchema.parse(req.body)

    const existing = await prisma.coupon.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Coupon non trouvé', 404, 'COUPON_NOT_FOUND'))
    }

    // Si le code change, vérifier qu'il n'existe pas déjà
    if (data.code && data.code !== existing.code) {
      const codeExists = await prisma.coupon.findFirst({
        where: { restaurantId: staff.restaurantId, code: data.code, id: { not: id } },
      })
      if (codeExists) {
        return next(new AppError('Ce code promo existe déjà', 400, 'COUPON_CODE_EXISTS'))
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.discountType !== undefined && { discountType: data.discountType }),
        ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
        ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount }),
        ...(data.maxDiscount !== undefined && { maxDiscount: data.maxDiscount }),
        ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
        ...(data.maxUsesPerCustomer !== undefined && { maxUsesPerCustomer: data.maxUsesPerCustomer }),
        ...(data.appliesToAll !== undefined && { appliesToAll: data.appliesToAll }),
        ...(data.productIds !== undefined && { productIds: data.productIds }),
        ...(data.categoryIds !== undefined && { categoryIds: data.categoryIds }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    res.json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        isActive: coupon.isActive,
        updatedAt: coupon.updatedAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }
    next(error)
  }
})

// DELETE /restaurant/marketing/coupons/:id - Supprimer un coupon
router.delete('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existing = await prisma.coupon.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Coupon non trouvé', 404, 'COUPON_NOT_FOUND'))
    }

    await prisma.coupon.delete({ where: { id } })

    res.json({ success: true, message: 'Coupon supprimé' })
  } catch (error) {
    next(error)
  }
})

// ============================================
// PROMOTIONS
// ============================================

const createPromotionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(['DISCOUNT', 'HAPPY_HOUR', 'BUNDLE', 'BOGO', 'FREE_DELIVERY']),
  discountType: z.enum(['PERCENTAGE', 'FIXED', 'FREE_ITEM']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().positive().optional().nullable(),
  appliesToAll: z.boolean().optional().default(true),
  productIds: z.array(z.string()).optional().default([]),
  categoryIds: z.array(z.string()).optional().default([]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  activeDays: z.array(z.number().min(0).max(6)).optional().default([0, 1, 2, 3, 4, 5, 6]),
  activeFrom: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  activeTo: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

const updatePromotionSchema = createPromotionSchema.partial()

// GET /restaurant/marketing/promotions - Liste des promotions
router.get('/promotions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { search, status, type, page = '1', limit = '20' } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20))
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = { restaurantId: staff.restaurantId }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (type && typeof type === 'string') {
      where.type = type
    }

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.promotion.count({ where }),
    ])

    res.json({
      success: true,
      data: promotions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        discountType: p.discountType,
        discountValue: Number(p.discountValue),
        minOrderAmount: p.minOrderAmount ? Number(p.minOrderAmount) : null,
        maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
        appliesToAll: p.appliesToAll,
        productIds: p.productIds,
        categoryIds: p.categoryIds,
        startDate: p.startDate,
        endDate: p.endDate,
        activeDays: p.activeDays,
        activeFrom: p.activeFrom,
        activeTo: p.activeTo,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/marketing/promotions/:id - Détail d'une promotion
router.get('/promotions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const promotion = await prisma.promotion.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!promotion) {
      return next(new AppError('Promotion non trouvée', 404, 'PROMOTION_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        discountType: promotion.discountType,
        discountValue: Number(promotion.discountValue),
        minOrderAmount: promotion.minOrderAmount ? Number(promotion.minOrderAmount) : null,
        maxDiscount: promotion.maxDiscount ? Number(promotion.maxDiscount) : null,
        appliesToAll: promotion.appliesToAll,
        productIds: promotion.productIds,
        categoryIds: promotion.categoryIds,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        activeDays: promotion.activeDays,
        activeFrom: promotion.activeFrom,
        activeTo: promotion.activeTo,
        isActive: promotion.isActive,
        createdAt: promotion.createdAt,
        updatedAt: promotion.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/marketing/promotions - Créer une promotion
router.post('/promotions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const data = createPromotionSchema.parse(req.body)

    const promotion = await prisma.promotion.create({
      data: {
        restaurantId: staff.restaurantId,
        name: data.name,
        description: data.description,
        type: data.type,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxDiscount: data.maxDiscount,
        appliesToAll: data.appliesToAll,
        productIds: data.productIds,
        categoryIds: data.categoryIds,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        activeDays: data.activeDays,
        activeFrom: data.activeFrom,
        activeTo: data.activeTo,
        isActive: data.isActive,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: promotion.id,
        name: promotion.name,
        type: promotion.type,
        isActive: promotion.isActive,
        createdAt: promotion.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }
    next(error)
  }
})

// PUT /restaurant/marketing/promotions/:id - Modifier une promotion
router.put('/promotions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const data = updatePromotionSchema.parse(req.body)

    const existing = await prisma.promotion.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Promotion non trouvée', 404, 'PROMOTION_NOT_FOUND'))
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.discountType !== undefined && { discountType: data.discountType }),
        ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
        ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount }),
        ...(data.maxDiscount !== undefined && { maxDiscount: data.maxDiscount }),
        ...(data.appliesToAll !== undefined && { appliesToAll: data.appliesToAll }),
        ...(data.productIds !== undefined && { productIds: data.productIds }),
        ...(data.categoryIds !== undefined && { categoryIds: data.categoryIds }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.activeDays !== undefined && { activeDays: data.activeDays }),
        ...(data.activeFrom !== undefined && { activeFrom: data.activeFrom }),
        ...(data.activeTo !== undefined && { activeTo: data.activeTo }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    res.json({
      success: true,
      data: {
        id: promotion.id,
        name: promotion.name,
        type: promotion.type,
        isActive: promotion.isActive,
        updatedAt: promotion.updatedAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }
    next(error)
  }
})

// DELETE /restaurant/marketing/promotions/:id - Supprimer une promotion
router.delete('/promotions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existing = await prisma.promotion.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Promotion non trouvée', 404, 'PROMOTION_NOT_FOUND'))
    }

    await prisma.promotion.delete({ where: { id } })

    res.json({ success: true, message: 'Promotion supprimée' })
  } catch (error) {
    next(error)
  }
})

// ============================================
// REVIEWS (AVIS)
// ============================================

// GET /restaurant/marketing/reviews - Liste des avis
router.get('/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { search, rating, status, page = '1', limit = '20' } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20))
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = { restaurantId: staff.restaurantId }

    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (rating && typeof rating === 'string') {
      where.rating = parseInt(rating)
    }

    if (status === 'published') {
      where.isPublished = true
    } else if (status === 'hidden') {
      where.isPublished = false
    } else if (status === 'pending') {
      where.response = null
    }

    const [reviews, total, avgRating, ratingDistribution] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where: { restaurantId: staff.restaurantId },
        _avg: { rating: true },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { restaurantId: staff.restaurantId },
        _count: { rating: true },
      }),
    ])

    const distribution = [1, 2, 3, 4, 5].map(r => ({
      rating: r,
      count: ratingDistribution.find(d => d.rating === r)?._count.rating || 0,
    }))

    res.json({
      success: true,
      data: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        foodRating: r.foodRating,
        serviceRating: r.serviceRating,
        deliveryRating: r.deliveryRating,
        response: r.response,
        respondedAt: r.respondedAt,
        isPublished: r.isPublished,
        isVerified: r.isVerified,
        customer: r.customer,
        orderId: r.orderId,
        createdAt: r.createdAt,
      })),
      stats: {
        avgRating: avgRating._avg.rating ? Number(avgRating._avg.rating.toFixed(1)) : null,
        distribution,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/marketing/reviews/:id - Détail d'un avis
router.get('/reviews/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const review = await prisma.review.findFirst({
      where: { id, restaurantId: staff.restaurantId },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    })

    if (!review) {
      return next(new AppError('Avis non trouvé', 404, 'REVIEW_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        foodRating: review.foodRating,
        serviceRating: review.serviceRating,
        deliveryRating: review.deliveryRating,
        response: review.response,
        respondedAt: review.respondedAt,
        respondedBy: review.respondedBy,
        isPublished: review.isPublished,
        isVerified: review.isVerified,
        customer: review.customer,
        orderId: review.orderId,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/marketing/reviews/:id - Modifier un avis (répondre, publier/masquer)
router.put('/reviews/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const { response, isPublished } = req.body

    const existing = await prisma.review.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Avis non trouvé', 404, 'REVIEW_NOT_FOUND'))
    }

    const updateData: Record<string, unknown> = {}

    if (response !== undefined) {
      updateData.response = response
      updateData.respondedAt = response ? new Date() : null
      updateData.respondedBy = response ? staff.userId : null
    }

    if (isPublished !== undefined) {
      updateData.isPublished = isPublished
    }

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
    })

    res.json({
      success: true,
      data: {
        id: review.id,
        response: review.response,
        respondedAt: review.respondedAt,
        isPublished: review.isPublished,
        updatedAt: review.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// LOYALTY (FIDÉLITÉ)
// ============================================

// GET /restaurant/marketing/loyalty/stats - Stats du programme de fidélité
router.get('/loyalty/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const [
      totalCustomers,
      customersWithPoints,
      totalPoints,
      avgPoints,
    ] = await Promise.all([
      prisma.restaurantCustomer.count({ where: { restaurantId: staff.restaurantId } }),
      prisma.restaurantCustomer.count({ where: { restaurantId: staff.restaurantId, loyaltyPoints: { gt: 0 } } }),
      prisma.restaurantCustomer.aggregate({
        where: { restaurantId: staff.restaurantId },
        _sum: { loyaltyPoints: true },
      }),
      prisma.restaurantCustomer.aggregate({
        where: { restaurantId: staff.restaurantId, loyaltyPoints: { gt: 0 } },
        _avg: { loyaltyPoints: true },
      }),
    ])

    // Top clients fidèles
    const topCustomers = await prisma.restaurantCustomer.findMany({
      where: { restaurantId: staff.restaurantId, loyaltyPoints: { gt: 0 } },
      orderBy: { loyaltyPoints: 'desc' },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        loyaltyPoints: true,
        totalOrders: true,
        totalSpent: true,
      },
    })

    res.json({
      success: true,
      data: {
        totalCustomers,
        customersWithPoints,
        totalPoints: totalPoints._sum.loyaltyPoints || 0,
        avgPoints: avgPoints._avg.loyaltyPoints ? Math.round(avgPoints._avg.loyaltyPoints) : 0,
        topCustomers: topCustomers.map(c => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          loyaltyPoints: c.loyaltyPoints,
          totalOrders: c.totalOrders,
          totalSpent: Number(c.totalSpent),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/marketing/loyalty/transactions - Historique des transactions de points
router.get('/loyalty/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { customerId, page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = { restaurantId: staff.restaurantId }
    if (customerId) {
      where.customerId = customerId
    }

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.loyaltyTransaction.count({ where }),
    ])

    res.json({
      success: true,
      data: transactions.map(t => ({
        id: t.id,
        type: t.type,
        points: t.points,
        balanceAfter: t.balanceAfter,
        description: t.description,
        orderId: t.orderId,
        customer: t.customer,
        createdAt: t.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/marketing/loyalty/adjust - Ajuster manuellement les points d'un client
router.post('/loyalty/adjust', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { customerId, points, description } = req.body

    if (!customerId || points === undefined) {
      return next(new AppError('customerId et points sont requis', 400, 'INVALID_INPUT'))
    }

    const customer = await prisma.restaurantCustomer.findFirst({
      where: { id: customerId, restaurantId: staff.restaurantId },
    })

    if (!customer) {
      return next(new AppError('Client non trouvé', 404, 'CUSTOMER_NOT_FOUND'))
    }

    const newBalance = customer.loyaltyPoints + points

    if (newBalance < 0) {
      return next(new AppError('Le solde de points ne peut pas être négatif', 400, 'INSUFFICIENT_POINTS'))
    }

    const [updatedCustomer, transaction] = await prisma.$transaction([
      prisma.restaurantCustomer.update({
        where: { id: customerId },
        data: { loyaltyPoints: newBalance },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          customerId,
          restaurantId: staff.restaurantId,
          type: 'ADJUSTMENT',
          points,
          balanceAfter: newBalance,
          description: description || (points > 0 ? 'Ajustement manuel (crédit)' : 'Ajustement manuel (débit)'),
        },
      }),
    ])

    res.json({
      success: true,
      data: {
        customerId: updatedCustomer.id,
        newBalance: updatedCustomer.loyaltyPoints,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          points: transaction.points,
          balanceAfter: transaction.balanceAfter,
          description: transaction.description,
          createdAt: transaction.createdAt,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/marketing/loyalty/settings - Récupérer les paramètres de fidélité
router.get('/loyalty/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: staff.restaurantId },
      select: {
        loyaltyEnabled: true,
        loyaltyPointsPerUnit: true,
        loyaltyPointsToMoneyRate: true,
        loyaltyMinPointsToRedeem: true,
        loyaltyWelcomeBonus: true,
        loyaltyBirthdayBonus: true,
        loyaltyReferralBonus: true,
      },
    })

    res.json({
      success: true,
      data: {
        enabled: settings?.loyaltyEnabled ?? true,
        pointsPerCurrency: settings?.loyaltyPointsPerUnit ?? 1,
        currencyPerPoint: settings?.loyaltyPointsToMoneyRate ?? 100,
        minPointsToRedeem: settings?.loyaltyMinPointsToRedeem ?? 100,
        welcomeBonus: settings?.loyaltyWelcomeBonus ?? 0,
        birthdayBonus: settings?.loyaltyBirthdayBonus ?? 0,
        referralBonus: settings?.loyaltyReferralBonus ?? 0,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/marketing/loyalty/settings - Mettre à jour les paramètres de fidélité
router.put('/loyalty/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const {
      enabled,
      pointsPerCurrency,
      currencyPerPoint,
      minPointsToRedeem,
      welcomeBonus,
      birthdayBonus,
      referralBonus,
    } = req.body

    const updateData: Record<string, unknown> = {}

    if (enabled !== undefined) updateData.loyaltyEnabled = enabled
    if (pointsPerCurrency !== undefined) updateData.loyaltyPointsPerUnit = Math.max(1, pointsPerCurrency)
    if (currencyPerPoint !== undefined) updateData.loyaltyPointsToMoneyRate = Math.max(1, currencyPerPoint)
    if (minPointsToRedeem !== undefined) updateData.loyaltyMinPointsToRedeem = Math.max(0, minPointsToRedeem)
    if (welcomeBonus !== undefined) updateData.loyaltyWelcomeBonus = Math.max(0, welcomeBonus)
    if (birthdayBonus !== undefined) updateData.loyaltyBirthdayBonus = Math.max(0, birthdayBonus)
    if (referralBonus !== undefined) updateData.loyaltyReferralBonus = Math.max(0, referralBonus)

    const settings = await prisma.restaurantSettings.upsert({
      where: { restaurantId: staff.restaurantId },
      update: updateData,
      create: {
        restaurantId: staff.restaurantId,
        ...updateData,
      },
      select: {
        loyaltyEnabled: true,
        loyaltyPointsPerUnit: true,
        loyaltyPointsToMoneyRate: true,
        loyaltyMinPointsToRedeem: true,
        loyaltyWelcomeBonus: true,
        loyaltyBirthdayBonus: true,
        loyaltyReferralBonus: true,
      },
    })

    res.json({
      success: true,
      data: {
        enabled: settings.loyaltyEnabled,
        pointsPerCurrency: settings.loyaltyPointsPerUnit,
        currencyPerPoint: settings.loyaltyPointsToMoneyRate,
        minPointsToRedeem: settings.loyaltyMinPointsToRedeem,
        welcomeBonus: settings.loyaltyWelcomeBonus,
        birthdayBonus: settings.loyaltyBirthdayBonus,
        referralBonus: settings.loyaltyReferralBonus,
      },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// EMAIL CAMPAIGNS
// ============================================

// GET /restaurant/marketing/campaigns - Liste des campagnes
router.get('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { status, type, page = '1', limit = '20' } = req.query

    const where: Record<string, unknown> = { restaurantId: staff.restaurantId }
    if (status) where.status = status
    if (type) where.type = type

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.emailCampaign.count({ where }),
    ])

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/marketing/campaigns/:id - Détails d'une campagne
router.get('/campaigns/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const { page = '1', limit = '50', recipientStatus } = req.query

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!campaign) {
      return next(new AppError('Campagne non trouvée', 404, 'NOT_FOUND'))
    }

    // Pagination des destinataires
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    // Filtre par statut de destinataire
    const recipientWhere: Record<string, unknown> = { campaignId: id }
    if (recipientStatus && recipientStatus !== 'all') {
      recipientWhere.status = recipientStatus
    }

    // Récupérer les destinataires avec pagination
    const [recipients, totalRecipients] = await Promise.all([
      prisma.emailCampaignRecipient.findMany({
        where: recipientWhere,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
        orderBy: { id: 'desc' },
        skip,
        take,
      }),
      prisma.emailCampaignRecipient.count({ where: recipientWhere }),
    ])

    // Statistiques par statut de destinataire
    const recipientStats = await prisma.emailCampaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { status: true },
    })

    const stats = {
      total: 0,
      pending: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0,
      unsubscribed: 0,
    }

    recipientStats.forEach((s) => {
      const count = s._count.status
      stats.total += count
      switch (s.status) {
        case 'PENDING': stats.pending = count; break
        case 'SENT': stats.sent = count; break
        case 'DELIVERED': stats.delivered = count; break
        case 'OPENED': stats.opened = count; break
        case 'CLICKED': stats.clicked = count; break
        case 'BOUNCED': stats.bounced = count; break
        case 'FAILED': stats.failed = count; break
        case 'UNSUBSCRIBED': stats.unsubscribed = count; break
      }
    })

    res.json({
      success: true,
      data: {
        ...campaign,
        recipients,
        recipientStats: stats,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total: totalRecipients,
          totalPages: Math.ceil(totalRecipients / take),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/marketing/campaigns - Créer une campagne
router.post('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { name, subject, content, type, targetAll, targetingRules, scheduledAt } = req.body

    const createCampaignSchema = z.object({
      name: z.string().min(1, 'Nom requis'),
      subject: z.string().min(1, 'Sujet requis'),
      content: z.string().min(1, 'Contenu requis'),
      type: z.enum(['PROMOTIONAL', 'NEWSLETTER', 'ANNOUNCEMENT', 'LOYALTY', 'BIRTHDAY', 'REACTIVATION']).optional(),
      targetAll: z.boolean().optional(),
      targetingRules: z.any().optional(),
      scheduledAt: z.string().datetime().optional(),
    })

    const validated = createCampaignSchema.parse({
      name, subject, content, type, targetAll, targetingRules, scheduledAt,
    })

    // Si scheduledAt est défini, la campagne passe directement en PENDING
    const initialStatus = (validated.scheduledAt ? 'PENDING' : 'DRAFT') as 'PENDING' | 'DRAFT'

    const campaign = await prisma.emailCampaign.create({
      data: {
        restaurantId: staff.restaurantId,
        name: validated.name,
        subject: validated.subject,
        content: validated.content,
        type: validated.type || 'PROMOTIONAL',
        status: initialStatus,
        targetAll: validated.targetAll ?? true,
        targetingRules: validated.targetingRules || null,
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : null,
      },
    })

    res.status(201).json({ success: true, data: campaign })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/marketing/campaigns/:id - Modifier une campagne
router.put('/campaigns/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const { name, subject, content, type, targetAll, targetingRules, scheduledAt } = req.body

    const existing = await prisma.emailCampaign.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Campagne non trouvée', 404, 'NOT_FOUND'))
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'PENDING') {
      return next(new AppError('Seules les campagnes en brouillon ou en attente peuvent être modifiées', 400, 'INVALID_STATUS'))
    }

    // Si on programme une campagne, elle passe en PENDING
    // Si on retire la programmation, elle repasse en DRAFT
    const newStatus = (scheduledAt ? 'PENDING' : 'DRAFT') as 'PENDING' | 'DRAFT'

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        name,
        subject,
        content,
        type,
        targetAll,
        targetingRules: targetingRules !== undefined ? targetingRules : undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: newStatus,
      },
    })

    res.json({ success: true, data: campaign })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/marketing/campaigns/:id - Supprimer une campagne
router.delete('/campaigns/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existing = await prisma.emailCampaign.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Campagne non trouvée', 404, 'NOT_FOUND'))
    }

    if (existing.status === 'SENDING') {
      return next(new AppError('Impossible de supprimer une campagne en cours d\'envoi', 400, 'INVALID_STATUS'))
    }

    await prisma.emailCampaign.delete({ where: { id } })

    res.json({ success: true, message: 'Campagne supprimée' })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/marketing/campaigns/:id/send - Envoyer une campagne
router.post('/campaigns/:id/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!campaign) {
      return next(new AppError('Campagne non trouvée', 404, 'NOT_FOUND'))
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'PENDING') {
      return next(new AppError('Cette campagne ne peut pas être envoyée', 400, 'INVALID_STATUS'))
    }

    // Récupérer les clients ciblés via le service de targeting
    const targetingRules = campaign.targetingRules as TargetingRules | null
    const customers = await getTargetedCustomers(
      staff.restaurantId,
      targetingRules,
      { marketingOptInOnly: true }
    )

    if (customers.length === 0) {
      return next(new AppError('Aucun client ne correspond aux critères de ciblage', 400, 'NO_RECIPIENTS'))
    }

    // Créer les destinataires
    const recipientData = customers.map(c => ({
      campaignId: id,
      customerId: c.id,
      email: c.email,
    }))

    await prisma.$transaction([
      prisma.emailCampaignRecipient.createMany({
        data: recipientData,
        skipDuplicates: true,
      }),
      prisma.emailCampaign.update({
        where: { id },
        data: {
          status: 'SENDING',
          recipientCount: customers.length,
        },
      }),
    ])

    // Récupérer le nom du restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: staff.restaurantId },
      select: { name: true },
    })

    // Récupérer les points de fidélité des clients
    const customersWithPoints = await prisma.restaurantCustomer.findMany({
      where: { id: { in: customers.map(c => c.id) } },
      select: { id: true, email: true, firstName: true, lastName: true, loyaltyPoints: true },
    })

    // Envoyer les emails
    const { sent, failed } = await sendCampaignEmails(
      id,
      campaign.subject,
      campaign.content,
      restaurant?.name || 'Restaurant',
      customersWithPoints
    )

    // Mettre à jour la campagne
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount: sent,
      },
    })

    res.json({
      success: true,
      message: `Campagne envoyée à ${sent} destinataires${failed > 0 ? ` (${failed} échecs)` : ''}`,
      data: { recipientCount: customers.length, sent, failed },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/marketing/campaigns/:id/stats - Statistiques d'une campagne
router.get('/campaigns/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, restaurantId: staff.restaurantId },
      select: {
        id: true,
        name: true,
        status: true,
        recipientCount: true,
        sentCount: true,
        openCount: true,
        clickCount: true,
        sentAt: true,
      },
    })

    if (!campaign) {
      return next(new AppError('Campagne non trouvée', 404, 'NOT_FOUND'))
    }

    const openRate = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0
    const clickRate = campaign.openCount > 0 ? (campaign.clickCount / campaign.openCount) * 100 : 0

    res.json({
      success: true,
      data: {
        ...campaign,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
      },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// EMAIL TEMPLATES (Personnalisation)
// ============================================

// GET /restaurant/marketing/email-templates - Liste des templates
router.get('/email-templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const templates = await prisma.restaurantEmailTemplate.findMany({
      where: { restaurantId: staff.restaurantId },
      orderBy: { type: 'asc' },
    })

    // Retourner tous les types possibles avec leur template personnalisé ou null
    const allTypes = [
      'ORDER_CONFIRMATION',
      'ORDER_READY',
      'ORDER_DELIVERED',
      'LOYALTY_POINTS_EARNED',
      'LOYALTY_POINTS_REDEEMED',
      'WELCOME',
      'BIRTHDAY',
      'RECEIPT',
    ]

    const templateMap = new Map(templates.map(t => [t.type, t]))
    const result = allTypes.map(type => ({
      type,
      template: templateMap.get(type as never) || null,
      hasCustomTemplate: templateMap.has(type as never),
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/marketing/email-templates/:type - Détails d'un template
router.get('/email-templates/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { type } = req.params

    const template = await prisma.restaurantEmailTemplate.findUnique({
      where: {
        restaurantId_type: {
          restaurantId: staff.restaurantId,
          type: type as never,
        },
      },
    })

    res.json({ success: true, data: template })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/marketing/email-templates/:type - Créer/Modifier un template
router.put('/email-templates/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { type } = req.params
    const { subject, content, isActive } = req.body

    const validTypes = [
      'ORDER_CONFIRMATION',
      'ORDER_READY',
      'ORDER_DELIVERED',
      'LOYALTY_POINTS_EARNED',
      'LOYALTY_POINTS_REDEEMED',
      'WELCOME',
      'BIRTHDAY',
      'RECEIPT',
    ]

    if (!validTypes.includes(type)) {
      return next(new AppError('Type de template invalide', 400, 'INVALID_TYPE'))
    }

    const template = await prisma.restaurantEmailTemplate.upsert({
      where: {
        restaurantId_type: {
          restaurantId: staff.restaurantId,
          type: type as never,
        },
      },
      update: {
        subject,
        content,
        isActive: isActive ?? true,
      },
      create: {
        restaurantId: staff.restaurantId,
        type: type as never,
        subject,
        content,
        isActive: isActive ?? true,
      },
    })

    res.json({ success: true, data: template })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/marketing/email-templates/:type - Supprimer un template (revenir au défaut)
router.delete('/email-templates/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { type } = req.params

    await prisma.restaurantEmailTemplate.deleteMany({
      where: {
        restaurantId: staff.restaurantId,
        type: type as never,
      },
    })

    res.json({ success: true, message: 'Template supprimé, le template par défaut sera utilisé' })
  } catch (error) {
    next(error)
  }
})

// ============================================
// CUSTOMER TAG RULES
// ============================================

// GET /restaurant/marketing/tag-rules - Liste des règles de tags
router.get('/tag-rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const rules = await prisma.customerTagRule.findMany({
      where: { restaurantId: staff.restaurantId },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: rules })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/marketing/tag-rules/:id - Détails d'une règle
router.get('/tag-rules/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const rule = await prisma.customerTagRule.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!rule) {
      return next(new AppError('Règle non trouvée', 404, 'NOT_FOUND'))
    }

    res.json({ success: true, data: rule })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/marketing/tag-rules - Créer une règle
router.post('/tag-rules', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { name, tag, description, conditions, triggerOnOrder } = req.body

    const createRuleSchema = z.object({
      name: z.string().min(1, 'Nom requis'),
      tag: z.string().min(1, 'Tag requis'),
      description: z.string().optional(),
      conditions: z.object({
        operator: z.enum(['AND', 'OR']),
        conditions: z.array(z.object({
          field: z.string(),
          operator: z.string(),
          value: z.unknown(),
        })),
      }),
      triggerOnOrder: z.boolean().optional().default(true),
    })

    const validated = createRuleSchema.parse({ name, tag, description, conditions, triggerOnOrder })

    const rule = await prisma.customerTagRule.create({
      data: {
        restaurantId: staff.restaurantId,
        name: validated.name,
        tag: validated.tag,
        description: validated.description,
        conditions: validated.conditions as object,
        triggerOnOrder: validated.triggerOnOrder,
      },
    })

    res.status(201).json({ success: true, data: rule })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/marketing/tag-rules/:id - Modifier une règle
router.put('/tag-rules/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const { name, tag, description, conditions, triggerOnOrder, isActive } = req.body

    const existing = await prisma.customerTagRule.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Règle non trouvée', 404, 'NOT_FOUND'))
    }

    const rule = await prisma.customerTagRule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(tag && { tag }),
        ...(description !== undefined && { description }),
        ...(conditions && { conditions }),
        ...(triggerOnOrder !== undefined && { triggerOnOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    res.json({ success: true, data: rule })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/marketing/tag-rules/:id - Supprimer une règle
router.delete('/tag-rules/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existing = await prisma.customerTagRule.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Règle non trouvée', 404, 'NOT_FOUND'))
    }

    await prisma.customerTagRule.delete({ where: { id } })

    res.json({ success: true, message: 'Règle supprimée' })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/marketing/tag-rules/:id/evaluate - Évaluer une règle pour tous les clients
router.post('/tag-rules/:id/evaluate', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existing = await prisma.customerTagRule.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Règle non trouvée', 404, 'NOT_FOUND'))
    }

    // Import dynamique pour éviter les problèmes de dépendances circulaires
    const { evaluateRuleForAllCustomers } = await import('../../services/tag-rules.service')
    const result = await evaluateRuleForAllCustomers(id)

    res.json({
      success: true,
      message: `${result.matched} clients sur ${result.total} correspondent à cette règle`,
      data: result,
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/marketing/tag-rules/preview - Prévisualiser une règle
router.post('/tag-rules/preview', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { conditions } = req.body

    if (!conditions) {
      return next(new AppError('Conditions requises', 400, 'VALIDATION_ERROR'))
    }

    const { previewRuleMatches } = await import('../../services/tag-rules.service')
    const result = await previewRuleMatches(staff.restaurantId, conditions)

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/marketing/campaigns/preview-targeting - Prévisualiser le ciblage d'une campagne
router.post('/campaigns/preview-targeting', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { targetingRules } = req.body

    const { countTargetedCustomers, getTargetedCustomers } = await import('../../services/targeting.service')
    
    const count = await countTargetedCustomers(staff.restaurantId, targetingRules)
    const sample = await getTargetedCustomers(staff.restaurantId, targetingRules, { limit: 10 })

    res.json({
      success: true,
      data: {
        count,
        sample,
      },
    })
  } catch (error) {
    next(error)
  }
})

export const marketingRoutes = router
