import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

// Schémas de validation
const stockMovementTypeEnum = z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'WASTE', 'TRANSFER', 'RETURN', 'PRODUCTION'])

const createMovementSchema = z.object({
  ingredientId: z.string().min(1, 'Ingrédient requis'),
  type: stockMovementTypeEnum,
  quantity: z.number(),
  unitCost: z.number().min(0).optional().nullable(),
  reason: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  referenceType: z.string().max(50).optional().nullable(),
})

const bulkMovementSchema = z.object({
  type: stockMovementTypeEnum,
  reason: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(z.object({
    ingredientId: z.string().min(1),
    quantity: z.number(),
    unitCost: z.number().min(0).optional().nullable(),
  })).min(1, 'Au moins un ingrédient requis'),
})

// GET /restaurant/stock-movements - Liste des mouvements
router.get('/', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const {
      ingredientId,
      type,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '50',
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50))
    const skip = (pageNum - 1) * limitNum

    const where: any = { restaurantId }

    if (ingredientId && typeof ingredientId === 'string') {
      where.ingredientId = ingredientId
    }

    if (type && typeof type === 'string') {
      where.type = type
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom as string)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo as string)
      }
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { ingredient: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const orderBy: any = {}
    const validSortFields = ['createdAt', 'quantity', 'type']
    if (validSortFields.includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          ingredient: {
            select: { id: true, name: true, sku: true, unit: true },
          },
        },
      }),
      prisma.stockMovement.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        items: movements.map(m => ({
          id: m.id,
          ingredientId: m.ingredientId,
          ingredient: m.ingredient,
          type: m.type,
          quantity: Number(m.quantity),
          unitCost: m.unitCost ? Number(m.unitCost) : null,
          totalCost: m.totalCost ? Number(m.totalCost) : null,
          reason: m.reason,
          notes: m.notes,
          reference: m.reference,
          referenceType: m.referenceType,
          performedBy: m.performedBy,
          createdAt: m.createdAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/stock-movements/summary - Résumé des mouvements
router.get('/summary', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { period = '30' } = req.query
    const days = parseInt(period as string) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const movements = await prisma.stockMovement.groupBy({
      by: ['type'],
      where: {
        restaurantId,
        createdAt: { gte: startDate },
      },
      _count: { id: true },
      _sum: { totalCost: true },
    })

    const summary = movements.reduce((acc, m) => {
      acc[m.type] = {
        count: m._count.id,
        totalCost: Number(m._sum.totalCost || 0),
      }
      return acc
    }, {} as Record<string, { count: number; totalCost: number }>)

    // Mouvements par jour
    const dailyMovements = await prisma.$queryRaw<{ date: Date; count: bigint; total_cost: number }[]>`
      SELECT DATE("createdAt") as date, COUNT(*) as count, COALESCE(SUM("totalCost"), 0) as total_cost
      FROM "StockMovement"
      WHERE "restaurantId" = ${restaurantId}
        AND "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    `

    res.json({
      success: true,
      data: {
        period: days,
        byType: summary,
        daily: dailyMovements.map(d => ({
          date: d.date,
          count: Number(d.count),
          totalCost: Number(d.total_cost),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/stock-movements/:id - Détail d'un mouvement
router.get('/:id', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const movement = await prisma.stockMovement.findFirst({
      where: { id: req.params.id, restaurantId },
      include: {
        ingredient: {
          select: { id: true, name: true, sku: true, unit: true, category: true },
        },
      },
    })

    if (!movement) {
      return next(new AppError('Mouvement non trouvé', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: movement.id,
        ingredientId: movement.ingredientId,
        ingredient: movement.ingredient,
        type: movement.type,
        quantity: Number(movement.quantity),
        unitCost: movement.unitCost ? Number(movement.unitCost) : null,
        totalCost: movement.totalCost ? Number(movement.totalCost) : null,
        reason: movement.reason,
        notes: movement.notes,
        reference: movement.reference,
        referenceType: movement.referenceType,
        performedBy: movement.performedBy,
        createdAt: movement.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/stock-movements - Créer un mouvement
router.post('/', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = createMovementSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: data.ingredientId, restaurantId },
    })

    if (!ingredient) {
      return next(new AppError('Ingrédient non trouvé', 404, 'INGREDIENT_NOT_FOUND'))
    }

    // Calculer le nouveau stock
    const currentStock = Number(ingredient.currentStock)
    let stockChange: number

    if (['PURCHASE', 'RETURN'].includes(data.type)) {
      stockChange = Math.abs(data.quantity)
    } else if (['SALE', 'WASTE', 'TRANSFER', 'PRODUCTION'].includes(data.type)) {
      stockChange = -Math.abs(data.quantity)
    } else {
      stockChange = data.quantity
    }

    const newStock = currentStock + stockChange

    if (newStock < 0) {
      return next(new AppError('Stock insuffisant pour cette opération', 400, 'INSUFFICIENT_STOCK'))
    }

    const unitCost = data.unitCost ?? Number(ingredient.unitCost)
    const totalCost = Math.abs(data.quantity) * unitCost

    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          restaurantId,
          ingredientId: data.ingredientId,
          type: data.type,
          quantity: data.quantity,
          unitCost,
          totalCost,
          reason: data.reason,
          notes: data.notes,
          reference: data.reference,
          referenceType: data.referenceType,
          performedBy: req.user?.userId,
        },
        include: {
          ingredient: {
            select: { id: true, name: true, unit: true },
          },
        },
      }),
      prisma.ingredient.update({
        where: { id: data.ingredientId },
        data: { currentStock: newStock },
      }),
    ])

    // Vérifier alertes stock bas
    if (ingredient.reorderPoint && newStock <= Number(ingredient.reorderPoint)) {
      const existingAlert = await prisma.stockAlert.findFirst({
        where: {
          ingredientId: ingredient.id,
          type: newStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          isRead: false,
        },
      })

      if (!existingAlert) {
        await prisma.stockAlert.create({
          data: {
            restaurantId,
            ingredientId: ingredient.id,
            type: newStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            threshold: ingredient.reorderPoint,
            currentStock: newStock,
          },
        })
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: movement.id,
        ingredientId: movement.ingredientId,
        ingredient: movement.ingredient,
        type: movement.type,
        quantity: Number(movement.quantity),
        unitCost: Number(movement.unitCost),
        totalCost: Number(movement.totalCost),
        newStock,
        createdAt: movement.createdAt,
      },
      message: 'Mouvement de stock créé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/stock-movements/bulk - Créer plusieurs mouvements
router.post('/bulk', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = bulkMovementSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    // Vérifier tous les ingrédients
    const ingredientIds = data.items.map(i => i.ingredientId)
    const ingredients = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds }, restaurantId },
    })

    if (ingredients.length !== ingredientIds.length) {
      return next(new AppError('Un ou plusieurs ingrédients non trouvés', 404, 'INGREDIENT_NOT_FOUND'))
    }

    const ingredientMap = new Map(ingredients.map(i => [i.id, i]))

    // Vérifier les stocks
    for (const item of data.items) {
      const ingredient = ingredientMap.get(item.ingredientId)!
      const currentStock = Number(ingredient.currentStock)
      let stockChange: number

      if (['PURCHASE', 'RETURN'].includes(data.type)) {
        stockChange = Math.abs(item.quantity)
      } else if (['SALE', 'WASTE', 'TRANSFER', 'PRODUCTION'].includes(data.type)) {
        stockChange = -Math.abs(item.quantity)
      } else {
        stockChange = item.quantity
      }

      if (currentStock + stockChange < 0) {
        return next(new AppError(
          `Stock insuffisant pour ${ingredient.name}`,
          400,
          'INSUFFICIENT_STOCK'
        ))
      }
    }

    // Créer les mouvements en transaction
    const results = await prisma.$transaction(async (tx) => {
      const movements = []

      for (const item of data.items) {
        const ingredient = ingredientMap.get(item.ingredientId)!
        const currentStock = Number(ingredient.currentStock)
        let stockChange: number

        if (['PURCHASE', 'RETURN'].includes(data.type)) {
          stockChange = Math.abs(item.quantity)
        } else if (['SALE', 'WASTE', 'TRANSFER', 'PRODUCTION'].includes(data.type)) {
          stockChange = -Math.abs(item.quantity)
        } else {
          stockChange = item.quantity
        }

        const newStock = currentStock + stockChange
        const unitCost = item.unitCost ?? Number(ingredient.unitCost)
        const totalCost = Math.abs(item.quantity) * unitCost

        const movement = await tx.stockMovement.create({
          data: {
            restaurantId,
            ingredientId: item.ingredientId,
            type: data.type,
            quantity: item.quantity,
            unitCost,
            totalCost,
            reason: data.reason,
            notes: data.notes,
            performedBy: req.user?.userId,
          },
        })

        await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: { currentStock: newStock },
        })

        movements.push({
          id: movement.id,
          ingredientId: movement.ingredientId,
          ingredientName: ingredient.name,
          quantity: Number(movement.quantity),
          newStock,
        })
      }

      return movements
    })

    res.status(201).json({
      success: true,
      data: {
        count: results.length,
        movements: results,
      },
      message: `${results.length} mouvement(s) créé(s) avec succès`,
    })
  } catch (error) {
    next(error)
  }
})

export { router as stockMovementsRoutes }
