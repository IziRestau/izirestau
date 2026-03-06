import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { sendResellerInvitationEmail } from '../../services/email.service'
import crypto from 'crypto'

const router = Router()

// GET /platform/resellers - Liste paginée avec filtres
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, planId, sortBy = 'createdAt', sortOrder = 'desc', page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (planId && planId !== 'all') {
      where.license = { planId: planId }
    }

    // Build orderBy based on sortBy parameter
    let orderBy: any = { createdAt: sortOrder }
    if (sortBy === 'name') {
      orderBy = { name: sortOrder }
    } else if (sortBy === 'sites') {
      orderBy = { sites: { _count: sortOrder } }
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder }
    }

    const [resellers, total, stats] = await Promise.all([
      prisma.resellerOrganization.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          license: {
            include: { plan: true },
          },
          _count: {
            select: { sites: true, members: true, clients: true },
          },
        },
      }),
      prisma.resellerOrganization.count({ where }),
      Promise.all([
        prisma.resellerOrganization.count(),
        prisma.resellerOrganization.count({ where: { status: 'ACTIVE' } }),
        prisma.resellerOrganization.count({ where: { status: 'PENDING' } }),
        prisma.resellerOrganization.count({ where: { status: 'SUSPENDED' } }),
        prisma.resellerOrganization.count({ where: { status: 'CANCELLED' } }),
      ]),
    ])

    res.json({
      success: true,
      data: {
        resellers,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          total: stats[0],
          active: stats[1],
          pending: stats[2],
          suspended: stats[3],
          cancelled: stats[4],
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /platform/resellers/:id - Détails complet
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const reseller = await prisma.resellerOrganization.findUnique({
      where: { id },
      include: {
        license: {
          include: {
            plan: true,
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                phone: true,
                createdAt: true,
              },
            },
          },
        },
        sites: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        clients: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            sites: true,
            members: true,
            clients: true,
            clientInvoices: true,
          },
        },
      },
    })

    if (!reseller) {
      return next(new AppError('Revendeur non trouve', 404, 'NOT_FOUND'))
    }

    res.json({ success: true, data: reseller })
  } catch (error) {
    next(error)
  }
})

