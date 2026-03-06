import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '../../services/email.service'

const router = Router()

// GET /platform/users - Liste paginee des utilisateurs
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      search, 
      userType, 
      emailVerified,
      twoFactorEnabled,
      isSuperAdmin,
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      page = '1', 
      limit = '20' 
    } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (search && typeof search === 'string') {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (userType && userType !== 'all') {
      where.userType = userType
    }

    if (emailVerified === 'true') {
      where.emailVerified = true
    } else if (emailVerified === 'false') {
      where.emailVerified = false
    }

    if (twoFactorEnabled === 'true') {
      where.twoFactorEnabled = true
    } else if (twoFactorEnabled === 'false') {
      where.twoFactorEnabled = false
    }

    if (isSuperAdmin === 'true') {
      where.isSuperAdmin = true
    }

    const orderBy: any = {}
    if (sortBy === 'email') {
      orderBy.email = sortOrder
    } else if (sortBy === 'firstName') {
      orderBy.firstName = sortOrder
    } else if (sortBy === 'userType') {
      orderBy.userType = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          userType: true,
          emailVerified: true,
          twoFactorEnabled: true,
          isSuperAdmin: true,
          language: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
          resellerProfile: {
            select: {
              id: true,
              role: true,
              isActive: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          restaurantProfile: {
            select: {
              id: true,
              role: true,
              isActive: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    res.json({
      success: true,
      users,
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

// GET /platform/users/stats - Statistiques des utilisateurs
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      total,
      superAdmins,
      resellers,
      restaurants,
      drivers,
      customers,
      emailVerified,
      twoFactorEnabled,
      newThisMonth,
      newThisWeek,
      newToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isSuperAdmin: true } }),
      prisma.user.count({ where: { userType: 'RESELLER' } }),
      prisma.user.count({ where: { userType: 'RESTAURANT' } }),
      prisma.user.count({ where: { userType: 'DRIVER' } }),
      prisma.user.count({ where: { userType: 'CUSTOMER' } }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    ])

    res.json({
      success: true,
      data: {
        total,
        byType: {
          superAdmins,
          resellers,
          restaurants,
          drivers,
          customers,
        },
        security: {
          emailVerified,
          twoFactorEnabled,
        },
        newUsers: {
          thisMonth: newThisMonth,
          thisWeek: newThisWeek,
          today: newToday,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /platform/users/export - Export CSV
router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userType } = req.query

    const where: any = {}
    if (userType && userType !== 'all') {
      where.userType = userType
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userType: true,
        emailVerified: true,
        twoFactorEnabled: true,
        isSuperAdmin: true,
        language: true,
        createdAt: true,
        resellerProfile: {
          select: {
            role: true,
            isActive: true,
            organization: { select: { name: true } },
          },
        },
        restaurantProfile: {
          select: {
            role: true,
            isActive: true,
            restaurant: { select: { name: true } },
          },
        },
      },
    })

    res.json({ success: true, data: users })
  } catch (error) {
    next(error)
  }
})

// GET /platform/users/:id - Details d'un utilisateur
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        userType: true,
        emailVerified: true,
        emailVerifiedAt: true,
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true,
        isSuperAdmin: true,
        language: true,
        timezone: true,
        notifyEmailInvoice: true,
        notifyEmailPayment: true,
        notifyEmailNewSite: true,
        notifyEmailNewClient: true,
        notifyEmailWeeklyReport: true,
        notifyEmailMarketing: true,
        createdAt: true,
        updatedAt: true,
        resellerProfile: {
          select: {
            id: true,
            role: true,
            isActive: true,
            permissions: true,
            invitedAt: true,
            joinedAt: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                email: true,
                logo: true,
                status: true,
              },
            },
          },
        },
        restaurantProfile: {
          select: {
            id: true,
            role: true,
            isActive: true,
            position: true,
            permissions: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                logo: true,
                site: {
                  select: {
                    id: true,
                    subdomain: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            ticketsCreated: true,
            ticketsAssigned: true,
          },
        },
      },
    })

    if (!user) {
      return next(new AppError('Utilisateur non trouve', 404, 'NOT_FOUND'))
    }

    res.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})

