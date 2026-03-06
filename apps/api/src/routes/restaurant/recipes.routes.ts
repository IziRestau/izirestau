import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

// Schémas de validation
const recipeIngredientSchema = z.object({
  ingredientId: z.string().min(1, 'Ingrédient requis'),
  quantity: z.number().positive('Quantité doit être positive'),
  unit: z.string().min(1, 'Unité requise'),
  notes: z.string().max(200).optional().nullable(),
  isOptional: z.boolean().optional().default(false),
})

const createRecipeSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  description: z.string().max(2000).optional().nullable(),
  yieldQuantity: z.number().positive().optional().default(1),
  yieldUnit: z.string().max(50).optional().default('portion'),
  prepTime: z.number().int().min(0).optional().nullable(),
  cookTime: z.number().int().min(0).optional().nullable(),
  instructions: z.string().max(5000).optional().nullable(),
  ingredients: z.array(recipeIngredientSchema).min(1, 'Au moins un ingrédient requis'),
  isActive: z.boolean().optional().default(true),
})

const updateRecipeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  yieldQuantity: z.number().positive().optional(),
  yieldUnit: z.string().max(50).optional(),
  prepTime: z.number().int().min(0).optional().nullable(),
  cookTime: z.number().int().min(0).optional().nullable(),
  instructions: z.string().max(5000).optional().nullable(),
  ingredients: z.array(recipeIngredientSchema).optional(),
  isActive: z.boolean().optional(),
})

// Fonction utilitaire pour calculer le coût d'une recette
async function calculateRecipeCost(recipeId: string): Promise<{ totalCost: number; costPerUnit: number }> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: {
          ingredient: {
            select: { unitCost: true, unit: true },
          },
        },
      },
    },
  })

  if (!recipe) {
    return { totalCost: 0, costPerUnit: 0 }
  }

  let totalCost = 0
  for (const ri of recipe.ingredients) {
    const ingredientCost = Number(ri.ingredient.unitCost)
    const quantity = Number(ri.quantity)
    totalCost += ingredientCost * quantity
  }

  const yieldQty = Number(recipe.yieldQuantity) || 1
  const costPerUnit = totalCost / yieldQty

  return { totalCost, costPerUnit }
}

