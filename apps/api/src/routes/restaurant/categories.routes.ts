import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

// Schemas de validation
const createCategorySchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  nameEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  image: z.string().url().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isVisible: z.boolean().optional().default(true),
})

const updateCategorySchema = createCategorySchema.partial()

const reorderSchema = z.object({
  categoryIds: z.array(z.string().min(1)),
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

// GET /restaurant/categories - Liste des categories
router.get('/', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const categories = await prisma.category.findMany({
      where: { restaurantId },
      include: {
        _count: {
          select: { products: true },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const formattedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      nameEn: cat.nameEn,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      parentId: cat.parentId,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      isVisible: cat.isVisible,
      productsCount: cat._count.products,
      children: cat.children,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }))

    res.json({
      success: true,
      data: formattedCategories,
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/categories/:id - Detail d'une categorie
router.get('/:id', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const category = await prisma.category.findFirst({
      where: { id, restaurantId },
      include: {
        _count: {
          select: { products: true },
        },
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            image: true,
            isActive: true,
          },
          orderBy: { sortOrder: 'asc' },
          take: 10,
        },
      },
    })

    if (!category) {
      return next(new AppError('Categorie non trouvee', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        nameEn: category.nameEn,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentId: category.parentId,
        parent: category.parent,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        isVisible: category.isVisible,
        productsCount: category._count.products,
        children: category.children,
        products: category.products.map(p => ({
          ...p,
          price: Number(p.price),
        })),
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/categories - Creer une categorie
router.post('/', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = createCategorySchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const { name, nameEn, description, image, parentId, isActive, isVisible } = validation.data

    // Generer un slug unique
    let slug = generateSlug(name)
    let slugSuffix = 0
    let slugExists = true

    while (slugExists) {
      const existingCategory = await prisma.category.findUnique({
        where: {
          restaurantId_slug: {
            restaurantId,
            slug: slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug,
          },
        },
      })
      if (!existingCategory) {
        slugExists = false
        if (slugSuffix > 0) {
          slug = `${slug}-${slugSuffix}`
        }
      } else {
        slugSuffix++
      }
    }

    // Verifier que le parent existe si fourni
    if (parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: { id: parentId, restaurantId },
      })
      if (!parentCategory) {
        return next(new AppError('Categorie parente non trouvee', 404, 'PARENT_NOT_FOUND'))
      }
    }

    // Obtenir le prochain sortOrder
    const lastCategory = await prisma.category.findFirst({
      where: { restaurantId, parentId: parentId || null },
      orderBy: { sortOrder: 'desc' },
    })
    const sortOrder = (lastCategory?.sortOrder ?? -1) + 1

    const category = await prisma.category.create({
      data: {
        restaurantId,
        name,
        nameEn,
        slug,
        description,
        image,
        parentId,
        sortOrder,
        isActive: isActive ?? true,
        isVisible: isVisible ?? true,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        nameEn: category.nameEn,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentId: category.parentId,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        isVisible: category.isVisible,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      message: 'Categorie creee avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/categories/:id - Modifier une categorie
router.put('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = updateCategorySchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    // Verifier que la categorie existe
    const existingCategory = await prisma.category.findFirst({
      where: { id, restaurantId },
    })
    if (!existingCategory) {
      return next(new AppError('Categorie non trouvee', 404, 'NOT_FOUND'))
    }

    const { name, nameEn, description, image, parentId, isActive, isVisible } = validation.data

    // Si le nom change, regenerer le slug
    let slug = existingCategory.slug
    if (name && name !== existingCategory.name) {
      slug = generateSlug(name)
      let slugSuffix = 0
      let slugExists = true

      while (slugExists) {
        const existingSlug = await prisma.category.findFirst({
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

    // Verifier que le parent existe si fourni et n'est pas la categorie elle-meme
    if (parentId) {
      if (parentId === id) {
        return next(new AppError('Une categorie ne peut pas etre son propre parent', 400, 'INVALID_PARENT'))
      }
      const parentCategory = await prisma.category.findFirst({
        where: { id: parentId, restaurantId },
      })
      if (!parentCategory) {
        return next(new AppError('Categorie parente non trouvee', 404, 'PARENT_NOT_FOUND'))
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(name && { slug }),
        ...(nameEn !== undefined && { nameEn }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(parentId !== undefined && { parentId }),
        ...(isActive !== undefined && { isActive }),
        ...(isVisible !== undefined && { isVisible }),
      },
    })

    res.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        nameEn: category.nameEn,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentId: category.parentId,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        isVisible: category.isVisible,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      message: 'Categorie modifiee avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/categories/:id - Supprimer une categorie
router.delete('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier que la categorie existe
    const category = await prisma.category.findFirst({
      where: { id, restaurantId },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    })

    if (!category) {
      return next(new AppError('Categorie non trouvee', 404, 'NOT_FOUND'))
    }

    // Verifier qu'il n'y a pas de produits ou sous-categories
    if (category._count.products > 0) {
      return next(new AppError(
        `Impossible de supprimer: ${category._count.products} produit(s) dans cette categorie`,
        400,
        'CATEGORY_HAS_PRODUCTS'
      ))
    }

    if (category._count.children > 0) {
      return next(new AppError(
        `Impossible de supprimer: ${category._count.children} sous-categorie(s)`,
        400,
        'CATEGORY_HAS_CHILDREN'
      ))
    }

    await prisma.category.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Categorie supprimee avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/categories/reorder - Reordonner les categories
router.patch('/reorder', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = reorderSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const { categoryIds } = validation.data

    // Verifier que toutes les categories appartiennent au restaurant
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        restaurantId,
      },
    })

    if (categories.length !== categoryIds.length) {
      return next(new AppError('Certaines categories sont invalides', 400, 'INVALID_CATEGORIES'))
    }

    // Mettre a jour l'ordre
    await prisma.$transaction(
      categoryIds.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    res.json({
      success: true,
      message: 'Ordre des categories mis a jour',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/categories/:id/toggle - Activer/Desactiver une categorie
router.patch('/:id/toggle', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier que la categorie existe
    const existingCategory = await prisma.category.findFirst({
      where: { id, restaurantId },
    })

    if (!existingCategory) {
      return next(new AppError('Categorie non trouvee', 404, 'NOT_FOUND'))
    }

    const category = await prisma.category.update({
      where: { id },
      data: { isActive: !existingCategory.isActive },
    })

    res.json({
      success: true,
      data: {
        id: category.id,
        isActive: category.isActive,
      },
      message: category.isActive ? 'Categorie activee' : 'Categorie desactivee',
    })
  } catch (error) {
    next(error)
  }
})

export const restaurantCategoriesRoutes = router
