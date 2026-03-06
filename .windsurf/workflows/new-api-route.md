---
description: Workflow pour créer une nouvelle route API backend
---

# Nouvelle Route API

## 1. Définir le schema de validation

```typescript
// apps/api/src/validators/<domain>.validator.ts
import { z } from 'zod'

export const createXxxSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export const updateXxxSchema = createXxxSchema.partial()

export type CreateXxxInput = z.infer<typeof createXxxSchema>
```

## 2. Créer le controller

```typescript
// apps/api/src/controllers/<domain>/xxx.controller.ts
import { Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '@/utils/errors'
import { success, created } from '@/utils/response'

export const xxxController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query
      
      const [items, total] = await Promise.all([
        prisma.xxx.findMany({
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.xxx.count(),
      ])

      return success(res, {
        items,
        pagination: { page: Number(page), limit: Number(limit), total },
      })
    } catch (error) {
      next(error)
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      
      const item = await prisma.xxx.findUnique({ where: { id } })
      
      if (!item) {
        throw new AppError('Non trouvé', 404, 'NOT_FOUND')
      }

      return success(res, item)
    } catch (error) {
      next(error)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body
      
      const item = await prisma.xxx.create({ data })

      return created(res, item)
    } catch (error) {
      next(error)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = req.body
      
      const item = await prisma.xxx.update({
        where: { id },
        data,
      })

      return success(res, item)
    } catch (error) {
      next(error)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      
      await prisma.xxx.delete({ where: { id } })

      return success(res, { message: 'Supprimé' })
    } catch (error) {
      next(error)
    }
  },
}
```

## 3. Créer les routes

```typescript
// apps/api/src/routes/<domain>/xxx.routes.ts
import { Router } from 'express'
import { auth, requireRole } from '@/middlewares/auth.middleware'
import { validate } from '@/middlewares/validate.middleware'
import { xxxController } from '@/controllers/<domain>/xxx.controller'
import { createXxxSchema, updateXxxSchema } from '@/validators/<domain>.validator'

const router = Router()

router.use(auth, requireRole(['RESELLER']))

router.get('/', xxxController.list)
router.get('/:id', xxxController.get)
router.post('/', validate(createXxxSchema), xxxController.create)
router.put('/:id', validate(updateXxxSchema), xxxController.update)
router.delete('/:id', xxxController.delete)

export { router as xxxRoutes }
```

## 4. Enregistrer les routes

```typescript
// apps/api/src/routes/<domain>/index.ts
import { xxxRoutes } from './xxx.routes'

router.use('/xxx', xxxRoutes)
```

## 5. Tester
// turbo
```bash
# GET list
curl http://localhost:4000/api/<domain>/xxx

# POST create
curl -X POST http://localhost:4000/api/<domain>/xxx \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Test"}'
```

## 6. Commit
```bash
git commit -m "feat(api): add xxx endpoints"
```
