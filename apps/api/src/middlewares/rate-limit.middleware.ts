import { Request, Response, NextFunction } from 'express'
import { redis, cacheKeys } from '../services/redis.service'

interface RateLimitOptions {
  windowMs?: number
  max?: number
  message?: string
  keyGenerator?: (req: Request) => string
}

export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60000,
    max = 100,
    message = 'Trop de requetes, veuillez reessayer plus tard',
    keyGenerator,
  } = options

  const windowSeconds = Math.ceil(windowMs / 1000)

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis.isReady()) {
      return next()
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const key = keyGenerator 
      ? keyGenerator(req) 
      : cacheKeys.rateLimit(ip, req.path)

    try {
      const current = await redis.incr(key)
      
      if (current === 1) {
        await redis.expire(key, windowSeconds)
      }

      const ttl = await redis.ttl(key)
      
      res.setHeader('X-RateLimit-Limit', max)
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - (current || 0)))
      res.setHeader('X-RateLimit-Reset', Date.now() + (ttl * 1000))

      if (current && current > max) {
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: ttl,
        })
      }

      next()
    } catch (error) {
      next()
    }
  }
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Trop de tentatives de connexion, veuillez reessayer dans 15 minutes',
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Limite de requetes atteinte',
})

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Action limitee, veuillez reessayer plus tard',
})