// POST /platform/resellers - Créer un revendeur + envoyer invitation
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, planId } = req.body
    const userId = req.user?.userId

    if (!email) {
      return next(new AppError('Email requis', 400, 'MISSING_EMAIL'))
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return next(new AppError('Cet email est deja utilise', 400, 'EMAIL_EXISTS'))
    }

    const existingOrg = await prisma.resellerOrganization.findFirst({
      where: { email: email.toLowerCase() },
    })

    if (existingOrg) {
      return next(new AppError('Une organisation avec cet email existe deja', 400, 'ORG_EXISTS'))
    }

    // Générer un token d'invitation
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours

    // Générer un slug temporaire
    const tempSlug = `reseller-${Date.now()}`

    // Si un planId est fourni, créer une licence pour ce plan
    let licenseId: string | null = null
    if (planId) {
      const plan = await prisma.licensePlan.findUnique({ where: { id: planId } })
      if (plan) {
        const license = await prisma.license.create({
          data: {
            planId: plan.id,
            status: 'TRIALING',
            billingCycle: 'MONTHLY',
            trialStart: new Date(),
            trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        })
        licenseId = license.id
      }
    }

    // Créer l'organisation en statut PENDING
    const reseller = await prisma.resellerOrganization.create({
      data: {
        name: 'Nouveau revendeur',
        slug: tempSlug,
        email: email.toLowerCase(),
        status: 'PENDING',
        licenseId,
      },
    })

    // Créer un utilisateur temporaire avec le token d'invitation
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: '',
        firstName: '',
        lastName: '',
        userType: 'RESELLER',
        inviteToken,
        inviteExpires,
      },
    })

    // Créer le membre avec le rôle OWNER
    await prisma.resellerMember.create({
      data: {
        organizationId: reseller.id,
        userId: user.id,
        role: 'OWNER',
        invitedBy: userId,
        invitedAt: new Date(),
      },
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        entityType: 'RESELLER',
        entityId: reseller.id,
        action: 'CREATED',
        performedBy: userId,
        metadata: { email },
      },
    })

    // Envoyer l'email d'invitation
    try {
      await sendResellerInvitationEmail({
        to: email,
        inviteToken,
        inviteUrl: `${process.env.FRONTEND_URL}/onboarding/reseller?token=${inviteToken}&email=${encodeURIComponent(email)}`,
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
    }

    res.status(201).json({
      success: true,
      data: reseller,
      message: 'Revendeur cree et invitation envoyee',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /platform/resellers/:id - Modifier un revendeur
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const {
      name,
      email,
      phone,
      website,
      address,
      city,
      postalCode,
      country,
      businessName,
      siret,
      vatNumber,
      primaryColor,
    } = req.body

    const reseller = await prisma.resellerOrganization.findUnique({
      where: { id },
    })

    if (!reseller) {
      return next(new AppError('Revendeur non trouve', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.resellerOrganization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(country !== undefined && { country }),
        ...(businessName !== undefined && { businessName }),
        ...(siret !== undefined && { siret }),
        ...(vatNumber !== undefined && { vatNumber }),
        ...(primaryColor !== undefined && { primaryColor }),
      },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'RESELLER',
        entityId: id,
        action: 'UPDATED',
        performedBy: userId,
        metadata: req.body,
      },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

// PUT /platform/resellers/:id/license - Changer de licence
router.put('/:id/license', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const { planId } = req.body

    if (!planId) {
      return next(new AppError('Plan ID requis', 400, 'VALIDATION_ERROR'))
    }

    const reseller = await prisma.resellerOrganization.findUnique({
      where: { id },
      include: { license: true },
    })

    if (!reseller) {
      return next(new AppError('Revendeur non trouve', 404, 'NOT_FOUND'))
    }

    const plan = await prisma.licensePlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return next(new AppError('Plan non trouve', 404, 'NOT_FOUND'))
    }

    if (!reseller.license) {
      return next(new AppError('Ce revendeur n\'a pas de licence', 400, 'NO_LICENSE'))
    }

    const updatedLicense = await prisma.license.update({
      where: { id: reseller.license.id },
      data: { planId },
      include: { plan: true },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'RESELLER',
        entityId: id,
        action: 'LICENSE_CHANGED',
        performedBy: userId,
        metadata: { oldPlanId: reseller.license.planId, newPlanId: planId },
      },
    })

    res.json({ success: true, data: updatedLicense, message: 'Licence mise a jour' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/resellers/:id/activate - Activer
router.post('/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    const reseller = await prisma.resellerOrganization.findUnique({
      where: { id },
    })

    if (!reseller) {
      return next(new AppError('Revendeur non trouve', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.resellerOrganization.update({
      where: { id },
      data: { status: 'ACTIVE', isActive: true },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'RESELLER',
        entityId: id,
        action: 'ACTIVATED',
        performedBy: userId,
      },
    })

    res.json({ success: true, data: updated, message: 'Revendeur active' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/resellers/:id/suspend - Suspendre
router.post('/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const { reason } = req.body

    const reseller = await prisma.resellerOrganization.findUnique({
      where: { id },
    })

    if (!reseller) {
      return next(new AppError('Revendeur non trouve', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.resellerOrganization.update({
      where: { id },
      data: { status: 'SUSPENDED', isActive: false },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'RESELLER',
        entityId: id,
        action: 'SUSPENDED',
        performedBy: userId,
        metadata: reason ? { reason } : undefined,
      },
    })

    res.json({ success: true, data: updated, message: 'Revendeur suspendu' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/resellers/:id/cancel - Annuler
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const { reason } = req.body

    const reseller = await prisma.resellerOrganization.findUnique({
      where: { id },
    })

    if (!reseller) {
      return next(new AppError('Revendeur non trouve', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.resellerOrganization.update({
      where: { id },
      data: { status: 'CANCELLED', isActive: false },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'RESELLER',
        entityId: id,
        action: 'CANCELLED',
        performedBy: userId,
        metadata: reason ? { reason } : undefined,
      },
    })

    res.json({ success: true, data: updated, message: 'Revendeur annule' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/resellers/:id/resend-invite - Renvoyer invitation
router.post('/:id/resend-invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    const reseller = await prisma.resellerOrganization.findUnique({
      where: { id },
      include: {
        members: {
          where: { role: 'OWNER' },
          include: { user: true },
        },
      },
    })

    if (!reseller) {
      return next(new AppError('Revendeur non trouve', 404, 'NOT_FOUND'))
    }

    const owner = reseller.members[0]?.user
    if (!owner) {
      return next(new AppError('Proprietaire non trouve', 404, 'OWNER_NOT_FOUND'))
    }

    // Générer un nouveau token
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: owner.id },
      data: { inviteToken, inviteExpires },
    })

    // Envoyer l'email
    try {
      await sendResellerInvitationEmail({
        to: owner.email,
        inviteToken,
        inviteUrl: `${process.env.FRONTEND_URL}/onboarding/reseller?token=${inviteToken}&email=${encodeURIComponent(owner.email)}`,
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      return next(new AppError('Erreur lors de l\'envoi de l\'email', 500, 'EMAIL_ERROR'))
    }

    await prisma.auditLog.create({
      data: {
        entityType: 'RESELLER',
        entityId: id,
        action: 'INVITE_RESENT',
        performedBy: userId,
      },
    })

    res.json({ success: true, message: 'Invitation renvoyee' })
  } catch (error) {
    next(error)
  }
})

// DELETE /platform/resellers/:id - Supprimer/Annuler invitation (seulement si PENDING)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    const reseller = await prisma.resellerOrganization.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: true },
        },
        license: true,
      },
    })

    if (!reseller) {
      return next(new AppError('Revendeur non trouve', 404, 'NOT_FOUND'))
    }

    if (reseller.status !== 'PENDING') {
      return next(new AppError('Seules les invitations en attente peuvent etre annulees', 400, 'INVALID_STATUS'))
    }

    // Supprimer dans l'ordre: membres, utilisateurs, licence, organisation
    const userIds = reseller.members.map(m => m.userId)

    await prisma.$transaction(async (tx) => {
      await tx.resellerMember.deleteMany({ where: { organizationId: id } })
      await tx.user.deleteMany({ where: { id: { in: userIds } } })
      if (reseller.license) {
        await tx.license.delete({ where: { id: reseller.license.id } })
      }
      await tx.resellerOrganization.delete({ where: { id } })
    })

    res.json({ success: true, message: 'Invitation annulee' })
  } catch (error) {
    next(error)
  }
})

// GET /platform/resellers/:id/activity - Historique des actions
router.get('/:id/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { limit = '50' } = req.query

    const activities = await prisma.auditLog.findMany({
      where: { entityType: 'RESELLER', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
    })

    // Enrichir avec les noms des utilisateurs
    const userIds = activities.map(a => a.performedBy).filter(Boolean) as string[]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    const enrichedActivities = activities.map(a => ({
      ...a,
      performedByUser: a.performedBy ? userMap.get(a.performedBy) : null,
    }))

    res.json({ success: true, data: enrichedActivities })
  } catch (error) {
    next(error)
  }
})

// GET /platform/resellers/:id/sites - Sites du revendeur
router.get('/:id/sites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const sites = await prisma.site.findMany({
      where: { organizationId: id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
            email: true,
            phone: true,
            city: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: sites })
  } catch (error) {
    next(error)
  }
})

// GET /platform/resellers/:id/clients - Clients du revendeur
router.get('/:id/clients', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const clients = await prisma.client.findMany({
      where: { organizationId: id },
      include: {
        sites: {
          select: {
            id: true,
            subdomain: true,
            status: true,
          },
        },
        _count: {
          select: { sites: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: clients })
  } catch (error) {
    next(error)
  }
})

// GET /platform/resellers/:id/invoices - Factures du revendeur
router.get('/:id/invoices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const invoices = await prisma.clientInvoice.findMany({
      where: { organizationId: id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: invoices })
  } catch (error) {
    next(error)
  }
})

