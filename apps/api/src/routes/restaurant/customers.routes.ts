import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

// Schemas de validation
const createCustomerSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  phone: z.string().max(20).optional().nullable(),
  marketingOptIn: z.boolean().optional().default(true),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().max(2000).optional().nullable(),
})

const updateCustomerSchema = createCustomerSchema.partial()

const addNoteSchema = z.object({
  content: z.string().min(1, 'Contenu requis').max(2000),
})

const updateTagsSchema = z.object({
  tags: z.array(z.string()),
})

const createAddressSchema = z.object({
  label: z.string().max(50).optional().nullable(),
  street: z.string().min(1, 'Adresse requise').max(200),
  streetLine2: z.string().max(200).optional().nullable(),
  city: z.string().min(1, 'Ville requise').max(100),
  postalCode: z.string().min(1, 'Code postal requis').max(20),
  country: z.string().max(50).optional().default('FR'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  instructions: z.string().max(500).optional().nullable(),
  isDefault: z.boolean().optional().default(false),
})

// GET /restaurant/customers - Liste des clients
router.get('/', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const {
      search,
      status,
      tags,
      minOrders,
      maxOrders,
      minSpent,
      maxSpent,
      lastOrderAfter,
      lastOrderBefore,
      createdAfter,
      createdBefore,
      marketingOptIn,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20))
    const skip = (pageNum - 1) * limitNum

    const where: any = { restaurantId }

    // Filtre recherche
    if (search && typeof search === 'string') {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filtre statut
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Filtre tags
    if (tags && typeof tags === 'string') {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      if (tagList.length > 0) {
        where.tags = { hasSome: tagList }
      }
    }

    // Filtre nombre de commandes
    if (minOrders) {
      where.totalOrders = { ...where.totalOrders, gte: parseInt(minOrders as string) }
    }
    if (maxOrders) {
      where.totalOrders = { ...where.totalOrders, lte: parseInt(maxOrders as string) }
    }

    // Filtre montant dépensé
    if (minSpent) {
      where.totalSpent = { ...where.totalSpent, gte: parseFloat(minSpent as string) }
    }
    if (maxSpent) {
      where.totalSpent = { ...where.totalSpent, lte: parseFloat(maxSpent as string) }
    }

    // Filtre dernière commande
    if (lastOrderAfter) {
      where.lastOrderAt = { ...where.lastOrderAt, gte: new Date(lastOrderAfter as string) }
    }
    if (lastOrderBefore) {
      where.lastOrderAt = { ...where.lastOrderAt, lte: new Date(lastOrderBefore as string) }
    }

    // Filtre date création
    if (createdAfter) {
      where.createdAt = { ...where.createdAt, gte: new Date(createdAfter as string) }
    }
    if (createdBefore) {
      where.createdAt = { ...where.createdAt, lte: new Date(createdBefore as string) }
    }

    // Filtre marketing
    if (marketingOptIn === 'true') {
      where.marketingOptIn = true
    } else if (marketingOptIn === 'false') {
      where.marketingOptIn = false
    }

    // Tri
    const validSortFields = ['firstName', 'lastName', 'email', 'totalOrders', 'totalSpent', 'lastOrderAt', 'createdAt']
    const orderByField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt'
    const orderByDirection = sortOrder === 'asc' ? 'asc' : 'desc'

    const [customers, total] = await Promise.all([
      prisma.restaurantCustomer.findMany({
        where,
        include: {
          addresses: {
            orderBy: { isDefault: 'desc' },
          },
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { [orderByField]: orderByDirection },
        skip,
        take: limitNum,
      }),
      prisma.restaurantCustomer.count({ where }),
    ])

    const formattedCustomers = customers.map(c => ({
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      totalOrders: c.totalOrders,
      totalSpent: Number(c.totalSpent),
      avgOrderValue: Number(c.avgOrderValue),
      lastOrderAt: c.lastOrderAt,
      loyaltyPoints: c.loyaltyPoints,
      marketingOptIn: c.marketingOptIn,
      tags: c.tags,
      isActive: c.isActive,
      addressesCount: c.addresses.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))

    res.json({
      success: true,
      data: formattedCustomers,
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

// GET /restaurant/customers/stats - Statistiques clients
router.get('/stats', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalCustomers,
      newThisMonth,
      newLastMonth,
      activeCustomers,
      avgSpentResult,
      totalTags,
    ] = await Promise.all([
      // Total clients
      prisma.restaurantCustomer.count({
        where: { restaurantId },
      }),
      // Nouveaux ce mois
      prisma.restaurantCustomer.count({
        where: { restaurantId, createdAt: { gte: monthStart } },
      }),
      // Nouveaux mois dernier
      prisma.restaurantCustomer.count({
        where: { restaurantId, createdAt: { gte: lastMonthStart, lt: monthStart } },
      }),
      // Clients actifs (commande < 30 jours)
      prisma.restaurantCustomer.count({
        where: { restaurantId, lastOrderAt: { gte: thirtyDaysAgo } },
      }),
      // Moyenne dépensée par client
      prisma.restaurantCustomer.aggregate({
        where: { restaurantId, totalOrders: { gt: 0 } },
        _avg: { avgOrderValue: true },
      }),
      // Tags uniques
      prisma.restaurantCustomer.findMany({
        where: { restaurantId },
        select: { tags: true },
      }),
    ])

    // Extraire les tags uniques
    const allTags = new Set<string>()
    totalTags.forEach(c => c.tags.forEach(t => allTags.add(t)))

    res.json({
      success: true,
      data: {
        total: totalCustomers,
        newThisMonth,
        newLastMonth,
        growthPercent: newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : 0,
        activeCustomers,
        avgOrderValue: Number(avgSpentResult._avg.avgOrderValue) || 0,
        uniqueTags: Array.from(allTags),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/customers/export - Export clients
router.get('/export', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { format = 'csv', columns } = req.query

    // Récupérer tous les clients avec les mêmes filtres que la liste
    const customers = await prisma.restaurantCustomer.findMany({
      where: { restaurantId },
      include: {
        addresses: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Colonnes par défaut
    const defaultColumns = ['firstName', 'lastName', 'email', 'phone', 'totalOrders', 'totalSpent', 'lastOrderAt', 'createdAt', 'tags', 'marketingOptIn']
    const selectedColumns = columns ? (columns as string).split(',') : defaultColumns

    // Formater les données pour l'export
    const exportData = customers.map(c => {
      const row: Record<string, any> = {}
      if (selectedColumns.includes('firstName')) row.prenom = c.firstName
      if (selectedColumns.includes('lastName')) row.nom = c.lastName
      if (selectedColumns.includes('email')) row.email = c.email
      if (selectedColumns.includes('phone')) row.telephone = c.phone || ''
      if (selectedColumns.includes('totalOrders')) row.commandes = c.totalOrders
      if (selectedColumns.includes('totalSpent')) row.total_depense = Number(c.totalSpent)
      if (selectedColumns.includes('avgOrderValue')) row.panier_moyen = Number(c.avgOrderValue)
      if (selectedColumns.includes('lastOrderAt')) row.derniere_commande = c.lastOrderAt?.toISOString() || ''
      if (selectedColumns.includes('createdAt')) row.inscription = c.createdAt.toISOString()
      if (selectedColumns.includes('tags')) row.tags = c.tags.join(', ')
      if (selectedColumns.includes('marketingOptIn')) row.marketing = c.marketingOptIn ? 'Oui' : 'Non'
      if (selectedColumns.includes('addresses')) {
        row.adresses = c.addresses.map(a => `${a.street}, ${a.postalCode} ${a.city}`).join(' | ')
      }
      return row
    })

    if (format === 'csv') {
      // Générer CSV
      const headers = Object.keys(exportData[0] || {})
      const csvRows = [
        headers.join(';'),
        ...exportData.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(';'))
      ]
      const csvContent = csvRows.join('\n')

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=clients_${new Date().toISOString().split('T')[0]}.csv`)
      res.send('\uFEFF' + csvContent) // BOM pour Excel
    } else {
      // Retourner JSON pour traitement côté client
      res.json({
        success: true,
        data: exportData,
        columns: Object.keys(exportData[0] || {}),
      })
    }
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/customers/:id - Détails d'un client
router.get('/:id', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { id } = req.params

    const customer = await prisma.restaurantCustomer.findFirst({
      where: { id, restaurantId },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
      },
    })

    if (!customer) {
      return next(new AppError('Client non trouvé', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        addresses: customer.addresses.map(a => ({
          id: a.id,
          label: a.label,
          street: a.street,
          streetLine2: a.streetLine2,
          city: a.city,
          postalCode: a.postalCode,
          country: a.country,
          latitude: a.latitude,
          longitude: a.longitude,
          instructions: a.instructions,
          isDefault: a.isDefault,
        })),
        defaultAddressId: customer.defaultAddressId,
        totalOrders: customer.totalOrders,
        totalSpent: Number(customer.totalSpent),
        avgOrderValue: Number(customer.avgOrderValue),
        lastOrderAt: customer.lastOrderAt,
        loyaltyPoints: customer.loyaltyPoints,
        marketingOptIn: customer.marketingOptIn,
        tags: customer.tags,
        notes: customer.notes,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/customers/:id/orders - Historique commandes d'un client
router.get('/:id/orders', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { id } = req.params
    const { page = '1', limit = '10' } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10))
    const skip = (pageNum - 1) * limitNum

    // Vérifier que le client existe
    const customer = await prisma.restaurantCustomer.findFirst({
      where: { id, restaurantId },
      select: { id: true },
    })

    if (!customer) {
      return next(new AppError('Client non trouvé', 404, 'NOT_FOUND'))
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: id, restaurantId },
        select: {
          id: true,
          orderNumber: true,
          displayNumber: true,
          status: true,
          serviceType: true,
          paymentStatus: true,
          subtotal: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where: { customerId: id, restaurantId } }),
    ])

    res.json({
      success: true,
      data: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        displayNumber: o.displayNumber,
        status: o.status,
        serviceType: o.serviceType,
        paymentStatus: o.paymentStatus,
        subtotal: Number(o.subtotal),
        total: Number(o.total),
        createdAt: o.createdAt,
      })),
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

// POST /restaurant/customers - Créer un client
router.post('/', requireRole('OWNER', 'MANAGER', 'STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const validation = createCustomerSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    // Vérifier si l'email existe déjà pour ce restaurant
    const existing = await prisma.restaurantCustomer.findFirst({
      where: { restaurantId, email: data.email },
    })

    if (existing) {
      return next(new AppError('Un client avec cet email existe déjà', 400, 'EMAIL_EXISTS'))
    }

    const customer = await prisma.restaurantCustomer.create({
      data: {
        restaurantId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        marketingOptIn: data.marketingOptIn,
        tags: data.tags,
        notes: data.notes || null,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        marketingOptIn: customer.marketingOptIn,
        tags: customer.tags,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/customers/:id - Modifier un client
router.put('/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { id } = req.params

    const validation = updateCustomerSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    // Vérifier que le client existe
    const existing = await prisma.restaurantCustomer.findFirst({
      where: { id, restaurantId },
    })

    if (!existing) {
      return next(new AppError('Client non trouvé', 404, 'NOT_FOUND'))
    }

    // Vérifier l'unicité de l'email si modifié
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.restaurantCustomer.findFirst({
        where: { restaurantId, email: data.email, id: { not: id } },
      })
      if (emailExists) {
        return next(new AppError('Un client avec cet email existe déjà', 400, 'EMAIL_EXISTS'))
      }
    }

    const customer = await prisma.restaurantCustomer.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.marketingOptIn !== undefined && { marketingOptIn: data.marketingOptIn }),
        ...(data.tags && { tags: data.tags }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    })

    res.json({
      success: true,
      message: 'Client modifié avec succès',
      data: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        marketingOptIn: customer.marketingOptIn,
        tags: customer.tags,
        isActive: customer.isActive,
        updatedAt: customer.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/customers/:id - Supprimer un client
router.delete('/:id', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { id } = req.params

    const customer = await prisma.restaurantCustomer.findFirst({
      where: { id, restaurantId },
      include: { _count: { select: { orders: true } } },
    })

    if (!customer) {
      return next(new AppError('Client non trouvé', 404, 'NOT_FOUND'))
    }

    // Si le client a des commandes, on le désactive plutôt que de le supprimer
    if (customer._count.orders > 0) {
      await prisma.restaurantCustomer.update({
        where: { id },
        data: { isActive: false },
      })
      return res.json({
        success: true,
        message: 'Client désactivé (historique de commandes conservé)',
      })
    }

    await prisma.restaurantCustomer.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Client supprimé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/customers/:id/toggle - Activer/désactiver un client
router.patch('/:id/toggle', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { id } = req.params

    const customer = await prisma.restaurantCustomer.findFirst({
      where: { id, restaurantId },
    })

    if (!customer) {
      return next(new AppError('Client non trouvé', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.restaurantCustomer.update({
      where: { id },
      data: { isActive: !customer.isActive },
    })

    res.json({
      success: true,
      message: updated.isActive ? 'Client activé' : 'Client désactivé',
      data: { id: updated.id, isActive: updated.isActive },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/customers/:id/notes - Ajouter une note
router.post('/:id/notes', loadStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { id } = req.params

    const validation = addNoteSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const customer = await prisma.restaurantCustomer.findFirst({
      where: { id, restaurantId },
    })

    if (!customer) {
      return next(new AppError('Client non trouvé', 404, 'NOT_FOUND'))
    }

    // Ajouter la note avec timestamp
    const timestamp = new Date().toISOString()
    const userName = req.user?.userId ? 'Staff' : 'Système'
    const newNote = `[${timestamp}] ${userName}: ${validation.data.content}`
    const updatedNotes = customer.notes ? `${customer.notes}\n\n${newNote}` : newNote

    const updated = await prisma.restaurantCustomer.update({
      where: { id },
      data: { notes: updatedNotes },
    })

    res.json({
      success: true,
      message: 'Note ajoutée',
      data: { notes: updated.notes },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/customers/:id/tags - Mettre à jour les tags
router.put('/:id/tags', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { id } = req.params

    const validation = updateTagsSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const customer = await prisma.restaurantCustomer.findFirst({
      where: { id, restaurantId },
    })

    if (!customer) {
      return next(new AppError('Client non trouvé', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.restaurantCustomer.update({
      where: { id },
      data: { tags: validation.data.tags },
    })

    res.json({
      success: true,
      message: 'Tags mis à jour',
      data: { id: updated.id, tags: updated.tags },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/customers/:id/addresses - Ajouter une adresse
router.post('/:id/addresses', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { id } = req.params

    const validation = createAddressSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const customer = await prisma.restaurantCustomer.findFirst({
      where: { id, restaurantId },
    })

    if (!customer) {
      return next(new AppError('Client non trouvé', 404, 'NOT_FOUND'))
    }

    const data = validation.data

    // Si c'est la première adresse ou si isDefault, mettre les autres à false
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: id },
        data: { isDefault: false },
      })
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerId: id,
        label: data.label,
        street: data.street,
        streetLine2: data.streetLine2,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        instructions: data.instructions,
        isDefault: data.isDefault,
      },
    })

    // Mettre à jour defaultAddressId si nécessaire
    if (data.isDefault) {
      await prisma.restaurantCustomer.update({
        where: { id },
        data: { defaultAddressId: address.id },
      })
    }

    res.status(201).json({
      success: true,
      message: 'Adresse ajoutée',
      data: address,
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/customers/:id/addresses/:addressId - Supprimer une adresse
router.delete('/:id/addresses/:addressId', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const { id, addressId } = req.params

    const customer = await prisma.restaurantCustomer.findFirst({
      where: { id, restaurantId },
    })

    if (!customer) {
      return next(new AppError('Client non trouvé', 404, 'NOT_FOUND'))
    }

    const address = await prisma.customerAddress.findFirst({
      where: { id: addressId, customerId: id },
    })

    if (!address) {
      return next(new AppError('Adresse non trouvée', 404, 'NOT_FOUND'))
    }

    await prisma.customerAddress.delete({
      where: { id: addressId },
    })

    // Si c'était l'adresse par défaut, mettre à jour
    if (customer.defaultAddressId === addressId) {
      const firstAddress = await prisma.customerAddress.findFirst({
        where: { customerId: id },
        orderBy: { createdAt: 'asc' },
      })
      await prisma.restaurantCustomer.update({
        where: { id },
        data: { defaultAddressId: firstAddress?.id || null },
      })
    }

    res.json({
      success: true,
      message: 'Adresse supprimée',
    })
  } catch (error) {
    next(error)
  }
})

export const restaurantCustomersRoutes = router
