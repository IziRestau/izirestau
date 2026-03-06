import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

// Schemas de validation
const createProductSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  nameEn: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  descriptionEn: z.string().max(2000).optional(),
  price: z.number().min(0, 'Prix invalide'),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  categoryId: z.string().cuid('Categorie requise'),
  taxRateId: z.string().cuid().optional().nullable(),
  taxIncluded: z.boolean().optional().default(true),
  image: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional().default([]),
  trackInventory: z.boolean().optional().default(false),
  stockQuantity: z.number().int().min(0).optional().default(0),
  lowStockAlert: z.number().int().min(0).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  calories: z.number().int().min(0).optional().nullable(),
  allergens: z.array(z.string()).optional().default([]),
  dietaryTags: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
  isVisible: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  prepTime: z.number().int().min(0).optional().nullable(),
  modifierGroupIds: z.array(z.string().cuid()).optional().default([]),
  recipeId: z.string().cuid().optional().nullable(),
})

const updateProductSchema = createProductSchema.partial()

const createVariantSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  nameEn: z.string().max(200).optional(),
  price: z.number().min(0, 'Prix invalide'),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  trackInventory: z.boolean().optional().default(false),
  stockQuantity: z.number().int().min(0).optional().default(0),
  image: z.string().url().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

const updateVariantSchema = createVariantSchema.partial()

const updateStockSchema = z.object({
  stockQuantity: z.number().int().min(0),
})

// Helper pour generer un slug unique
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /restaurant/products - Liste des produits
router.get('/', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const { categoryId, search, isActive, isFeatured, page = '1', limit = '20' } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20))
    const skip = (pageNum - 1) * limitNum

    const where: any = { restaurantId }

    if (categoryId && typeof categoryId === 'string') {
      where.categoryId = categoryId
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true'
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            select: {
              id: true,
              name: true,
              price: true,
              stockQuantity: true,
              isActive: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
          modifierGroups: {
            include: {
              modifierGroup: {
                include: {
                  modifiers: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      isDefault: true,
                    },
                  },
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: { variants: true, modifierGroups: true },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ])

    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      nameEn: p.nameEn,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      categoryId: p.categoryId,
      category: p.category,
      image: p.image,
      trackInventory: p.trackInventory,
      stockQuantity: p.stockQuantity,
      isActive: p.isActive,
      isVisible: p.isVisible,
      isFeatured: p.isFeatured,
      sortOrder: p.sortOrder,
      variantsCount: p._count.variants,
      modifierGroupsCount: p._count.modifierGroups,
      variants: p.variants.map(v => ({
        ...v,
        price: Number(v.price),
      })),
      modifierGroups: p.modifierGroups.map(pmg => ({
        id: pmg.modifierGroup.id,
        name: pmg.modifierGroup.name,
        type: pmg.modifierGroup.type,
        isRequired: pmg.modifierGroup.isRequired,
        minSelections: pmg.modifierGroup.minSelections,
        maxSelections: pmg.modifierGroup.maxSelections,
        modifiers: pmg.modifierGroup.modifiers.map(m => ({
          id: m.id,
          name: m.name,
          price: Number(m.price),
          isDefault: m.isDefault,
        })),
      })),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))

    res.json({
      success: true,
      data: formattedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/products/trending - Produits tendance
router.get('/trending', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    // Recuperer les produits les plus commandes des 30 derniers jours
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const trendingProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          restaurantId,
          createdAt: { gte: thirtyDaysAgo },
          status: { notIn: ['CANCELLED'] },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    })

    const productIds = trendingProducts.map(t => t.productId)

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        price: true,
      },
    })

    const productsMap = new Map(products.map(p => [p.id, p]))

    const result = trendingProducts
      .map(t => {
        const product = productsMap.get(t.productId)
        if (!product) return null
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.image,
          price: Number(product.price),
          totalSold: t._sum.quantity || 0,
        }
      })
      .filter(Boolean)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/products/:id - Detail d'un produit
