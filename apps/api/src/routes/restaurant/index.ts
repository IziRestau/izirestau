import { Router, Request, Response, NextFunction } from 'express'
import { prisma, ReceiptType } from '@iziresto/database'
import { authenticate } from '../../middlewares/auth.middleware'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'
import { restaurantSettingsRoutes } from './settings.routes'
import { restaurantCategoriesRoutes } from './categories.routes'
import { restaurantProductsRoutes } from './products.routes'
import { restaurantModifiersRoutes } from './modifiers.routes'
import { restaurantCustomersRoutes } from './customers.routes'
import { restaurantMediaRoutes } from './media.routes'
import { ingredientsRoutes } from './ingredients.routes'
import { suppliersRoutes } from './suppliers.routes'
import { stockMovementsRoutes } from './stock-movements.routes'
import { recipesRoutes } from './recipes.routes'
import { receiptsRoutes } from './receipts.routes'
import { siteRoutes } from './site.routes'
import { marketingRoutes } from './marketing.routes'
import deliveryZonesRoutes from './delivery-zones.routes'
import driversRoutes from './drivers.routes'
import deliveriesRoutes from './deliveries.routes'
import { receiptService } from '../../services/receipt.service'
import { sendLoyaltyPointsEarnedEmail, sendReceiptEmail } from '../../services/email.service'

const router = Router()

// Helper pour récupérer le staff avec support multi-restaurant
async function getStaffForRequest(userId: string, queryRestaurantId?: string) {
  return prisma.restaurantStaff.findFirst({
    where: queryRestaurantId 
      ? { userId, restaurantId: queryRestaurantId, isActive: true }
      : { userId, isActive: true },
    select: { restaurantId: true, userId: true, role: true },
  })
}

// Toutes les routes restaurant necessitent une authentification
router.use(authenticate)

// Routes settings
router.use('/settings', restaurantSettingsRoutes)

// Routes categories
router.use('/categories', restaurantCategoriesRoutes)

// Routes products
router.use('/products', restaurantProductsRoutes)

// Routes modifiers
router.use('/modifiers', restaurantModifiersRoutes)

// Routes customers
router.use('/customers', restaurantCustomersRoutes)

// Routes media
router.use('/media', restaurantMediaRoutes)

// Routes inventory
router.use('/ingredients', ingredientsRoutes)
router.use('/suppliers', suppliersRoutes)
router.use('/stock-movements', stockMovementsRoutes)
router.use('/recipes', recipesRoutes)

// Routes receipts (facturation)
router.use('/receipts', receiptsRoutes)

// Routes site management (Mon Site)
router.use('/site', siteRoutes)

// Routes marketing
router.use('/marketing', marketingRoutes)

// Routes delivery zones
router.use('/delivery-zones', deliveryZonesRoutes)

// Routes drivers
router.use('/drivers', driversRoutes)

// Routes deliveries
router.use('/deliveries', deliveriesRoutes)

