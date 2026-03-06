import { Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { hashPassword, comparePassword } from '../utils/password'
import { generateTokens, verifyRefreshToken, generateTempToken, verifyTempToken } from '../utils/jwt'
import { AppError } from '../middlewares/error.middleware'
import { RegisterInput, LoginInput } from '../validators/auth.validator'
import { verifySync } from 'otplib'

function verify2FACode(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret })
    return result.valid
  } catch {
    return false
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, phone, userType } = req.body as RegisterInput

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return next(new AppError('Cet email est déjà utilisé', 400, 'EMAIL_EXISTS'))
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone,
        userType: userType as 'RESELLER' | 'RESTAURANT' | 'DRIVER' | 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        userType: true,
        language: true,
        timezone: true,
        createdAt: true,
      },
    })

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    })

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.status(201).json({
      success: true,
      data: {
        user,
        ...tokens,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return next(new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS'))
    }

    const isValidPassword = await comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      return next(new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS'))
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const tempToken = generateTempToken({ userId: user.id, purpose: '2fa' })
      return res.json({
        success: true,
        data: {
          requires2FA: true,
          tempToken,
        },
      })
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    })

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          avatar: user.avatar,
          userType: user.userType,
          isSuperAdmin: user.isSuperAdmin,
          language: user.language,
          timezone: user.timezone,
        },
        ...tokens,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function login2FA(req: Request, res: Response, next: NextFunction) {
  try {
    const { tempToken, code } = req.body

    if (!tempToken || !code) {
      return next(new AppError('Token et code requis', 400, 'MISSING_PARAMS'))
    }

    let payload
    try {
      payload = verifyTempToken(tempToken)
    } catch {
      return next(new AppError('Session expiree, veuillez vous reconnecter', 401, 'INVALID_TOKEN'))
    }

    if (payload.purpose !== '2fa') {
      return next(new AppError('Token invalide', 401, 'INVALID_TOKEN'))
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.twoFactorSecret) {
      return next(new AppError('Utilisateur non trouve', 404, 'USER_NOT_FOUND'))
    }

    const isValidCode = verify2FACode(code, user.twoFactorSecret)
    
    if (!isValidCode) {
      const backupCodes = user.twoFactorBackupCodes || []
      const backupIndex = backupCodes.indexOf(code.toUpperCase())
      
      if (backupIndex === -1) {
        return next(new AppError('Code invalide', 401, 'INVALID_2FA_CODE'))
      }
      
      const updatedBackupCodes = [...backupCodes]
      updatedBackupCodes.splice(backupIndex, 1)
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: updatedBackupCodes }
      })
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    })

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          avatar: user.avatar,
          userType: user.userType,
          isSuperAdmin: user.isSuperAdmin,
          language: user.language,
          timezone: user.timezone,
        },
        ...tokens,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }

    res.json({ success: true, message: 'Déconnexion réussie' })
  } catch (error) {
    next(error)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return next(new AppError('Refresh token requis', 400, 'MISSING_TOKEN'))
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return next(new AppError('Refresh token invalide ou expiré', 401, 'INVALID_TOKEN'))
    }

    try {
      verifyRefreshToken(refreshToken)
    } catch {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } })
      return next(new AppError('Refresh token invalide', 401, 'INVALID_TOKEN'))
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } })

    const tokens = generateTokens({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      userType: storedToken.user.userType,
    })

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.json({
      success: true,
      data: tokens,
    })
  } catch (error) {
    next(error)
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        userType: true,
        language: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return next(new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND'))
    }

    res.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}
