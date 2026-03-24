import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

router.use(loadStaff)

// GET /restaurant/deliveries - Liste des livraisons
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { status, driverId, date, limit = '50', offset = '0' } = req.query

    const where: any = {
      order: {
        restaurantId: staff.restaurantId,
      },
    }

    if (status) {
      where.status = status
    }

    if (driverId) {
      where.driverId = driverId
    }

    if (date) {
      const startDate = new Date(date as string)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date as string)
      endDate.setHours(23, 59, 59, 999)
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
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
              createdAt: true,
            },
          },
          driver: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                  avatar: true,
                },
              },
              vehicleType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.delivery.count({ where }),
    ])

    res.json({
      success: true,
      data: deliveries.map(d => ({
        id: d.id,
        orderId: d.orderId,
        order: {
          id: d.order.id,
          orderNumber: d.order.orderNumber,
          total: Number(d.order.total),
          customerName: d.order.customer 
            ? `${d.order.customer.firstName} ${d.order.customer.lastName}`
            : d.order.guestName,
          customerPhone: d.order.customer?.phone || d.order.guestPhone,
          createdAt: d.order.createdAt,
        },
        driver: d.driver ? {
          id: d.driver.id,
          name: `${d.driver.user.firstName} ${d.driver.user.lastName}`,
          phone: d.driver.user.phone,
          avatar: d.driver.user.avatar,
          vehicleType: d.driver.vehicleType,
        } : null,
        status: d.status,
        address: d.address,
        latitude: d.latitude,
        longitude: d.longitude,
        distanceKm: d.distanceKm,
        estimatedTime: d.estimatedTime,
        assignedAt: d.assignedAt,
        pickedUpAt: d.pickedUpAt,
        deliveredAt: d.deliveredAt,
        customerNotes: d.customerNotes,
        customerRating: d.customerRating,
        customerFeedback: d.customerFeedback,
        createdAt: d.createdAt,
      })),
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/deliveries/stats - Statistiques des livraisons
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalToday,
      pendingCount,
      inProgressCount,
      completedToday,
      avgDeliveryTime,
    ] = await Promise.all([
      prisma.delivery.count({
        where: {
          order: { restaurantId: staff.restaurantId },
          createdAt: { gte: today },
        },
      }),
      prisma.delivery.count({
        where: {
          order: { restaurantId: staff.restaurantId },
          status: 'PENDING',
        },
      }),
      prisma.delivery.count({
        where: {
          order: { restaurantId: staff.restaurantId },
          status: { in: ['ASSIGNED', 'DRIVER_EN_ROUTE', 'AT_RESTAURANT', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED'] },
        },
      }),
      prisma.delivery.count({
        where: {
          order: { restaurantId: staff.restaurantId },
          status: 'DELIVERED',
          deliveredAt: { gte: today },
        },
      }),
      prisma.delivery.aggregate({
        where: {
          order: { restaurantId: staff.restaurantId },
          status: 'DELIVERED',
          deliveredAt: { not: null },
          assignedAt: { not: null },
        },
        _avg: {
          estimatedTime: true,
        },
      }),
    ])

    res.json({
      success: true,
      data: {
        totalToday,
        pendingCount,
        inProgressCount,
        completedToday,
        avgDeliveryTime: avgDeliveryTime._avg.estimatedTime || 0,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/deliveries/:id - Details d'une livraison
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const delivery = await prisma.delivery.findFirst({
      where: {
        id,
        order: { restaurantId: staff.restaurantId },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
              },
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            guestName: true,
            guestEmail: true,
            guestPhone: true,
            deliveryNotes: true,
            createdAt: true,
          },
        },
        driver: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                avatar: true,
              },
            },
            vehicleType: true,
            currentLatitude: true,
            currentLongitude: true,
            lastLocationUpdate: true,
          },
        },
      },
    })

    if (!delivery) {
      return next(new AppError('Livraison non trouvee', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: delivery.id,
        orderId: delivery.orderId,
        order: {
          id: delivery.order.id,
          orderNumber: delivery.order.orderNumber,
          total: Number(delivery.order.total),
          items: delivery.order.items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          })),
          customer: delivery.order.customer || {
            firstName: delivery.order.guestName?.split(' ')[0] || '',
            lastName: delivery.order.guestName?.split(' ').slice(1).join(' ') || '',
            email: delivery.order.guestEmail,
            phone: delivery.order.guestPhone,
          },
          deliveryNotes: delivery.order.deliveryNotes,
          createdAt: delivery.order.createdAt,
        },
        driver: delivery.driver ? {
          id: delivery.driver.id,
          name: `${delivery.driver.user.firstName} ${delivery.driver.user.lastName}`,
          phone: delivery.driver.user.phone,
          avatar: delivery.driver.user.avatar,
          vehicleType: delivery.driver.vehicleType,
          currentLatitude: delivery.driver.currentLatitude,
          currentLongitude: delivery.driver.currentLongitude,
          lastLocationUpdate: delivery.driver.lastLocationUpdate,
        } : null,
        status: delivery.status,
        address: delivery.address,
        latitude: delivery.latitude,
        longitude: delivery.longitude,
        distanceKm: delivery.distanceKm,
        estimatedTime: delivery.estimatedTime,
        assignedAt: delivery.assignedAt,
        pickedUpAt: delivery.pickedUpAt,
        deliveredAt: delivery.deliveredAt,
        trackingHistory: delivery.trackingHistory,
        customerNotes: delivery.customerNotes,
        deliveryProof: delivery.deliveryProof,
        signature: delivery.signature,
        customerRating: delivery.customerRating,
        customerFeedback: delivery.customerFeedback,
        createdAt: delivery.createdAt,
        updatedAt: delivery.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/deliveries/:id/assign - Assigner un livreur
