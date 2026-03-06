import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

// Schémas de validation
const ingredientUnitEnum = z.enum(['UNIT', 'GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'PORTION'])

const createIngredientSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  sku: z.string().max(50).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  unit: ingredientUnitEnum.optional().default('UNIT'),
  unitCost: z.number().min(0).optional().default(0),
  currentStock: z.number().min(0).optional().default(0),
  minStock: z.number().min(0).optional().nullable(),
  maxStock: z.number().min(0).optional().nullable(),
  reorderPoint: z.number().min(0).optional().nullable(),
  supplierId: z.string().optional().nullable(),
  isTracked: z.boolean().optional().default(true),
  expirationDays: z.number().int().min(0).optional().nullable(),
})

const updateIngredientSchema = createIngredientSchema.partial()

const adjustStockSchema = z.object({
  quantity: z.number(),
  type: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'WASTE', 'TRANSFER', 'RETURN', 'PRODUCTION']),
  reason: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  unitCost: z.number().min(0).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  referenceType: z.string().max(50).optional().nullable(),
})

const addSupplierSchema = z.object({
  supplierId: z.string().min(1, 'Fournisseur requis'),
  unitCost: z.number().min(0),
  isPreferred: z.boolean().optional().default(false),
  leadTimeDays: z.number().int().min(0).optional().nullable(),
  minOrderQty: z.number().min(0).optional().nullable(),
})

