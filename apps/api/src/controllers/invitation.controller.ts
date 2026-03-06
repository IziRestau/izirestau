import { Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { hashPassword } from '../utils/password'
import { AppError } from '../middlewares/error.middleware'
import crypto from 'crypto'

export async function inviteRestaurantUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, firstName, lastName, siteId } = req.body

    if (!req.user) {
      return next(new AppError('Non authentifie', 401, 'UNAUTHORIZED'))
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { organization: true },
    })

    if (!site) {
      return next(new AppError('Site non trouve', 404, 'SITE_NOT_FOUND'))
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return next(new AppError('Cet email est deja utilise', 400, 'EMAIL_EXISTS'))
    }

    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: '',
        userType: 'RESTAURANT',
        inviteToken,
        inviteExpires,
      },
    })

    if (site.restaurantId) {
      await prisma.restaurantStaff.create({
        data: {
          userId: user.id,
          restaurantId: site.restaurantId,
          role: 'OWNER',
        },
      })
    }

    const inviteUrl = `https://${site.subdomain}.iziresto.com/setup-password?token=${inviteToken}`

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        inviteUrl,
      },
      message: 'Invitation envoyee',
    })
  } catch (error) {
    next(error)
  }
}

export async function setupPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return next(new AppError('Token et mot de passe requis', 400, 'MISSING_FIELDS'))
    }

    if (password.length < 8) {
      return next(new AppError('Le mot de passe doit contenir au moins 8 caracteres', 400, 'WEAK_PASSWORD'))
    }

    const user = await prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteExpires: { gt: new Date() },
      },
    })

    if (!user) {
      return next(new AppError('Token invalide ou expire', 400, 'INVALID_TOKEN'))
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        inviteToken: null,
        inviteExpires: null,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    })

    res.json({
      success: true,
      message: 'Mot de passe configure avec succes',
    })
  } catch (error) {
    next(error)
  }
}