// ============================================
// SITES MANAGEMENT
// ============================================

// DELETE /platform/resellers/sites/:siteId - Supprimer un site
router.delete('/sites/:siteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params
    const userId = req.user?.userId

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { restaurant: true, organization: true },
    })

    if (!site) {
      return next(new AppError('Site non trouve', 404, 'NOT_FOUND'))
    }

    await prisma.$transaction(async (tx) => {
      // Supprimer le restaurant associe si existe
      if (site.restaurantId) {
        await tx.restaurant.delete({ where: { id: site.restaurantId } })
      }
      // Supprimer le site
      await tx.site.delete({ where: { id: siteId } })

      // Mettre a jour le compteur de sites utilises sur la licence
      if (site.organization?.licenseId) {
        await tx.license.update({
          where: { id: site.organization.licenseId },
          data: { sitesUsed: { decrement: 1 } },
        })
      }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'SITE',
        entityId: siteId,
        action: 'SITE_DELETED',
        performedBy: userId,
        metadata: { subdomain: site.subdomain, organizationId: site.organizationId },
      },
    })

    res.json({ success: true, message: 'Site supprime' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/resellers/sites/:siteId/activate - Activer un site
router.post('/sites/:siteId/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params
    const userId = req.user?.userId

    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) {
      return next(new AppError('Site non trouve', 404, 'NOT_FOUND'))
    }

    await prisma.site.update({
      where: { id: siteId },
      data: { status: 'ACTIVE' },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'SITE',
        entityId: siteId,
        action: 'ACTIVATED',
        performedBy: userId,
      },
    })

    res.json({ success: true, message: 'Site active' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/resellers/sites/:siteId/suspend - Suspendre un site
router.post('/sites/:siteId/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params
    const userId = req.user?.userId
    const { reason } = req.body

    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) {
      return next(new AppError('Site non trouve', 404, 'NOT_FOUND'))
    }

    await prisma.site.update({
      where: { id: siteId },
      data: { status: 'SUSPENDED' },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'SITE',
        entityId: siteId,
        action: 'SUSPENDED',
        performedBy: userId,
        metadata: reason ? { reason } : undefined,
      },
    })

    res.json({ success: true, message: 'Site suspendu' })
  } catch (error) {
    next(error)
  }
})

