import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

router.use(loadStaff)

// GET /restaurant/delivery-zones - Liste des zones de livraison
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const zones = await prisma.deliveryZone.findMany({
      where: { restaurantId: staff.restaurantId },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    })

    res.json({
      success: true,
      data: zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        polygon: zone.polygon,
        addresses: zone.addresses,
        deliveryFee: Number(zone.deliveryFee),
        minOrderAmount: zone.minOrderAmount ? Number(zone.minOrderAmount) : null,
        estimatedTime: zone.estimatedTime,
        isActive: zone.isActive,
        priority: zone.priority,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/delivery-zones - Creer une zone de livraison
router.post('/', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { name, polygon, addresses, deliveryFee, minOrderAmount, estimatedTime, priority } = req.body

    if (!name || !polygon) {
      return next(new AppError('Nom et polygon requis', 400, 'INVALID_INPUT'))
    }

    if (!Array.isArray(polygon) || polygon.length < 3) {
      return next(new AppError('Le polygon doit contenir au moins 3 points', 400, 'INVALID_POLYGON'))
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        restaurantId: staff.restaurantId,
        name,
        polygon,
        addresses: addresses || null,
        deliveryFee: deliveryFee || 0,
        minOrderAmount: minOrderAmount || null,
        estimatedTime: estimatedTime || null,
        priority: priority || 0,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: zone.id,
        name: zone.name,
        polygon: zone.polygon,
        addresses: zone.addresses,
        deliveryFee: Number(zone.deliveryFee),
        minOrderAmount: zone.minOrderAmount ? Number(zone.minOrderAmount) : null,
        estimatedTime: zone.estimatedTime,
        isActive: zone.isActive,
        priority: zone.priority,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/delivery-zones/:id - Details d'une zone
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const zone = await prisma.deliveryZone.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!zone) {
      return next(new AppError('Zone non trouvee', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: zone.id,
        name: zone.name,
        polygon: zone.polygon,
        addresses: zone.addresses,
        deliveryFee: Number(zone.deliveryFee),
        minOrderAmount: zone.minOrderAmount ? Number(zone.minOrderAmount) : null,
        estimatedTime: zone.estimatedTime,
        isActive: zone.isActive,
        priority: zone.priority,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/delivery-zones/:id - Modifier une zone
router.put('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const { name, polygon, addresses, deliveryFee, minOrderAmount, estimatedTime, priority, isActive } = req.body

    const existingZone = await prisma.deliveryZone.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!existingZone) {
      return next(new AppError('Zone non trouvee', 404, 'NOT_FOUND'))
    }

    if (polygon && (!Array.isArray(polygon) || polygon.length < 3)) {
      return next(new AppError('Le polygon doit contenir au moins 3 points', 400, 'INVALID_POLYGON'))
    }

    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(polygon !== undefined && { polygon }),
        ...(addresses !== undefined && { addresses }),
        ...(deliveryFee !== undefined && { deliveryFee }),
        ...(minOrderAmount !== undefined && { minOrderAmount }),
        ...(estimatedTime !== undefined && { estimatedTime }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    res.json({
      success: true,
      data: {
        id: zone.id,
        name: zone.name,
        polygon: zone.polygon,
        addresses: zone.addresses,
        deliveryFee: Number(zone.deliveryFee),
        minOrderAmount: zone.minOrderAmount ? Number(zone.minOrderAmount) : null,
        estimatedTime: zone.estimatedTime,
        isActive: zone.isActive,
        priority: zone.priority,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/delivery-zones/:id - Supprimer une zone
router.delete('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existingZone = await prisma.deliveryZone.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!existingZone) {
      return next(new AppError('Zone non trouvee', 404, 'NOT_FOUND'))
    }

    await prisma.deliveryZone.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Zone supprimee',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/delivery-zones/:id/toggle - Activer/desactiver une zone
router.put('/:id/toggle', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existingZone = await prisma.deliveryZone.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!existingZone) {
      return next(new AppError('Zone non trouvee', 404, 'NOT_FOUND'))
    }

    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: {
        isActive: !existingZone.isActive,
      },
    })

    res.json({
      success: true,
      data: {
        id: zone.id,
        isActive: zone.isActive,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/delivery-zones/check - Verifier si une adresse est dans une zone
router.post('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { latitude, longitude } = req.body

    if (latitude === undefined || longitude === undefined) {
      return next(new AppError('Latitude et longitude requises', 400, 'INVALID_INPUT'))
    }

    const zones = await prisma.deliveryZone.findMany({
      where: {
        restaurantId: staff.restaurantId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    })

    // Fonction pour verifier si un point est dans un polygon (ray casting algorithm)
    const isPointInPolygon = (point: { lat: number; lng: number }, polygon: Array<{ lat: number; lng: number }>) => {
      let inside = false
      const x = point.lng
      const y = point.lat

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng
        const yi = polygon[i].lat
        const xj = polygon[j].lng
        const yj = polygon[j].lat

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
          inside = !inside
        }
      }

      return inside
    }

    // Trouver la premiere zone qui contient le point (par priorite)
    for (const zone of zones) {
      const polygon = zone.polygon as Array<{ lat: number; lng: number }>
      if (isPointInPolygon({ lat: latitude, lng: longitude }, polygon)) {
        return res.json({
          success: true,
          data: {
            inZone: true,
            zone: {
              id: zone.id,
              name: zone.name,
              deliveryFee: Number(zone.deliveryFee),
              minOrderAmount: zone.minOrderAmount ? Number(zone.minOrderAmount) : null,
              estimatedTime: zone.estimatedTime,
            },
          },
        })
      }
    }

    res.json({
      success: true,
      data: {
        inZone: false,
        zone: null,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