// GET /restaurant/recipes - Liste des recettes
router.get('/', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const {
      search,
      isActive,
      hasProduct,
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
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    if (hasProduct !== undefined) {
      if (hasProduct === 'true') {
        where.products = { some: {} }
      } else {
        where.products = { none: {} }
      }
    }

    const orderBy: any = {}
    const validSortFields = ['name', 'totalCost', 'costPerUnit', 'createdAt', 'updatedAt']
    if (validSortFields.includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc'
    } else {
      orderBy.name = 'asc'
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          ingredients: {
            include: {
              ingredient: {
                select: { id: true, name: true, unit: true },
              },
            },
          },
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.recipe.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        items: recipes.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          yieldQuantity: Number(r.yieldQuantity),
          yieldUnit: r.yieldUnit,
          prepTime: r.prepTime,
          cookTime: r.cookTime,
          totalCost: r.totalCost ? Number(r.totalCost) : null,
          costPerUnit: r.costPerUnit ? Number(r.costPerUnit) : null,
          ingredientsCount: r.ingredients.length,
          productsCount: r._count.products,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
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

// GET /restaurant/recipes/stats - Statistiques recettes
router.get('/stats', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const [totalRecipes, activeRecipes, recipesWithProducts, avgCost] = await Promise.all([
      prisma.recipe.count({ where: { restaurantId } }),
      prisma.recipe.count({ where: { restaurantId, isActive: true } }),
      prisma.recipe.count({ where: { restaurantId, products: { some: {} } } }),
      prisma.recipe.aggregate({
        where: { restaurantId, isActive: true, costPerUnit: { not: null } },
        _avg: { costPerUnit: true },
      }),
    ])

    res.json({
      success: true,
      data: {
        totalRecipes,
        activeRecipes,
        inactiveRecipes: totalRecipes - activeRecipes,
        recipesWithProducts,
        recipesWithoutProducts: totalRecipes - recipesWithProducts,
        averageCostPerUnit: avgCost._avg.costPerUnit ? Number(avgCost._avg.costPerUnit) : 0,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/recipes/:id - Détail d'une recette
router.get('/:id', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, restaurantId },
      include: {
        ingredients: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
                unitCost: true,
                currentStock: true,
              },
            },
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
          },
        },
      },
    })

    if (!recipe) {
      return next(new AppError('Recette non trouvée', 404, 'NOT_FOUND'))
    }

    // Calculer le coût de chaque ingrédient
    const ingredientsWithCost = recipe.ingredients.map(ri => {
      const ingredientCost = Number(ri.ingredient.unitCost)
      const quantity = Number(ri.quantity)
      const lineCost = ingredientCost * quantity

      return {
        id: ri.id,
        ingredientId: ri.ingredientId,
        ingredient: {
          id: ri.ingredient.id,
          name: ri.ingredient.name,
          sku: ri.ingredient.sku,
          unit: ri.ingredient.unit,
          unitCost: Number(ri.ingredient.unitCost),
          currentStock: Number(ri.ingredient.currentStock),
        },
        quantity: quantity,
        unit: ri.unit,
        notes: ri.notes,
        isOptional: ri.isOptional,
        lineCost,
      }
    })

    // Vérifier la disponibilité du stock
    const yieldQty = Number(recipe.yieldQuantity) || 1
    const canProduce = Math.floor(Math.min(
      ...ingredientsWithCost
        .filter(i => !i.isOptional)
        .map(i => i.ingredient.currentStock / (i.quantity / yieldQty))
    ))

    res.json({
      success: true,
      data: {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        yieldQuantity: Number(recipe.yieldQuantity),
        yieldUnit: recipe.yieldUnit,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        totalTime: (recipe.prepTime || 0) + (recipe.cookTime || 0),
        instructions: recipe.instructions,
        totalCost: recipe.totalCost ? Number(recipe.totalCost) : null,
        costPerUnit: recipe.costPerUnit ? Number(recipe.costPerUnit) : null,
        ingredients: ingredientsWithCost,
        products: recipe.products.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          isActive: p.isActive,
          margin: recipe.costPerUnit ? Number(p.price) - Number(recipe.costPerUnit) : null,
          marginPercent: recipe.costPerUnit && Number(p.price) > 0
            ? ((Number(p.price) - Number(recipe.costPerUnit)) / Number(p.price)) * 100
            : null,
        })),
        canProduce: isFinite(canProduce) ? canProduce : 0,
        isActive: recipe.isActive,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/recipes - Créer une recette
router.post('/', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = createRecipeSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    // Vérifier que tous les ingrédients existent
    const ingredientIds = data.ingredients.map(i => i.ingredientId)
    const ingredients = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds }, restaurantId },
    })

    if (ingredients.length !== ingredientIds.length) {
      return next(new AppError('Un ou plusieurs ingrédients non trouvés', 404, 'INGREDIENT_NOT_FOUND'))
    }

    const ingredientMap = new Map(ingredients.map(i => [i.id, i]))

    // Calculer le coût total
    let totalCost = 0
    for (const item of data.ingredients) {
      const ingredient = ingredientMap.get(item.ingredientId)!
      totalCost += Number(ingredient.unitCost) * item.quantity
    }

    const costPerUnit = totalCost / data.yieldQuantity

    const recipe = await prisma.recipe.create({
      data: {
        restaurantId,
        name: data.name,
        description: data.description,
        yieldQuantity: data.yieldQuantity,
        yieldUnit: data.yieldUnit,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        instructions: data.instructions,
        totalCost,
        costPerUnit,
        isActive: data.isActive,
        ingredients: {
          create: data.ingredients.map(i => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            unit: i.unit,
            notes: i.notes,
            isOptional: i.isOptional,
          })),
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: {
              select: { id: true, name: true, unit: true },
            },
          },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        yieldQuantity: Number(recipe.yieldQuantity),
        yieldUnit: recipe.yieldUnit,
        totalCost: Number(recipe.totalCost),
        costPerUnit: Number(recipe.costPerUnit),
        ingredientsCount: recipe.ingredients.length,
        createdAt: recipe.createdAt,
      },
      message: 'Recette créée avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/recipes/:id - Modifier une recette