router.post('/:id/assign', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const { driverId } = req.body

    if (!driverId) {
      return next(new AppError('ID du livreur requis', 400, 'INVALID_INPUT'))
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id,
        order: { restaurantId: staff.restaurantId },
      },
    })

    if (!delivery) {
      return next(new AppError('Livraison non trouvee', 404, 'NOT_FOUND'))
    }

    // Verifier que la livraison peut etre reassignee (pas encore recuperee)
    const reassignableStatuses = ['PENDING', 'ASSIGNED', 'DRIVER_EN_ROUTE', 'AT_RESTAURANT']
    if (!reassignableStatuses.includes(delivery.status)) {
      return next(new AppError('Impossible de changer le livreur apres recuperation', 400, 'CANNOT_REASSIGN'))
    }

    // Verifier que le livreur existe et est disponible
    const driver = await prisma.driver.findFirst({
      where: {
        id: driverId,
        restaurantId: staff.restaurantId,
        isActive: true,
      },
    })

    if (!driver) {
      return next(new AppError('Livreur non trouve ou inactif', 404, 'DRIVER_NOT_FOUND'))
    }

    // Liberer l'ancien livreur si different
    if (delivery.driverId && delivery.driverId !== driverId) {
      await prisma.driver.update({
        where: { id: delivery.driverId },
        data: {
          isAvailable: true,
          currentDeliveryId: null,
        },
      })
    }

    // Mettre a jour la livraison
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: {
        driverId,
        status: 'ASSIGNED',
        assignedAt: new Date(),
        trackingHistory: {
          push: {
            status: 'REASSIGNED',
            timestamp: new Date().toISOString(),
            driverId,
            previousDriverId: delivery.driverId,
          },
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    // Mettre a jour le nouveau livreur
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        isAvailable: false,
        currentDeliveryId: id,
      },
    })

    res.json({
      success: true,
      data: {
        id: updatedDelivery.id,
        status: updatedDelivery.status,
        assignedAt: updatedDelivery.assignedAt,
        driver: updatedDelivery.driver ? {
          id: updatedDelivery.driver.id,
          name: `${updatedDelivery.driver.user.firstName} ${updatedDelivery.driver.user.lastName}`,
          phone: updatedDelivery.driver.user.phone,
        } : null,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/deliveries/:id/status - Changer le statut d'une livraison
router.put('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    const staff = req.restaurantStaff
    const { id } = req.params
    const { status, deliveryProof, signature, latitude, longitude } = req.body

    const validStatuses = ['PENDING', 'ASSIGNED', 'DRIVER_EN_ROUTE', 'AT_RESTAURANT', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'FAILED', 'CANCELLED']
    if (!status || !validStatuses.includes(status)) {
      return next(new AppError('Statut invalide', 400, 'INVALID_STATUS'))
    }

    // Verifier l'acces
    let delivery
    if (staff) {
      delivery = await prisma.delivery.findFirst({
        where: {
          id,
          order: { restaurantId: staff.restaurantId },
        },
      })
    } else {
      // Verifier si c'est le livreur assigne
      const driver = await prisma.driver.findFirst({
        where: { userId },
      })
      if (driver) {
        delivery = await prisma.delivery.findFirst({
          where: {
            id,
            driverId: driver.id,
          },
        })
      }
    }

    if (!delivery) {
      return next(new AppError('Livraison non trouvee ou acces refuse', 404, 'NOT_FOUND'))
    }

    const updateData: any = {
      status,
      trackingHistory: {
        push: {
          status,
          timestamp: new Date().toISOString(),
          latitude,
          longitude,
        },
      },
    }

    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date()
    }

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
      if (deliveryProof) updateData.deliveryProof = deliveryProof
      if (signature) updateData.signature = signature

      // Liberer le livreur
      if (delivery.driverId) {
        await prisma.driver.update({
          where: { id: delivery.driverId },
          data: {
            isAvailable: true,
            currentDeliveryId: null,
            totalDeliveries: { increment: 1 },
          },
        })
      }

      // Mettre a jour le statut de la commande
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      })
    }

    if (status === 'FAILED' || status === 'CANCELLED') {
      // Liberer le livreur
      if (delivery.driverId) {
        await prisma.driver.update({
          where: { id: delivery.driverId },
          data: {
            isAvailable: true,
            currentDeliveryId: null,
          },
        })
      }
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
    })

    res.json({
      success: true,
      data: {
        id: updatedDelivery.id,
        status: updatedDelivery.status,
        pickedUpAt: updatedDelivery.pickedUpAt,
        deliveredAt: updatedDelivery.deliveredAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/orders/:orderId/create-delivery - Creer une livraison pour une commande
router.post('/orders/:orderId/create-delivery', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { orderId } = req.params

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: staff.restaurantId,
        serviceType: 'DELIVERY',
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvee ou pas une livraison', 404, 'NOT_FOUND'))
    }

    // Verifier si une livraison existe deja
    const existingDelivery = await prisma.delivery.findUnique({
      where: { orderId },
    })

    if (existingDelivery) {
      return next(new AppError('Une livraison existe deja pour cette commande', 400, 'DELIVERY_EXISTS'))
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

export default router
