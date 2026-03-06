import { Router } from 'express'
import { prisma } from '@iziresto/database'
import { hashPassword } from '../utils/password'

const router = Router()

// Valider le token d'invitation
router.get('/validate', async (req, res) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, valid: false, error: 'TOKEN_REQUIRED' })
    }

    const client = await prisma.client.findFirst({
      where: {
        inviteToken: token,
        inviteExpires: { gt: new Date() },
        status: 'LEAD',
      },
    })

    if (!client) {
      return res.json({ success: true, data: { valid: false } })
    }

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: client.organizationId },
      select: { name: true }
    })

    res.json({
      success: true,
      data: {
        valid: true,
        email: client.email,
        resellerName: organization?.name || '',
        clientName: client.name,
      }
    })
  } catch (error) {
    console.error('Validate token error:', error)
    res.status(500).json({ success: false, valid: false, error: 'INTERNAL_ERROR' })
  }
})

// Completer l'onboarding
router.post('/complete', async (req, res) => {
  try {
    const {
      token,
      firstName,
      lastName,
      email,
      phone,
      password,
      restaurantName,
      restaurantPhone,
      restaurantAddress,
    } = req.body

    if (!token || !firstName || !lastName || !email || !password || !restaurantName) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS' })
    }

    // Verifier le token
    const client = await prisma.client.findFirst({
      where: {
        inviteToken: token,
        inviteExpires: { gt: new Date() },
        status: 'LEAD',
      },
    })

    if (!client) {
      return res.status(400).json({ success: false, error: 'INVALID_TOKEN' })
    }

    // Recuperer l'abonnement en attente
    const pendingSubscription = await prisma.clientSubscription.findFirst({
      where: {
        clientId: client.id,
        status: 'PENDING',
      }
    })

    // Verifier que l'email correspond
    if (client.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'EMAIL_MISMATCH' })
    }

    // Verifier que l'utilisateur n'existe pas deja
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'USER_EXISTS' })
    }

    const hashedPassword = await hashPassword(password)

    // Generer un subdomain unique
    const baseSubdomain = restaurantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30)

    let subdomain = baseSubdomain
    let counter = 1
    while (await prisma.site.findUnique({ where: { subdomain } })) {
      subdomain = `${baseSubdomain}-${counter}`
      counter++
    }

    // Transaction pour creer tout
    const result = await prisma.$transaction(async (tx) => {
      // 1. Creer l'utilisateur
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          firstName,
          lastName,
          phone,
          userType: 'RESTAURANT',
          emailVerified: true,
        }
      })

      // 2. Mettre a jour le client
      await tx.client.update({
        where: { id: client.id },
        data: {
          status: 'ACTIVE',
          inviteToken: null,
          inviteExpires: null,
          contactFirstName: firstName,
          contactLastName: lastName,
          phone,
        }
      })

      // 3. Creer le site
      const site = await tx.site.create({
        data: {
          organizationId: client.organizationId,
          clientId: client.id,
          subdomain,
          status: 'DRAFT',
        }
      })

      // 4. Creer le restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          email: email.toLowerCase(),
          phone: restaurantPhone || phone,
          address: restaurantAddress || '',
          city: '',
          postalCode: '',
          country: 'FR',
        }
      })

      // 5. Lier le restaurant au site
      await tx.site.update({
        where: { id: site.id },
        data: { restaurantId: restaurant.id }
      })

      // 6. Activer l'abonnement si present
      if (pendingSubscription) {
        await tx.clientSubscription.update({
          where: { id: pendingSubscription.id },
          data: {
            status: 'ACTIVE',
            startDate: new Date(),
          }
        })
      }

      return { user, site, restaurant }
    })

    console.log('Onboarding completed for:', email, 'Restaurant:', restaurantName)

    res.status(201).json({
      success: true,
      message: 'Compte cree avec succes',
      data: {
        userId: result.user.id,
        siteId: result.site.id,
        restaurantId: result.restaurant.id,
      }
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// ============================================
// RESELLER ONBOARDING
// ============================================

router.get('/reseller/validate', async (req, res) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, valid: false, error: 'TOKEN_REQUIRED' })
    }

    const user = await prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteExpires: { gt: new Date() },
        userType: 'RESELLER',
      },
      include: {
        resellerProfile: {
          include: {
            organization: true,
          },
        },
      },
    })

    if (!user) {
      return res.json({ success: true, data: { valid: false } })
    }

    const organization = user.resellerProfile?.organization

    res.json({
      success: true,
      data: {
        valid: true,
        email: user.email,
        organizationId: organization?.id,
        organizationName: organization?.name,
      },
    })
  } catch (error) {
    console.error('Validate reseller token error:', error)
    res.status(500).json({ success: false, valid: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/reseller/complete', async (req, res) => {
  try {
    const {
      token,
      firstName,
      lastName,
      organizationName,
      password,
      phone,
      address,
      city,
      postalCode,
      country,
      siret,
      logo,
      primaryColor,
    } = req.body

    if (!token || !firstName || !lastName || !organizationName || !password) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS' })
    }

    const user = await prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteExpires: { gt: new Date() },
        userType: 'RESELLER',
      },
      include: {
        resellerProfile: {
          include: {
            organization: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(400).json({ success: false, error: 'INVALID_TOKEN' })
    }

    const member = user.resellerProfile
    const organization = member?.organization

    if (!organization) {
      return res.status(400).json({ success: false, error: 'ORGANIZATION_NOT_FOUND' })
    }

    const hashedPassword = await hashPassword(password)

    const baseSlug = organizationName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)

    let slug = baseSlug
    let counter = 1
    while (await prisma.resellerOrganization.findFirst({ where: { slug, id: { not: organization.id } } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName,
          phone: phone || null,
          passwordHash: hashedPassword,
          inviteToken: null,
          inviteExpires: null,
          emailVerified: true,
        },
      })

      await tx.resellerOrganization.update({
        where: { id: organization.id },
        data: {
          name: organizationName,
          slug,
          phone: phone || null,
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          country: country || 'FR',
          siret: siret || null,
          logo: logo || null,
          primaryColor: primaryColor || '#10b981',
          status: 'ACTIVE',
          isActive: true,
        },
      })

      await tx.resellerMember.update({
        where: { id: member.id },
        data: {
          isActive: true,
          joinedAt: new Date(),
        },
      })

      await tx.auditLog.create({
        data: {
          entityType: 'RESELLER',
          entityId: organization.id,
          action: 'ONBOARDING_COMPLETED',
          performedBy: user.id,
        },
      })
    })

    console.log('Reseller onboarding completed for:', user.email, 'Organization:', organizationName)

    res.status(201).json({
      success: true,
      message: 'Compte revendeur cree avec succes',
      data: {
        userId: user.id,
        organizationId: organization.id,
      },
    })
  } catch (error) {
    console.error('Reseller onboarding error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

export { router as onboardingRoutes }