// GET /restaurant/my-restaurants - Liste des restaurants de l'utilisateur (pour OWNER multi-restaurant et livreurs)
router.get('/my-restaurants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    // Récupérer tous les restaurants où l'utilisateur est staff
    const staffEntries = await prisma.restaurantStaff.findMany({
      where: { userId, isActive: true },
      include: {
        restaurant: {
          include: {
            site: {
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    logo: true,
                    primaryColor: true,
                    currency: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Récupérer aussi les restaurants où l'utilisateur est livreur
    const driverEntries = await prisma.driver.findMany({
      where: { userId, isActive: true },
      include: {
        restaurant: {
          include: {
            site: {
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    logo: true,
                    primaryColor: true,
                    currency: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const restaurantsFromStaff = staffEntries
      .filter(s => s.restaurant)
      .map(s => ({
        id: s.restaurant.id,
        name: s.restaurant.name,
        logo: s.restaurant.logo,
        address: s.restaurant.address,
        city: s.restaurant.city,
        role: s.role,
        organization: s.restaurant.site?.organization ? {
          id: s.restaurant.site.organization.id,
          name: s.restaurant.site.organization.name,
          primaryColor: s.restaurant.site.organization.primaryColor,
        } : null,
      }))

    const restaurantsFromDriver = driverEntries
      .filter(d => d.restaurant)
      .map(d => ({
        id: d.restaurant.id,
        name: d.restaurant.name,
        logo: d.restaurant.logo,
        address: d.restaurant.address,
        city: d.restaurant.city,
        role: 'DRIVER',
        organization: d.restaurant.site?.organization ? {
          id: d.restaurant.site.organization.id,
          name: d.restaurant.site.organization.name,
          primaryColor: d.restaurant.site.organization.primaryColor,
        } : null,
      }))

    // Fusionner et dédupliquer (un utilisateur pourrait être staff ET driver)
    const allRestaurants = [...restaurantsFromStaff]
    for (const driverRestaurant of restaurantsFromDriver) {
      if (!allRestaurants.find(r => r.id === driverRestaurant.id)) {
        allRestaurants.push(driverRestaurant)
      }
    }

    res.json({
      success: true,
      data: allRestaurants,
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/me - Récupérer le restaurant de l'utilisateur connecté
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { restaurantId } = req.query

    // D'abord chercher si l'utilisateur est un staff
    let staff
    if (restaurantId) {
      staff = await prisma.restaurantStaff.findFirst({
        where: { 
          restaurantId: restaurantId as string,
          userId,
          isActive: true,
        },
        include: {
          restaurant: {
            include: {
              site: {
                include: {
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      logo: true,
                      primaryColor: true,
                      currency: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
              settings: true,
            },
          },
        },
      })
    } else {
      staff = await prisma.restaurantStaff.findFirst({
        where: { userId, isActive: true },
        include: {
          restaurant: {
            include: {
              site: {
                include: {
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      logo: true,
                      primaryColor: true,
                      currency: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
              settings: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })
    }

    // Si pas de staff, chercher si l'utilisateur est un livreur
    if (!staff) {
      let driver
      if (restaurantId) {
        driver = await prisma.driver.findFirst({
          where: {
            restaurantId: restaurantId as string,
            userId,
            isActive: true,
          },
          include: {
            restaurant: {
              include: {
                site: {
                  include: {
                    organization: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        logo: true,
                        primaryColor: true,
                        currency: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
                settings: true,
              },
            },
          },
        })
      } else {
        driver = await prisma.driver.findFirst({
          where: { userId, isActive: true },
          include: {
            restaurant: {
              include: {
                site: {
                  include: {
                    organization: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        logo: true,
                        primaryColor: true,
                        currency: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
                settings: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        })
      }

      if (driver && driver.restaurant) {
        const { restaurant } = driver
        const site = restaurant.site
        const organization = site?.organization

        return res.json({
          success: true,
          data: {
            restaurant: {
              id: restaurant.id,
              name: restaurant.name,
              description: restaurant.description,
              email: restaurant.email,
              phone: restaurant.phone,
              address: restaurant.address,
              city: restaurant.city,
              postalCode: restaurant.postalCode,
              country: restaurant.country,
              logo: restaurant.logo,
              coverImage: restaurant.coverImage,
              businessType: restaurant.businessType,
              cuisineTypes: restaurant.cuisineTypes,
            },
            organization: organization ? {
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              logo: organization.logo,
              primaryColor: organization.primaryColor,
              currency: organization.currency,
            } : null,
            site: site ? {
              id: site.id,
              subdomain: site.subdomain,
              customDomain: site.customDomain,
              status: site.status,
            } : null,
            staff: {
              id: driver.id,
              role: 'DRIVER',
              permissions: ['view_deliveries', 'update_delivery_status'],
              position: 'Livreur',
            },
            settings: restaurant.settings,
          },
        })
      }

      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { restaurant } = staff
    const site = restaurant.site
    const organization = site?.organization

    res.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          description: restaurant.description,
          email: restaurant.email,
          phone: restaurant.phone,
          address: restaurant.address,
          city: restaurant.city,
          postalCode: restaurant.postalCode,
          country: restaurant.country,
          logo: restaurant.logo,
          coverImage: restaurant.coverImage,
          businessType: restaurant.businessType,
          cuisineTypes: restaurant.cuisineTypes,
        },
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
          primaryColor: organization.primaryColor,
          currency: organization.currency,
        } : null,
        site: site ? {
          id: site.id,
          subdomain: site.subdomain,
          customDomain: site.customDomain,
          status: site.status,
        } : null,
        staff: {
          id: staff.id,
          role: staff.role,
          permissions: staff.permissions,
          position: staff.position,
        },
        settings: restaurant.settings,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/dashboard/stats - Statistiques du dashboard
router.get('/dashboard/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { restaurantId: queryRestaurantId } = req.query

    // Trouver le staff pour ce restaurant (ou le premier si non spécifié)
    const staff = await prisma.restaurantStaff.findFirst({
      where: queryRestaurantId 
        ? { userId, restaurantId: queryRestaurantId as string, isActive: true }
        : { userId, isActive: true },
      select: { restaurantId: true },
    })

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const restaurantId = staff.restaurantId

    // Dates pour les stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Stats commandes et revenus
    const [
      ordersToday,
      ordersWeek,
      ordersMonth,
      ordersPending,
      ordersPreparing,
      revenueToday,
      revenueWeek,
      revenueMonth,
      customersTotal,
      customersNew,
      productsTotal,
      productsActive,
    ] = await Promise.all([
      // Commandes aujourd'hui
      prisma.order.count({
        where: { restaurantId, createdAt: { gte: todayStart } },
      }),
      // Commandes semaine
      prisma.order.count({
        where: { restaurantId, createdAt: { gte: weekStart } },
      }),
      // Commandes mois
      prisma.order.count({
        where: { restaurantId, createdAt: { gte: monthStart } },
      }),
      // Commandes en attente
      prisma.order.count({
        where: { restaurantId, status: 'PENDING' },
      }),
      // Commandes en preparation
      prisma.order.count({
        where: { restaurantId, status: 'PREPARING' },
      }),
      // Revenu aujourd'hui
      prisma.order.aggregate({
        where: { 
          restaurantId, 
          createdAt: { gte: todayStart },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
      }),
      // Revenu semaine
      prisma.order.aggregate({
        where: { 
          restaurantId, 
          createdAt: { gte: weekStart },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
      }),
      // Revenu mois
      prisma.order.aggregate({
        where: { 
          restaurantId, 
          createdAt: { gte: monthStart },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
      }),
      // Clients total
      prisma.restaurantCustomer.count({
        where: { restaurantId },
      }),
      // Nouveaux clients ce mois
      prisma.restaurantCustomer.count({
        where: { restaurantId, createdAt: { gte: monthStart } },
      }),
      // Produits total
      prisma.product.count({
        where: { restaurantId },
      }),
      // Produits actifs
      prisma.product.count({
        where: { restaurantId, isActive: true },
      }),
    ])

    res.json({
      success: true,
      data: {
        orders: {
          today: ordersToday,
          week: ordersWeek,
          month: ordersMonth,
          pending: ordersPending,
          preparing: ordersPreparing,
        },
        revenue: {
          today: Number(revenueToday._sum.total) || 0,
          week: Number(revenueWeek._sum.total) || 0,
          month: Number(revenueMonth._sum.total) || 0,
        },
        customers: {
          total: customersTotal,
          new: customersNew,
        },
        products: {
          total: productsTotal,
          active: productsActive,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/revenue/chart - Données pour le graphe des revenus
router.get('/revenue/chart', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { restaurantId: queryRestaurantId } = req.query
    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const restaurantId = staff.restaurantId

    // Revenus des 12 derniers mois
    const now = new Date()
    const months: { month: string; value: number }[] = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const revenue = await prisma.order.aggregate({
        where: {
          restaurantId,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
      })

      const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
      months.push({
        month: monthNames[date.getMonth()],
        value: Number(revenue._sum.total) || 0,
      })
    }

    res.json({ success: true, data: months })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/products/trending - Produits les plus vendus
router.get('/products/trending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { restaurantId: queryRestaurantId } = req.query
    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    // Produits les plus commandes (top 5)
    const trendingProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          restaurantId: staff.restaurantId,
          status: { not: 'CANCELLED' },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    })

    const productIds = trendingProducts.map(p => p.productId)
    
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        price: true,
      },
    })

    const result = trendingProducts.map(tp => {
      const product = products.find(p => p.id === tp.productId)
      return {
        id: tp.productId,
        name: product?.name || 'Produit inconnu',
        description: product?.description || '',
        image: product?.image,
        price: product ? Number(product.price) : 0,
        totalSold: tp._sum.quantity || 0,
      }
    })

    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/orders - Liste paginée des commandes avec filtres et stats
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { 
      restaurantId: queryRestaurantId,
      status, 
      serviceType, 
      dateFrom, 
      dateTo, 
      search,
      page = '1', 
      limit = '20' 
    } = req.query

    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = { restaurantId: staff.restaurantId }

    if (status && status !== 'all') {
      where.status = status as string
    }
    if (serviceType && serviceType !== 'all') {
      where.serviceType = serviceType as string
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom as string)
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo as string)
    }
    if (search) {
      const searchStr = (search as string).toLowerCase()
      where.OR = [
        { orderNumber: { contains: searchStr, mode: 'insensitive' } },
        { displayNumber: { contains: searchStr, mode: 'insensitive' } },
        { guestName: { contains: searchStr, mode: 'insensitive' } },
        { guestPhone: { contains: searchStr, mode: 'insensitive' } },
        { customer: { firstName: { contains: searchStr, mode: 'insensitive' } } },
        { customer: { lastName: { contains: searchStr, mode: 'insensitive' } } },
      ]
    }

    const [orders, total] = await Promise.all([
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
          paymentMethod: true,
          total: true,
          serviceType: true,
          source: true,
          createdAt: true,
          scheduledFor: true,
          isScheduled: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          guestName: true,
          guestPhone: true,
          guestEmail: true,
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [statsTotal, statsPending, statsConfirmed, statsPreparing, statsReady, statsCompleted, statsCancelled, revenueToday] = await Promise.all([
      prisma.order.count({ where: { restaurantId: staff.restaurantId } }),
      prisma.order.count({ where: { restaurantId: staff.restaurantId, status: 'PENDING' } }),
      prisma.order.count({ where: { restaurantId: staff.restaurantId, status: 'CONFIRMED' } }),
      prisma.order.count({ where: { restaurantId: staff.restaurantId, status: 'PREPARING' } }),
      prisma.order.count({ where: { restaurantId: staff.restaurantId, status: 'READY' } }),
      prisma.order.count({ where: { restaurantId: staff.restaurantId, status: 'COMPLETED' } }),
      prisma.order.count({ where: { restaurantId: staff.restaurantId, status: 'CANCELLED' } }),
      prisma.order.aggregate({
        where: { 
          restaurantId: staff.restaurantId, 
          paymentStatus: 'PAID',
          createdAt: { gte: today },
        },
        _sum: { total: true },
      }),
    ])

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          displayNumber: order.displayNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          total: Number(order.total),
          serviceType: order.serviceType,
          source: order.source,
          createdAt: order.createdAt,
          scheduledFor: order.scheduledFor,
          isScheduled: order.isScheduled,
          customer: order.customer ? {
            id: order.customer.id,
            firstName: order.customer.firstName,
            lastName: order.customer.lastName,
            phone: order.customer.phone,
            email: order.customer.email,
          } : null,
          guestName: order.guestName,
          guestPhone: order.guestPhone,
          guestEmail: order.guestEmail,
          itemsCount: order._count.items,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          total: statsTotal,
          pending: statsPending,
          confirmed: statsConfirmed,
          preparing: statsPreparing,
          ready: statsReady,
          completed: statsCompleted,
          cancelled: statsCancelled,
          revenueToday: Number(revenueToday._sum.total || 0),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/orders/recent - Dernières commandes
router.get('/orders/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { restaurantId: queryRestaurantId } = req.query
    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const orders = await prisma.order.findMany({
      where: { restaurantId: staff.restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        displayNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        serviceType: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        guestName: true,
        guestPhone: true,
        _count: {
          select: { items: true },
        },
      },
    })

    res.json({
      success: true,
      data: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        displayNumber: order.displayNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        serviceType: order.serviceType,
        createdAt: order.createdAt,
        customer: order.customer ? {
          id: order.customer.id,
          name: `${order.customer.firstName} ${order.customer.lastName}`,
          phone: order.customer.phone,
        } : order.guestName ? {
          name: order.guestName,
          phone: order.guestPhone,
        } : null,
        itemsCount: order._count.items,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/orders/open - Liste des commandes ouvertes (non payées, sur place)
// IMPORTANT: Cette route doit être AVANT /orders/:id pour éviter que "open" soit interprété comme un ID
router.get('/orders/open', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { restaurantId: queryRestaurantId } = req.query
    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId: staff.restaurantId,
        paymentStatus: 'PENDING',
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        displayNumber: order.displayNumber,
        tableNumber: order.tableNumber,
        serviceType: order.serviceType,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        discount: Number(order.discount),
        total: Number(order.total),
        customer: order.customer ? {
          id: order.customer.id,
          name: `${order.customer.firstName} ${order.customer.lastName}`,
          phone: order.customer.phone,
          email: order.customer.email,
        } : null,
        guestName: order.guestName,
        itemsCount: order.items.length,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          modifiers: item.modifiers.map(mod => ({
            id: mod.id,
            name: mod.name,
            price: Number(mod.price),
          })),
        })),
        createdAt: order.createdAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/orders/:id - Détail d'une commande
router.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { restaurantId: queryRestaurantId } = req.query
    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: req.params.id,
        restaurantId: staff.restaurantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            totalOrders: true,
            totalSpent: true,
          },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, image: true },
            },
            variant: {
              select: { id: true, name: true },
            },
            modifiers: {
              include: {
                modifier: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
        coupon: {
          select: { id: true, code: true, discountType: true, discountValue: true },
        },
        delivery: {
          include: {
            driver: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvee', 404, 'ORDER_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        displayNumber: order.displayNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        serviceType: order.serviceType,
        source: order.source,
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        deliveryFee: Number(order.deliveryFee),
        tip: Number(order.tip),
        discount: Number(order.discount),
        total: Number(order.total),
        customer: order.customer ? {
          id: order.customer.id,
          firstName: order.customer.firstName,
          lastName: order.customer.lastName,
          email: order.customer.email,
          phone: order.customer.phone,
          totalOrders: order.customer.totalOrders,
          totalSpent: Number(order.customer.totalSpent),
        } : null,
        guestName: order.guestName,
        guestEmail: order.guestEmail,
        guestPhone: order.guestPhone,
        deliveryAddress: order.deliveryAddress,
        deliveryNotes: order.deliveryNotes,
        pickupTime: order.pickupTime,
        scheduledFor: order.scheduledFor,
        isScheduled: order.isScheduled,
        estimatedPrepTime: order.estimatedPrepTime,
        prepStartedAt: order.prepStartedAt,
        prepCompletedAt: order.prepCompletedAt,
        customerNotes: order.customerNotes,
        internalNotes: order.internalNotes,
        cancelledAt: order.cancelledAt,
        cancelReason: order.cancelReason,
        cancelledBy: order.cancelledBy,
        refundedAmount: order.refundedAmount ? Number(order.refundedAmount) : null,
        refundedAt: order.refundedAt,
        refundReason: order.refundReason,
        paidAt: order.paidAt,
        coupon: order.coupon,
        couponCode: order.couponCode,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.product?.image,
          variantId: item.variantId,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          modifiersTotal: Number(item.modifiersTotal),
          specialInstructions: item.specialInstructions,
          modifiers: item.modifiers.map(mod => ({
            id: mod.id,
            name: mod.name,
            price: Number(mod.price),
            quantity: mod.quantity,
          })),
        })),
        timeline: order.timeline.map(t => ({
          id: t.id,
          status: t.status,
          message: t.message,
          userId: t.userId,
          createdAt: t.createdAt,
        })),
        delivery: order.delivery ? {
          id: order.delivery.id,
          status: order.delivery.status,
          address: order.delivery.address,
          assignedAt: order.delivery.assignedAt,
          pickedUpAt: order.delivery.pickedUpAt,
          deliveredAt: order.delivery.deliveredAt,
          driver: order.delivery.driver ? {
            id: order.delivery.driver.id,
            user: {
              id: order.delivery.driver.user.id,
              firstName: order.delivery.driver.user.firstName,
              lastName: order.delivery.driver.user.lastName,
              phone: order.delivery.driver.user.phone,
              avatar: order.delivery.driver.user.avatar,
            },
            vehicleType: order.delivery.driver.vehicleType,
          } : null,
        } : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/orders/:id/status - Changer le statut d'une commande
router.post('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { status, message, restaurantId: queryRestaurantId } = req.body
    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    if (!status) {
      return next(new AppError('Statut requis', 400, 'STATUS_REQUIRED'))
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PICKED_UP', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return next(new AppError('Statut invalide', 400, 'INVALID_STATUS'))
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: req.params.id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvee', 404, 'ORDER_NOT_FOUND'))
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return next(new AppError('Impossible de modifier une commande annulee ou remboursee', 400, 'ORDER_CLOSED'))
    }

    const updateData: Record<string, unknown> = { status }

    if (status === 'PREPARING' && !order.prepStartedAt) {
      updateData.prepStartedAt = new Date()
    }
    if (status === 'READY' && !order.prepCompletedAt) {
      updateData.prepCompletedAt = new Date()
    }

    const [updatedOrder] = await Promise.all([
      prisma.order.update({
        where: { id: req.params.id },
        data: updateData,
      }),
      prisma.orderTimeline.create({
        data: {
          orderId: req.params.id,
          status,
          message: message || null,
          userId: staff.userId,
        },
      }),
    ])

    // Accumulation des points de fidélité quand la commande est terminée
    const completedStatuses = ['COMPLETED', 'DELIVERED', 'PICKED_UP']
    const wasNotCompleted = !completedStatuses.includes(order.status)
    const isNowCompleted = completedStatuses.includes(status)
    
    if (wasNotCompleted && isNowCompleted && order.customerId) {
      try {
        // Récupérer les settings du restaurant pour le taux de points
        const settings = await prisma.restaurantSettings.findUnique({
          where: { restaurantId: staff.restaurantId },
        })
        
        // Vérifier si la fidélité est activée
        const loyaltyEnabled = settings?.loyaltyEnabled ?? true
        if (loyaltyEnabled) {
          // Points par unité dépensée (défaut: 1 point par unité)
          const pointsPerUnit = settings?.loyaltyPointsPerUnit ?? 1
          const orderTotal = Number(order.total)
          const pointsEarned = Math.floor(orderTotal * pointsPerUnit)
        
          if (pointsEarned > 0) {
            const customer = await prisma.restaurantCustomer.findUnique({
              where: { id: order.customerId },
            })
          
            if (customer) {
              const newBalance = customer.loyaltyPoints + pointsEarned
            
              await prisma.$transaction([
                prisma.restaurantCustomer.update({
                  where: { id: order.customerId },
                  data: { loyaltyPoints: newBalance },
                }),
                prisma.loyaltyTransaction.create({
                  data: {
                    customerId: order.customerId,
                    restaurantId: staff.restaurantId,
                    type: 'EARN',
                    points: pointsEarned,
                    balanceAfter: newBalance,
                    orderId: order.id,
                    description: `Points gagnés pour la commande #${order.displayNumber}`,
                  },
                }),
              ])

              // Envoyer l'email de points gagnés
              if (customer.email) {
                const restaurant = await prisma.restaurant.findUnique({
                  where: { id: staff.restaurantId },
                  select: { name: true, logo: true },
                })
                const formatCurrency = (amount: number) => 
                  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: settings?.currency || 'XOF' }).format(amount)
                
                sendLoyaltyPointsEarnedEmail({
                  to: customer.email,
                  customerName: customer.firstName,
                  restaurantName: restaurant?.name || 'Restaurant',
                  restaurantLogo: restaurant?.logo || undefined,
                  pointsEarned,
                  totalPoints: newBalance,
                  orderNumber: order.displayNumber,
                  orderTotal: formatCurrency(orderTotal),
                }).catch(err => console.error('Erreur envoi email fidélité:', err))
              }
            }
          }
        }
      } catch (loyaltyError) {
        // Log l'erreur mais ne pas bloquer la mise à jour du statut
        console.error('Erreur lors de l\'attribution des points de fidélité:', loyaltyError)
      }
    }

    res.json({
      success: true,
      data: {
        id: updatedOrder.id,
        status: updatedOrder.status,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/orders/:id/cancel - Annuler une commande (OWNER ou MANAGER uniquement)
router.post('/orders/:id/cancel', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    if (!staff) {
      return next(new AppError('Non autorise', 403, 'FORBIDDEN'))
    }

    const { reason } = req.body

    if (!reason || reason.trim() === '') {
      return next(new AppError('Raison d\'annulation requise', 400, 'REASON_REQUIRED'))
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: req.params.id,
        restaurantId: staff.restaurantId,
      },
      include: {
        items: true,
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvee', 404, 'ORDER_NOT_FOUND'))
    }

    if (order.status === 'CANCELLED') {
      return next(new AppError('Commande deja annulee', 400, 'ALREADY_CANCELLED'))
    }

    if (order.status === 'COMPLETED' || order.status === 'DELIVERED' || order.status === 'PICKED_UP') {
      return next(new AppError('Impossible d\'annuler une commande terminee', 400, 'ORDER_COMPLETED'))
    }

    // Remettre le stock des ingrédients lors de l'annulation
    try {
      const productIds = order.items.map((item: any) => item.productId)
      const productsWithRecipes = await prisma.product.findMany({
        where: { 
          id: { in: productIds },
          recipeId: { not: null },
        },
        include: {
          recipe: {
            include: {
              ingredients: true,
            },
          },
        },
      })

      for (const item of order.items) {
        const product = productsWithRecipes.find((p: any) => p.id === item.productId)
        if (product?.recipe?.ingredients) {
          for (const recipeIngredient of product.recipe.ingredients) {
            const quantityToRestore = Number(recipeIngredient.quantity) * item.quantity

            await prisma.ingredient.update({
              where: { id: recipeIngredient.ingredientId },
              data: {
                currentStock: { increment: quantityToRestore },
              },
            })

            await prisma.stockMovement.create({
              data: {
                restaurantId: staff.restaurantId,
                ingredientId: recipeIngredient.ingredientId,
                type: 'RETURN',
                quantity: quantityToRestore,
                reason: `Annulation commande #${order.orderNumber} - ${product.name}`,
                reference: order.id,
                performedBy: staff.userId,
              },
            })
          }
        }
      }
    } catch (stockError) {
      console.error('Erreur lors de la remise en stock:', stockError)
    }

    const [updatedOrder] = await Promise.all([
      prisma.order.update({
        where: { id: req.params.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason,
          cancelledBy: staff.userId,
        },
      }),
      prisma.orderTimeline.create({
        data: {
          orderId: req.params.id,
          status: 'CANCELLED',
          message: reason,
          userId: staff.userId,
        },
      }),
    ])

    res.json({
      success: true,
      data: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        cancelledAt: updatedOrder.cancelledAt,
        cancelReason: updatedOrder.cancelReason,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/orders - Créer une commande (POS)
router.post('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const {
      restaurantId: queryRestaurantId,
      serviceType,
      source = 'POS',
      customerId,
      tableNumber,
      deliveryAddress,
      customerNotes,
      paymentMethod,
      items,
      discount,
    } = req.body

    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Articles requis', 400, 'ITEMS_REQUIRED'))
    }

    if (!serviceType) {
      return next(new AppError('Type de service requis', 400, 'SERVICE_TYPE_REQUIRED'))
    }

    // Generer le numero de commande
    const today = new Date()
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '')
    
    const lastOrder = await prisma.order.findFirst({
      where: {
        restaurantId: staff.restaurantId,
        orderNumber: { startsWith: datePrefix },
      },
      orderBy: { orderNumber: 'desc' },
    })

    let orderSequence = 1
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4), 10)
      orderSequence = lastSequence + 1
    }

    const orderNumber = `${datePrefix}${orderSequence.toString().padStart(4, '0')}`
    const displayNumber = orderSequence.toString()

    // Recuperer les produits pour calculer les prix
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, restaurantId: staff.restaurantId },
      include: {
        variants: true,
        modifierGroups: {
          include: { 
            modifierGroup: {
              include: { modifiers: true },
            },
          },
        },
      },
    })

    type ProductWithRelations = typeof products[number]
    const productMap = new Map<string, ProductWithRelations>(products.map(p => [p.id, p]))

    // Calculer les totaux
    let subtotal = 0
    const orderItems: any[] = []

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return next(new AppError(`Produit ${item.productId} non trouve`, 400, 'PRODUCT_NOT_FOUND'))
      }

      let unitPrice = Number(product.price)
      let variantName: string | null = null

      if (item.variantId) {
        const variant = product.variants.find((v: { id: string }) => v.id === item.variantId)
        if (variant) {
          unitPrice = Number(variant.price)
          variantName = variant.name
        }
      }

      let modifiersTotal = 0
      const itemModifiers: any[] = []

      if (item.modifiers && Array.isArray(item.modifiers)) {
        for (const mod of item.modifiers) {
          for (const pmg of product.modifierGroups) {
            const modifier = pmg.modifierGroup.modifiers.find((m: { id: string }) => m.id === mod.modifierId)
            if (modifier) {
              modifiersTotal += Number(modifier.price)
              itemModifiers.push({
                modifierId: modifier.id,
                name: modifier.name,
                price: modifier.price,
                quantity: 1,
              })
            }
          }
        }
      }

      const totalPrice = (unitPrice + modifiersTotal) * item.quantity
      subtotal += totalPrice

      orderItems.push({
        productId: product.id,
        productName: product.name,
        variantId: item.variantId || null,
        variantName,
        quantity: item.quantity,
        unitPrice,
        modifiersTotal,
        totalPrice,
        specialInstructions: item.notes || null,
        modifiers: {
          create: itemModifiers,
        },
      })
    }

    // Calculer la remise
    let discountAmount = 0
    if (discount) {
      if (discount.type === 'percentage') {
        discountAmount = (subtotal * discount.value) / 100
      } else {
        discountAmount = Math.min(discount.value, subtotal)
      }
    }

    // Calculer la TVA (10% par defaut)
    const taxRate = 10
    const taxAmount = ((subtotal - discountAmount) * taxRate) / 100
    const total = subtotal - discountAmount + taxAmount

    // Creer la commande
    const order = await prisma.order.create({
      data: {
        restaurantId: staff.restaurantId,
        orderNumber,
        displayNumber,
        customerId: customerId || null,
        serviceType,
        tableNumber: serviceType === 'DINE_IN' ? (tableNumber || null) : null,
        source,
        status: 'CONFIRMED',
        paymentStatus: paymentMethod ? 'PAID' : 'PENDING',
        paymentMethod: paymentMethod || null,
        paidAt: paymentMethod ? new Date() : null,
        subtotal,
        taxAmount,
        discount: discountAmount,
        total,
        customerNotes: customerNotes || null,
        deliveryAddress: deliveryAddress ? JSON.parse(JSON.stringify(deliveryAddress)) : null,
        items: {
          create: orderItems,
        },
        timeline: {
          create: {
            status: 'CONFIRMED',
            message: `Commande creee depuis ${source}${tableNumber ? ` - Table ${tableNumber}` : ''}`,
            userId: staff.userId,
          },
        },
      },
      include: {
        items: true,
      },
    })

    // Mettre a jour les stats du client si connecte
    if (customerId) {
      await prisma.restaurantCustomer.update({
        where: { id: customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
          lastOrderAt: new Date(),
        },
      })
    }

    // Déduire le stock des ingrédients basé sur les recettes des produits
    try {
      // Récupérer les produits avec leurs recettes et ingrédients
      const productsWithRecipes = await prisma.product.findMany({
        where: { 
          id: { in: productIds },
          recipeId: { not: null },
        },
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
        },
      })

      // Pour chaque produit commandé qui a une recette
      for (const item of items) {
        const product = productsWithRecipes.find(p => p.id === item.productId)
        if (product?.recipe?.ingredients) {
          // Pour chaque ingrédient de la recette
          for (const recipeIngredient of product.recipe.ingredients) {
            const quantityToDeduct = Number(recipeIngredient.quantity) * item.quantity

            // Mettre à jour le stock de l'ingrédient
            await prisma.ingredient.update({
              where: { id: recipeIngredient.ingredientId },
              data: {
                currentStock: { decrement: quantityToDeduct },
              },
            })

            // Créer un mouvement de stock
            await prisma.stockMovement.create({
              data: {
                restaurantId: staff.restaurantId,
                ingredientId: recipeIngredient.ingredientId,
                type: 'SALE',
                quantity: -quantityToDeduct,
                reason: `Commande #${orderNumber} - ${product.name}`,
                reference: order.id,
                performedBy: staff.userId,
              },
            })
          }
        }
      }
    } catch (stockError) {
      // Log l'erreur mais ne pas bloquer la commande
      console.error('Erreur lors de la déduction du stock:', stockError)
    }

    // Générer automatiquement un reçu si la commande est payée directement
    let receipt = null
    if (paymentMethod) {
      try {
        const receiptTypeValue = total >= 150 ? ReceiptType.INVOICE_SIMPLE : ReceiptType.TICKET
        receipt = await receiptService.createReceipt({
          orderId: order.id,
          restaurantId: staff.restaurantId,
          type: receiptTypeValue,
          cashierId: staff.userId,
        })

        // Envoyer le reçu par email si le client a un email
        if (receipt && customerId) {
          const customer = await prisma.restaurantCustomer.findUnique({
            where: { id: customerId },
            select: { email: true, firstName: true, lastName: true },
          })

          if (customer?.email) {
            const restaurant = await prisma.restaurant.findUnique({
              where: { id: staff.restaurantId },
              select: { name: true, logo: true, settings: { select: { currency: true } } },
            })

            const currency = restaurant?.settings?.currency || 'XOF'
            const formatCurrency = (amount: number) => 
              new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)

            const receiptItems = order.items.map((item) => ({
              name: item.productName + (item.variantName ? ` - ${item.variantName}` : ''),
              quantity: item.quantity,
              total: Number(item.totalPrice),
            }))

            sendReceiptEmail({
              to: customer.email,
              customerName: `${customer.firstName} ${customer.lastName || ''}`.trim(),
              restaurantName: restaurant?.name || 'Restaurant',
              restaurantLogo: restaurant?.logo || undefined,
              primaryColor: '#10b981',
              receiptNumber: receipt.receiptNumber,
              orderNumber: order.orderNumber,
              date: new Date().toLocaleDateString('fr-FR'),
              items: receiptItems,
              subtotal,
              taxAmount,
              total,
              receiptType: receiptTypeValue as 'TICKET' | 'INVOICE_SIMPLE',
            }).catch(err => console.error('Erreur envoi email reçu:', err))
          }
        }
      } catch (receiptError) {
        console.error('Erreur lors de la génération du reçu:', receiptError)
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        displayNumber: order.displayNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        receipt: receipt ? {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          type: receipt.type,
        } : null,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/orders/:id - Modifier les notes internes d'une commande
router.put('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { internalNotes, restaurantId: queryRestaurantId } = req.body
    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: req.params.id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvee', 404, 'ORDER_NOT_FOUND'))
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { internalNotes },
    })

    res.json({
      success: true,
      data: {
        id: updatedOrder.id,
        internalNotes: updatedOrder.internalNotes,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/orders/:id/payment-status - Mettre a jour le statut de paiement (pas KITCHEN)
router.post('/orders/:id/payment-status', requireRole('OWNER', 'MANAGER', 'STAFF', 'CASHIER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    if (!staff) {
      return next(new AppError('Non autorise', 403, 'FORBIDDEN'))
    }

    const { paymentStatus } = req.body

    const validStatuses = ['PENDING', 'AUTHORIZED', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED', 'CANCELLED']
    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return next(new AppError('Statut de paiement invalide', 400, 'INVALID_PAYMENT_STATUS'))
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: req.params.id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvee', 404, 'ORDER_NOT_FOUND'))
    }

    if (order.paymentStatus === paymentStatus) {
      return next(new AppError('Le statut de paiement est deja ' + paymentStatus, 400, 'SAME_STATUS'))
    }

    const updateData: Record<string, unknown> = {
      paymentStatus,
    }

    if (paymentStatus === 'PAID' && !order.paidAt) {
      updateData.paidAt = new Date()
    }

    const [updatedOrder] = await Promise.all([
      prisma.order.update({
        where: { id: req.params.id },
        data: updateData,
      }),
      prisma.orderTimeline.create({
        data: {
          orderId: req.params.id,
          status: order.status,
          message: `Statut de paiement changé: ${order.paymentStatus} -> ${paymentStatus}`,
          userId: staff.userId,
        },
      }),
    ])

    // Générer automatiquement un reçu quand la commande est payée
    let receipt = null
    if (paymentStatus === 'PAID') {
      try {
        // Vérifier si un reçu existe déjà
        const existingReceipt = await prisma.receipt.findUnique({
          where: { orderId: order.id },
        })
        
        if (!existingReceipt) {
          // Déterminer le type de reçu selon le montant
          const total = Number(order.total)
          const receiptTypeVal = total >= 150 ? ReceiptType.INVOICE_SIMPLE : ReceiptType.TICKET
          
          receipt = await receiptService.createReceipt({
            orderId: order.id,
            restaurantId: staff.restaurantId,
            type: receiptTypeVal,
            cashierId: staff.userId,
          })
        } else {
          receipt = existingReceipt
        }
      } catch (receiptError) {
        console.error('Erreur lors de la génération du reçu:', receiptError)
      }
    }

    res.json({
      success: true,
      data: {
        id: updatedOrder.id,
        paymentStatus: updatedOrder.paymentStatus,
        paidAt: updatedOrder.paidAt,
        receipt: receipt ? {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          type: receipt.type,
        } : null,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/orders/:id/items - Ajouter des articles à une commande ouverte
router.post('/orders/:id/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { restaurantId: queryRestaurantId, items } = req.body
    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Articles requis', 400, 'ITEMS_REQUIRED'))
    }

    // Vérifier que la commande existe et est ouverte
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvée', 404, 'ORDER_NOT_FOUND'))
    }

    if (order.paymentStatus !== 'PENDING') {
      return next(new AppError('Impossible d\'ajouter des articles à une commande payée', 400, 'ORDER_ALREADY_PAID'))
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return next(new AppError('Impossible d\'ajouter des articles à une commande annulée', 400, 'ORDER_CANCELLED'))
    }

    // Récupérer les produits pour calculer les prix
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, restaurantId: staff.restaurantId },
      include: {
        variants: true,
        modifierGroups: {
          include: {
            modifierGroup: {
              include: { modifiers: true },
            },
          },
        },
      },
    })

    type ProductWithRelations = typeof products[number]
    const productMap = new Map<string, ProductWithRelations>(products.map(p => [p.id, p]))

    // Calculer les totaux des nouveaux articles
    let addedSubtotal = 0
    const newOrderItems: any[] = []

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return next(new AppError(`Produit ${item.productId} non trouvé`, 400, 'PRODUCT_NOT_FOUND'))
      }

      let unitPrice = Number(product.price)
      let variantName: string | null = null

      if (item.variantId) {
        const variant = product.variants.find((v: { id: string }) => v.id === item.variantId)
        if (variant) {
          unitPrice = Number(variant.price)
          variantName = variant.name
        }
      }

      let modifiersTotal = 0
      const itemModifiers: any[] = []

      if (item.modifiers && Array.isArray(item.modifiers)) {
        for (const mod of item.modifiers) {
          for (const pmg of product.modifierGroups) {
            const modifier = pmg.modifierGroup.modifiers.find((m: { id: string }) => m.id === mod.modifierId)
            if (modifier) {
              modifiersTotal += Number(modifier.price)
              itemModifiers.push({
                modifierId: modifier.id,
                name: modifier.name,
                price: modifier.price,
                quantity: 1,
              })
            }
          }
        }
      }

      const totalPrice = (unitPrice + modifiersTotal) * item.quantity
      addedSubtotal += totalPrice

      newOrderItems.push({
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        variantId: item.variantId || null,
        variantName,
        quantity: item.quantity,
        unitPrice,
        modifiersTotal,
        totalPrice,
        specialInstructions: item.notes || null,
        modifiers: {
          create: itemModifiers,
        },
      })
    }

    // Recalculer les totaux
    const newSubtotal = Number(order.subtotal) + addedSubtotal
    const taxRate = 10
    const newTaxAmount = ((newSubtotal - Number(order.discount)) * taxRate) / 100
    const newTotal = newSubtotal - Number(order.discount) + newTaxAmount

    // Créer les nouveaux articles et mettre à jour la commande
    await Promise.all([
      ...newOrderItems.map(item => prisma.orderItem.create({ data: item })),
      prisma.order.update({
        where: { id: order.id },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          total: newTotal,
        },
      }),
      prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status: order.status,
          message: `${items.length} article(s) ajouté(s) à la commande`,
          userId: staff.userId,
        },
      }),
    ])

    // Déduire le stock des ingrédients
    try {
      const productsWithRecipes = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          recipeId: { not: null },
        },
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
        },
      })

      for (const item of items) {
        const product = productsWithRecipes.find(p => p.id === item.productId)
        if (product?.recipe?.ingredients) {
          for (const recipeIngredient of product.recipe.ingredients) {
            const quantityToDeduct = Number(recipeIngredient.quantity) * item.quantity

            await prisma.ingredient.update({
              where: { id: recipeIngredient.ingredientId },
              data: {
                currentStock: { decrement: quantityToDeduct },
              },
            })

            await prisma.stockMovement.create({
              data: {
                restaurantId: staff.restaurantId,
                ingredientId: recipeIngredient.ingredientId,
                type: 'SALE',
                quantity: -quantityToDeduct,
                reason: `Ajout commande #${order.orderNumber} - ${product.name}`,
                reference: order.id,
                performedBy: staff.userId,
              },
            })
          }
        }
      }
    } catch (stockError) {
      console.error('Erreur lors de la déduction du stock:', stockError)
    }

    // Récupérer la commande mise à jour
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: { modifiers: true },
        },
      },
    })

    res.json({
      success: true,
      data: {
        id: updatedOrder!.id,
        orderNumber: updatedOrder!.orderNumber,
        subtotal: Number(updatedOrder!.subtotal),
        taxAmount: Number(updatedOrder!.taxAmount),
        discount: Number(updatedOrder!.discount),
        total: Number(updatedOrder!.total),
        itemsCount: updatedOrder!.items.length,
        addedItems: newOrderItems.length,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/orders/:id/close - Clôturer une commande ouverte avec paiement
router.post('/orders/:id/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const { restaurantId: queryRestaurantId, paymentMethod, amountReceived } = req.body
    const staff = await getStaffForRequest(userId, queryRestaurantId as string | undefined)

    if (!staff) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    if (!paymentMethod) {
      return next(new AppError('Méthode de paiement requise', 400, 'PAYMENT_METHOD_REQUIRED'))
    }

    // Vérifier que la commande existe et est ouverte
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvée', 404, 'ORDER_NOT_FOUND'))
    }

    if (order.paymentStatus !== 'PENDING') {
      return next(new AppError('Cette commande est déjà payée', 400, 'ORDER_ALREADY_PAID'))
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return next(new AppError('Impossible de clôturer une commande annulée', 400, 'ORDER_CANCELLED'))
    }

    // Mettre à jour la commande
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        paymentMethod,
        paidAt: new Date(),
        status: order.status === 'CONFIRMED' ? 'COMPLETED' : order.status,
      },
    })

    // Ajouter à la timeline
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: updatedOrder.status,
        message: `Commande clôturée - Paiement ${paymentMethod === 'CASH' ? 'en espèces' : 'par carte'}`,
        userId: staff.userId,
      },
    })

    // Générer le reçu
    let receipt = null
    try {
      const total = Number(order.total)
      const receiptTypeVal = total >= 150 ? ReceiptType.INVOICE_SIMPLE : ReceiptType.TICKET

      receipt = await receiptService.createReceipt({
        orderId: order.id,
        restaurantId: staff.restaurantId,
        type: receiptTypeVal,
        cashierId: staff.userId,
      })
    } catch (receiptError) {
      console.error('Erreur lors de la génération du reçu:', receiptError)
    }

    // Calculer le rendu si paiement en espèces
    const change = paymentMethod === 'CASH' && amountReceived
      ? amountReceived - Number(order.total)
      : undefined

    res.json({
      success: true,
      data: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        displayNumber: updatedOrder.displayNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        paymentMethod: updatedOrder.paymentMethod,
        total: Number(updatedOrder.total),
        change: change && change > 0 ? change : undefined,
        receipt: receipt ? {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          type: receipt.type,
        } : null,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/orders/:id/create-delivery - Créer une livraison pour une commande
router.post('/orders/:id/create-delivery', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const orderId = req.params.id

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: staff.restaurantId,
        serviceType: 'DELIVERY',
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvée ou pas une livraison', 404, 'NOT_FOUND'))
    }

    // Vérifier si une livraison existe déjà
    const existingDelivery = await prisma.delivery.findUnique({
      where: { orderId },
    })

    if (existingDelivery) {
      // Retourner la livraison existante au lieu d'une erreur
      return res.json({
        success: true,
        data: {
          id: existingDelivery.id,
          orderId: existingDelivery.orderId,
          status: existingDelivery.status,
          address: existingDelivery.address,
          createdAt: existingDelivery.createdAt,
        },
      })
    }

    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        address: order.deliveryAddress || {},
        customerNotes: order.deliveryNotes,
        trackingHistory: [{
          status: 'PENDING',
          timestamp: new Date().toISOString(),
        }],
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: delivery.id,
        orderId: delivery.orderId,
        status: delivery.status,
        address: delivery.address,
        createdAt: delivery.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as restaurantRoutes }
