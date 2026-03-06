import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { z } from 'zod'

const router = Router()

const updateRestaurantSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().nullable(),
  address: z.string().optional(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  businessName: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  businessType: z.enum(['RESTAURANT', 'FAST_FOOD', 'CAFE', 'BAKERY', 'PIZZERIA', 'FOOD_TRUCK', 'DARK_KITCHEN', 'CATERING', 'OTHER']).optional(),
  cuisineTypes: z.array(z.string()).optional(),
  logo: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
})

const updateSettingsSchema = z.object({
  currency: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  orderPrefix: z.string().optional(),
  autoAcceptOrders: z.boolean().optional(),
  avgPrepTime: z.number().int().positive().optional(),
  maxOrdersPerSlot: z.number().int().positive().optional().nullable(),
  acceptCash: z.boolean().optional(),
  acceptCard: z.boolean().optional(),
  acceptOnlinePayment: z.boolean().optional(),
  tipsEnabled: z.boolean().optional(),
  suggestedTips: z.array(z.number().int()).optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  metaKeywords: z.array(z.string()).optional(),
  termsUrl: z.string().url().optional().nullable(),
  privacyUrl: z.string().url().optional().nullable(),
  legalNotice: z.string().optional().nullable(),
})

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, resellerId, businessType, page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { site: { subdomain: { contains: search as string, mode: 'insensitive' } } },
      ]
    }

    if (businessType) {
      where.businessType = businessType as string
    }

    const siteWhere: Record<string, unknown> = {}
    if (status) {
      siteWhere.status = status as string
    }
    if (resellerId) {
      siteWhere.organizationId = resellerId as string
    }

    if (Object.keys(siteWhere).length > 0) {
      where.site = siteWhere
    }

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessType: true,
          cuisineTypes: true,
          logo: true,
          city: true,
          country: true,
          createdAt: true,
          site: {
            select: {
              id: true,
              subdomain: true,
              status: true,
              organization: {
                select: { id: true, name: true },
              },
              client: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: {
              orders: true,
              products: true,
              staff: true,
            },
          },
        },
      }),
      prisma.restaurant.count({ where }),
    ])

    const [totalCount, activeCount, suspendedCount, draftCount] = await Promise.all([
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { site: { status: 'ACTIVE' } } }),
      prisma.restaurant.count({ where: { site: { status: 'SUSPENDED' } } }),
      prisma.restaurant.count({ where: { site: { status: 'DRAFT' } } }),
    ])

    res.json({
      success: true,
      data: {
        restaurants: restaurants.map(r => ({
          ...r,
          status: r.site?.status || 'DRAFT',
          subdomain: r.site?.subdomain,
          resellerOrg: r.site?.organization,
          client: r.site?.client,
          ordersCount: r._count.orders,
          productsCount: r._count.products,
          staffCount: r._count.staff,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          total: totalCount,
          active: activeCount,
          suspended: suspendedCount,
          draft: draftCount,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: {
        site: {
          include: {
            organization: {
              select: { id: true, name: true, email: true, phone: true },
            },
            client: {
              select: { id: true, name: true, email: true, phone: true, contactFirstName: true, contactLastName: true },
            },
          },
        },
        settings: true,
        openingHours: {
          include: { slots: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        specialHours: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            staff: true,
            products: true,
            categories: true,
            orders: true,
            customers: true,
            reviews: true,
          },
        },
      },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalRevenue, ordersThisMonth, avgRating] = await Promise.all([
      prisma.order.aggregate({
        where: { restaurantId: restaurant.id, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { restaurantId: restaurant.id, createdAt: { gte: startOfMonth } },
      }),
      prisma.review.aggregate({
        where: { restaurantId: restaurant.id },
        _avg: { rating: true },
      }),
    ])

    res.json({
      success: true,
      data: {
        ...restaurant,
        stats: {
          totalRevenue: totalRevenue._sum.total || 0,
          ordersThisMonth,
          avgRating: avgRating._avg.rating || 0,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const validation = updateRestaurantSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Donnees invalides', 400, 'VALIDATION_ERROR'))
    }

    const updated = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: validation.data,
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: { settings: true },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const validation = updateSettingsSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Donnees invalides', 400, 'VALIDATION_ERROR'))
    }

    let settings
    if (restaurant.settings) {
      settings = await prisma.restaurantSettings.update({
        where: { restaurantId: req.params.id },
        data: validation.data,
      })
    } else {
      settings = await prisma.restaurantSettings.create({
        data: {
          restaurantId: req.params.id,
          ...validation.data,
        },
      })
    }

    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: { site: true },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    if (!restaurant.site) {
      return next(new AppError('Aucun site associe', 400, 'NO_SITE'))
    }

    await prisma.site.update({
      where: { id: restaurant.site.id },
      data: { status: 'ACTIVE' },
    })

    res.json({ success: true, message: 'Restaurant active' })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: { site: true },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    if (!restaurant.site) {
      return next(new AppError('Aucun site associe', 400, 'NO_SITE'))
    }

    await prisma.site.update({
      where: { id: restaurant.site.id },
      data: { status: 'SUSPENDED' },
    })

    res.json({ success: true, message: 'Restaurant suspendu' })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/staff', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const staff = await prisma.restaurantStaff.findMany({
      where: { restaurantId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: staff })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, dateFrom, dateTo, page = '1', limit = '20' } = req.query

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = { restaurantId: req.params.id }

    if (status) {
      where.status = status as string
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom as string)
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo as string)
    }

    const [orders, total, stats] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          displayNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          serviceType: true,
          guestName: true,
          guestEmail: true,
          customer: {
            select: { firstName: true, lastName: true },
          },
          createdAt: true,
        },
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: { restaurantId: req.params.id, paymentStatus: 'PAID' },
        _sum: { total: true },
        _count: true,
      }),
    ])

    const [pending, completed, cancelled] = await Promise.all([
      prisma.order.count({ where: { restaurantId: req.params.id, status: 'PENDING' } }),
      prisma.order.count({ where: { restaurantId: req.params.id, status: 'COMPLETED' } }),
      prisma.order.count({ where: { restaurantId: req.params.id, status: 'CANCELLED' } }),
    ])

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          total: stats._count,
          pending,
          completed,
          cancelled,
          revenue: stats._sum.total || 0,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { restaurantId: req.params.id },
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
          isActive: true,
          isVisible: true,
          stockQuantity: true,
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
        take: 50,
      }),
      prisma.category.findMany({
        where: { restaurantId: req.params.id },
        select: {
          id: true,
          name: true,
          _count: { select: { products: true } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    res.json({
      success: true,
      data: {
        products,
        categories: categories.map(c => ({
          ...c,
          productsCount: c._count.products,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const [customers, total, stats] = await Promise.all([
      prisma.restaurantCustomer.findMany({
        where: { restaurantId: req.params.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          totalOrders: true,
          totalSpent: true,
          lastOrderAt: true,
          createdAt: true,
        },
        orderBy: { totalSpent: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.restaurantCustomer.count({ where: { restaurantId: req.params.id } }),
      prisma.restaurantCustomer.aggregate({
        where: { restaurantId: req.params.id },
        _avg: { totalSpent: true },
      }),
    ])

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          total,
          avgSpent: stats._avg.totalSpent || 0,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const [reviews, total, avgRating] = await Promise.all([
      prisma.review.findMany({
        where: { restaurantId: req.params.id },
        include: {
          customer: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.review.count({ where: { restaurantId: req.params.id } }),
      prisma.review.aggregate({
        where: { restaurantId: req.params.id },
        _avg: { rating: true },
      }),
    ])

    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { restaurantId: req.params.id },
      _count: true,
    })

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    distribution.forEach(d => {
      ratingDistribution[d.rating] = d._count
    })

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          avgRating: avgRating._avg.rating || 0,
          total,
          distribution: ratingDistribution,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = '30d' } = req.query

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const now = new Date()
    let startDate: Date

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const [
      revenueData,
      ordersData,
      newCustomers,
      returningCustomers,
      topProducts,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: {
          restaurantId: req.params.id,
          paymentStatus: 'PAID',
          createdAt: { gte: startDate },
        },
        _sum: { total: true },
        _avg: { total: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: {
          restaurantId: req.params.id,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      prisma.restaurantCustomer.count({
        where: {
          restaurantId: req.params.id,
          createdAt: { gte: startDate },
        },
      }),
      prisma.restaurantCustomer.count({
        where: {
          restaurantId: req.params.id,
          totalOrders: { gt: 1 },
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            restaurantId: req.params.id,
            createdAt: { gte: startDate },
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.product.findMany({
        where: {
          restaurantId: req.params.id,
          trackInventory: true,
          stockQuantity: { lte: 10 },
        },
        select: { id: true, name: true, stockQuantity: true, lowStockAlert: true },
        take: 10,
      }),
    ])

    const topProductIds = topProducts.map(p => p.productId)
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, image: true },
    })

    const ordersByStatus: Record<string, number> = {}
    ordersData.forEach(o => {
      ordersByStatus[o.status] = o._count
    })

    res.json({
      success: true,
      data: {
        revenue: {
          total: revenueData._sum.total || 0,
          avgOrderValue: revenueData._avg.total || 0,
        },
        orders: {
          total: Object.values(ordersByStatus).reduce((a, b) => a + b, 0),
          byStatus: ordersByStatus,
        },
        customers: {
          new: newCustomers,
          returning: returningCustomers,
          total: newCustomers + returningCustomers,
        },
        products: {
          topSelling: topProducts.map(p => {
            const details = topProductDetails.find(d => d.id === p.productId)
            return {
              id: p.productId,
              name: details?.name || 'Inconnu',
              image: details?.image,
              quantity: p._sum.quantity || 0,
            }
          }),
          lowStock: lowStockProducts,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as platformRestaurantsRoutes }
