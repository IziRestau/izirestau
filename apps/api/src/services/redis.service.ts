import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

class RedisService {
  private client: Redis | null = null
  private isConnected = false

  async connect(): Promise<void> {
    if (this.client && this.isConnected) return

    try {
      this.client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('Redis: Max retries reached, running without cache')
            return null
          }
          return Math.min(times * 100, 3000)
        },
        lazyConnect: true,
      })

      this.client.on('connect', () => {
        this.isConnected = true
        console.log('Redis connected')
      })

      this.client.on('error', (err) => {
        console.error('Redis error:', err.message)
        this.isConnected = false
      })

      this.client.on('close', () => {
        this.isConnected = false
      })

      await this.client.connect()
    } catch (error) {
      console.warn('Redis connection failed, running without cache')
      this.client = null
      this.isConnected = false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null

    try {
      const data = await this.client.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) return false

    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized)
      } else {
        await this.client.set(key, serialized)
      }
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false

    try {
      await this.client.del(key)
      return true
    } catch (error) {
      console.error('Redis del error:', error)
      return false
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false

    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Redis delPattern error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis exists error:', error)
      return false
    }
  }

  async incr(key: string): Promise<number | null> {
    if (!this.client || !this.isConnected) return null

    try {
      return await this.client.incr(key)
    } catch (error) {
      console.error('Redis incr error:', error)
      return null
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client || !this.isConnected) return false

    try {
      await this.client.expire(key, ttlSeconds)
      return true
    } catch (error) {
      console.error('Redis expire error:', error)
      return false
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.client || !this.isConnected) return -1

    try {
      return await this.client.ttl(key)
    } catch (error) {
      console.error('Redis ttl error:', error)
      return -1
    }
  }

  getClient(): Redis | null {
    return this.client
  }

  isReady(): boolean {
    return this.isConnected
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
      this.isConnected = false
    }
  }
}

export const redis = new RedisService()

// Cache key generators
export const cacheKeys = {
  // User session
  userSession: (userId: string) => `session:user:${userId}`,
  refreshToken: (token: string) => `refresh:${token}`,
  
  // Reseller data
  resellerDashboard: (orgId: string) => `reseller:dashboard:${orgId}`,
  resellerSites: (orgId: string) => `reseller:sites:${orgId}`,
  resellerClients: (orgId: string) => `reseller:clients:${orgId}`,
  siteDetails: (siteId: string) => `site:${siteId}`,
  
  // Restaurant data
  restaurantMenu: (restaurantId: string) => `restaurant:menu:${restaurantId}`,
  restaurantOrders: (restaurantId: string) => `restaurant:orders:${restaurantId}`,
  
  // Rate limiting
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
  
  // Invalidation patterns
  patterns: {
    reseller: (orgId: string) => `reseller:*:${orgId}`,
    restaurant: (restaurantId: string) => `restaurant:*:${restaurantId}`,
    site: (siteId: string) => `site:${siteId}*`,
  }
}

// Cache TTL constants (in seconds)
export const cacheTTL = {
  short: 60,           // 1 minute
  medium: 300,         // 5 minutes
  long: 900,           // 15 minutes
  hour: 3600,          // 1 hour
  day: 86400,          // 24 hours
  session: 604800,     // 7 days
}
