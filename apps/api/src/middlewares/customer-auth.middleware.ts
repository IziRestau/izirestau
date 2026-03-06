import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '@iziresto/database'
import { AppError } from './error.middleware'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface CustomerTokenPayload {
  customerId: string
  restaurantId: string
  email: string
  type: 'customer'
}

interface CustomerData {
  id: string
  restaurantId: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  emailVerified: boolean
  loyaltyPoints: number
}

declare global {
  namespace Express {
    interface Request {
      customer?: CustomerData
    }
  }
}

export function generateCustomerToken(customer: { id: string; restaurantId: string; email: string }): string {
  const payload: CustomerTokenPayload = {
    customerId: customer.id,
    restaurantId: customer.restaurantId,
    email: customer.email,
    type: 'customer',
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function generateCustomerRefreshToken(customer: { id: string; restaurantId: string; email: string }): string {
  const payload: CustomerTokenPayload = {
    customerId: customer.id,
    restaurantId: customer.restaurantId,
    email: customer.email,
    type: 'customer',
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '90d' })
}

export async function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Token d\'authentification requis', 401, 'UNAUTHORIZED'))
    }

    const token = authHeader.split(' ')[1]
    
    let payload: CustomerTokenPayload
    try {
      payload = jwt.verify(token, JWT_SECRET) as CustomerTokenPayload
    } catch {
      return next(new AppError('Token invalide ou expiré', 401, 'INVALID_TOKEN'))
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
        firstName: true,
        lastName: true,
        phone: true,
        emailVerified: true,
        isActive: true,
        loyaltyPoints: true,
      },
    })

    if (!customer) {
      return next(new AppError('Client non trouvé', 401, 'CUSTOMER_NOT_FOUND'))
    }

    if (!customer.isActive) {
      return next(new AppError('Compte désactivé', 403, 'ACCOUNT_DISABLED'))
    }

    req.customer = {
      id: customer.id,
      restaurantId: customer.restaurantId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      emailVerified: customer.emailVerified,
      loyaltyPoints: customer.loyaltyPoints,
    }

    next()
  } catch (error) {
    return next(new AppError('Erreur d\'authentification', 500, 'AUTH_ERROR'))
  }
}

export async function optionalCustomerAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.split(' ')[1]
    
    let payload: CustomerTokenPayload
    try {
      payload = jwt.verify(token, JWT_SECRET) as CustomerTokenPayload
    } catch {
      return next()
    }

    if (payload.type !== 'customer') {
      return next()
    }

    const customer = await prisma.restaurantCustomer.findUnique({
      where: { id: payload.customerId },
      select: {
        id: true,
        restaurantId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        emailVerified: true,
        isActive: true,
        loyaltyPoints: true,
      },
    })

    if (customer && customer.isActive) {
      req.customer = {
        id: customer.id,
        restaurantId: customer.restaurantId,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        emailVerified: customer.emailVerified,
        loyaltyPoints: customer.loyaltyPoints,
      }
    }

    next()
  } catch {
    next()
  }
}
