import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'
import { sendStaffInvitationEmail } from '../../services/email.service'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const router = Router()

router.use(loadStaff)

// GET /restaurant/drivers - Liste des livreurs
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const drivers = await prisma.driver.findMany({
      where: { restaurantId: staff.restaurantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            inviteToken: true,
            inviteExpires: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: drivers.map(driver => ({
        id: driver.id,
        userId: driver.userId,
        user: {
          id: driver.user.id,
          email: driver.user.email,
          firstName: driver.user.firstName,
          lastName: driver.user.lastName,
          phone: driver.user.phone,
          avatar: driver.user.avatar,
        },
        invitePending: !!driver.user.inviteToken,
        inviteExpired: driver.user.inviteExpires ? new Date(driver.user.inviteExpires) < new Date() : false,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        isActive: driver.isActive,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        currentLatitude: driver.currentLatitude,
        currentLongitude: driver.currentLongitude,
        lastLocationUpdate: driver.lastLocationUpdate,
        totalDeliveries: driver.totalDeliveries,
        avgRating: driver.avgRating,
        currentDeliveryId: driver.currentDeliveryId,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/drivers/available - Liste des livreurs disponibles
router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const drivers = await prisma.driver.findMany({
      where: {
        restaurantId: staff.restaurantId,
        isActive: true,
        isOnline: true,
        isAvailable: true,
      },
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
      orderBy: { avgRating: 'desc' },
    })

    res.json({
      success: true,
      data: drivers.map(driver => ({
        id: driver.id,
        user: driver.user,
        vehicleType: driver.vehicleType,
        currentLatitude: driver.currentLatitude,
        currentLongitude: driver.currentLongitude,
        totalDeliveries: driver.totalDeliveries,
        avgRating: driver.avgRating,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/drivers - Creer/inviter un livreur
router.post('/', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { email, firstName, lastName, phone, licenseNumber, vehicleType, vehiclePlate } = req.body

    if (!email || !firstName || !lastName) {
      return next(new AppError('Email, prenom et nom requis', 400, 'INVALID_INPUT'))
    }

    // Verifier si l'email existe deja
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (user) {
      // Verifier si l'utilisateur est deja livreur pour ce restaurant
      const existingDriver = await prisma.driver.findFirst({
        where: {
          userId: user.id,
          restaurantId: staff.restaurantId,
        },
      })

      if (existingDriver) {
        return next(new AppError('Ce livreur existe deja', 400, 'DRIVER_EXISTS'))
      }
    } else {
      // Creer un nouvel utilisateur avec invitation
      const inviteToken = crypto.randomBytes(32).toString('hex')
      const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours

      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          phone: phone || null,
          passwordHash: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
          userType: 'DRIVER',
          inviteToken,
          inviteExpires,
        },
      })

      // Envoyer l'email d'invitation
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: staff.restaurantId },
        select: { name: true },
      })

      // Récupérer le nom de l'invitant
      const inviter = await prisma.user.findUnique({
        where: { id: req.user?.userId },
        select: { firstName: true, lastName: true },
      })
      const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Le manager'

      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/setup-password?token=${inviteToken}`

      try {
        await sendStaffInvitationEmail({
          to: email,
          firstName,
          restaurantName: restaurant?.name || 'Restaurant',
          role: 'Livreur',
          inviterName,
          inviteLink,
        })
      } catch (emailError) {
        console.error('Erreur envoi email invitation livreur:', emailError)
      }
    }

    // Creer le profil livreur
    const driver = await prisma.driver.create({
      data: {
        restaurantId: staff.restaurantId,
        userId: user.id,
        licenseNumber: licenseNumber || null,
        vehicleType: vehicleType || 'SCOOTER',
        vehiclePlate: vehiclePlate || null,
      },
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
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: driver.id,
        userId: driver.userId,
        user: driver.user,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        isActive: driver.isActive,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        totalDeliveries: driver.totalDeliveries,
        avgRating: driver.avgRating,
        createdAt: driver.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/drivers/:id - Details d'un livreur
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const driver = await prisma.driver.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
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
        deliveries: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                total: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })

    if (!driver) {
      return next(new AppError('Livreur non trouve', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: driver.id,
        userId: driver.userId,
        user: driver.user,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        isActive: driver.isActive,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        currentLatitude: driver.currentLatitude,
        currentLongitude: driver.currentLongitude,
        lastLocationUpdate: driver.lastLocationUpdate,
        totalDeliveries: driver.totalDeliveries,
        avgRating: driver.avgRating,
        currentDeliveryId: driver.currentDeliveryId,
        recentDeliveries: driver.deliveries.map(d => ({
          id: d.id,
          status: d.status,
          order: d.order,
          deliveredAt: d.deliveredAt,
          customerRating: d.customerRating,
        })),
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/drivers/:id - Modifier un livreur
router.put('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const { licenseNumber, vehicleType, vehiclePlate, isActive } = req.body

    const existingDriver = await prisma.driver.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!existingDriver) {
      return next(new AppError('Livreur non trouve', 404, 'NOT_FOUND'))
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(vehiclePlate !== undefined && { vehiclePlate }),
        ...(isActive !== undefined && { isActive }),
      },
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
      },
    })

    res.json({
      success: true,
      data: {
        id: driver.id,
        userId: driver.userId,
        user: driver.user,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        isActive: driver.isActive,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        totalDeliveries: driver.totalDeliveries,
        avgRating: driver.avgRating,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/drivers/:id - Supprimer un livreur
router.delete('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existingDriver = await prisma.driver.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!existingDriver) {
      return next(new AppError('Livreur non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier s'il a des livraisons en cours
    const activeDelivery = await prisma.delivery.findFirst({
      where: {
        driverId: id,
        status: {
          notIn: ['DELIVERED', 'FAILED', 'CANCELLED'],
        },
      },
    })

    if (activeDelivery) {
      return next(new AppError('Ce livreur a une livraison en cours', 400, 'ACTIVE_DELIVERY'))
    }

    await prisma.driver.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Livreur supprime',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/drivers/:id/status - Activer/desactiver un livreur
router.put('/:id/status', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existingDriver = await prisma.driver.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!existingDriver) {
      return next(new AppError('Livreur non trouve', 404, 'NOT_FOUND'))
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        isActive: !existingDriver.isActive,
      },
    })

    res.json({
      success: true,
      data: {
        id: driver.id,
        isActive: driver.isActive,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/drivers/:id/resend-invite - Renvoyer l'invitation
router.post('/:id/resend-invite', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const driver = await prisma.driver.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
      include: {
        user: true,
        restaurant: {
          select: { name: true },
        },
      },
    })

    if (!driver) {
      return next(new AppError('Livreur non trouve', 404, 'NOT_FOUND'))
    }

    // Générer un nouveau token d'invitation
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours

    await prisma.user.update({
      where: { id: driver.userId },
      data: {
        inviteToken,
        inviteExpires,
      },
    })

    // Récupérer le nom de l'invitant
    const inviter = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { firstName: true, lastName: true },
    })
    const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Le manager'

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/setup-password?token=${inviteToken}`

    try {
      await sendStaffInvitationEmail({
        to: driver.user.email,
        firstName: driver.user.firstName,
        restaurantName: driver.restaurant.name,
        role: 'Livreur',
        inviterName,
        inviteLink,
      })
    } catch (emailError) {
      console.error('Erreur envoi email invitation livreur:', emailError)
      return next(new AppError('Erreur lors de l\'envoi de l\'email', 500, 'EMAIL_ERROR'))
    }

    res.json({
      success: true,
      message: 'Invitation renvoyee',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/drivers/:id/location - Mettre a jour la position (pour le livreur)
router.put('/:id/location', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const { latitude, longitude } = req.body

    if (latitude === undefined || longitude === undefined) {
      return next(new AppError('Latitude et longitude requises', 400, 'INVALID_INPUT'))
    }

    // Verifier que l'utilisateur est bien ce livreur
    const driver = await prisma.driver.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!driver) {
      return next(new AppError('Non autorise', 403, 'FORBIDDEN'))
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    })

    res.json({
      success: true,
      data: {
        id: updatedDriver.id,
        currentLatitude: updatedDriver.currentLatitude,
        currentLongitude: updatedDriver.currentLongitude,
        lastLocationUpdate: updatedDriver.lastLocationUpdate,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/drivers/:id/availability - Changer disponibilite (pour le livreur)
router.put('/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const { isOnline, isAvailable } = req.body

    // Verifier que l'utilisateur est bien ce livreur
    const driver = await prisma.driver.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!driver) {
      return next(new AppError('Non autorise', 403, 'FORBIDDEN'))
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
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

export default router
