import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

// Schémas de validation
const createSupplierSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  contactName: z.string().max(100).optional().nullable(),
  email: z.string().email('Email invalide').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

const updateSupplierSchema = createSupplierSchema.partial()

// GET /restaurant/suppliers - Liste des fournisseurs
router.get('/', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const {
      search,
      isActive,
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
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const orderBy: any = {}
    const validSortFields = ['name', 'contactName', 'createdAt', 'updatedAt']
    if (validSortFields.includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'desc' ? 'desc' : 'asc'
    } else {
      orderBy.name = 'asc'
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          _count: {
            select: { ingredients: true, ingredientSuppliers: true },
          },
        },
      }),
      prisma.supplier.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        items: suppliers.map(s => ({
          id: s.id,
          name: s.name,
          contactName: s.contactName,
          email: s.email,
          phone: s.phone,
          address: s.address,
          notes: s.notes,
          isActive: s.isActive,
          ingredientsCount: s._count.ingredients + s._count.ingredientSuppliers,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
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

// GET /restaurant/suppliers/stats - Statistiques fournisseurs
router.get('/stats', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const [totalSuppliers, activeSuppliers, suppliersWithIngredients] = await Promise.all([
      prisma.supplier.count({ where: { restaurantId } }),
      prisma.supplier.count({ where: { restaurantId, isActive: true } }),
      prisma.supplier.count({
        where: {
          restaurantId,
          OR: [
            { ingredients: { some: {} } },
            { ingredientSuppliers: { some: {} } },
          ],
        },
      }),
    ])

    res.json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers: totalSuppliers - activeSuppliers,
        suppliersWithIngredients,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/suppliers/:id - Détail d'un fournisseur
router.get('/:id', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, restaurantId },
      include: {
        ingredients: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            unit: true,
            unitCost: true,
            currentStock: true,
          },
        },
        ingredientSuppliers: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                unit: true,
                currentStock: true,
              },
            },
          },
        },
        batches: {
          where: { isActive: true },
          orderBy: { receivedAt: 'desc' },
          take: 10,
          include: {
            ingredient: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!supplier) {
      return next(new AppError('Fournisseur non trouvé', 404, 'NOT_FOUND'))
    }

    // Combiner les ingrédients directs et via IngredientSupplier
    const allIngredients = [
      ...supplier.ingredients.map(i => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        category: i.category,
        unit: i.unit,
        unitCost: Number(i.unitCost),
        currentStock: Number(i.currentStock),
        isPreferred: false,
        leadTimeDays: null,
        minOrderQty: null,
      })),
      ...supplier.ingredientSuppliers.map(is => ({
        id: is.ingredient.id,
        name: is.ingredient.name,
        sku: is.ingredient.sku,
        category: is.ingredient.category,
        unit: is.ingredient.unit,
        unitCost: Number(is.unitCost),
        currentStock: Number(is.ingredient.currentStock),
        isPreferred: is.isPreferred,
        leadTimeDays: is.leadTimeDays,
        minOrderQty: is.minOrderQty ? Number(is.minOrderQty) : null,
      })),
    ]

    // Dédupliquer par ID
    const uniqueIngredients = allIngredients.filter((ing, index, self) =>
      index === self.findIndex(i => i.id === ing.id)
    )

    res.json({
      success: true,
      data: {
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        notes: supplier.notes,
        isActive: supplier.isActive,
        ingredients: uniqueIngredients,
        recentBatches: supplier.batches.map(b => ({
          id: b.id,
          batchNumber: b.batchNumber,
          ingredientId: b.ingredientId,
          ingredientName: b.ingredient.name,
          quantity: Number(b.quantity),
          remainingQty: Number(b.remainingQty),
          unitCost: Number(b.unitCost),
          expirationDate: b.expirationDate,
          receivedAt: b.receivedAt,
        })),
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/suppliers - Créer un fournisseur
router.post('/', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = createSupplierSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const supplier = await prisma.supplier.create({
      data: {
        restaurantId,
        name: data.name,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        isActive: data.isActive,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        notes: supplier.notes,
        isActive: supplier.isActive,
        createdAt: supplier.createdAt,
      },
      message: 'Fournisseur créé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/suppliers/:id - Modifier un fournisseur
router.put('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = updateSupplierSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    const existing = await prisma.supplier.findFirst({
      where: { id: req.params.id, restaurantId },
    })

    if (!existing) {
      return next(new AppError('Fournisseur non trouvé', 404, 'NOT_FOUND'))
    }

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.contactName !== undefined && { contactName: data.contactName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    res.json({
      success: true,
      data: {
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        notes: supplier.notes,
        isActive: supplier.isActive,
        updatedAt: supplier.updatedAt,
      },
      message: 'Fournisseur modifié avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/suppliers/:id - Supprimer un fournisseur
router.delete('/:id', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, restaurantId },
      include: {
        _count: {
          select: { ingredients: true, ingredientSuppliers: true },
        },
      },
    })

    if (!supplier) {
      return next(new AppError('Fournisseur non trouvé', 404, 'NOT_FOUND'))
    }

    const totalIngredients = supplier._count.ingredients + supplier._count.ingredientSuppliers
    if (totalIngredients > 0) {
      return next(new AppError(
        `Ce fournisseur est associé à ${totalIngredients} ingrédient(s). Retirez d'abord les associations.`,
        400,
        'SUPPLIER_IN_USE'
      ))
    }

    await prisma.supplier.delete({
      where: { id: req.params.id },
    })

    res.json({
      success: true,
      message: 'Fournisseur supprimé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/suppliers/:id/toggle - Activer/désactiver un fournisseur
router.patch('/:id/toggle', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, restaurantId },
    })

    if (!supplier) {
      return next(new AppError('Fournisseur non trouvé', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { isActive: !supplier.isActive },
    })

    res.json({
      success: true,
      data: {
        id: updated.id,
        isActive: updated.isActive,
      },
      message: updated.isActive ? 'Fournisseur activé' : 'Fournisseur désactivé',
    })
  } catch (error) {
    next(error)
  }
})

export { router as suppliersRoutes }