// ============================================
// MEMBERS MANAGEMENT
// ============================================

// PATCH /platform/resellers/members/:memberId/status - Activer/Desactiver un membre
router.patch('/members/:memberId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params
    const { isActive } = req.body
    const userId = req.user?.userId

    const member = await prisma.resellerMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    })

    if (!member) {
      return next(new AppError('Membre non trouve', 404, 'NOT_FOUND'))
    }

    await prisma.resellerMember.update({
      where: { id: memberId },
      data: { isActive },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'RESELLER',
        entityId: member.organizationId,
        action: isActive ? 'MEMBER_ACTIVATED' : 'MEMBER_DEACTIVATED',
        performedBy: userId,
        metadata: { memberId, email: member.user.email },
      },
    })

    res.json({ success: true, message: isActive ? 'Membre active' : 'Membre desactive' })
  } catch (error) {
    next(error)
  }
})

// DELETE /platform/resellers/members/:memberId - Revoquer un membre
router.delete('/members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params
    const userId = req.user?.userId

    const member = await prisma.resellerMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    })

    if (!member) {
      return next(new AppError('Membre non trouve', 404, 'NOT_FOUND'))
    }

    if (member.role === 'OWNER') {
      return next(new AppError('Impossible de revoquer le proprietaire', 400, 'CANNOT_REVOKE_OWNER'))
    }

    await prisma.resellerMember.delete({ where: { id: memberId } })

    await prisma.auditLog.create({
      data: {
        entityType: 'RESELLER',
        entityId: member.organizationId,
        action: 'MEMBER_REMOVED',
        performedBy: userId,
        metadata: { memberId, email: member.user.email },
      },
    })

    res.json({ success: true, message: 'Membre revoque' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/resellers/members/:memberId/resend-invite - Renvoyer invitation membre
router.post('/members/:memberId/resend-invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params
    const userId = req.user?.userId

    const member = await prisma.resellerMember.findUnique({
      where: { id: memberId },
      include: { user: true, organization: true },
    })

    if (!member) {
      return next(new AppError('Membre non trouve', 404, 'NOT_FOUND'))
    }

    // Generer un nouveau token
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: member.userId },
      data: { inviteToken, inviteExpires },
    })

    // Envoyer l'email
    try {
      await sendResellerInvitationEmail({
        to: member.user.email,
        inviteToken,
        inviteUrl: `${process.env.FRONTEND_URL}/onboarding/reseller?token=${inviteToken}&email=${encodeURIComponent(member.user.email)}`,
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      return next(new AppError('Erreur lors de l\'envoi de l\'email', 500, 'EMAIL_ERROR'))
    }

    await prisma.auditLog.create({
      data: {
        entityType: 'RESELLER',
        entityId: member.organizationId,
        action: 'INVITE_RESENT',
        performedBy: userId,
        metadata: { memberId, email: member.user.email },
      },
    })

    res.json({ success: true, message: 'Invitation renvoyee' })
  } catch (error) {
    next(error)
  }
})

