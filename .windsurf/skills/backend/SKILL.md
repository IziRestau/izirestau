# Skill: Backend Express.js

## Quand utiliser ce skill
- Création de routes API
- Controllers et logique métier
- Middlewares
- Validation des données
- Gestion des erreurs

---

## Structure du Backend

```
apps/api/src/
├── index.ts              # Entry point
├── app.ts                # Express app config
├── routes/
│   ├── index.ts          # Router principal
│   ├── auth.routes.ts
│   ├── platform/         # Routes Super Admin
│   ├── reseller/         # Routes Revendeur
│   ├── restaurant/       # Routes Restaurant
│   └── public/           # Routes publiques
├── controllers/
│   ├── auth.controller.ts
│   ├── platform/
│   ├── reseller/
│   └── restaurant/
├── middlewares/
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   ├── error.middleware.ts
│   └── rateLimit.middleware.ts
├── services/
│   ├── email.service.ts
│   ├── storage.service.ts
│   ├── stripe.service.ts
│   └── paytech.service.ts
├── validators/
│   ├── auth.validator.ts
│   ├── reseller.validator.ts
│   └── restaurant.validator.ts
├── utils/
│   ├── jwt.ts
│   ├── password.ts
│   └── response.ts
└── types/
    └── index.ts
```

---

## Configuration Express

```typescript
// src/app.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { errorHandler } from './middlewares/error.middleware'
import { routes } from './routes'

const app = express()

// Middlewares
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api', routes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler (toujours en dernier)
app.use(errorHandler)

export { app }
```

```typescript
// src/index.ts
import { app } from './app'
import { prisma } from '@iziresto/database'

const PORT = process.env.PORT || 4000

async function main() {
  await prisma.$connect()
  console.log('Database connected')

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
```

---

## Routes

### Structure de route
```typescript
// src/routes/reseller/sites.routes.ts
import { Router } from 'express'
import { auth, requireRole } from '@/middlewares/auth.middleware'
import { validate } from '@/middlewares/validate.middleware'
import { sitesController } from '@/controllers/reseller/sites.controller'
import { createSiteSchema, updateSiteSchema } from '@/validators/reseller.validator'

const router = Router()

// Toutes les routes nécessitent auth + rôle RESELLER
router.use(auth, requireRole(['RESELLER']))

router.get('/', sitesController.list)
router.get('/:id', sitesController.get)
router.post('/', validate(createSiteSchema), sitesController.create)
router.put('/:id', validate(updateSiteSchema), sitesController.update)
router.delete('/:id', sitesController.delete)
router.post('/:id/activate', sitesController.activate)
router.post('/:id/suspend', sitesController.suspend)

export { router as sitesRoutes }
```

### Router principal
```typescript
// src/routes/index.ts
import { Router } from 'express'
import { authRoutes } from './auth.routes'
import { platformRoutes } from './platform'
import { resellerRoutes } from './reseller'
import { restaurantRoutes } from './restaurant'
import { publicRoutes } from './public'

const router = Router()

router.use('/auth', authRoutes)
router.use('/platform', platformRoutes)
router.use('/reseller', resellerRoutes)
router.use('/restaurant', restaurantRoutes)
router.use('/store', publicRoutes)

export { router as routes }
```

---

## Controllers