// PUT /platform/users/:id - Modifier un utilisateur
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, phone, language, timezone, emailVerified, isSuperAdmin } = req.body

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return next(new AppError('Utilisateur non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier si l'email est deja utilise par un autre utilisateur
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return next(new AppError('Cet email est deja utilise', 400, 'EMAIL_EXISTS'))
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(language !== undefined && { language }),
        ...(timezone !== undefined && { timezone }),
        ...(emailVerified !== undefined && { emailVerified, emailVerifiedAt: emailVerified ? new Date() : null }),
        ...(isSuperAdmin !== undefined && { isSuperAdmin }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        userType: true,
        emailVerified: true,
        twoFactorEnabled: true,
        isSuperAdmin: true,
        language: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json({ success: true, data: updated, message: 'Utilisateur mis a jour' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/users/:id/suspend - Desactiver un utilisateur
router.post('/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        resellerProfile: true,
        restaurantProfile: true,
      },
    })

    if (!user) {
      return next(new AppError('Utilisateur non trouve', 404, 'NOT_FOUND'))
    }

    if (user.isSuperAdmin) {
      return next(new AppError('Impossible de suspendre un super admin', 400, 'CANNOT_SUSPEND_ADMIN'))
    }

    // Desactiver le profil reseller ou restaurant
    if (user.resellerProfile) {
      await prisma.resellerMember.update({
        where: { id: user.resellerProfile.id },
        data: { isActive: false },
      })
    }

    if (user.restaurantProfile) {
      await prisma.restaurantStaff.update({
        where: { id: user.restaurantProfile.id },
        data: { isActive: false },
      })
    }

    // Supprimer les refresh tokens pour forcer la deconnexion
    await prisma.refreshToken.deleteMany({ where: { userId: id } })

    res.json({ success: true, message: 'Utilisateur suspendu' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/users/:id/activate - Reactiver un utilisateur
router.post('/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        resellerProfile: true,
        restaurantProfile: true,
      },
    })

    if (!user) {
      return next(new AppError('Utilisateur non trouve', 404, 'NOT_FOUND'))
    }

    // Reactiver le profil reseller ou restaurant
    if (user.resellerProfile) {
      await prisma.resellerMember.update({
        where: { id: user.resellerProfile.id },
        data: { isActive: true },
      })
    }

    if (user.restaurantProfile) {
      await prisma.restaurantStaff.update({
        where: { id: user.restaurantProfile.id },
        data: { isActive: true },
      })
    }

    res.json({ success: true, message: 'Utilisateur reactive' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/users/:id/reset-password - Envoyer email reset password
router.post('/:id/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return next(new AppError('Utilisateur non trouve', 404, 'NOT_FOUND'))
    }

    // Generer un token de reset
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    await prisma.user.update({
      where: { id },
      data: {
        resetToken,
        resetExpires,
      },
    })

    // Envoyer l'email avec le lien de reset
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`
    
    await sendPasswordResetEmail(user.email, user.firstName, resetLink)

    res.json({ 
      success: true, 
      message: 'Email de reinitialisation envoye',
    })
  } catch (error) {
    next(error)
  }
})

// POST /platform/users/:id/toggle-admin - Promouvoir/Revoquer Super Admin
router.post('/:id/toggle-admin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const currentUserId = req.user?.userId

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return next(new AppError('Utilisateur non trouve', 404, 'NOT_FOUND'))
    }

    // Empecher de se retirer soi-meme les droits admin
    if (id === currentUserId && user.isSuperAdmin) {
      return next(new AppError('Vous ne pouvez pas vous retirer vos propres droits admin', 400, 'CANNOT_REMOVE_OWN_ADMIN'))
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isSuperAdmin: !user.isSuperAdmin },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuperAdmin: true,
      },
    })

    res.json({ 
      success: true, 
      data: updated,
      message: updated.isSuperAdmin ? 'Utilisateur promu Super Admin' : 'Droits Super Admin retires',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /platform/users/:id - Supprimer un utilisateur
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const currentUserId = req.user?.userId

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        resellerProfile: {
          include: {
            organization: {
              include: {
                _count: { select: { members: true } },
              },
            },
          },
        },
        restaurantProfile: true,
        _count: {
          select: {
            ticketsCreated: true,
            ticketsAssigned: true,
          },
        },
      },
    })

    if (!user) {
      return next(new AppError('Utilisateur non trouve', 404, 'NOT_FOUND'))
    }

    // Empecher de se supprimer soi-meme
    if (id === currentUserId) {
      return next(new AppError('Vous ne pouvez pas supprimer votre propre compte', 400, 'CANNOT_DELETE_SELF'))
    }

    // Empecher de supprimer un super admin
    if (user.isSuperAdmin) {
      return next(new AppError('Impossible de supprimer un super admin', 400, 'CANNOT_DELETE_ADMIN'))
    }

    // Verifier si l'utilisateur est le seul owner d'une organisation
    if (user.resellerProfile?.role === 'OWNER') {
      const org = user.resellerProfile.organization
      if (org._count.members === 1) {
        return next(new AppError(
          'Cet utilisateur est le seul membre de son organisation. Supprimez d\'abord l\'organisation.',
          400,
          'SOLE_OWNER'
        ))
      }
    }

    // Supprimer l'utilisateur (cascade supprimera les profils)
    await prisma.user.delete({ where: { id } })

    res.json({ success: true, message: 'Utilisateur supprime' })
  } catch (error) {
    next(error)
  }
})

export { router as platformUsersRoutes }