// ============================================
// CLIENTS MANAGEMENT
// ============================================

// PATCH /platform/resellers/clients/:clientId/status - Changer statut client
router.patch('/clients/:clientId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.params
    const { status } = req.body
    const userId = req.user?.userId

    if (!['PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED'].includes(status)) {
      return next(new AppError('Statut invalide', 400, 'INVALID_STATUS'))
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) {
      return next(new AppError('Client non trouve', 404, 'NOT_FOUND'))
    }

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { status },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'CLIENT',
        entityId: clientId,
        action: 'STATUS_CHANGED',
        performedBy: userId,
        metadata: { oldStatus: client.status, newStatus: status },
      },
    })

    res.json({ success: true, data: updated, message: 'Statut mis a jour' })
  } catch (error) {
    next(error)
  }
})

// ============================================
// INVOICES MANAGEMENT
// ============================================

// PATCH /platform/resellers/invoices/:invoiceId/status - Changer statut facture
router.patch('/invoices/:invoiceId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.params
    const { status } = req.body
    const userId = req.user?.userId

    if (!['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
      return next(new AppError('Statut invalide', 400, 'INVALID_STATUS'))
    }

    const invoice = await prisma.clientInvoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) {
      return next(new AppError('Facture non trouvee', 404, 'NOT_FOUND'))
    }

    const updateData: Record<string, unknown> = { status }
    if (status === 'PAID') {
      updateData.paidAt = new Date()
    }

    const updated = await prisma.clientInvoice.update({
      where: { id: invoiceId },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'INVOICE',
        entityId: invoiceId,
        action: 'STATUS_CHANGED',
        performedBy: userId,
        metadata: { oldStatus: invoice.status, newStatus: status },
      },
    })

    res.json({ success: true, data: updated, message: 'Statut mis a jour' })
  } catch (error) {
    next(error)
  }
})

// POST /platform/resellers/invoices/:invoiceId/resend - Renvoyer facture par email
router.post('/invoices/:invoiceId/resend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.params
    const userId = req.user?.userId

    const invoice = await prisma.clientInvoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    })

    if (!invoice) {
      return next(new AppError('Facture non trouvee', 404, 'NOT_FOUND'))
    }

    // TODO: Implementer l'envoi d'email de facture
    // await sendInvoiceEmail({ to: invoice.client.email, invoice })

    await prisma.auditLog.create({
      data: {
        entityType: 'INVOICE',
        entityId: invoiceId,
        action: 'INVOICE_RESENT',
        performedBy: userId,
        metadata: { clientEmail: invoice.client.email },
      },
    })

    res.json({ success: true, message: 'Facture renvoyee' })
  } catch (error) {
    next(error)
  }
})

export { router as platformResellersRoutes }
