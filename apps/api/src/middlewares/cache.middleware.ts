import { Request, Response, NextFunction } from 'express'
import { redis, cacheTTL } from '../services/redis.service'

interface CacheOptions {
  ttl?: number
  keyGenerator?: (req: Request) => string
}

export function cache(options: CacheOptions = {}) {
  const { ttl = cacheTTL.medium, keyGenerator } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis.isReady()) {
      return next()
    }

    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `cache:${req.originalUrl}:${req.user?.userId || 'anonymous'}`

    try {
      const cached = await redis.get<{ data: unknown; timestamp: number }>(cacheKey)
      
      if (cached) {
        return res.json(cached.data)
      }

      const originalJson = res.json.bind(res)
      res.json = (body: unknown) => {
        if (res.statusCode === 200) {
          redis.set(cacheKey, { data: body, timestamp: Date.now() }, ttl)
        }
        return originalJson(body)
      }

      next()
    } catch (error) {
      next()
    }
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  await redis.delPattern(pattern)
}

export async function invalidateCacheKey(key: string): Promise<void> {
  await redis.del(key)
}