### Pattern Controller
```typescript
// src/controllers/reseller/sites.controller.ts
import { Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '@/utils/errors'
import { success, created } from '@/utils/response'

export const sitesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.user!
      const { page = 1, limit = 20, status } = req.query

      const where = {
        organizationId,
        ...(status && { status: status as string }),
      }

      const [sites, total] = await Promise.all([
        prisma.site.findMany({
          where,
          include: {
            client: true,
            restaurant: { select: { name: true } },
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.site.count({ where }),
      ])

      return success(res, {
        sites,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      })
    } catch (error) {
      next(error)
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { organizationId } = req.user!

      const site = await prisma.site.findFirst({
        where: { id, organizationId },
        include: {
          client: true,
          restaurant: true,
        },
      })

      if (!site) {
        throw new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND')
      }

      return success(res, site)
    } catch (error) {
      next(error)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.user!
      const { subdomain, clientId } = req.body

      // Vérifier la licence
      const organization = await prisma.resellerOrganization.findUnique({
        where: { id: organizationId },
        include: { license: { include: { plan: true } } },
      })

      if (!organization?.license) {
        throw new AppError('Licence non trouvée', 403, 'NO_LICENSE')
      }

      const sitesCount = await prisma.site.count({ where: { organizationId } })
      
      if (organization.license.plan.maxSites > 0 && 
          sitesCount >= organization.license.plan.maxSites) {
        throw new AppError('Limite de sites atteinte', 403, 'SITES_LIMIT_REACHED')
      }

      // Vérifier subdomain unique
      const existing = await prisma.site.findUnique({ where: { subdomain } })
      if (existing) {
        throw new AppError('Ce sous-domaine est déjà pris', 400, 'SUBDOMAIN_TAKEN')
      }

      const site = await prisma.site.create({
        data: {
          subdomain,
          organizationId,
          clientId,
          status: 'DRAFT',
        },
        include: { client: true },
      })

      return created(res, site)
    } catch (error) {
      next(error)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { organizationId } = req.user!
      const data = req.body

      const site = await prisma.site.findFirst({
        where: { id, organizationId },
      })

      if (!site) {
        throw new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND')
      }

      const updated = await prisma.site.update({
        where: { id },
        data,
        include: { client: true },
      })

      return success(res, updated)
    } catch (error) {
      next(error)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { organizationId } = req.user!

      const site = await prisma.site.findFirst({
        where: { id, organizationId },
      })

      if (!site) {
        throw new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND')
      }

      await prisma.site.delete({ where: { id } })

      return success(res, { message: 'Site supprimé' })
    } catch (error) {
      next(error)
    }
  },

  async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { organizationId } = req.user!

      const site = await prisma.site.update({
        where: { id, organizationId },
        data: { 
          status: 'ACTIVE',
          publishedAt: new Date(),
        },
      })

      return success(res, site)
    } catch (error) {
      next(error)
    }
  },

  async suspend(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { organizationId } = req.user!

      const site = await prisma.site.update({
        where: { id, organizationId },
        data: { status: 'SUSPENDED' },
      })

      return success(res, site)
    } catch (error) {
      next(error)
    }
  },
}
```

---

## Middlewares

### Auth Middleware
```typescript
// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '@/utils/jwt'
import { prisma } from '@iziresto/database'
import { AppError } from '@/utils/errors'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        userType: string
        organizationId?: string
        restaurantId?: string
      }
    }
  }
}

export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Token manquant', 401, 'UNAUTHORIZED')
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        resellerProfile: { select: { organizationId: true } },
        restaurantProfile: { select: { restaurantId: true } },
      },
    })

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 401, 'UNAUTHORIZED')
    }

    req.user = {
      id: user.id,
      email: user.email,
      userType: user.userType,
      organizationId: user.resellerProfile?.organizationId,
      restaurantId: user.restaurantProfile?.restaurantId,
    }

    next()
  } catch (error) {
    next(new AppError('Token invalide', 401, 'INVALID_TOKEN'))
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.userType)) {
      return next(new AppError('Accès refusé', 403, 'FORBIDDEN'))
    }
    next()
  }
}
```

### Validation Middleware
```typescript
// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { AppError } from '@/utils/errors'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR', errors))
    }

    req.body = result.data
    next()
  }
}
```

### Error Handler
```typescript
// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { AppError } from '@/utils/errors'
import { Prisma } from '@prisma/client'

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error)

  // AppError custom
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    })
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_ENTRY',
        message: 'Cette entrée existe déjà',
      })
    }
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Ressource non trouvée',
      })
    }
  }

  // Erreur générique
  return res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue' 
      : error.message,
  })
}
```

---

## Utilitaires

### Response Helpers
```typescript
// src/utils/response.ts
import { Response } from 'express'

export function success<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  })
}

export function created<T>(res: Response, data: T) {
  return success(res, data, 201)
}

export function noContent(res: Response) {
  return res.status(204).send()
}
```

### Custom Error
```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```

### JWT Utils
```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

interface TokenPayload {
  userId: string
  type: 'access' | 'refresh'
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId, type: 'access' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  })
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, JWT_SECRET) as TokenPayload
  if (payload.type !== 'access') {
    throw new Error('Invalid token type')
  }
  return payload
}

export function verifyRefreshToken(token: string): TokenPayload {
  const payload = jwt.verify(token, JWT_SECRET) as TokenPayload
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type')
  }
  return payload
}
```

---

## Validators (Zod)

```typescript
// src/validators/reseller.validator.ts
import { z } from 'zod'

export const createSiteSchema = z.object({
  subdomain: z.string()
    .min(3, 'Minimum 3 caractères')
    .max(50, 'Maximum 50 caractères')
    .regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement'),
  clientId: z.string().cuid().optional(),
  customDomain: z.string().url().optional(),
})

export const updateSiteSchema = z.object({
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
  clientId: z.string().cuid().nullable().optional(),
  customDomain: z.string().url().nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED']).optional(),
})

export const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  contactFirstName: z.string().min(2).max(50),
  contactLastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('FR'),
  businessName: z.string().optional(),
  siret: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  source: z.string().optional(),
})
```
