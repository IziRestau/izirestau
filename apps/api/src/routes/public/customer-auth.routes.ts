import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { sendPasswordResetEmail, sendEmailVerificationEmail } from '../../services/email.service'
import {
  generateCustomerToken,
  generateCustomerRefreshToken,
  requireCustomerAuth,
} from '../../middlewares/customer-auth.middleware'

const router = Router({ mergeParams: true })

// Schemas de validation
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  phone: z.string().optional(),
  marketingOptIn: z.boolean().optional().default(true),
})

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
})

// Helper pour résoudre le site
async function resolveSite(subdomain: string) {
  return prisma.site.findFirst({
    where: {
      OR: [
        { subdomain },
        { customDomain: subdomain },
      ],
      status: 'ACTIVE',
    },
    select: {
      id: true,
      restaurantId: true,
      restaurant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

// POST /store/:subdomain/auth/register - Inscription client
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subdomain } = req.params
    const site = await resolveSite(subdomain)

    if (!site || !site.restaurantId) {
      return next(new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND'))
    }

    const validation = registerSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const { email, password, firstName, lastName, phone, marketingOptIn } = validation.data

    // Vérifier si le client existe déjà
    const existingCustomer = await prisma.restaurantCustomer.findUnique({
      where: {
        restaurantId_email: {
          restaurantId: site.restaurantId,
          email: email.toLowerCase(),
        },
      },
    })

    if (existingCustomer) {
      if (existingCustomer.passwordHash) {
        return next(new AppError('Un compte existe déjà avec cet email', 400, 'EMAIL_EXISTS'))
      }
      // Client guest existant - convertir en compte
      const passwordHash = await bcrypt.hash(password, 12)
      const emailVerificationToken = crypto.randomBytes(32).toString('hex')

      const customer = await prisma.restaurantCustomer.update({
        where: { id: existingCustomer.id },
        data: {
          firstName,
          lastName,
          phone,
          passwordHash,
          emailVerificationToken,
          marketingOptIn,
        },
      })

      const accessToken = generateCustomerToken(customer)
      const refreshToken = generateCustomerRefreshToken(customer)

      // TODO: Envoyer email de vérification

      return res.status(200).json({
        success: true,
        message: 'Compte créé avec succès',
        data: {
          customer: {
            id: customer.id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            emailVerified: customer.emailVerified,
          },
          accessToken,
          refreshToken,
        },
      })
    }

    // Nouveau client
    const passwordHash = await bcrypt.hash(password, 12)
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')

    const customer = await prisma.restaurantCustomer.create({
      data: {
        restaurantId: site.restaurantId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone,
        passwordHash,
        emailVerificationToken,
        marketingOptIn,
      },
    })

    const accessToken = generateCustomerToken(customer)
    const refreshToken = generateCustomerRefreshToken(customer)

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const verificationLink = `${frontendUrl}/store/${subdomain}/verify-email?token=${emailVerificationToken}`
    
    await sendEmailVerificationEmail(customer.email, customer.firstName, verificationLink)

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          emailVerified: customer.emailVerified,
        },
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/auth/login - Connexion client
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subdomain } = req.params
    const site = await resolveSite(subdomain)

    if (!site || !site.restaurantId) {
      return next(new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND'))
    }

    const validation = loginSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const { email, password } = validation.data

    const customer = await prisma.restaurantCustomer.findUnique({
      where: {
        restaurantId_email: {
          restaurantId: site.restaurantId,
          email: email.toLowerCase(),
        },
      },
    })

    if (!customer || !customer.passwordHash) {
      return next(new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS'))
    }

    if (!customer.isActive) {
      return next(new AppError('Compte désactivé', 403, 'ACCOUNT_DISABLED'))
    }

    const isValidPassword = await bcrypt.compare(password, customer.passwordHash)
    if (!isValidPassword) {
      return next(new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS'))
    }

    // Mettre à jour lastLoginAt
    await prisma.restaurantCustomer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    })

    const accessToken = generateCustomerToken(customer)
    const refreshToken = generateCustomerRefreshToken(customer)

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          emailVerified: customer.emailVerified,
        },
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /store/:subdomain/auth/me - Profil client connecté
router.get('/me', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!

    const fullCustomer = await prisma.restaurantCustomer.findUnique({
      where: { id: customer.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        emailVerified: true,
        totalOrders: true,
        totalSpent: true,
        loyaltyPoints: true,
        marketingOptIn: true,
        defaultAddressId: true,
        addresses: {
          select: {
            id: true,
            label: true,
            street: true,
            streetLine2: true,
            city: true,
            postalCode: true,
            country: true,
            isDefault: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        createdAt: true,
      },
    })

    if (!fullCustomer) {
      return next(new AppError('Client non trouvé', 404, 'CUSTOMER_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        ...fullCustomer,
        totalSpent: Number(fullCustomer.totalSpent),
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /store/:subdomain/auth/profile - Modifier profil
router.put('/profile', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!

    const validation = updateProfileSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const { firstName, lastName, phone, marketingOptIn } = validation.data

    const updatedCustomer = await prisma.restaurantCustomer.update({
      where: { id: customer.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(marketingOptIn !== undefined && { marketingOptIn }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        emailVerified: true,
        marketingOptIn: true,
      },
    })

    res.json({
      success: true,
      data: updatedCustomer,
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/auth/change-password - Changer mot de passe
router.post('/change-password', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!

    const validation = changePasswordSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const { currentPassword, newPassword } = validation.data

    const fullCustomer = await prisma.restaurantCustomer.findUnique({
      where: { id: customer.id },
      select: { passwordHash: true },
    })

    if (!fullCustomer?.passwordHash) {
      return next(new AppError('Aucun mot de passe défini', 400, 'NO_PASSWORD'))
    }

    const isValidPassword = await bcrypt.compare(currentPassword, fullCustomer.passwordHash)
    if (!isValidPassword) {
      return next(new AppError('Mot de passe actuel incorrect', 401, 'INVALID_PASSWORD'))
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    await prisma.restaurantCustomer.update({
      where: { id: customer.id },
      data: { passwordHash: newPasswordHash },
    })

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/auth/forgot-password - Mot de passe oublié
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subdomain } = req.params
    const site = await resolveSite(subdomain)

    if (!site || !site.restaurantId) {
      return next(new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND'))
    }

    const validation = forgotPasswordSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const { email } = validation.data

    const customer = await prisma.restaurantCustomer.findUnique({
      where: {
        restaurantId_email: {
          restaurantId: site.restaurantId,
          email: email.toLowerCase(),
        },
      },
    })

    // Toujours retourner succès pour éviter l'énumération d'emails
    if (!customer || !customer.passwordHash) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation',
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 3600000) // 1 heure

    await prisma.restaurantCustomer.update({
      where: { id: customer.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const resetLink = `${frontendUrl}/store/${subdomain}/reset-password?token=${resetToken}`
    
    await sendPasswordResetEmail(customer.email, customer.firstName, resetLink)

    res.json({
      success: true,
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation',
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/auth/reset-password - Reset mot de passe
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subdomain } = req.params
    const site = await resolveSite(subdomain)

    if (!site || !site.restaurantId) {
      return next(new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND'))
    }

    const validation = resetPasswordSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const { token, password } = validation.data

    const customer = await prisma.restaurantCustomer.findFirst({
      where: {
        restaurantId: site.restaurantId,
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    })

    if (!customer) {
      return next(new AppError('Lien de réinitialisation invalide ou expiré', 400, 'INVALID_RESET_TOKEN'))
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.restaurantCustomer.update({
      where: { id: customer.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/auth/verify-email - Vérifier email
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subdomain } = req.params
    const { token } = req.body

    if (!token) {
      return next(new AppError('Token requis', 400, 'TOKEN_REQUIRED'))
    }

    const site = await resolveSite(subdomain)

    if (!site || !site.restaurantId) {
      return next(new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND'))
    }

    const customer = await prisma.restaurantCustomer.findFirst({
      where: {
        restaurantId: site.restaurantId,
        emailVerificationToken: token,
      },
    })

    if (!customer) {
      return next(new AppError('Lien de vérification invalide', 400, 'INVALID_VERIFICATION_TOKEN'))
    }

    await prisma.restaurantCustomer.update({
      where: { id: customer.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    })

    res.json({
      success: true,
      message: 'Email vérifié avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/auth/refresh - Rafraîchir token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return next(new AppError('Refresh token requis', 400, 'REFRESH_TOKEN_REQUIRED'))
    }

    // Vérifier le refresh token
    const jwt = await import('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

    let payload: { customerId: string; type: string }
    try {
      payload = jwt.default.verify(refreshToken, JWT_SECRET) as { customerId: string; type: string }
    } catch {
      return next(new AppError('Refresh token invalide ou expiré', 401, 'INVALID_REFRESH_TOKEN'))
    }

    if (payload.type !== 'customer') {
      return next(new AppError('Token invalide', 401, 'INVALID_TOKEN_TYPE'))
    }

    const customer = await prisma.restaurantCustomer.findUnique({
      where: { id: payload.customerId },
      select: {
        id: true,
        restaurantId: true,
        email: true,
        isActive: true,
      },
    })

    if (!customer || !customer.isActive) {
      return next(new AppError('Client non trouvé ou désactivé', 401, 'CUSTOMER_NOT_FOUND'))
    }

    const newAccessToken = generateCustomerToken(customer)
    const newRefreshToken = generateCustomerRefreshToken(customer)

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