// GET /restaurant/ingredients - Liste des ingrédients
router.get('/', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const {
      search,
      category,
      supplierId,
      lowStock,
      isTracked,
      sortBy = 'name',
      sortOrder = 'asc',
      page = '1',
      limit = '50',
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50))
    const skip = (pageNum - 1) * limitNum

    const where: any = { restaurantId }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category && typeof category === 'string') {
      where.category = category
    }

    if (supplierId && typeof supplierId === 'string') {
      where.supplierId = supplierId
    }

    if (lowStock === 'true') {
      where.AND = [
        { reorderPoint: { not: null } },
        { currentStock: { lte: prisma.ingredient.fields.reorderPoint } },
      ]
    }

    if (isTracked !== undefined) {
      where.isTracked = isTracked === 'true'
    }

    const orderBy: any = {}
    const validSortFields = ['name', 'category', 'currentStock', 'unitCost', 'createdAt', 'updatedAt']
    if (validSortFields.includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc'
    } else {
      orderBy.name = 'asc'
    }

    const [ingredients, total, lowStockCount, categories] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          supplier: {
            select: { id: true, name: true },
          },
          _count: {
            select: { stockMovements: true, recipeIngredients: true },
          },
        },
      }),
      prisma.ingredient.count({ where }),
      prisma.ingredient.count({
        where: {
          restaurantId,
          isTracked: true,
          reorderPoint: { not: null },
          currentStock: { lte: prisma.ingredient.fields.reorderPoint },
        },
      }),
      prisma.ingredient.findMany({
        where: { restaurantId, category: { not: null } },
        select: { category: true },
        distinct: ['category'],
      }),
    ])

    // Calculer la valeur totale du stock
    const stockValue = await prisma.ingredient.aggregate({
      where: { restaurantId, isTracked: true },
      _sum: {
        currentStock: true,
      },
    })

    const totalValue = ingredients.reduce((sum, ing) => {
      return sum + Number(ing.currentStock) * Number(ing.unitCost)
    }, 0)

    res.json({
      success: true,
      data: {
        items: ingredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          sku: ing.sku,
          category: ing.category,
          unit: ing.unit,
          unitCost: Number(ing.unitCost),
          currentStock: Number(ing.currentStock),
          minStock: ing.minStock ? Number(ing.minStock) : null,
          maxStock: ing.maxStock ? Number(ing.maxStock) : null,
          reorderPoint: ing.reorderPoint ? Number(ing.reorderPoint) : null,
          supplierId: ing.supplierId,
          supplier: ing.supplier,
          isTracked: ing.isTracked,
          expirationDays: ing.expirationDays,
          movementsCount: ing._count.stockMovements,
          recipesCount: ing._count.recipeIngredients,
          isLowStock: ing.reorderPoint ? Number(ing.currentStock) <= Number(ing.reorderPoint) : false,
          createdAt: ing.createdAt,
          updatedAt: ing.updatedAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        stats: {
          total,
          lowStockCount,
          totalValue,
          categories: categories.map(c => c.category).filter(Boolean),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/ingredients/categories - Liste des catégories
router.get('/categories', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const categories = await prisma.ingredient.findMany({
      where: { restaurantId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    res.json({
      success: true,
      data: categories.map(c => c.category).filter(Boolean),
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/ingredients/low-stock - Ingrédients en stock bas
router.get('/low-stock', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const ingredients = await prisma.$queryRaw`
      SELECT id, name, sku, category, unit, "unitCost", "currentStock", "reorderPoint", "minStock"
      FROM "Ingredient"
      WHERE "restaurantId" = ${restaurantId}
        AND "isTracked" = true
        AND "reorderPoint" IS NOT NULL
        AND "currentStock" <= "reorderPoint"
      ORDER BY ("currentStock" / NULLIF("reorderPoint", 0)) ASC
      LIMIT 20
    `

    res.json({
      success: true,
      data: ingredients,
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/ingredients/stats - Statistiques inventaire
router.get('/stats', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalIngredients,
      trackedIngredients,
      lowStockIngredients,
      outOfStockIngredients,
      movementsToday,
      expiringBatches,
    ] = await Promise.all([
      prisma.ingredient.count({ where: { restaurantId } }),
      prisma.ingredient.count({ where: { restaurantId, isTracked: true } }),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM "Ingredient"
        WHERE "restaurantId" = ${restaurantId}
          AND "isTracked" = true
          AND "reorderPoint" IS NOT NULL
          AND "currentStock" <= "reorderPoint"
          AND "currentStock" > 0
      `,
      prisma.ingredient.count({
        where: { restaurantId, isTracked: true, currentStock: { lte: 0 } },
      }),
      prisma.stockMovement.count({
        where: { restaurantId, createdAt: { gte: today } },
      }),
      prisma.ingredientBatch.count({
        where: {
          restaurantId,
          isActive: true,
          expirationDate: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
            gte: new Date(),
          },
        },
      }),
    ])

    // Valeur totale du stock
    const ingredients = await prisma.ingredient.findMany({
      where: { restaurantId, isTracked: true },
      select: { currentStock: true, unitCost: true },
    })

    const totalValue = ingredients.reduce((sum, ing) => {
      return sum + Number(ing.currentStock) * Number(ing.unitCost)
    }, 0)

    // Top catégories par valeur
    const categoryValues = await prisma.ingredient.groupBy({
      by: ['category'],
      where: { restaurantId, isTracked: true, category: { not: null } },
      _sum: { currentStock: true },
    })

    res.json({
      success: true,
      data: {
        totalIngredients,
        trackedIngredients,
        lowStockCount: Number(lowStockIngredients[0]?.count || 0),
        outOfStockCount: outOfStockIngredients,
        movementsToday,
        expiringBatches,
        totalValue,
        topCategories: categoryValues.slice(0, 5).map(c => ({
          name: c.category,
          count: Number(c._sum.currentStock || 0),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/ingredients/:id - Détail d'un ingrédient
router.get('/:id', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: req.params.id, restaurantId },
      include: {
        supplier: true,
        suppliers: {
          include: {
            supplier: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
        stockMovements: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        recipeIngredients: {
          include: {
            recipe: {
              select: { id: true, name: true },
            },
          },
        },
        batches: {
          where: { isActive: true },
          orderBy: { expirationDate: 'asc' },
          take: 10,
        },
        priceHistory: {
          take: 10,
          orderBy: { effectiveDate: 'desc' },
        },
        alerts: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!ingredient) {
      return next(new AppError('Ingrédient non trouvé', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: ingredient.id,
        name: ingredient.name,
        sku: ingredient.sku,
        category: ingredient.category,
        unit: ingredient.unit,
        unitCost: Number(ingredient.unitCost),
        currentStock: Number(ingredient.currentStock),
        minStock: ingredient.minStock ? Number(ingredient.minStock) : null,
        maxStock: ingredient.maxStock ? Number(ingredient.maxStock) : null,
        reorderPoint: ingredient.reorderPoint ? Number(ingredient.reorderPoint) : null,
        supplierId: ingredient.supplierId,
        supplier: ingredient.supplier,
        suppliers: ingredient.suppliers.map(s => ({
          id: s.id,
          supplierId: s.supplierId,
          supplier: s.supplier,
          unitCost: Number(s.unitCost),
          isPreferred: s.isPreferred,
          leadTimeDays: s.leadTimeDays,
          minOrderQty: s.minOrderQty ? Number(s.minOrderQty) : null,
        })),
        isTracked: ingredient.isTracked,
        expirationDays: ingredient.expirationDays,
        stockMovements: ingredient.stockMovements.map(m => ({
          id: m.id,
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
        recipes: ingredient.recipeIngredients.map(ri => ({
          id: ri.recipe.id,
          name: ri.recipe.name,
          quantity: Number(ri.quantity),
          unit: ri.unit,
        })),
        batches: ingredient.batches.map(b => ({
          id: b.id,
          batchNumber: b.batchNumber,
          quantity: Number(b.quantity),
          remainingQty: Number(b.remainingQty),
          unitCost: Number(b.unitCost),
          expirationDate: b.expirationDate,
          receivedAt: b.receivedAt,
        })),
        priceHistory: ingredient.priceHistory.map(p => ({
          id: p.id,
          unitCost: Number(p.unitCost),
          effectiveDate: p.effectiveDate,
          changedBy: p.changedBy,
          reason: p.reason,
        })),
        alerts: ingredient.alerts,
        isLowStock: ingredient.reorderPoint ? Number(ingredient.currentStock) <= Number(ingredient.reorderPoint) : false,
        createdAt: ingredient.createdAt,
        updatedAt: ingredient.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/ingredients - Créer un ingrédient
router.post('/', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = createIngredientSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    // Vérifier unicité du nom
    const existing = await prisma.ingredient.findFirst({
      where: { restaurantId, name: data.name },
    })

    if (existing) {
      return next(new AppError('Un ingrédient avec ce nom existe déjà', 400, 'DUPLICATE_NAME'))
    }

    // Vérifier que le fournisseur existe
    if (data.supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: data.supplierId, restaurantId },
      })
      if (!supplier) {
        return next(new AppError('Fournisseur non trouvé', 404, 'SUPPLIER_NOT_FOUND'))
      }
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        restaurantId,
        name: data.name,
        sku: data.sku,
        category: data.category,
        unit: data.unit,
        unitCost: data.unitCost,
        currentStock: data.currentStock,
        minStock: data.minStock,
        maxStock: data.maxStock,
        reorderPoint: data.reorderPoint,
        supplierId: data.supplierId,
        isTracked: data.isTracked,
        expirationDays: data.expirationDays,
      },
      include: {
        supplier: {
          select: { id: true, name: true },
        },
      },
    })

    // Créer le mouvement de stock initial si stock > 0
    if (data.currentStock && data.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          restaurantId,
          ingredientId: ingredient.id,
          type: 'ADJUSTMENT',
          quantity: data.currentStock,
          unitCost: data.unitCost,
          totalCost: data.currentStock * data.unitCost,
          reason: 'Stock initial',
          performedBy: req.user?.userId,
        },
      })
    }

    res.status(201).json({
      success: true,
      data: {
        id: ingredient.id,
        name: ingredient.name,
        sku: ingredient.sku,
        category: ingredient.category,
        unit: ingredient.unit,
        unitCost: Number(ingredient.unitCost),
        currentStock: Number(ingredient.currentStock),
        minStock: ingredient.minStock ? Number(ingredient.minStock) : null,
        maxStock: ingredient.maxStock ? Number(ingredient.maxStock) : null,
        reorderPoint: ingredient.reorderPoint ? Number(ingredient.reorderPoint) : null,
        supplierId: ingredient.supplierId,
        supplier: ingredient.supplier,
        isTracked: ingredient.isTracked,
        expirationDays: ingredient.expirationDays,
        createdAt: ingredient.createdAt,
      },
      message: 'Ingrédient créé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/ingredients/:id - Modifier un ingrédient
router.put('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = updateIngredientSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const existing = await prisma.ingredient.findFirst({
      where: { id: req.params.id, restaurantId },
    })

    if (!existing) {
      return next(new AppError('Ingrédient non trouvé', 404, 'NOT_FOUND'))
    }

    // Vérifier unicité du nom si modifié
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.ingredient.findFirst({
        where: { restaurantId, name: data.name, id: { not: req.params.id } },
      })
      if (duplicate) {
        return next(new AppError('Un ingrédient avec ce nom existe déjà', 400, 'DUPLICATE_NAME'))
      }
    }

    // Vérifier fournisseur si modifié
    if (data.supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: data.supplierId, restaurantId },
      })
      if (!supplier) {
        return next(new AppError('Fournisseur non trouvé', 404, 'SUPPLIER_NOT_FOUND'))
      }
    }

    // Enregistrer l'historique de prix si le coût change
    if (data.unitCost !== undefined && Number(data.unitCost) !== Number(existing.unitCost)) {
      await prisma.ingredientPriceHistory.create({
        data: {
          ingredientId: existing.id,
          unitCost: data.unitCost,
          changedBy: req.user?.userId,
          reason: 'Modification manuelle',
        },
      })
    }

    const ingredient = await prisma.ingredient.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.unitCost !== undefined && { unitCost: data.unitCost }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.maxStock !== undefined && { maxStock: data.maxStock }),
        ...(data.reorderPoint !== undefined && { reorderPoint: data.reorderPoint }),
        ...(data.supplierId !== undefined && { supplierId: data.supplierId }),
        ...(data.isTracked !== undefined && { isTracked: data.isTracked }),
        ...(data.expirationDays !== undefined && { expirationDays: data.expirationDays }),
      },
      include: {
        supplier: {
          select: { id: true, name: true },
        },
      },
    })

    res.json({
      success: true,
      data: {
        id: ingredient.id,
        name: ingredient.name,
        sku: ingredient.sku,
        category: ingredient.category,
        unit: ingredient.unit,
        unitCost: Number(ingredient.unitCost),
        currentStock: Number(ingredient.currentStock),
        minStock: ingredient.minStock ? Number(ingredient.minStock) : null,
        maxStock: ingredient.maxStock ? Number(ingredient.maxStock) : null,
        reorderPoint: ingredient.reorderPoint ? Number(ingredient.reorderPoint) : null,
        supplierId: ingredient.supplierId,
        supplier: ingredient.supplier,
        isTracked: ingredient.isTracked,
        expirationDays: ingredient.expirationDays,
        updatedAt: ingredient.updatedAt,
      },
      message: 'Ingrédient modifié avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/ingredients/:id - Supprimer un ingrédient
router.delete('/:id', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: req.params.id, restaurantId },
      include: {
        _count: {
          select: { recipeIngredients: true },
        },
      },
    })

    if (!ingredient) {
      return next(new AppError('Ingrédient non trouvé', 404, 'NOT_FOUND'))
    }

    if (ingredient._count.recipeIngredients > 0) {
      return next(new AppError(
        `Cet ingrédient est utilisé dans ${ingredient._count.recipeIngredients} recette(s). Supprimez d'abord les recettes associées.`,
        400,
        'INGREDIENT_IN_USE'
      ))
    }

    await prisma.ingredient.delete({
      where: { id: req.params.id },
    })

    res.json({
      success: true,
      message: 'Ingrédient supprimé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/ingredients/:id/stock - Ajuster le stock
router.patch('/:id/stock', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = adjustStockSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: req.params.id, restaurantId },
    })

    if (!ingredient) {
      return next(new AppError('Ingrédient non trouvé', 404, 'NOT_FOUND'))
    }

    // Calculer le nouveau stock
    const currentStock = Number(ingredient.currentStock)
    let newStock: number

    // Pour les types qui ajoutent du stock
    if (['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(data.type) && data.quantity > 0) {
      newStock = currentStock + Math.abs(data.quantity)
    } else if (['SALE', 'WASTE', 'TRANSFER', 'PRODUCTION'].includes(data.type)) {
      newStock = currentStock - Math.abs(data.quantity)
    } else if (data.type === 'ADJUSTMENT') {
      // Pour un ajustement, la quantité peut être positive ou négative
      newStock = currentStock + data.quantity
    } else {
      newStock = currentStock + data.quantity
    }

    // Empêcher le stock négatif
    if (newStock < 0) {
      return next(new AppError('Stock insuffisant pour cette opération', 400, 'INSUFFICIENT_STOCK'))
    }

    // Créer le mouvement de stock
    const movement = await prisma.stockMovement.create({
      data: {
        restaurantId,
        ingredientId: ingredient.id,
        type: data.type,
        quantity: data.quantity,
        unitCost: data.unitCost ?? Number(ingredient.unitCost),
        totalCost: data.unitCost ? Math.abs(data.quantity) * data.unitCost : Math.abs(data.quantity) * Number(ingredient.unitCost),
        reason: data.reason,
        notes: data.notes,
        reference: data.reference,
        referenceType: data.referenceType,
        performedBy: req.user?.userId,
      },
    })

    // Mettre à jour le stock
    const updatedIngredient = await prisma.ingredient.update({
      where: { id: ingredient.id },
      data: { currentStock: newStock },
    })

    // Vérifier si une alerte stock bas doit être créée
    if (updatedIngredient.reorderPoint && newStock <= Number(updatedIngredient.reorderPoint)) {
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
            threshold: updatedIngredient.reorderPoint,
            currentStock: newStock,
          },
        })
      }
    }

    res.json({
      success: true,
      data: {
        ingredient: {
          id: updatedIngredient.id,
          name: updatedIngredient.name,
          currentStock: Number(updatedIngredient.currentStock),
          isLowStock: updatedIngredient.reorderPoint ? newStock <= Number(updatedIngredient.reorderPoint) : false,
        },
        movement: {
          id: movement.id,
          type: movement.type,
          quantity: Number(movement.quantity),
          createdAt: movement.createdAt,
        },
      },
      message: 'Stock ajusté avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/ingredients/:id/suppliers - Ajouter un fournisseur à un ingrédient
router.post('/:id/suppliers', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = addSupplierSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: req.params.id, restaurantId },
    })

    if (!ingredient) {
      return next(new AppError('Ingrédient non trouvé', 404, 'NOT_FOUND'))
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: data.supplierId, restaurantId },
    })

    if (!supplier) {
      return next(new AppError('Fournisseur non trouvé', 404, 'SUPPLIER_NOT_FOUND'))
    }

    // Vérifier si la relation existe déjà
    const existing = await prisma.ingredientSupplier.findFirst({
      where: { ingredientId: ingredient.id, supplierId: data.supplierId },
    })

    if (existing) {
      return next(new AppError('Ce fournisseur est déjà associé à cet ingrédient', 400, 'DUPLICATE_SUPPLIER'))
    }

    // Si c'est le fournisseur préféré, retirer le statut des autres
    if (data.isPreferred) {
      await prisma.ingredientSupplier.updateMany({
        where: { ingredientId: ingredient.id },
        data: { isPreferred: false },
      })
    }

    const ingredientSupplier = await prisma.ingredientSupplier.create({
      data: {
        ingredientId: ingredient.id,
        supplierId: data.supplierId,
        unitCost: data.unitCost,
        isPreferred: data.isPreferred,
        leadTimeDays: data.leadTimeDays,
        minOrderQty: data.minOrderQty,
      },
      include: {
        supplier: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: ingredientSupplier.id,
        supplierId: ingredientSupplier.supplierId,
        supplier: ingredientSupplier.supplier,
        unitCost: Number(ingredientSupplier.unitCost),
        isPreferred: ingredientSupplier.isPreferred,
        leadTimeDays: ingredientSupplier.leadTimeDays,
        minOrderQty: ingredientSupplier.minOrderQty ? Number(ingredientSupplier.minOrderQty) : null,
      },
      message: 'Fournisseur ajouté avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/ingredients/:id/suppliers/:supplierId - Retirer un fournisseur
router.delete('/:id/suppliers/:supplierId', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: req.params.id, restaurantId },
    })

    if (!ingredient) {
      return next(new AppError('Ingrédient non trouvé', 404, 'NOT_FOUND'))
    }

    const ingredientSupplier = await prisma.ingredientSupplier.findFirst({
      where: { ingredientId: ingredient.id, supplierId: req.params.supplierId },
    })

    if (!ingredientSupplier) {
      return next(new AppError('Relation fournisseur non trouvée', 404, 'NOT_FOUND'))
    }

    await prisma.ingredientSupplier.delete({
      where: { id: ingredientSupplier.id },
    })

    res.json({
      success: true,
      message: 'Fournisseur retiré avec succès',
    })
  } catch (error) {
    next(error)
  }
})

export { router as ingredientsRoutes }