router.get('/:id', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const product = await prisma.product.findFirst({
      where: { id, restaurantId },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        taxRate: {
          select: { id: true, name: true, rate: true },
        },
        variants: {
          orderBy: { sortOrder: 'asc' },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!product) {
      return next(new AppError('Produit non trouve', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        nameEn: product.nameEn,
        slug: product.slug,
        description: product.description,
        descriptionEn: product.descriptionEn,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        categoryId: product.categoryId,
        category: product.category,
        taxRateId: product.taxRateId,
        taxRate: product.taxRate ? {
          ...product.taxRate,
          rate: Number(product.taxRate.rate),
        } : null,
        taxIncluded: product.taxIncluded,
        image: product.image,
        images: product.images,
        trackInventory: product.trackInventory,
        stockQuantity: product.stockQuantity,
        lowStockAlert: product.lowStockAlert,
        sku: product.sku,
        barcode: product.barcode,
        calories: product.calories,
        allergens: product.allergens,
        dietaryTags: product.dietaryTags,
        isActive: product.isActive,
        isVisible: product.isVisible,
        isFeatured: product.isFeatured,
        prepTime: product.prepTime,
        sortOrder: product.sortOrder,
        recipeId: product.recipeId,
        variants: product.variants.map(v => ({
          id: v.id,
          name: v.name,
          nameEn: v.nameEn,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          costPrice: v.costPrice ? Number(v.costPrice) : null,
          sku: v.sku,
          barcode: v.barcode,
          trackInventory: v.trackInventory,
          stockQuantity: v.stockQuantity,
          image: v.image,
          isActive: v.isActive,
          sortOrder: v.sortOrder,
        })),
        modifierGroups: product.modifierGroups.map(pmg => ({
          id: pmg.modifierGroup.id,
          name: pmg.modifierGroup.name,
          nameEn: pmg.modifierGroup.nameEn,
          type: pmg.modifierGroup.type,
          minSelections: pmg.modifierGroup.minSelections,
          maxSelections: pmg.modifierGroup.maxSelections,
          isRequired: pmg.modifierGroup.isRequired,
          isActive: pmg.modifierGroup.isActive,
          sortOrder: pmg.sortOrder,
          modifiers: pmg.modifierGroup.modifiers.map(m => ({
            id: m.id,
            name: m.name,
            nameEn: m.nameEn,
            price: Number(m.price),
            isDefault: m.isDefault,
            isActive: m.isActive,
            sortOrder: m.sortOrder,
          })),
        })),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/products - Creer un produit
router.post('/', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = createProductSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    // Verifier que la categorie existe
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, restaurantId },
    })
    if (!category) {
      return next(new AppError('Categorie non trouvee', 404, 'CATEGORY_NOT_FOUND'))
    }

    // Generer un slug unique
    let slug = generateSlug(data.name)
    let slugSuffix = 0
    let slugExists = true

    while (slugExists) {
      const existingProduct = await prisma.product.findUnique({
        where: {
          restaurantId_slug: {
            restaurantId,
            slug: slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug,
          },
        },
      })
      if (!existingProduct) {
        slugExists = false
        if (slugSuffix > 0) {
          slug = `${slug}-${slugSuffix}`
        }
      } else {
        slugSuffix++
      }
    }

    // Obtenir le prochain sortOrder
    const lastProduct = await prisma.product.findFirst({
      where: { restaurantId, categoryId: data.categoryId },
      orderBy: { sortOrder: 'desc' },
    })
    const sortOrder = (lastProduct?.sortOrder ?? -1) + 1

    const product = await prisma.product.create({
      data: {
        restaurantId,
        name: data.name,
        nameEn: data.nameEn,
        slug,
        description: data.description,
        descriptionEn: data.descriptionEn,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        categoryId: data.categoryId,
        taxRateId: data.taxRateId,
        taxIncluded: data.taxIncluded,
        image: data.image,
        images: data.images,
        trackInventory: data.trackInventory,
        stockQuantity: data.stockQuantity,
        lowStockAlert: data.lowStockAlert,
        sku: data.sku,
        barcode: data.barcode,
        calories: data.calories,
        allergens: data.allergens,
        dietaryTags: data.dietaryTags,
        isActive: data.isActive,
        isVisible: data.isVisible,
        isFeatured: data.isFeatured,
        prepTime: data.prepTime,
        recipeId: data.recipeId,
        sortOrder,
        modifierGroups: data.modifierGroupIds.length > 0 ? {
          create: data.modifierGroupIds.map((groupId, index) => ({
            modifierGroupId: groupId,
            sortOrder: index,
          })),
        } : undefined,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        categoryId: product.categoryId,
        category: product.category,
        isActive: product.isActive,
        createdAt: product.createdAt,
      },
      message: 'Produit cree avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/products/:id - Modifier un produit
router.put('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = updateProductSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    // Verifier que le produit existe
    const existingProduct = await prisma.product.findFirst({
      where: { id, restaurantId },
    })
    if (!existingProduct) {
      return next(new AppError('Produit non trouve', 404, 'NOT_FOUND'))
    }

    const data = validation.data

    // Verifier la categorie si fournie
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, restaurantId },
      })
      if (!category) {
        return next(new AppError('Categorie non trouvee', 404, 'CATEGORY_NOT_FOUND'))
      }
    }

    // Si le nom change, regenerer le slug
    let slug = existingProduct.slug
    if (data.name && data.name !== existingProduct.name) {
      slug = generateSlug(data.name)
      let slugSuffix = 0
      let slugExists = true

      while (slugExists) {
        const existingSlug = await prisma.product.findFirst({
          where: {
            restaurantId,
            slug: slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug,
            id: { not: id },
          },
        })
        if (!existingSlug) {
          slugExists = false
          if (slugSuffix > 0) {
            slug = `${slug}-${slugSuffix}`
          }
        } else {
          slugSuffix++
        }
      }
    }

    // Mettre a jour les modifier groups si fournis
    if (data.modifierGroupIds !== undefined) {
      await prisma.productModifierGroup.deleteMany({
        where: { productId: id },
      })

      if (data.modifierGroupIds.length > 0) {
        await prisma.productModifierGroup.createMany({
          data: data.modifierGroupIds.map((groupId, index) => ({
            productId: id,
            modifierGroupId: groupId,
            sortOrder: index,
          })),
        })
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name, slug }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.taxRateId !== undefined && { taxRateId: data.taxRateId }),
        ...(data.taxIncluded !== undefined && { taxIncluded: data.taxIncluded }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.images !== undefined && { images: data.images }),
        ...(data.trackInventory !== undefined && { trackInventory: data.trackInventory }),
        ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
        ...(data.lowStockAlert !== undefined && { lowStockAlert: data.lowStockAlert }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.calories !== undefined && { calories: data.calories }),
        ...(data.allergens !== undefined && { allergens: data.allergens }),
        ...(data.dietaryTags !== undefined && { dietaryTags: data.dietaryTags }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.prepTime !== undefined && { prepTime: data.prepTime }),
        ...(data.recipeId !== undefined && { recipeId: data.recipeId }),
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    res.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        categoryId: product.categoryId,
        category: product.category,
        isActive: product.isActive,
        updatedAt: product.updatedAt,
      },
      message: 'Produit modifie avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/products/:id - Supprimer un produit
router.delete('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier que le produit existe
    const product = await prisma.product.findFirst({
      where: { id, restaurantId },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    })

    if (!product) {
      return next(new AppError('Produit non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier qu'il n'y a pas de commandes associees
    if (product._count.orderItems > 0) {
      return next(new AppError(
        'Impossible de supprimer: ce produit a ete commande. Desactivez-le plutot.',
        400,
        'PRODUCT_HAS_ORDERS'
      ))
    }

    await prisma.product.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Produit supprime avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/products/:id/duplicate - Dupliquer un produit
router.post('/:id/duplicate', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    // Recuperer le produit original
    const original = await prisma.product.findFirst({
      where: { id, restaurantId },
      include: {
        variants: true,
        modifierGroups: true,
      },
    })

    if (!original) {
      return next(new AppError('Produit non trouve', 404, 'NOT_FOUND'))
    }

    // Generer un nouveau slug
    let slug = generateSlug(`${original.name} copie`)
    let slugSuffix = 0
    let slugExists = true

    while (slugExists) {
      const existingProduct = await prisma.product.findUnique({
        where: {
          restaurantId_slug: {
            restaurantId,
            slug: slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug,
          },
        },
      })
      if (!existingProduct) {
        slugExists = false
        if (slugSuffix > 0) {
          slug = `${slug}-${slugSuffix}`
        }
      } else {
        slugSuffix++
      }
    }

    // Creer la copie
    const duplicate = await prisma.product.create({
      data: {
        restaurantId,
        name: `${original.name} (copie)`,
        nameEn: original.nameEn ? `${original.nameEn} (copy)` : null,
        slug,
        description: original.description,
        descriptionEn: original.descriptionEn,
        price: original.price,
        compareAtPrice: original.compareAtPrice,
        costPrice: original.costPrice,
        categoryId: original.categoryId,
        taxRateId: original.taxRateId,
        taxIncluded: original.taxIncluded,
        image: original.image,
        images: original.images,
        trackInventory: original.trackInventory,
        stockQuantity: 0,
        lowStockAlert: original.lowStockAlert,
        sku: original.sku ? `${original.sku}-COPY` : null,
        barcode: null,
        calories: original.calories,
        allergens: original.allergens,
        dietaryTags: original.dietaryTags,
        isActive: false,
        isVisible: original.isVisible,
        isFeatured: false,
        prepTime: original.prepTime,
        sortOrder: original.sortOrder + 1,
        variants: original.variants.length > 0 ? {
          create: original.variants.map(v => ({
            name: v.name,
            nameEn: v.nameEn,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            costPrice: v.costPrice,
            sku: v.sku ? `${v.sku}-COPY` : null,
            barcode: null,
            trackInventory: v.trackInventory,
            stockQuantity: 0,
            image: v.image,
            isActive: v.isActive,
            sortOrder: v.sortOrder,
          })),
        } : undefined,
        modifierGroups: original.modifierGroups.length > 0 ? {
          create: original.modifierGroups.map(mg => ({
            modifierGroupId: mg.modifierGroupId,
            sortOrder: mg.sortOrder,
          })),
        } : undefined,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: duplicate.id,
        name: duplicate.name,
        slug: duplicate.slug,
        price: Number(duplicate.price),
        categoryId: duplicate.categoryId,
        category: duplicate.category,
        isActive: duplicate.isActive,
        createdAt: duplicate.createdAt,
      },
      message: 'Produit duplique avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/products/:id/toggle - Activer/Desactiver un produit
router.patch('/:id/toggle', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const existingProduct = await prisma.product.findFirst({
      where: { id, restaurantId },
    })

    if (!existingProduct) {
      return next(new AppError('Produit non trouve', 404, 'NOT_FOUND'))
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: !existingProduct.isActive },
    })

    res.json({
      success: true,
      data: {
        id: product.id,
        isActive: product.isActive,
      },
      message: product.isActive ? 'Produit active' : 'Produit desactive',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/products/:id/stock - Mettre a jour le stock
router.patch('/:id/stock', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = updateStockSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const existingProduct = await prisma.product.findFirst({
      where: { id, restaurantId },
    })

    if (!existingProduct) {
      return next(new AppError('Produit non trouve', 404, 'NOT_FOUND'))
    }

    const product = await prisma.product.update({
      where: { id },
      data: { stockQuantity: validation.data.stockQuantity },
    })

    res.json({
      success: true,
      data: {
        id: product.id,
        stockQuantity: product.stockQuantity,
      },
      message: 'Stock mis a jour',
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// VARIANTS
// ============================================

// POST /restaurant/products/:id/variants - Creer une variante
router.post('/:id/variants', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id: productId } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = createVariantSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    // Verifier que le produit existe
    const product = await prisma.product.findFirst({
      where: { id: productId, restaurantId },
    })
    if (!product) {
      return next(new AppError('Produit non trouve', 404, 'NOT_FOUND'))
    }

    // Obtenir le prochain sortOrder
    const lastVariant = await prisma.productVariant.findFirst({
      where: { productId },
      orderBy: { sortOrder: 'desc' },
    })
    const sortOrder = (lastVariant?.sortOrder ?? -1) + 1

    const data = validation.data

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name: data.name,
        nameEn: data.nameEn,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        sku: data.sku,
        barcode: data.barcode,
        trackInventory: data.trackInventory,
        stockQuantity: data.stockQuantity,
        image: data.image,
        isActive: data.isActive,
        sortOrder,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: variant.id,
        name: variant.name,
        price: Number(variant.price),
        stockQuantity: variant.stockQuantity,
        isActive: variant.isActive,
        sortOrder: variant.sortOrder,
      },
      message: 'Variante creee avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/products/:id/variants/:variantId - Modifier une variante
router.put('/:id/variants/:variantId', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id: productId, variantId } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = updateVariantSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    // Verifier que le produit et la variante existent
    const product = await prisma.product.findFirst({
      where: { id: productId, restaurantId },
    })
    if (!product) {
      return next(new AppError('Produit non trouve', 404, 'NOT_FOUND'))
    }

    const existingVariant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    })
    if (!existingVariant) {
      return next(new AppError('Variante non trouvee', 404, 'NOT_FOUND'))
    }

    const data = validation.data

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.trackInventory !== undefined && { trackInventory: data.trackInventory }),
        ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    res.json({
      success: true,
      data: {
        id: variant.id,
        name: variant.name,
        price: Number(variant.price),
        stockQuantity: variant.stockQuantity,
        isActive: variant.isActive,
      },
      message: 'Variante modifiee avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/products/:id/variants/:variantId - Supprimer une variante
router.delete('/:id/variants/:variantId', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id: productId, variantId } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier que le produit existe
    const product = await prisma.product.findFirst({
      where: { id: productId, restaurantId },
    })
    if (!product) {
      return next(new AppError('Produit non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier que la variante existe
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    })
    if (!variant) {
      return next(new AppError('Variante non trouvee', 404, 'NOT_FOUND'))
    }

    // Verifier qu'il n'y a pas de commandes associees
    if (variant._count.orderItems > 0) {
      return next(new AppError(
        'Impossible de supprimer: cette variante a ete commandee. Desactivez-la plutot.',
        400,
        'VARIANT_HAS_ORDERS'
      ))
    }

    await prisma.productVariant.delete({
      where: { id: variantId },
    })

    res.json({
      success: true,
      message: 'Variante supprimee avec succes',
    })
  } catch (error) {
    next(error)
  }
})

export const restaurantProductsRoutes = router