router.put('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = updateRecipeSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const existing = await prisma.recipe.findFirst({
      where: { id: req.params.id, restaurantId },
    })

    if (!existing) {
      return next(new AppError('Recette non trouvée', 404, 'NOT_FOUND'))
    }

    let totalCost: number | undefined
    let costPerUnit: number | undefined

    // Si les ingrédients sont mis à jour, recalculer le coût
    if (data.ingredients) {
      const ingredientIds = data.ingredients.map(i => i.ingredientId)
      const ingredients = await prisma.ingredient.findMany({
        where: { id: { in: ingredientIds }, restaurantId },
      })

      if (ingredients.length !== ingredientIds.length) {
        return next(new AppError('Un ou plusieurs ingrédients non trouvés', 404, 'INGREDIENT_NOT_FOUND'))
      }

      const ingredientMap = new Map(ingredients.map(i => [i.id, i]))

      totalCost = 0
      for (const item of data.ingredients) {
        const ingredient = ingredientMap.get(item.ingredientId)!
        totalCost += Number(ingredient.unitCost) * item.quantity
      }

      const yieldQty = data.yieldQuantity ?? Number(existing.yieldQuantity)
      costPerUnit = totalCost / yieldQty
    }

    const recipe = await prisma.$transaction(async (tx) => {
      // Supprimer les anciens ingrédients si mis à jour
      if (data.ingredients) {
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: req.params.id },
        })
      }

      return tx.recipe.update({
        where: { id: req.params.id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.yieldQuantity !== undefined && { yieldQuantity: data.yieldQuantity }),
          ...(data.yieldUnit !== undefined && { yieldUnit: data.yieldUnit }),
          ...(data.prepTime !== undefined && { prepTime: data.prepTime }),
          ...(data.cookTime !== undefined && { cookTime: data.cookTime }),
          ...(data.instructions !== undefined && { instructions: data.instructions }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(totalCost !== undefined && { totalCost }),
          ...(costPerUnit !== undefined && { costPerUnit }),
          ...(data.ingredients && {
            ingredients: {
              create: data.ingredients.map(i => ({
                ingredientId: i.ingredientId,
                quantity: i.quantity,
                unit: i.unit,
                notes: i.notes,
                isOptional: i.isOptional,
              })),
            },
          }),
        },
        include: {
          ingredients: {
            include: {
              ingredient: {
                select: { id: true, name: true, unit: true },
              },
            },
          },
        },
      })
    })

    res.json({
      success: true,
      data: {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        yieldQuantity: Number(recipe.yieldQuantity),
        yieldUnit: recipe.yieldUnit,
        totalCost: recipe.totalCost ? Number(recipe.totalCost) : null,
        costPerUnit: recipe.costPerUnit ? Number(recipe.costPerUnit) : null,
        ingredientsCount: recipe.ingredients.length,
        updatedAt: recipe.updatedAt,
      },
      message: 'Recette modifiée avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/recipes/:id - Supprimer une recette
router.delete('/:id', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, restaurantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!recipe) {
      return next(new AppError('Recette non trouvée', 404, 'NOT_FOUND'))
    }

    if (recipe._count.products > 0) {
      return next(new AppError(
        `Cette recette est utilisée par ${recipe._count.products} produit(s). Retirez d'abord les associations.`,
        400,
        'RECIPE_IN_USE'
      ))
    }

    await prisma.recipe.delete({
      where: { id: req.params.id },
    })

    res.json({
      success: true,
      message: 'Recette supprimée avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/recipes/:id/recalculate - Recalculer le coût
router.post('/:id/recalculate', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const existing = await prisma.recipe.findFirst({
      where: { id: req.params.id, restaurantId },
    })

    if (!existing) {
      return next(new AppError('Recette non trouvée', 404, 'NOT_FOUND'))
    }

    const { totalCost, costPerUnit } = await calculateRecipeCost(req.params.id)

    const recipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: { totalCost, costPerUnit },
    })

    res.json({
      success: true,
      data: {
        id: recipe.id,
        name: recipe.name,
        totalCost: Number(recipe.totalCost),
        costPerUnit: Number(recipe.costPerUnit),
      },
      message: 'Coût recalculé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/recipes/:id/duplicate - Dupliquer une recette
router.post('/:id/duplicate', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const original = await prisma.recipe.findFirst({
      where: { id: req.params.id, restaurantId },
      include: {
        ingredients: true,
      },
    })

    if (!original) {
      return next(new AppError('Recette non trouvée', 404, 'NOT_FOUND'))
    }

    const { name } = req.body
    const newName = name || `${original.name} (copie)`

    const recipe = await prisma.recipe.create({
      data: {
        restaurantId,
        name: newName,
        description: original.description,
        yieldQuantity: original.yieldQuantity,
        yieldUnit: original.yieldUnit,
        prepTime: original.prepTime,
        cookTime: original.cookTime,
        instructions: original.instructions,
        totalCost: original.totalCost,
        costPerUnit: original.costPerUnit,
        isActive: false,
        ingredients: {
          create: original.ingredients.map(i => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            unit: i.unit,
            notes: i.notes,
            isOptional: i.isOptional,
          })),
        },
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: recipe.id,
        name: recipe.name,
      },
      message: 'Recette dupliquée avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/recipes/:id/toggle - Activer/désactiver une recette
router.patch('/:id/toggle', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, restaurantId },
    })

    if (!recipe) {
      return next(new AppError('Recette non trouvée', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.recipe.update({
      where: { id: req.params.id },
      data: { isActive: !recipe.isActive },
    })

    res.json({
      success: true,
      data: {
        id: updated.id,
        isActive: updated.isActive,
      },
      message: updated.isActive ? 'Recette activée' : 'Recette désactivée',
    })
  } catch (error) {
    next(error)
  }
})

export { router as recipesRoutes }
