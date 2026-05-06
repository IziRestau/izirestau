import 'dotenv/config'
import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { createServer } from 'http'
import { Server } from 'socket.io'

import { redis } from './services/redis.service'
import { errorHandler } from './middlewares/error.middleware'
import { authRoutes } from './routes/auth.routes'
import { platformRoutes } from './routes/platform'
import { resellerRoutes } from './routes/reseller'
import { restaurantRoutes } from './routes/restaurant'
import { publicRoutes } from './routes/public'
import { webhookRoutes } from './routes/webhooks'
import { onboardingRoutes } from './routes/onboarding'
import { uploadRoutes } from './routes/upload.routes'
import { twoFactorRoutes } from './routes/auth/two-factor.routes'
import cronRoutes from './routes/cron.routes'
import driverRoutes from './routes/driver'
import { startCronJobs } from './services/cron.service'
import { authenticate } from './middlewares/auth.middleware'

const app: Express = express()
const httpServer = createServer(app)

const explicitOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const originPatterns: RegExp[] = (process.env.CORS_ORIGIN_PATTERNS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(p => new RegExp(p))

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true
  if (explicitOrigins.includes(origin)) return true
  return originPatterns.some(rx => rx.test(origin))
}

const corsOriginCheck = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  if (isOriginAllowed(origin)) callback(null, true)
  else callback(new Error(`CORS: origin ${origin} not allowed`))
}

const io = new Server(httpServer, {
  cors: {
    origin: corsOriginCheck,
    credentials: true,
  },
})

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      frameSrc: ["'self'"],
      frameAncestors: ["'self'", ...explicitOrigins],
    },
  },
  crossOriginEmbedderPolicy: false,
}))
app.use(cors({
  origin: corsOriginCheck,
  credentials: true,
}))
app.use(compression())
app.use(morgan('dev'))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    redis: redis.isReady() ? 'connected' : 'disconnected'
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/platform', platformRoutes)
app.use('/api/reseller', resellerRoutes)
app.use('/api/restaurant', restaurantRoutes)
app.use('/api/store', publicRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/onboarding', onboardingRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/auth/2fa', twoFactorRoutes)
app.use('/api/cron', cronRoutes)
app.use('/api/driver', authenticate, driverRoutes)

app.use(errorHandler)

const PORT = Number(process.env.PORT) || 4000

async function startServer() {
  await redis.connect()

  // Démarrer les jobs cron internes
  startCronJobs()

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`)
  })
}

startServer().catch(console.error)

export { app, io, redis }
