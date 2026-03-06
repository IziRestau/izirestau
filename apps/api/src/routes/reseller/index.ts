import { Router } from 'express'
import { prisma, Site, Client, SiteStatus } from '@iziresto/database'
import { sendInvitationEmail } from '../../services/email.service'
import { authenticate } from '../../middlewares/auth.middleware'
import { cache, invalidateCacheKey } from '../../middlewares/cache.middleware'
import { redis, cacheKeys, cacheTTL } from '../../services/redis.service'
import supportRoutes from './support.routes'

const router = Router()

router.use(authenticate)

router.use('/support', supportRoutes)

// Helper pour obtenir l'organizationId du membre
async function getOrganizationId(userId: string): Promise<string | null> {
  const member = await prisma.resellerMember.findUnique({
    where: { userId },
    select: { organizationId: true }
  })
  return member?.organizationId || null
}

// Helper pour invalider le cache reseller
async function invalidateResellerCache(orgId: string) {
  await redis.delPattern(`reseller:*:${orgId}`)
  await redis.delPattern(`site:*`)
}

router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: {
        organization: {
          include: {
            license: {
              include: { plan: true }
            },
            sites: { where: { isActive: true } },
            clients: { where: { isActive: true } },
          }
        }
      }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const org = member.organization
    const license = org.license
    const plan = license?.plan

    // Essayer de recuperer depuis le cache
    const cacheKey = cacheKeys.resellerDashboard(org.id)
    const cached = await redis.get(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
    }

    const data = {
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
      },
      license: license ? {
        id: license.id,
        status: license.status,
        billingCycle: license.billingCycle,
        currentPeriodEnd: license.currentPeriodEnd,
        sitesUsed: license.sitesUsed,
        plan: plan ? {
          name: plan.name,
          maxSites: plan.maxSites,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
        } : null,
      } : null,
      stats: {
        sitesCount: org.sites.length,
        sitesActive: org.sites.filter((s: Site) => s.status === 'ACTIVE').length,
        sitesRemaining: plan ? plan.maxSites - (license?.sitesUsed || 0) : 0,
        clientsCount: org.clients.length,
        clientsActive: org.clients.filter((c: Client) => c.status === 'ACTIVE').length,
      }
    }

    // Mettre en cache pour 5 minutes
    await redis.set(cacheKey, data, cacheTTL.medium)

    res.json({ success: true, data })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.get('/sites', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const sites = await prisma.site.findMany({
      where: { organizationId: member.organizationId },
      include: {
        restaurant: {
          select: { name: true, email: true, phone: true }
        },
        client: {
          select: { id: true, name: true, email: true, contactFirstName: true, contactLastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: sites })
  } catch (error) {
    console.error('Sites error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/sites', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: {
        organization: {
          include: {
            license: { include: { plan: true } }
          }
        }
      }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const { subdomain, clientId } = req.body

    if (!subdomain) {
      return res.status(400).json({ success: false, error: 'SUBDOMAIN_REQUIRED' })
    }

    const existingSite = await prisma.site.findUnique({
      where: { subdomain }
    })

    if (existingSite) {
      return res.status(400).json({ success: false, error: 'SUBDOMAIN_TAKEN' })
    }

    const license = member.organization.license
    const plan = license?.plan

    if (plan && license && license.sitesUsed >= plan.maxSites) {
      return res.status(400).json({ success: false, error: 'SITES_LIMIT_REACHED' })
    }

    const site = await prisma.site.create({
      data: {
        organizationId: member.organizationId,
        subdomain: subdomain.toLowerCase(),
        clientId: clientId || null,
        status: 'DRAFT',
      },
      include: {
        client: true
      }
    })

    if (license) {
      await prisma.license.update({
        where: { id: license.id },
        data: { sitesUsed: { increment: 1 } }
      })
    }

    // Invalider le cache
    await invalidateResellerCache(member.organizationId)

    res.status(201).json({ success: true, data: site })
  } catch (error) {
    console.error('Create site error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.get('/clients', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const clients = await prisma.client.findMany({
      where: { organizationId: member.organizationId },
      include: {
        sites: {
          select: { id: true, subdomain: true, status: true }
        },
        _count: {
          select: { sites: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: clients })
  } catch (error) {
    console.error('Clients error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/clients', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const { name, contactFirstName, contactLastName, email, phone, businessName, siret, subscriptionAmount, billingCycle } = req.body

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'MISSING_REQUIRED_FIELDS' })
    }

    const existingClient = await prisma.client.findUnique({
      where: {
        organizationId_email: {
          organizationId: member.organizationId,
          email
        }
      },
      include: {
        sites: true
      }
    })

    // Générer un token d'invitation unique
    const inviteToken = require('crypto').randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours

    let result
    let isNewRestaurant = false

    if (existingClient) {
      // Client existe déjà - on ajoute un nouveau site/restaurant
      isNewRestaurant = true
      
      // Vérifier si le client a déjà un User associé
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      result = await prisma.$transaction(async (tx) => {
        // Générer un subdomain unique pour le nouveau site
        const siteCount = existingClient.sites.length + 1
        const baseSubdomain = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        const subdomain = `${baseSubdomain}-${siteCount}`

        // Créer le restaurant d'abord
        const restaurant = await tx.restaurant.create({
          data: {
            name,
            email,
            phone: phone || '',
            address: '',
            city: '',
            postalCode: '',
            country: 'FR',
            businessType: 'RESTAURANT',
          }
        })

        // Créer le site avec la référence au restaurant
        const site = await tx.site.create({
          data: {
            organizationId: member.organizationId,
            clientId: existingClient.id,
            subdomain,
            status: 'DRAFT',
            restaurantId: restaurant.id,
          }
        })

        // Créer les settings du restaurant
        await tx.restaurantSettings.create({
          data: {
            restaurantId: restaurant.id,
          }
        })

        // Si le User existe, créer un RestaurantStaff pour ce nouveau restaurant
        if (existingUser) {
          await tx.restaurantStaff.create({
            data: {
              restaurantId: restaurant.id,
              userId: existingUser.id,
              role: 'OWNER',
            }
          })
        }

        // Créer l'abonnement si montant spécifié
        if (subscriptionAmount && subscriptionAmount > 0) {
          await tx.clientSubscription.create({
            data: {
              organizationId: member.organizationId,
              clientId: existingClient.id,
              name: `Abonnement Restaurant - ${name}`,
              amount: subscriptionAmount,
              billingCycle: billingCycle || 'MONTHLY',
              status: 'PENDING',
              startDate: new Date(),
            }
          })
        }

        return { ...existingClient, newSite: site, newRestaurant: restaurant }
      })
    } else {
      // Nouveau client - créer le client avec transaction
      result = await prisma.$transaction(async (tx) => {
        // Créer le client
        const client = await tx.client.create({
          data: {
            organizationId: member.organizationId,
            name,
            contactFirstName: contactFirstName || '',
            contactLastName: contactLastName || '',
            email,
            phone,
            businessName,
            siret,
            status: 'LEAD',
            inviteToken,
            inviteExpires,
          }
        })

        // Créer l'abonnement si montant spécifié
        if (subscriptionAmount && subscriptionAmount > 0) {
          await tx.clientSubscription.create({
            data: {
              organizationId: member.organizationId,
              clientId: client.id,
              name: 'Abonnement Restaurant',
              amount: subscriptionAmount,
              billingCycle: billingCycle || 'MONTHLY',
              status: 'PENDING',
              startDate: new Date(),
            }
          })
        }

        return client
      })
    }

    // Récupérer le nom du revendeur pour l'email
    const organization = await prisma.resellerOrganization.findFirst({
      where: { id: member.organizationId },
      select: { name: true }
    })

    // Invalider le cache
    await invalidateResellerCache(member.organizationId)

    // Vérifier si le User existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (isNewRestaurant && existingUser) {
      // Nouveau restaurant pour client existant avec compte - pas d'email
      console.log('=== NEW RESTAURANT FOR EXISTING USER ===')
      console.log('Client ID:', existingClient?.id)
      console.log('User ID:', existingUser.id)
      console.log('New Restaurant:', (result as any).newRestaurant?.name)
      console.log('=========================================')

      res.status(201).json({ 
        success: true, 
        data: result,
        message: `Nouveau restaurant "${name}" ajouté avec succès. Le propriétaire peut y accéder depuis son dashboard.`
      })
    } else {
      // Nouveau client OU client existant sans compte User - envoyer l'email d'invitation
      // Mettre à jour le token d'invitation sur le client existant si nécessaire
      if (isNewRestaurant && existingClient) {
        await prisma.client.update({
          where: { id: existingClient.id },
          data: { inviteToken, inviteExpires }
        })
      }

      const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding?token=${inviteToken}&email=${encodeURIComponent(email)}`
      
      console.log('=== INVITATION DEBUG ===')
      console.log('Token saved in DB:', inviteToken)
      console.log('Token in URL:', inviteUrl)
      console.log('Client ID:', isNewRestaurant ? existingClient?.id : result.id)
      console.log('Is new restaurant for existing client:', isNewRestaurant)
      console.log('========================')

      await sendInvitationEmail(
        email,
        contactFirstName || 'Cher propriétaire',
        organization?.name || 'Votre revendeur',
        inviteUrl
      )

      console.log('Invitation sent to:', email)

      res.status(201).json({ 
        success: true, 
        data: result,
        message: 'Invitation envoyée avec succès'
      })
    }
  } catch (error) {
    console.error('Create client error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Renvoyer une invitation
router.post('/clients/:clientId/resend-invitation', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { clientId } = req.params

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: {
        organization: true
      }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: member.organizationId,
        status: 'LEAD'
      }
    })

    if (!client) {
      return res.status(404).json({ success: false, error: 'CLIENT_NOT_FOUND' })
    }

    // Generer un nouveau token d'invitation et le sauvegarder
    const inviteToken = require('crypto').randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours

    await prisma.client.update({
      where: { id: clientId },
      data: { inviteToken, inviteExpires }
    })

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding?token=${inviteToken}&email=${encodeURIComponent(client.email)}`

    await sendInvitationEmail(
      client.email,
      client.contactFirstName,
      member.organization.name,
      inviteUrl
    )

    console.log('Invitation resent to:', client.email, 'New token:', inviteToken)

    res.json({ success: true, message: 'Invitation renvoyee' })
  } catch (error) {
    console.error('Resend invitation error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Supprimer un client (annuler invitation)
router.delete('/clients/:clientId', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { clientId } = req.params

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: member.organizationId,
      }
    })

    if (!client) {
      return res.status(404).json({ success: false, error: 'CLIENT_NOT_FOUND' })
    }

    // Supprimer le client et ses abonnements en cascade
    await prisma.$transaction(async (tx) => {
      await tx.clientSubscription.deleteMany({
        where: { clientId }
      })
      await tx.client.delete({
        where: { id: clientId }
      })
    })

    console.log('Client deleted:', clientId)

    // Invalider le cache
    await invalidateResellerCache(member.organizationId)

    res.json({ success: true, message: 'Client supprime' })
  } catch (error) {
    console.error('Delete client error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Stats par periode (pour les filtres du dashboard)
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { period = 'month' } = req.query // 'day', 'week', 'month'

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    // Calculer les dates selon la periode
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    // Sites crees dans la periode
    const sitesCreated = await prisma.site.count({
      where: {
        organizationId: member.organizationId,
        createdAt: { gte: startDate }
      }
    })

    // Sites actifs dans la periode
    const sitesActivated = await prisma.site.count({
      where: {
        organizationId: member.organizationId,
        status: 'ACTIVE',
        publishedAt: { gte: startDate }
      }
    })

    // Clients crees dans la periode
    const clientsCreated = await prisma.client.count({
      where: {
        organizationId: member.organizationId,
        createdAt: { gte: startDate }
      }
    })

    // Clients actifs dans la periode
    const clientsActivated = await prisma.client.count({
      where: {
        organizationId: member.organizationId,
        status: 'ACTIVE',
        createdAt: { gte: startDate }
      }
    })

    res.json({
      success: true,
      data: {
        period,
        startDate,
        sitesCreated,
        sitesActivated,
        clientsCreated,
        clientsActivated
      }
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Revenus par periode
router.get('/revenue', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { period = 'month', filter = 'all' } = req.query // period: 'day', 'week', 'month' | filter: 'all', 'sites', 'services'

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: {
        organization: {
          include: {
            license: true
          }
        }
      }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    // Recuperer la devise de l'organisation
    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: member.organization.id },
      select: { currency: true }
    })
    const currency = organization?.currency || 'XOF'
    const orgId = member.organization.id

    const now = new Date()
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec']

    // Recuperer les factures payees (sans filtre sur paidAt car peut etre null)
    const paidInvoices = await prisma.clientInvoice.findMany({
      where: {
        organizationId: orgId,
        status: { in: ['PAID', 'PARTIAL'] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        paidAmount: true,
        paidAt: true,
        issueDate: true,
        status: true,
      }
    })

    // Recuperer les paiements directs
    const payments = await prisma.clientPayment.findMany({
      where: {
        organizationId: orgId,
      },
      select: {
        amount: true,
        receivedAt: true,
      }
    })

    // Trouver la date la plus ancienne parmi les factures
    let oldestDate = now
    paidInvoices.forEach(inv => {
      const invDate = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.issueDate)
      if (invDate < oldestDate) oldestDate = invDate
    })
    payments.forEach(p => {
      const pDate = new Date(p.receivedAt)
      if (pDate < oldestDate) oldestDate = pDate
    })

    // Generer les donnees depuis la date la plus ancienne jusqu'a maintenant
    const monthlyData = []
    const startMonth = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1)
    const endMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    let currentMonth = new Date(startMonth)
    while (currentMonth <= endMonth) {
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)
      const monthLabel = `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear().toString().slice(-2)}`

      // Revenus des factures payees ce mois (utilise paidAt ou issueDate)
      const invoiceRevenue = paidInvoices
        .filter(inv => {
          const invDate = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.issueDate)
          return invDate >= monthStart && invDate <= monthEnd
        })
        .reduce((sum, inv) => sum + Number(inv.paidAmount || inv.total), 0)

      // Revenus des paiements directs ce mois
      const paymentRevenue = payments
        .filter(p => {
          const pDate = new Date(p.receivedAt)
          return pDate >= monthStart && pDate <= monthEnd
        })
        .reduce((sum, p) => sum + Number(p.amount), 0)

      monthlyData.push({
        month: monthLabel,
        value: invoiceRevenue + paymentRevenue,
        sites: invoiceRevenue,
        services: paymentRevenue
      })

      // Passer au mois suivant
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    }

    // Total revenus (factures payees + paiements)
    const totalFromInvoices = paidInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || inv.total), 0)
    const totalFromPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const totalRevenue = totalFromInvoices + totalFromPayments

    res.json({
      success: true,
      data: {
        period,
        filter,
        totalRevenue,
        currency,
        chartData: monthlyData
      }
    })
  } catch (error) {
    console.error('Revenue error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Obtenir les details d'un site
router.get('/sites/:siteId', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { siteId } = req.params

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        organizationId: member.organizationId,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
            logo: true,
            coverImage: true,
            businessType: true,
            cuisineTypes: true,
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            contactFirstName: true,
            contactLastName: true,
            businessName: true,
            status: true,
            notes: true,
            createdAt: true,
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                name: true,
                amount: true,
                currency: true,
                billingCycle: true,
                status: true,
                startDate: true,
                nextBillingDate: true,
              }
            },
            invoices: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: {
                id: true,
                invoiceNumber: true,
                total: true,
                status: true,
                issueDate: true,
                dueDate: true,
                paidAt: true,
              }
            },
            interactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: {
                id: true,
                type: true,
                subject: true,
                content: true,
                performedBy: true,
                createdAt: true,
              }
            }
          }
        }
      }
    })

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND' })
    }

    // Recuperer les stats du site (placeholder pour l'instant)
    const stats = {
      ordersCount: 0,
      ordersThisMonth: 0,
      revenue: 0,
      revenueThisMonth: 0,
      visitorsThisMonth: 0,
    }

    res.json({ 
      success: true, 
      data: {
        ...site,
        stats
      }
    })
  } catch (error) {
    console.error('Get site error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Changer le statut d'un site
router.patch('/sites/:siteId/status', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { siteId } = req.params
    const { status } = req.body

    if (!status || !['DRAFT', 'ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'INVALID_STATUS' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        organizationId: member.organizationId,
      }
    })

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND' })
    }

    const updateData: { status: SiteStatus; publishedAt?: Date | null } = { status: status as SiteStatus }
    
    // Si on active le site, mettre a jour publishedAt
    if (status === 'ACTIVE' && site.status !== 'ACTIVE') {
      updateData.publishedAt = new Date()
    }

    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: updateData,
      include: {
        restaurant: { select: { name: true } },
        client: { select: { name: true, email: true } }
      }
    })

    // Invalider le cache
    await invalidateResellerCache(member.organizationId)
    await redis.del(cacheKeys.siteDetails(siteId))

    res.json({ success: true, data: updatedSite })
  } catch (error) {
    console.error('Update site status error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Ajouter une note/interaction sur un client
router.post('/clients/:clientId/notes', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { clientId } = req.params
    const { content, type = 'NOTE', subject } = req.body

    if (!content) {
      return res.status(400).json({ success: false, error: 'CONTENT_REQUIRED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: { organization: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: member.organizationId,
      }
    })

    if (!client) {
      return res.status(404).json({ success: false, error: 'CLIENT_NOT_FOUND' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    })

    const interaction = await prisma.clientInteraction.create({
      data: {
        clientId,
        type: type as 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'TASK',
        subject,
        content,
        performedBy: user ? `${user.firstName} ${user.lastName}` : undefined,
      }
    })

    // Invalider le cache
    await invalidateResellerCache(member.organizationId)

    res.status(201).json({ success: true, data: interaction })
  } catch (error) {
    console.error('Add note error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Mettre a jour les notes du client
router.patch('/clients/:clientId/notes', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { clientId } = req.params
    const { notes } = req.body

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: member.organizationId,
      }
    })

    if (!client) {
      return res.status(404).json({ success: false, error: 'CLIENT_NOT_FOUND' })
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { notes },
      select: { id: true, notes: true }
    })

    // Invalider le cache
    await invalidateResellerCache(member.organizationId)

    res.json({ success: true, data: updatedClient })
  } catch (error) {
    console.error('Update notes error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Renvoyer les acces (reset password) au restaurateur
router.post('/sites/:siteId/resend-access', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { siteId } = req.params

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: { organization: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        organizationId: member.organizationId,
      },
      include: {
        restaurant: {
          select: { email: true, name: true }
        }
      }
    })

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND' })
    }

    if (!site.restaurant) {
      return res.status(400).json({ success: false, error: 'NO_RESTAURANT_LINKED' })
    }

    // Trouver l'utilisateur associe au restaurant
    const restaurantUser = await prisma.user.findFirst({
      where: { email: site.restaurant.email }
    })

    if (!restaurantUser) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' })
    }

    // Generer un token de reset password
    const crypto = require('crypto')
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    // Sauvegarder le token (on utilise un champ existant ou on cree une table)
    // Pour l'instant, on log juste le lien
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(site.restaurant.email)}`

    console.log('=== RESET PASSWORD LINK ===')
    console.log('Email:', site.restaurant.email)
    console.log('URL:', resetUrl)
    console.log('===========================')

    // TODO: Envoyer l'email de reset password
    // await sendResetPasswordEmail(site.restaurant.email, site.restaurant.name, resetUrl)

    res.json({ 
      success: true, 
      message: 'Lien de reinitialisation envoye',
      email: site.restaurant.email
    })
  } catch (error) {
    console.error('Resend access error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Envoyer une relance pour une facture impayee
router.post('/invoices/:invoiceId/reminder', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { invoiceId } = req.params

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: { organization: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const invoice = await prisma.clientInvoice.findFirst({
      where: {
        id: invoiceId,
        organizationId: member.organizationId,
      },
      include: {
        client: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            contactFirstName: true,
            contactLastName: true 
          }
        },
        items: true
      }
    })

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'INVOICE_NOT_FOUND' })
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ success: false, error: 'INVOICE_ALREADY_PAID' })
    }

    // Mettre a jour le compteur de relances
    const updatedInvoice = await prisma.clientInvoice.update({
      where: { id: invoiceId },
      data: {
        remindersSent: { increment: 1 },
        lastReminderAt: new Date()
      }
    })

    // Formater les montants
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
    }

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    // Verifier si la facture est en retard
    const isOverdue = new Date(invoice.dueDate) < new Date()

    // Envoyer l'email de relance
    if (invoice.client?.email) {
      const { sendInvoiceReminderEmail } = await import('../../services/email.service')
      
      await sendInvoiceReminderEmail(
        invoice.client.email,
        invoice.client.contactFirstName || invoice.client.name,
        invoice.invoiceNumber,
        formatCurrency(Number(invoice.total)),
        formatDate(invoice.dueDate),
        member.organization.name,
        isOverdue
      )

      console.log(`[Invoice Reminder] Email envoye a ${invoice.client.email} pour facture ${invoice.invoiceNumber}`)
    }

    // Ajouter une interaction pour tracer la relance
    if (invoice.client) {
      await prisma.clientInteraction.create({
        data: {
          clientId: invoice.client.id,
          type: 'EMAIL',
          subject: `Relance facture ${invoice.invoiceNumber}`,
          content: `Relance envoyee pour la facture ${invoice.invoiceNumber} d'un montant de ${formatCurrency(Number(invoice.total))}. Echeance: ${formatDate(invoice.dueDate)}.`,
          performedBy: req.user?.email || 'Systeme'
        }
      })
    }

    res.json({ 
      success: true, 
      message: 'Relance envoyee',
      data: {
        invoiceNumber: invoice.invoiceNumber,
        clientEmail: invoice.client?.email,
        remindersSent: updatedInvoice.remindersSent
      }
    })
  } catch (error) {
    console.error('Invoice reminder error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.get('/license', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: {
        organization: {
          include: {
            license: {
              include: {
                plan: true,
                payments: {
                  orderBy: { createdAt: 'desc' },
                  take: 10
                }
              }
            },
            _count: {
              select: { sites: true }
            }
          }
        }
      }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const license = member.organization.license
    const sitesUsed = member.organization._count.sites

    res.json({ 
      success: true, 
      data: {
        ...license,
        sitesUsed,
        organization: {
          name: member.organization.name,
          email: member.organization.email
        }
      }
    })
  } catch (error) {
    console.error('License error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Lister les factures du revendeur (factures clients)
router.get('/invoices', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const { status, clientId, page = '1', limit = '20' } = req.query

    const where: any = {
      organizationId: member.organizationId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    const [invoices, total] = await Promise.all([
      prisma.clientInvoice.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: true
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take
      }),
      prisma.clientInvoice.count({ where })
    ])

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / take)
      }
    })
  } catch (error) {
    console.error('List invoices error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Statistiques des factures (DOIT etre avant /invoices/:invoiceId)
router.get('/invoices/stats/summary', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const [totalInvoices, paidInvoices, pendingInvoices, overdueInvoices] = await Promise.all([
      prisma.clientInvoice.aggregate({
        where: { organizationId: member.organizationId },
        _sum: { total: true },
        _count: true
      }),
      prisma.clientInvoice.aggregate({
        where: { organizationId: member.organizationId, status: 'PAID' },
        _sum: { total: true },
        _count: true
      }),
      prisma.clientInvoice.aggregate({
        where: { organizationId: member.organizationId, status: { in: ['DRAFT', 'SENT'] } },
        _sum: { total: true },
        _count: true
      }),
      prisma.clientInvoice.aggregate({
        where: { organizationId: member.organizationId, status: 'OVERDUE' },
        _sum: { total: true },
        _count: true
      })
    ])

    res.json({
      success: true,
      data: {
        total: {
          count: totalInvoices._count,
          amount: Number(totalInvoices._sum.total || 0)
        },
        paid: {
          count: paidInvoices._count,
          amount: Number(paidInvoices._sum.total || 0)
        },
        pending: {
          count: pendingInvoices._count,
          amount: Number(pendingInvoices._sum.total || 0)
        },
        overdue: {
          count: overdueInvoices._count,
          amount: Number(overdueInvoices._sum.total || 0)
        }
      }
    })
  } catch (error) {
    console.error('Invoice stats error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Recuperer une facture par ID
router.get('/invoices/:invoiceId', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { invoiceId } = req.params

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const invoice = await prisma.clientInvoice.findFirst({
      where: {
        id: invoiceId,
        organizationId: member.organizationId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
            siret: true,
            vatNumber: true
          }
        },
        items: true,
        subscription: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'INVOICE_NOT_FOUND' })
    }

    res.json({ success: true, data: invoice })
  } catch (error) {
    console.error('Get invoice error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Creer une nouvelle facture
router.post('/invoices', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const { clientId, items, dueDate, notes } = req.body

    if (!clientId || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'MISSING_REQUIRED_FIELDS' })
    }

    // Verifier que le client appartient a l'organisation
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: member.organizationId
      }
    })

    if (!client) {
      return res.status(404).json({ success: false, error: 'CLIENT_NOT_FOUND' })
    }

    // Generer le numero de facture
    const lastInvoice = await prisma.clientInvoice.findFirst({
      where: { organizationId: member.organizationId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    })

    const year = new Date().getFullYear()
    let invoiceNumber: string

    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/)
      const lastNum = match ? parseInt(match[1]) : 0
      invoiceNumber = `FAC-${year}-${String(lastNum + 1).padStart(4, '0')}`
    } else {
      invoiceNumber = `FAC-${year}-0001`
    }

    // Calculer les totaux
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)

    const taxRate = 20
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    const invoice = await prisma.clientInvoice.create({
      data: {
        organizationId: member.organizationId,
        clientId,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        taxRate,
        taxAmount,
        total,
        status: 'DRAFT',
        notes,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            total: (item.quantity || 1) * item.unitPrice
          }))
        }
      },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        },
        items: true
      }
    })

    res.status(201).json({ success: true, data: invoice })
  } catch (error) {
    console.error('Create invoice error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Mettre a jour le statut d'une facture
router.patch('/invoices/:invoiceId/status', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { invoiceId } = req.params
    const { status, paidAmount } = req.body

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const invoice = await prisma.clientInvoice.findFirst({
      where: {
        id: invoiceId,
        organizationId: member.organizationId
      }
    })

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'INVOICE_NOT_FOUND' })
    }

    const updateData: any = { status }

    if (status === 'PAID') {
      updateData.paidAmount = invoice.total
      updateData.paidAt = new Date()
    } else if (status === 'PARTIAL' && paidAmount) {
      updateData.paidAmount = paidAmount
    }

    const updatedInvoice = await prisma.clientInvoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        client: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    res.json({ success: true, data: updatedInvoice })
  } catch (error) {
    console.error('Update invoice status error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Recuperer tous les plans disponibles pour upgrade
router.get('/license/plans', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const plans = await prisma.licensePlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    res.json({ success: true, data: plans })
  } catch (error) {
    console.error('License plans error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// ============================================
// SETTINGS ROUTES
// ============================================

router.get('/settings', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            language: true,
            timezone: true,
            emailVerified: true,
          }
        },
        organization: {
          include: {
            license: {
              include: { plan: true }
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!member) {
      return res.status(404).json({ success: false, error: 'MEMBER_NOT_FOUND' })
    }

    res.json({
      success: true,
      data: {
        user: member.user,
        organization: {
          id: member.organization.id,
          name: member.organization.name,
          slug: member.organization.slug,
          email: member.organization.email,
          phone: member.organization.phone,
          website: member.organization.website,
          address: member.organization.address,
          city: member.organization.city,
          postalCode: member.organization.postalCode,
          country: member.organization.country,
          businessName: member.organization.businessName,
          siret: member.organization.siret,
          vatNumber: member.organization.vatNumber,
          logo: member.organization.logo,
          primaryColor: member.organization.primaryColor,
          status: member.organization.status,
          currency: member.organization.currency,
        },
        license: member.organization.license,
        members: member.organization.members.map(m => ({
          id: m.id,
          role: m.role,
          isActive: m.isActive,
          joinedAt: m.joinedAt,
          user: m.user,
        })),
        currentMember: {
          id: member.id,
          role: member.role,
          permissions: member.permissions,
        }
      }
    })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.put('/settings/profile', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { firstName, lastName, phone, avatar, language, timezone } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
        ...(language && { language }),
        ...(timezone && { timezone }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        language: true,
        timezone: true,
      }
    })

    res.json({ success: true, data: updatedUser })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.put('/settings/organization', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const orgId = await getOrganizationId(userId)
    if (!orgId) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { role: true }
    })

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' })
    }

    const { 
      name, email, phone, website, 
      address, city, postalCode, country,
      businessName, siret, vatNumber, currency 
    } = req.body

    const validCurrencies = ['XOF', 'EUR', 'USD']
    const currencyToUpdate = currency && validCurrencies.includes(currency) ? currency : undefined

    const updatedOrg = await prisma.resellerOrganization.update({
      where: { id: orgId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(country && { country }),
        ...(businessName !== undefined && { businessName }),
        ...(siret !== undefined && { siret }),
        ...(vatNumber !== undefined && { vatNumber }),
        ...(currencyToUpdate && { currency: currencyToUpdate }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        businessName: true,
        siret: true,
        vatNumber: true,
        logo: true,
        primaryColor: true,
        currency: true,
      }
    })

    await invalidateResellerCache(orgId)

    res.json({ success: true, data: updatedOrg })
  } catch (error) {
    console.error('Update organization error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.put('/settings/branding', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const orgId = await getOrganizationId(userId)
    if (!orgId) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { role: true }
    })

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' })
    }

    const { logo, primaryColor } = req.body

    const updatedOrg = await prisma.resellerOrganization.update({
      where: { id: orgId },
      data: {
        ...(logo !== undefined && { logo }),
        ...(primaryColor && { primaryColor }),
      },
      select: {
        id: true,
        logo: true,
        primaryColor: true,
      }
    })

    await invalidateResellerCache(orgId)

    res.json({ success: true, data: updatedOrg })
  } catch (error) {
    console.error('Update branding error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.put('/settings/password', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'PASSWORD_TOO_SHORT', message: 'Le mot de passe doit contenir au moins 8 caracteres' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' })
    }

    const bcrypt = await import('bcryptjs')
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'INVALID_PASSWORD', message: 'Mot de passe actuel incorrect' })
    }

    const newHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    })

    res.json({ success: true, message: 'Mot de passe mis a jour' })
  } catch (error) {
    console.error('Update password error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.get('/settings/members', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const orgId = await getOrganizationId(userId)
    if (!orgId) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const members = await prisma.resellerMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    res.json({
      success: true,
      data: members.map(m => ({
        id: m.id,
        role: m.role,
        isActive: m.isActive,
        joinedAt: m.joinedAt,
        invitedAt: m.invitedAt,
        user: m.user,
      }))
    })
  } catch (error) {
    console.error('Get members error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/settings/members/invite', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const orgId = await getOrganizationId(userId)
    if (!orgId) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { role: true }
    })

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' })
    }

    const { email, firstName, lastName, role } = req.body

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS' })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      const existingMember = await prisma.resellerMember.findUnique({
        where: { userId: existingUser.id }
      })

      if (existingMember) {
        return res.status(400).json({ success: false, error: 'USER_ALREADY_MEMBER', message: 'Cet utilisateur est deja membre d\'une organisation' })
      }
    }

    const crypto = await import('crypto')
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const bcrypt = await import('bcryptjs')
    const tempPassword = crypto.randomBytes(8).toString('hex')
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const newUser = await prisma.user.upsert({
      where: { email },
      update: {
        inviteToken,
        inviteExpires,
      },
      create: {
        email,
        firstName,
        lastName,
        passwordHash,
        userType: 'RESELLER',
        inviteToken,
        inviteExpires,
      }
    })

    await prisma.resellerMember.create({
      data: {
        organizationId: orgId,
        userId: newUser.id,
        role: role || 'MEMBER',
        invitedBy: userId,
        invitedAt: new Date(),
      }
    })

    const org = await prisma.resellerOrganization.findUnique({
      where: { id: orgId },
      select: { name: true }
    })

    const inviteLink = `${process.env.FRONTEND_URL}/invite/${inviteToken}`
    await sendInvitationEmail(email, firstName, org?.name || 'IziResto', inviteLink)

    res.json({ success: true, message: 'Invitation envoyee' })
  } catch (error) {
    console.error('Invite member error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.put('/settings/members/:memberId', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { memberId } = req.params
    const { role, isActive } = req.body

    const orgId = await getOrganizationId(userId)
    if (!orgId) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const currentMember = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { role: true, id: true }
    })

    if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' })
    }

    const targetMember = await prisma.resellerMember.findUnique({
      where: { id: memberId },
      select: { organizationId: true, role: true }
    })

    if (!targetMember || targetMember.organizationId !== orgId) {
      return res.status(404).json({ success: false, error: 'MEMBER_NOT_FOUND' })
    }

    if (targetMember.role === 'OWNER' && currentMember.role !== 'OWNER') {
      return res.status(403).json({ success: false, error: 'CANNOT_MODIFY_OWNER' })
    }

    if (role === 'OWNER' && currentMember.role !== 'OWNER') {
      return res.status(403).json({ success: false, error: 'CANNOT_ASSIGN_OWNER' })
    }

    const updatedMember = await prisma.resellerMember.update({
      where: { id: memberId },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    })

    res.json({
      success: true,
      data: {
        id: updatedMember.id,
        role: updatedMember.role,
        isActive: updatedMember.isActive,
        user: updatedMember.user,
      }
    })
  } catch (error) {
    console.error('Update member error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.delete('/settings/members/:memberId', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { memberId } = req.params

    const orgId = await getOrganizationId(userId)
    if (!orgId) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const currentMember = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { role: true, id: true }
    })

    if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' })
    }

    if (currentMember.id === memberId) {
      return res.status(400).json({ success: false, error: 'CANNOT_REMOVE_SELF' })
    }

    const targetMember = await prisma.resellerMember.findUnique({
      where: { id: memberId },
      select: { organizationId: true, role: true, userId: true }
    })

    if (!targetMember || targetMember.organizationId !== orgId) {
      return res.status(404).json({ success: false, error: 'MEMBER_NOT_FOUND' })
    }

    if (targetMember.role === 'OWNER') {
      return res.status(403).json({ success: false, error: 'CANNOT_REMOVE_OWNER' })
    }

    await prisma.resellerMember.delete({
      where: { id: memberId }
    })

    res.json({ success: true, message: 'Membre supprime' })
  } catch (error) {
    console.error('Delete member error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.get('/settings/notifications', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notifyEmailInvoice: true,
        notifyEmailPayment: true,
        notifyEmailNewSite: true,
        notifyEmailNewClient: true,
        notifyEmailWeeklyReport: true,
        notifyEmailMarketing: true,
      }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.put('/settings/notifications', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const {
      notifyEmailInvoice,
      notifyEmailPayment,
      notifyEmailNewSite,
      notifyEmailNewClient,
      notifyEmailWeeklyReport,
      notifyEmailMarketing,
    } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(notifyEmailInvoice !== undefined && { notifyEmailInvoice }),
        ...(notifyEmailPayment !== undefined && { notifyEmailPayment }),
        ...(notifyEmailNewSite !== undefined && { notifyEmailNewSite }),
        ...(notifyEmailNewClient !== undefined && { notifyEmailNewClient }),
        ...(notifyEmailWeeklyReport !== undefined && { notifyEmailWeeklyReport }),
        ...(notifyEmailMarketing !== undefined && { notifyEmailMarketing }),
      },
      select: {
        notifyEmailInvoice: true,
        notifyEmailPayment: true,
        notifyEmailNewSite: true,
        notifyEmailNewClient: true,
        notifyEmailWeeklyReport: true,
        notifyEmailMarketing: true,
      }
    })

    res.json({ success: true, data: updatedUser })
  } catch (error) {
    console.error('Update notifications error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.get('/settings/export-data', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        language: true,
        timezone: true,
        emailVerified: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' })
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true,
            website: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
            businessName: true,
            siret: true,
            vatNumber: true,
            logo: true,
            primaryColor: true,
            status: true,
            createdAt: true,
          }
        }
      }
    })

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        ...user,
        passwordHash: '[REDACTED]',
      },
      membership: member ? {
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt,
        organization: member.organization,
      } : null,
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="iziresto-data-export-${new Date().toISOString().split('T')[0]}.json"`)
    res.json(exportData)
  } catch (error) {
    console.error('Export data error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/settings/resend-verification', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, emailVerified: true }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' })
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, error: 'EMAIL_ALREADY_VERIFIED', message: 'Email deja verifie' })
    }

    const crypto = await import('crypto')
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: verificationToken,
        resetExpires: verificationExpires,
      }
    })

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`
    
    const { sendEmailVerificationEmail } = await import('../../services/email.service')
    await sendEmailVerificationEmail(user.email, user.firstName, verificationLink)

    res.json({ success: true, message: 'Email de verification envoye' })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.get('/settings/domain', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }
    const organizationId = await getOrganizationId(userId)
    if (!organizationId) {
      return res.status(403).json({ success: false, error: 'NO_ORGANIZATION' })
    }

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: organizationId },
      select: {
        customDomain: true,
        domainVerified: true,
        domainVerifiedAt: true,
        domainTxtRecord: true,
      }
    })

    if (!organization) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    res.json({ success: true, data: organization })
  } catch (error) {
    console.error('Get domain error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/settings/domain', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }
    const organizationId = await getOrganizationId(userId)
    if (!organizationId) {
      return res.status(403).json({ success: false, error: 'NO_ORGANIZATION' })
    }

    const { domain } = req.body
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'DOMAIN_REQUIRED' })
    }

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/
    if (!domainRegex.test(cleanDomain)) {
      return res.status(400).json({ success: false, error: 'INVALID_DOMAIN', message: 'Format de domaine invalide' })
    }

    const existing = await prisma.resellerOrganization.findFirst({
      where: { 
        customDomain: cleanDomain,
        id: { not: organizationId }
      }
    })

    if (existing) {
      return res.status(400).json({ success: false, error: 'DOMAIN_TAKEN', message: 'Ce domaine est deja utilise' })
    }

    const crypto = await import('crypto')
    const txtRecord = `iziresto-verify=${crypto.randomBytes(16).toString('hex')}`

    await prisma.resellerOrganization.update({
      where: { id: organizationId },
      data: {
        customDomain: cleanDomain,
        domainVerified: false,
        domainVerifiedAt: null,
        domainTxtRecord: txtRecord,
      }
    })

    res.json({ 
      success: true, 
      data: { 
        domain: cleanDomain, 
        txtRecord,
        message: 'Domaine configure. Ajoutez l\'enregistrement TXT pour verifier.' 
      } 
    })
  } catch (error) {
    console.error('Set domain error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/settings/domain/verify', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }
    const organizationId = await getOrganizationId(userId)
    if (!organizationId) {
      return res.status(403).json({ success: false, error: 'NO_ORGANIZATION' })
    }

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: organizationId },
      select: {
        customDomain: true,
        domainTxtRecord: true,
        domainVerified: true,
      }
    })

    if (!organization?.customDomain) {
      return res.status(400).json({ success: false, error: 'NO_DOMAIN_CONFIGURED' })
    }

    if (organization.domainVerified) {
      return res.status(400).json({ success: false, error: 'ALREADY_VERIFIED' })
    }

    const dns = await import('dns')
    const { promisify } = await import('util')
    const resolveTxt = promisify(dns.resolveTxt)

    try {
      const records = await resolveTxt(organization.customDomain)
      const flatRecords = records.flat()
      const isVerified = flatRecords.some(record => record === organization.domainTxtRecord)

      if (!isVerified) {
        return res.status(400).json({ 
          success: false, 
          error: 'VERIFICATION_FAILED',
          message: 'Enregistrement TXT non trouve. Verifiez la configuration DNS.' 
        })
      }

      await prisma.resellerOrganization.update({
        where: { id: organizationId },
        data: {
          domainVerified: true,
          domainVerifiedAt: new Date(),
        }
      })

      res.json({ success: true, message: 'Domaine verifie avec succes' })
    } catch (dnsError) {
      return res.status(400).json({ 
        success: false, 
        error: 'DNS_LOOKUP_FAILED',
        message: 'Impossible de verifier le DNS. Reessayez dans quelques minutes.' 
      })
    }
  } catch (error) {
    console.error('Verify domain error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.delete('/settings/domain', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }
    const organizationId = await getOrganizationId(userId)
    if (!organizationId) {
      return res.status(403).json({ success: false, error: 'NO_ORGANIZATION' })
    }

    await prisma.resellerOrganization.update({
      where: { id: organizationId },
      data: {
        customDomain: null,
        domainVerified: false,
        domainVerifiedAt: null,
        domainTxtRecord: null,
      }
    })

    res.json({ success: true, message: 'Domaine supprime' })
  } catch (error) {
    console.error('Delete domain error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Get currency settings
router.get('/settings/currency', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }
    const organizationId = await getOrganizationId(userId)
    if (!organizationId) {
      return res.status(403).json({ success: false, error: 'NO_ORGANIZATION' })
    }

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: organizationId },
      select: { currency: true }
    })

    if (!organization) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    res.json({
      success: true,
      data: { currency: organization.currency }
    })
  } catch (error) {
    console.error('Get currency error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Update currency settings
router.put('/settings/currency', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }
    const organizationId = await getOrganizationId(userId)
    if (!organizationId) {
      return res.status(403).json({ success: false, error: 'NO_ORGANIZATION' })
    }

    const { currency } = req.body
    const validCurrencies = ['XOF', 'EUR', 'USD']
    
    if (!currency || !validCurrencies.includes(currency)) {
      return res.status(400).json({ 
        success: false, 
        error: 'INVALID_CURRENCY',
        message: 'Devise invalide'
      })
    }

    await prisma.resellerOrganization.update({
      where: { id: organizationId },
      data: { currency }
    })

    res.json({
      success: true,
      data: { currency },
      message: 'Devise mise a jour'
    })
  } catch (error) {
    console.error('Update currency error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// ============================================
// MONEROO PAYMENT CONFIGURATION
// ============================================

// Get Moneroo configuration
router.get('/settings/moneroo', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }
    const organizationId = await getOrganizationId(userId)
    if (!organizationId) {
      return res.status(403).json({ success: false, error: 'NO_ORGANIZATION' })
    }

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: organizationId },
      select: {
        monerooSecretKey: true,
        monerooWebhookSecret: true,
        monerooConfigured: true,
      }
    })

    if (!organization) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    res.json({
      success: true,
      data: {
        secretKey: organization.monerooSecretKey ? '••••••••' + organization.monerooSecretKey.slice(-4) : '',
        webhookSecret: organization.monerooWebhookSecret ? '••••••••' + organization.monerooWebhookSecret.slice(-4) : '',
        isConfigured: organization.monerooConfigured,
        hasSecretKey: !!organization.monerooSecretKey,
        hasWebhookSecret: !!organization.monerooWebhookSecret,
      }
    })
  } catch (error) {
    console.error('Get Moneroo config error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Update Moneroo configuration
router.put('/settings/moneroo', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }
    const organizationId = await getOrganizationId(userId)
    if (!organizationId) {
      return res.status(403).json({ success: false, error: 'NO_ORGANIZATION' })
    }

    const { secretKey, webhookSecret } = req.body

    if (!secretKey) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_KEY',
        message: 'La cle API est requise'
      })
    }

    const updateData: Record<string, string | boolean> = {
      monerooConfigured: true,
    }

    if (secretKey && !secretKey.startsWith('••••')) {
      updateData.monerooSecretKey = secretKey
    }

    if (webhookSecret && !webhookSecret.startsWith('••••')) {
      updateData.monerooWebhookSecret = webhookSecret
    }

    await prisma.resellerOrganization.update({
      where: { id: organizationId },
      data: updateData
    })

    res.json({
      success: true,
      message: 'Configuration Moneroo mise a jour'
    })
  } catch (error) {
    console.error('Update Moneroo config error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// Test Moneroo connection
router.post('/settings/moneroo/test', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }
    const organizationId = await getOrganizationId(userId)
    if (!organizationId) {
      return res.status(403).json({ success: false, error: 'NO_ORGANIZATION' })
    }

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: organizationId },
      select: {
        monerooSecretKey: true,
      }
    })

    if (!organization?.monerooSecretKey) {
      return res.status(400).json({
        success: false,
        error: 'NOT_CONFIGURED',
        message: 'Moneroo non configure'
      })
    }

    const response = await fetch('https://api.moneroo.io/v1/apps/current', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${organization.monerooSecretKey}`,
        'Accept': 'application/json',
      }
    })

    if (response.ok) {
      res.json({
        success: true,
        message: 'Connexion Moneroo reussie'
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'CONNECTION_FAILED',
        message: 'Echec de connexion - verifiez vos cles API'
      })
    }
  } catch (error) {
    console.error('Test Moneroo connection error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

export { router as resellerRoutes }
