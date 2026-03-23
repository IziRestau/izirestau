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
import { startCronJobs } from './services/cron.service'

const app: Express = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
      frameAncestors: ["'self'", "http://localhost:3000", "http://localhost:4000"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

app.use(errorHandler)

const PORT = process.env.PORT || 4000

async function startServer() {
  await redis.connect()
  
  // Démarrer les jobs cron internes
  startCronJobs()
  
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

startServer().catch(console.error)

export { app, io, redis }
