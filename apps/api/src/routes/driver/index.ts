import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'

const router = Router()

// GET /driver/me - Obtenir le profil du livreur connecté
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const driver = await prisma.driver.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            logo: true,
          },
        },
      },
    })

    if (!driver) {
      return next(new AppError('Profil livreur non trouve', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: driver.id,
        user: driver.user,
        restaurant: driver.restaurant,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        licenseNumber: driver.licenseNumber,
        isActive: driver.isActive,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        totalDeliveries: driver.totalDeliveries,
        avgRating: driver.avgRating,
        currentDeliveryId: driver.currentDeliveryId,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /driver/status - Mettre à jour le statut en ligne/disponible
router.put('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const { isOnline, isAvailable } = req.body

    const driver = await prisma.driver.findFirst({
      where: { userId },
    })

    if (!driver) {
      return next(new AppError('Profil livreur non trouve', 404, 'NOT_FOUND'))
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        ...(isOnline !== undefined && { isOnline }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
    })

    res.json({
      success: true,
      data: {
        id: updatedDriver.id,
        isOnline: updatedDriver.isOnline,
        isAvailable: updatedDriver.isAvailable,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /driver/location - Mettre à jour la position GPS
router.put('/location', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const { latitude, longitude } = req.body

    if (latitude === undefined || longitude === undefined) {
      return next(new AppError('Latitude et longitude requises', 400, 'INVALID_INPUT'))
    }

    const driver = await prisma.driver.findFirst({
      where: { userId },
    })

    if (!driver) {
      return next(new AppError('Profil livreur non trouve', 404, 'NOT_FOUND'))
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    })

    res.json({
      success: true,
      data: {
        currentLatitude: updatedDriver.currentLatitude,
        currentLongitude: updatedDriver.currentLongitude,
        lastLocationUpdate: updatedDriver.lastLocationUpdate,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /driver/deliveries - Obtenir les livraisons du livreur
router.get('/deliveries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const driver = await prisma.driver.findFirst({
      where: { userId },
    })

    if (!driver) {
      return next(new AppError('Profil livreur non trouve', 404, 'NOT_FOUND'))
    }

    const { status } = req.query

    const whereClause: Record<string, unknown> = { driverId: driver.id }
    
    if (status === 'active') {
      whereClause.status = { in: ['ASSIGNED', 'DRIVER_EN_ROUTE', 'AT_RESTAURANT', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED'] }
    } else if (status === 'completed') {
      whereClause.status = { in: ['DELIVERED', 'FAILED', 'CANCELLED'] }
    }

    const deliveries = await prisma.delivery.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            subtotal: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    res.json({
      success: true,
      data: deliveries.map(d => ({
        id: d.id,
        status: d.status,
        order: d.order,
        address: d.address,
        latitude: d.latitude,
        longitude: d.longitude,
        estimatedTime: d.estimatedTime,
        pickedUpAt: d.pickedUpAt,
        deliveredAt: d.deliveredAt,
        customerRating: d.customerRating,
        customerFeedback: d.customerFeedback,
        createdAt: d.createdAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// GET /driver/deliveries/current - Obtenir la livraison en cours
router.get('/deliveries/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const driver = await prisma.driver.findFirst({
      where: { userId },
    })

    if (!driver) {
      return next(new AppError('Profil livreur non trouve', 404, 'NOT_FOUND'))
    }

    const currentDelivery = await prisma.delivery.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ['ASSIGNED', 'DRIVER_EN_ROUTE', 'AT_RESTAURANT', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED'] },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            subtotal: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            items: {
              select: {
                id: true,
                quantity: true,
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            restaurant: {
              select: {
                name: true,
                address: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    res.json({
      success: true,
      data: currentDelivery ? {
        id: currentDelivery.id,
        status: currentDelivery.status,
        order: currentDelivery.order,
        address: currentDelivery.address,
        latitude: currentDelivery.latitude,
        longitude: currentDelivery.longitude,
        estimatedTime: currentDelivery.estimatedTime,
      } : null,
    })
  } catch (error) {
    next(error)
  }
})

// PUT /driver/deliveries/:id/status - Mettre à jour le statut d'une livraison
router.put('/deliveries/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const { id } = req.params
    const { status } = req.body

    const driver = await prisma.driver.findFirst({
      where: { userId },
    })

    if (!driver) {
      return next(new AppError('Profil livreur non trouve', 404, 'NOT_FOUND'))
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id,
        driverId: driver.id,
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!delivery) {
      return next(new AppError('Livraison non trouvee', 404, 'NOT_FOUND'))
    }

    const validTransitions: Record<string, string[]> = {
      'ASSIGNED': ['DRIVER_EN_ROUTE'],
      'DRIVER_EN_ROUTE': ['AT_RESTAURANT'],
      'AT_RESTAURANT': ['PICKED_UP'],
      'PICKED_UP': ['EN_ROUTE'],
      'EN_ROUTE': ['ARRIVED'],
      'ARRIVED': ['DELIVERED', 'FAILED'],
    }

    if (!validTransitions[delivery.status]?.includes(status)) {
      return next(new AppError('Transition de statut invalide', 400, 'INVALID_TRANSITION'))
    }

    // Vérifier que la commande est prête avant de permettre PICKED_UP
    if (status === 'PICKED_UP') {
      const readyStatuses = ['READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']
      if (!readyStatuses.includes(delivery.order.status)) {
        return next(new AppError('La commande n\'est pas encore prete. Statut actuel: ' + delivery.order.status, 400, 'ORDER_NOT_READY'))
      }
    }

    const updateData: Record<string, unknown> = { status }

    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date()
      
      // Synchroniser: Commande passe en OUT_FOR_DELIVERY
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'OUT_FOR_DELIVERY' },
      })
    } else if (status === 'EN_ROUTE') {
      // Synchroniser: Confirmer que la commande est en livraison
      if (delivery.order.status !== 'OUT_FOR_DELIVERY') {
        await prisma.order.update({
          where: { id: delivery.orderId },
          data: { status: 'OUT_FOR_DELIVERY' },
        })
      }
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
      
      // Libérer le livreur
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          isAvailable: true,
          currentDeliveryId: null,
          totalDeliveries: { increment: 1 },
        },
      })

      // Synchroniser: Commande passe en DELIVERED
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      })
    } else if (status === 'FAILED') {
      // Libérer le livreur
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          isAvailable: true,
          currentDeliveryId: null,
        },
      })
      
      // Synchroniser: Commande passe en CANCELLED
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'CANCELLED' },
      })
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
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /driver/stats - Statistiques du livreur
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const driver = await prisma.driver.findFirst({
      where: { userId },
    })

    if (!driver) {
      return next(new AppError('Profil livreur non trouve', 404, 'NOT_FOUND'))
    }

    // Stats du jour
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayDeliveries = await prisma.delivery.count({
      where: {
        driverId: driver.id,
        status: 'DELIVERED',
        deliveredAt: { gte: today },
      },
    })

    // Stats de la semaine
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const weekDeliveries = await prisma.delivery.count({
      where: {
        driverId: driver.id,
        status: 'DELIVERED',
        deliveredAt: { gte: weekStart },
      },
    })

    res.json({
      success: true,
      data: {
        totalDeliveries: driver.totalDeliveries,
        avgRating: driver.avgRating,
        todayDeliveries,
        weekDeliveries,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
