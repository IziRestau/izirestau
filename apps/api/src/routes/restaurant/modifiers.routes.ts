import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

// Schemas de validation
const createModifierGroupSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  nameEn: z.string().max(100).optional(),
  type: z.enum(['SINGLE', 'MULTIPLE', 'OPTIONAL']).optional().default('OPTIONAL'),
  minSelections: z.number().int().min(0).optional().default(0),
  maxSelections: z.number().int().min(1).optional().nullable(),
  isRequired: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  modifiers: z.array(z.object({
    name: z.string().min(1, 'Nom requis').max(100),
    nameEn: z.string().max(100).optional(),
    price: z.number().min(0).optional().default(0),
    isDefault: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
  })).optional().default([]),
})

const updateModifierGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameEn: z.string().max(100).optional().nullable(),
  type: z.enum(['SINGLE', 'MULTIPLE', 'OPTIONAL']).optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional().nullable(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

const createModifierSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  nameEn: z.string().max(100).optional(),
  price: z.number().min(0).optional().default(0),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
})

const updateModifierSchema = createModifierSchema.partial()

const reorderModifiersSchema = z.object({
  modifierIds: z.array(z.string().cuid()),
})

// GET /restaurant/modifiers - Liste des groupes de modifiers
router.get('/', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const modifierGroups = await prisma.modifierGroup.findMany({
      where: { restaurantId },
      include: {
        modifiers: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const formattedGroups = modifierGroups.map(group => ({
      id: group.id,
      name: group.name,
      nameEn: group.nameEn,
      type: group.type,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      isRequired: group.isRequired,
      isActive: group.isActive,
      productsCount: group._count.products,
      modifiers: group.modifiers.map(m => ({
        id: m.id,
        name: m.name,
        nameEn: m.nameEn,
        price: Number(m.price),
        isDefault: m.isDefault,
        isActive: m.isActive,
        sortOrder: m.sortOrder,
      })),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }))

    res.json({
      success: true,
      data: formattedGroups,
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/modifiers/:id - Detail d'un groupe de modifiers
router.get('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const group = await prisma.modifierGroup.findFirst({
      where: { id, restaurantId },
      include: {
        modifiers: {
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
              },
            },
          },
        },
      },
    })

    if (!group) {
      return next(new AppError('Groupe de modifiers non trouve', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        nameEn: group.nameEn,
        type: group.type,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isRequired: group.isRequired,
        isActive: group.isActive,
        modifiers: group.modifiers.map(m => ({
          id: m.id,
          name: m.name,
          nameEn: m.nameEn,
          price: Number(m.price),
          isDefault: m.isDefault,
          isActive: m.isActive,
          sortOrder: m.sortOrder,
        })),
        products: group.products.map(p => p.product),
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/modifiers - Creer un groupe de modifiers
router.post('/', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = createModifierGroupSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const group = await prisma.modifierGroup.create({
      data: {
        restaurantId,
        name: data.name,
        nameEn: data.nameEn,
        type: data.type,
        minSelections: data.minSelections,
        maxSelections: data.maxSelections,
        isRequired: data.isRequired,
        isActive: data.isActive,
        modifiers: data.modifiers.length > 0 ? {
          create: data.modifiers.map((m, index) => ({
            name: m.name,
            nameEn: m.nameEn,
            price: m.price,
            isDefault: m.isDefault,
            isActive: m.isActive,
            sortOrder: index,
          })),
        } : undefined,
      },
      include: {
        modifiers: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        nameEn: group.nameEn,
        type: group.type,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isRequired: group.isRequired,
        isActive: group.isActive,
        modifiers: group.modifiers.map(m => ({
          id: m.id,
          name: m.name,
          nameEn: m.nameEn,
          price: Number(m.price),
          isDefault: m.isDefault,
          isActive: m.isActive,
          sortOrder: m.sortOrder,
        })),
        createdAt: group.createdAt,
      },
      message: 'Groupe de modifiers cree avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/modifiers/:id - Modifier un groupe de modifiers
router.put('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = updateModifierGroupSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    // Verifier que le groupe existe
    const existingGroup = await prisma.modifierGroup.findFirst({
      where: { id, restaurantId },
    })
    if (!existingGroup) {
      return next(new AppError('Groupe de modifiers non trouve', 404, 'NOT_FOUND'))
    }

    const data = validation.data

    const group = await prisma.modifierGroup.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.minSelections !== undefined && { minSelections: data.minSelections }),
        ...(data.maxSelections !== undefined && { maxSelections: data.maxSelections }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        modifiers: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    res.json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        nameEn: group.nameEn,
        type: group.type,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isRequired: group.isRequired,
        isActive: group.isActive,
        modifiers: group.modifiers.map(m => ({
          id: m.id,
          name: m.name,
          nameEn: m.nameEn,
          price: Number(m.price),
          isDefault: m.isDefault,
          isActive: m.isActive,
          sortOrder: m.sortOrder,
        })),
        updatedAt: group.updatedAt,
      },
      message: 'Groupe de modifiers modifie avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/modifiers/:id - Supprimer un groupe de modifiers
router.delete('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier que le groupe existe
    const group = await prisma.modifierGroup.findFirst({
      where: { id, restaurantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!group) {
      return next(new AppError('Groupe de modifiers non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier qu'il n'est pas utilise par des produits
    if (group._count.products > 0) {
      return next(new AppError(
        `Impossible de supprimer: ce groupe est utilise par ${group._count.products} produit(s)`,
        400,
        'GROUP_IN_USE'
      ))
    }

    await prisma.modifierGroup.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Groupe de modifiers supprime avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/modifiers/:id/toggle - Activer/Desactiver un groupe
router.patch('/:id/toggle', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const existingGroup = await prisma.modifierGroup.findFirst({
      where: { id, restaurantId },
    })

    if (!existingGroup) {
      return next(new AppError('Groupe de modifiers non trouve', 404, 'NOT_FOUND'))
    }

    const group = await prisma.modifierGroup.update({
      where: { id },
      data: { isActive: !existingGroup.isActive },
    })

    res.json({
      success: true,
      data: {
        id: group.id,
        isActive: group.isActive,
      },
      message: group.isActive ? 'Groupe active' : 'Groupe desactive',
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// MODIFIER ITEMS
// ============================================

// POST /restaurant/modifiers/:id/items - Ajouter un modifier
router.post('/:id/items', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id: groupId } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = createModifierSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    // Verifier que le groupe existe
    const group = await prisma.modifierGroup.findFirst({
      where: { id: groupId, restaurantId },
    })
    if (!group) {
      return next(new AppError('Groupe de modifiers non trouve', 404, 'NOT_FOUND'))
    }

    // Obtenir le prochain sortOrder
    const lastModifier = await prisma.modifier.findFirst({
      where: { groupId },
      orderBy: { sortOrder: 'desc' },
    })
    const sortOrder = (lastModifier?.sortOrder ?? -1) + 1

    const data = validation.data

    const modifier = await prisma.modifier.create({
      data: {
        groupId,
        name: data.name,
        nameEn: data.nameEn,
        price: data.price,
        isDefault: data.isDefault,
        isActive: data.isActive,
        sortOrder,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: modifier.id,
        name: modifier.name,
        nameEn: modifier.nameEn,
        price: Number(modifier.price),
        isDefault: modifier.isDefault,
        isActive: modifier.isActive,
        sortOrder: modifier.sortOrder,
      },
      message: 'Modifier ajoute avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/modifiers/:id/items/:itemId - Modifier un modifier
router.put('/:id/items/:itemId', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id: groupId, itemId } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = updateModifierSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    // Verifier que le groupe existe
    const group = await prisma.modifierGroup.findFirst({
      where: { id: groupId, restaurantId },
    })
    if (!group) {
      return next(new AppError('Groupe de modifiers non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier que le modifier existe
    const existingModifier = await prisma.modifier.findFirst({
      where: { id: itemId, groupId },
    })
    if (!existingModifier) {
      return next(new AppError('Modifier non trouve', 404, 'NOT_FOUND'))
    }

    const data = validation.data

    const modifier = await prisma.modifier.update({
      where: { id: itemId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    res.json({
      success: true,
      data: {
        id: modifier.id,
        name: modifier.name,
        nameEn: modifier.nameEn,
        price: Number(modifier.price),
        isDefault: modifier.isDefault,
        isActive: modifier.isActive,
        sortOrder: modifier.sortOrder,
      },
      message: 'Modifier modifie avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/modifiers/:id/items/:itemId - Supprimer un modifier
router.delete('/:id/items/:itemId', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id: groupId, itemId } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier que le groupe existe
    const group = await prisma.modifierGroup.findFirst({
      where: { id: groupId, restaurantId },
    })
    if (!group) {
      return next(new AppError('Groupe de modifiers non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier que le modifier existe
    const modifier = await prisma.modifier.findFirst({
      where: { id: itemId, groupId },
      include: {
        _count: {
          select: { orderItemModifiers: true },
        },
      },
    })
    if (!modifier) {
      return next(new AppError('Modifier non trouve', 404, 'NOT_FOUND'))
    }

    // Verifier qu'il n'a pas ete utilise dans des commandes
    if (modifier._count.orderItemModifiers > 0) {
      return next(new AppError(
        'Impossible de supprimer: ce modifier a ete utilise dans des commandes. Desactivez-le plutot.',
        400,
        'MODIFIER_IN_USE'
      ))
    }

    await prisma.modifier.delete({
      where: { id: itemId },
    })

    res.json({
      success: true,
      message: 'Modifier supprime avec succes',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/modifiers/:id/items/reorder - Reordonner les modifiers
router.patch('/:id/items/reorder', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    const { id: groupId } = req.params

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
    }

    const validation = reorderModifiersSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    // Verifier que le groupe existe
    const group = await prisma.modifierGroup.findFirst({
      where: { id: groupId, restaurantId },
    })
    if (!group) {
      return next(new AppError('Groupe de modifiers non trouve', 404, 'NOT_FOUND'))
    }

    const { modifierIds } = validation.data

    // Verifier que tous les modifiers appartiennent au groupe
    const modifiers = await prisma.modifier.findMany({
      where: {
        id: { in: modifierIds },
        groupId,
      },
    })

    if (modifiers.length !== modifierIds.length) {
      return next(new AppError('Certains modifiers sont invalides', 400, 'INVALID_MODIFIERS'))
    }

    // Mettre a jour l'ordre
    await prisma.$transaction(
      modifierIds.map((id, index) =>
        prisma.modifier.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    res.json({
      success: true,
      message: 'Ordre des modifiers mis a jour',
    })
  } catch (error) {
    next(error)
  }
})

export const restaurantModifiersRoutes = router
