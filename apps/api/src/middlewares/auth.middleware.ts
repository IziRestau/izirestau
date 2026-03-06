import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, TokenPayload } from '../utils/jwt'
import { AppError } from './error.middleware'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token manquant', 401, 'UNAUTHORIZED'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch {
    return next(new AppError('Token invalide ou expiré', 401, 'INVALID_TOKEN'))
  }
}

export function authorize(...allowedTypes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return next(new AppError('Accès non autorisé', 403, 'FORBIDDEN'))
    }

    next()
  }
}
