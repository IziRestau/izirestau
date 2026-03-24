import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'
import { sendStaffInvitationEmail } from '../../services/email.service'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const router = Router()

// Toutes les routes settings necessitent d'etre membre du staff
router.use(loadStaff)

// GET /restaurant/settings - Recuperer tous les parametres
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const userId = req.user?.userId

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: staff.restaurantId },
      include: {
        settings: true,
        deliverySettings: true,
        openingHours: {
          include: { slots: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        specialHours: {
          orderBy: { date: 'asc' },
        },
        theme: true,
        receiptSettings: true,
      },
    })

    // Récupérer les templates de reçus disponibles (système + custom)
    const receiptTemplates = await prisma.receiptTemplate.findMany({
      where: {
        OR: [
          { restaurantId: null, isSystem: true },
          { restaurantId: staff.restaurantId },
        ],
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouve', 404, 'NOT_FOUND'))
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
        twoFactorEnabled: true,
      },
    })

    let staffMembers: Array<{
      id: string
      role: string
      position: string | null
      isActive: boolean
      createdAt: Date
      inviteStatus: 'pending' | 'expired' | 'accepted'
      user: { id: string; email: string; firstName: string; lastName: string; avatar: string | null }
    }> = []

    if (staff.role === 'OWNER' || staff.role === 'MANAGER') {
      const members = await prisma.restaurantStaff.findMany({
        where: { restaurantId: staff.restaurantId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              inviteToken: true,
              inviteExpires: true,
            },
          },
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      })
      staffMembers = members.map(m => {
        const isPending = !!m.user.inviteToken && (!m.user.inviteExpires || m.user.inviteExpires > new Date())
        const isExpired = !!m.user.inviteToken && m.user.inviteExpires && m.user.inviteExpires <= new Date()
        
        return {
          id: m.id,
          role: m.role,
          position: m.position,
          isActive: m.isActive,
          createdAt: m.createdAt,
          inviteStatus: isPending ? 'pending' : isExpired ? 'expired' : 'accepted' as const,
          user: {
            id: m.user.id,
            email: m.user.email,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            avatar: m.user.avatar,
          },
        }
      })
    }

    res.json({
      success: true,
      data: {
        user,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          description: restaurant.description,
          shortDescription: restaurant.shortDescription,
          email: restaurant.email,
          phone: restaurant.phone,
          website: restaurant.website,
          address: restaurant.address,
          addressLine2: restaurant.addressLine2,
          city: restaurant.city,
          postalCode: restaurant.postalCode,
          country: restaurant.country,
          latitude: restaurant.latitude ? Number(restaurant.latitude) : null,
          longitude: restaurant.longitude ? Number(restaurant.longitude) : null,
          businessName: restaurant.businessName,
          siret: restaurant.siret,
          vatNumber: restaurant.vatNumber,
          businessType: restaurant.businessType,
          cuisineTypes: restaurant.cuisineTypes,
          logo: restaurant.logo,
          coverImage: restaurant.coverImage,
          images: restaurant.images,
        },
        settings: restaurant.settings ? {
          id: restaurant.settings.id,
          currency: restaurant.settings.currency,
          language: restaurant.settings.language,
          timezone: restaurant.settings.timezone,
          orderPrefix: restaurant.settings.orderPrefix,
          autoAcceptOrders: restaurant.settings.autoAcceptOrders,
          orderConfirmationEmail: restaurant.settings.orderConfirmationEmail,
          orderNotificationSms: restaurant.settings.orderNotificationSms,
          avgPrepTime: restaurant.settings.avgPrepTime,
          maxOrdersPerSlot: restaurant.settings.maxOrdersPerSlot,
          acceptCash: restaurant.settings.acceptCash,
          acceptCard: restaurant.settings.acceptCard,
          acceptOnlinePayment: restaurant.settings.acceptOnlinePayment,
          tipsEnabled: restaurant.settings.tipsEnabled,
          suggestedTips: restaurant.settings.suggestedTips,
          pickupEnabled: restaurant.settings.pickupEnabled,
          dineInEnabled: restaurant.settings.dineInEnabled,
          metaTitle: restaurant.settings.metaTitle,
          metaDescription: restaurant.settings.metaDescription,
          metaKeywords: restaurant.settings.metaKeywords,
          termsUrl: restaurant.settings.termsUrl,
          privacyUrl: restaurant.settings.privacyUrl,
          legalNotice: restaurant.settings.legalNotice,
        } : null,
        deliverySettings: restaurant.deliverySettings ? {
          id: restaurant.deliverySettings.id,
          isEnabled: restaurant.deliverySettings.isEnabled,
          baseFee: Number(restaurant.deliverySettings.baseFee),
          feePerKm: Number(restaurant.deliverySettings.feePerKm),
          freeDeliveryMin: restaurant.deliverySettings.freeDeliveryMin ? Number(restaurant.deliverySettings.freeDeliveryMin) : null,
          maxDistance: Number(restaurant.deliverySettings.maxDistance),
          minOrderAmount: Number(restaurant.deliverySettings.minOrderAmount),
          avgDeliveryTime: restaurant.deliverySettings.avgDeliveryTime,
          autoAssign: restaurant.deliverySettings.autoAssign,
        } : null,
        openingHours: restaurant.openingHours.map(oh => ({
          id: oh.id,
          dayOfWeek: oh.dayOfWeek,
          isOpen: oh.isOpen,
          slots: oh.slots.map(slot => ({
            id: slot.id,
            openTime: slot.openTime,
            closeTime: slot.closeTime,
            serviceTypes: slot.serviceTypes,
          })),
        })),
        specialHours: restaurant.specialHours.map(sh => ({
          id: sh.id,
          date: sh.date,
          isClosed: sh.isClosed,
          reason: sh.reason,
          openTime: sh.openTime,
          closeTime: sh.closeTime,
        })),
        theme: restaurant.theme ? {
          id: restaurant.theme.id,
          baseTheme: restaurant.theme.baseTheme,
          primaryColor: restaurant.theme.primaryColor,
          secondaryColor: restaurant.theme.secondaryColor,
          accentColor: restaurant.theme.accentColor,
          backgroundColor: restaurant.theme.backgroundColor,
          textColor: restaurant.theme.textColor,
          headingFont: restaurant.theme.headingFont,
          bodyFont: restaurant.theme.bodyFont,
          layoutStyle: restaurant.theme.layoutStyle,
          headerStyle: restaurant.theme.headerStyle,
          customCss: restaurant.theme.customCss,
          socialLinks: restaurant.theme.socialLinks,
          heroTitle: restaurant.theme.heroTitle,
          heroSubtitle: restaurant.theme.heroSubtitle,
          heroCtaText: restaurant.theme.heroCtaText,
          aboutTitle: restaurant.theme.aboutTitle,
          aboutText: restaurant.theme.aboutText,
          footerText: restaurant.theme.footerText,
          announcementText: restaurant.theme.announcementText,
          announcementActive: restaurant.theme.announcementActive,
          announcementBgColor: restaurant.theme.announcementBgColor,
          announcementLink: restaurant.theme.announcementLink,
          logoPosition: restaurant.theme.logoPosition,
          showRatings: restaurant.theme.showRatings,
          showPrepTime: restaurant.theme.showPrepTime,
          showAllergens: restaurant.theme.showAllergens,
          showCuisineTypes: restaurant.theme.showCuisineTypes,
          heroStyle: restaurant.theme.heroStyle,
          heroOverlayOpacity: restaurant.theme.heroOverlayOpacity,
          heroImageUrl: restaurant.theme.heroImageUrl,
          heroImages: restaurant.theme.heroImages,
          heroVideoUrl: restaurant.theme.heroVideoUrl,
          heroCtaLink: restaurant.theme.heroCtaLink,
          menuStyle: restaurant.theme.menuStyle,
          productCardStyle: restaurant.theme.productCardStyle,
          showProductImages: restaurant.theme.showProductImages,
          productConfig: restaurant.theme.productConfig,
          buttonStyle: restaurant.theme.buttonStyle,
          buttonSize: restaurant.theme.buttonSize,
          showAboutPage: restaurant.theme.showAboutPage,
          showContactPage: restaurant.theme.showContactPage,
          showGallery: restaurant.theme.showGallery,
          showTestimonials: restaurant.theme.showTestimonials,
          showNewsletter: restaurant.theme.showNewsletter,
          showMap: restaurant.theme.showMap,
          legalText: restaurant.theme.legalText,
          privacyText: restaurant.theme.privacyText,
          headerDesign: restaurant.theme.headerDesign,
          headerSticky: restaurant.theme.headerSticky,
          headerTransparent: restaurant.theme.headerTransparent,
          headerBgOpacity: restaurant.theme.headerBgOpacity,
          headerTextColor: restaurant.theme.headerTextColor,
          footerDesign: restaurant.theme.footerDesign,
          navigationConfig: restaurant.theme.navigationConfig,
          cartConfig: restaurant.theme.cartConfig,
        } : null,
        receiptSettings: restaurant.receiptSettings ? {
          id: restaurant.receiptSettings.id,
          ticketTemplateId: restaurant.receiptSettings.ticketTemplateId,
          invoiceSimpleTemplateId: restaurant.receiptSettings.invoiceSimpleTemplateId,
          invoiceFullTemplateId: restaurant.receiptSettings.invoiceFullTemplateId,
          logo: restaurant.receiptSettings.logo,
          thankYouMessage: restaurant.receiptSettings.thankYouMessage,
          footerText: restaurant.receiptSettings.footerText,
          showQrCode: restaurant.receiptSettings.showQrCode,
          qrCodeType: restaurant.receiptSettings.qrCodeType,
          qrCodeCustomUrl: restaurant.receiptSettings.qrCodeCustomUrl,
          autoPrintOnOrder: restaurant.receiptSettings.autoPrintOnOrder,
          autoEmailOnOrder: restaurant.receiptSettings.autoEmailOnOrder,
          defaultReceiptType: restaurant.receiptSettings.defaultReceiptType,
          receiptPrefix: restaurant.receiptSettings.receiptPrefix,
          nextSequenceNumber: restaurant.receiptSettings.nextSequenceNumber,
        } : null,
        receiptTemplates: receiptTemplates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: t.type,
          isSystem: t.isSystem,
          isDefault: t.isDefault,
          previewImage: t.previewImage,
        })),
        currentStaff: {
          id: staff.id,
          role: staff.role,
          permissions: staff.permissions,
        },
        staffMembers,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/profile - Mettre a jour le profil utilisateur
router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifie', 401, 'UNAUTHORIZED'))
    }

    const { firstName, lastName, phone, language, timezone, avatar } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(language !== undefined && { language }),
        ...(timezone !== undefined && { timezone }),
        ...(avatar !== undefined && { avatar }),
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
      },
    })

    res.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/restaurant - Mettre a jour les infos restaurant (OWNER/MANAGER)
router.put('/restaurant', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const {
      name,
      description,
      shortDescription,
      email,
      phone,
      website,
      address,
      addressLine2,
      city,
      postalCode,
      country,
      latitude,
      longitude,
      businessName,
      siret,
      vatNumber,
      businessType,
      cuisineTypes,
      logo,
      coverImage,
      images,
    } = req.body

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: staff.restaurantId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(address !== undefined && { address }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(country !== undefined && { country }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(businessName !== undefined && { businessName }),
        ...(siret !== undefined && { siret }),
        ...(vatNumber !== undefined && { vatNumber }),
        ...(businessType !== undefined && { businessType }),
        ...(cuisineTypes !== undefined && { cuisineTypes }),
        ...(logo !== undefined && { logo }),
        ...(coverImage !== undefined && { coverImage }),
        ...(images !== undefined && { images }),
      },
    })

    res.json({
      success: true,
      data: {
        id: updatedRestaurant.id,
        name: updatedRestaurant.name,
        description: updatedRestaurant.description,
        shortDescription: updatedRestaurant.shortDescription,
        email: updatedRestaurant.email,
        phone: updatedRestaurant.phone,
        website: updatedRestaurant.website,
        address: updatedRestaurant.address,
        addressLine2: updatedRestaurant.addressLine2,
        city: updatedRestaurant.city,
        postalCode: updatedRestaurant.postalCode,
        country: updatedRestaurant.country,
        latitude: updatedRestaurant.latitude ? Number(updatedRestaurant.latitude) : null,
        longitude: updatedRestaurant.longitude ? Number(updatedRestaurant.longitude) : null,
        businessName: updatedRestaurant.businessName,
        siret: updatedRestaurant.siret,
        vatNumber: updatedRestaurant.vatNumber,
        businessType: updatedRestaurant.businessType,
        cuisineTypes: updatedRestaurant.cuisineTypes,
        logo: updatedRestaurant.logo,
        coverImage: updatedRestaurant.coverImage,
        images: updatedRestaurant.images,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/settings/geocode - Geocoder une adresse
router.post('/geocode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.body

    if (!address || typeof address !== 'string') {
      return next(new AppError('Adresse requise', 400, 'ADDRESS_REQUIRED'))
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'Accept-Language': 'fr',
          'User-Agent': 'IziResto/1.0',
        },
      }
    )

    const data = await response.json() as Array<{ lat: string; lon: string; display_name: string }>

    if (data && data.length > 0) {
      const { lat, lon, display_name } = data[0]
      return res.json({
        success: true,
        data: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          displayName: display_name,
        },
      })
    }

    return res.json({
      success: false,
      error: 'ADDRESS_NOT_FOUND',
      message: 'Adresse non trouvee',
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/settings/reverse-geocode - Reverse geocoder des coordonnees
router.post('/reverse-geocode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body

    if (latitude === undefined || longitude === undefined) {
      return next(new AppError('Latitude et longitude requises', 400, 'COORDINATES_REQUIRED'))
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'fr',
          'User-Agent': 'IziResto/1.0 (contact@iziresto.com)',
        },
      }
    )

    if (!response.ok) {
      return res.json({
        success: false,
        data: { address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` },
      })
    }

    const text = await response.text()
    
    if (text.startsWith('<') || !text.startsWith('{')) {
      return res.json({
        success: false,
        data: { address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` },
      })
    }

    const data = JSON.parse(text) as {
      address?: {
        house_number?: string
        road?: string
        suburb?: string
        city?: string
        town?: string
        village?: string
      }
      display_name?: string
      error?: string
    }

    if (data.error) {
      return res.json({
        success: false,
        data: { address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` },
      })
    }

    if (data.address) {
      const parts = []
      if (data.address.house_number) parts.push(data.address.house_number)
      if (data.address.road) parts.push(data.address.road)
      if (data.address.suburb) parts.push(data.address.suburb)
      if (data.address.city || data.address.town || data.address.village) {
        parts.push(data.address.city || data.address.town || data.address.village)
      }
      const address = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || null

      return res.json({
        success: true,
        data: { address },
      })
    }

    return res.json({
      success: false,
      data: { address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` },
    })
  } catch (error) {
    return res.json({
      success: false,
      data: { address: null },
    })
  }
})

// PUT /restaurant/settings/currency - Mettre a jour la devise (OWNER uniquement)
router.put('/currency', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { currency } = req.body

    if (!currency || typeof currency !== 'string') {
      return next(new AppError('Devise requise', 400, 'CURRENCY_REQUIRED'))
    }

    // Verifier si le restaurant a des commandes
    const ordersCount = await prisma.order.count({
      where: { restaurantId: staff.restaurantId },
    })

    if (ordersCount > 0) {
      return next(new AppError(
        'La devise ne peut plus être modifiée car des commandes ont déjà été enregistrées. Contactez le support pour assistance.',
        400,
        'CURRENCY_CHANGE_BLOCKED'
      ))
    }

    const settings = await prisma.restaurantSettings.upsert({
      where: { restaurantId: staff.restaurantId },
      create: {
        restaurantId: staff.restaurantId,
        currency,
      },
      update: {
        currency,
      },
    })

    res.json({
      success: true,
      data: {
        currency: settings.currency,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/settings/currency/can-change - Verifier si la devise peut etre modifiee
router.get('/currency/can-change', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const ordersCount = await prisma.order.count({
      where: { restaurantId: staff.restaurantId },
    })

    res.json({
      success: true,
      data: {
        canChange: ordersCount === 0,
        ordersCount,
        message: ordersCount > 0 
          ? 'La devise ne peut plus être modifiée car des commandes ont déjà été enregistrées.'
          : 'La devise peut être modifiée.',
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/orders - Mettre a jour parametres commandes (OWNER/MANAGER)
router.put('/orders', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const {
      orderPrefix,
      autoAcceptOrders,
      orderConfirmationEmail,
      orderNotificationSms,
      avgPrepTime,
      maxOrdersPerSlot,
      pickupEnabled,
      dineInEnabled,
    } = req.body

    const settings = await prisma.restaurantSettings.upsert({
      where: { restaurantId: staff.restaurantId },
      create: {
        restaurantId: staff.restaurantId,
        ...(orderPrefix !== undefined && { orderPrefix }),
        ...(autoAcceptOrders !== undefined && { autoAcceptOrders }),
        ...(orderConfirmationEmail !== undefined && { orderConfirmationEmail }),
        ...(orderNotificationSms !== undefined && { orderNotificationSms }),
        ...(avgPrepTime !== undefined && { avgPrepTime }),
        ...(maxOrdersPerSlot !== undefined && { maxOrdersPerSlot }),
        ...(pickupEnabled !== undefined && { pickupEnabled }),
        ...(dineInEnabled !== undefined && { dineInEnabled }),
      },
      update: {
        ...(orderPrefix !== undefined && { orderPrefix }),
        ...(autoAcceptOrders !== undefined && { autoAcceptOrders }),
        ...(orderConfirmationEmail !== undefined && { orderConfirmationEmail }),
        ...(orderNotificationSms !== undefined && { orderNotificationSms }),
        ...(avgPrepTime !== undefined && { avgPrepTime }),
        ...(maxOrdersPerSlot !== undefined && { maxOrdersPerSlot }),
        ...(pickupEnabled !== undefined && { pickupEnabled }),
        ...(dineInEnabled !== undefined && { dineInEnabled }),
      },
    })

    res.json({
      success: true,
      data: {
        orderPrefix: settings.orderPrefix,
        autoAcceptOrders: settings.autoAcceptOrders,
        orderConfirmationEmail: settings.orderConfirmationEmail,
        orderNotificationSms: settings.orderNotificationSms,
        avgPrepTime: settings.avgPrepTime,
        maxOrdersPerSlot: settings.maxOrdersPerSlot,
        pickupEnabled: settings.pickupEnabled,
        dineInEnabled: settings.dineInEnabled,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/payments - Mettre a jour parametres paiements (OWNER uniquement)
router.put('/payments', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const {
      acceptCash,
      acceptCard,
      acceptOnlinePayment,
      tipsEnabled,
      suggestedTips,
    } = req.body

    // Verifier que Moneroo est configure si on veut activer le paiement en ligne
    if (acceptOnlinePayment === true) {
      const currentSettings = await prisma.restaurantSettings.findUnique({
        where: { restaurantId: staff.restaurantId },
        select: { monerooConfigured: true },
      })

      if (!currentSettings?.monerooConfigured) {
        return next(new AppError('Vous devez configurer Moneroo avant d\'activer le paiement en ligne', 400, 'MONEROO_NOT_CONFIGURED'))
      }
    }

    const settings = await prisma.restaurantSettings.upsert({
      where: { restaurantId: staff.restaurantId },
      create: {
        restaurantId: staff.restaurantId,
        ...(acceptCash !== undefined && { acceptCash }),
        ...(acceptCard !== undefined && { acceptCard }),
        ...(acceptOnlinePayment !== undefined && { acceptOnlinePayment }),
        ...(tipsEnabled !== undefined && { tipsEnabled }),
        ...(suggestedTips !== undefined && { suggestedTips }),
      },
      update: {
        ...(acceptCash !== undefined && { acceptCash }),
        ...(acceptCard !== undefined && { acceptCard }),
        ...(acceptOnlinePayment !== undefined && { acceptOnlinePayment }),
        ...(tipsEnabled !== undefined && { tipsEnabled }),
        ...(suggestedTips !== undefined && { suggestedTips }),
      },
    })

    res.json({
      success: true,
      data: {
        acceptCash: settings.acceptCash,
        acceptCard: settings.acceptCard,
        acceptOnlinePayment: settings.acceptOnlinePayment,
        tipsEnabled: settings.tipsEnabled,
        suggestedTips: settings.suggestedTips,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/delivery - Mettre a jour parametres livraison (OWNER/MANAGER)
router.put('/delivery', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const {
      isEnabled,
      baseFee,
      feePerKm,
      freeDeliveryMin,
      maxDistance,
      minOrderAmount,
      avgDeliveryTime,
      autoAssign,
    } = req.body

    const deliverySettings = await prisma.deliverySettings.upsert({
      where: { restaurantId: staff.restaurantId },
      create: {
        restaurantId: staff.restaurantId,
        ...(isEnabled !== undefined && { isEnabled }),
        ...(baseFee !== undefined && { baseFee }),
        ...(feePerKm !== undefined && { feePerKm }),
        ...(freeDeliveryMin !== undefined && { freeDeliveryMin }),
        ...(maxDistance !== undefined && { maxDistance }),
        ...(minOrderAmount !== undefined && { minOrderAmount }),
        ...(avgDeliveryTime !== undefined && { avgDeliveryTime }),
        ...(autoAssign !== undefined && { autoAssign }),
      },
      update: {
        ...(isEnabled !== undefined && { isEnabled }),
        ...(baseFee !== undefined && { baseFee }),
        ...(feePerKm !== undefined && { feePerKm }),
        ...(freeDeliveryMin !== undefined && { freeDeliveryMin }),
        ...(maxDistance !== undefined && { maxDistance }),
        ...(minOrderAmount !== undefined && { minOrderAmount }),
        ...(avgDeliveryTime !== undefined && { avgDeliveryTime }),
        ...(autoAssign !== undefined && { autoAssign }),
      },
    })

    res.json({
      success: true,
      data: {
        isEnabled: deliverySettings.isEnabled,
        baseFee: Number(deliverySettings.baseFee),
        feePerKm: Number(deliverySettings.feePerKm),
        freeDeliveryMin: deliverySettings.freeDeliveryMin ? Number(deliverySettings.freeDeliveryMin) : null,
        maxDistance: Number(deliverySettings.maxDistance),
        minOrderAmount: Number(deliverySettings.minOrderAmount),
        avgDeliveryTime: deliverySettings.avgDeliveryTime,
        autoAssign: deliverySettings.autoAssign,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/opening-hours - Mettre a jour les horaires (OWNER/MANAGER)
router.put('/opening-hours', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { openingHours } = req.body

    if (!Array.isArray(openingHours)) {
      return next(new AppError('Format invalide', 400, 'INVALID_FORMAT'))
    }

    // Supprimer les anciens horaires et slots
    await prisma.openingSlot.deleteMany({
      where: { openingHours: { restaurantId: staff.restaurantId } },
    })
    await prisma.openingHours.deleteMany({
      where: { restaurantId: staff.restaurantId },
    })

    // Creer les nouveaux horaires
    for (const day of openingHours) {
      const openingHour = await prisma.openingHours.create({
        data: {
          restaurantId: staff.restaurantId,
          dayOfWeek: day.dayOfWeek,
          isOpen: day.isOpen,
        },
      })

      if (day.slots && Array.isArray(day.slots)) {
        for (const slot of day.slots) {
          await prisma.openingSlot.create({
            data: {
              openingHoursId: openingHour.id,
              openTime: slot.openTime,
              closeTime: slot.closeTime,
              serviceTypes: slot.serviceTypes || [],
            },
          })
        }
      }
    }

    // Recuperer les horaires mis a jour
    const updatedHours = await prisma.openingHours.findMany({
      where: { restaurantId: staff.restaurantId },
      include: { slots: true },
      orderBy: { dayOfWeek: 'asc' },
    })

    res.json({
      success: true,
      data: updatedHours.map(oh => ({
        id: oh.id,
        dayOfWeek: oh.dayOfWeek,
        isOpen: oh.isOpen,
        slots: oh.slots.map(slot => ({
          id: slot.id,
          openTime: slot.openTime,
          closeTime: slot.closeTime,
          serviceTypes: slot.serviceTypes,
        })),
      })),
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/settings/special-hours - Ajouter jour special (OWNER/MANAGER)
router.post('/special-hours', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { date, isClosed, reason, openTime, closeTime } = req.body

    if (!date) {
      return next(new AppError('Date requise', 400, 'DATE_REQUIRED'))
    }

    const specialHour = await prisma.specialHours.create({
      data: {
        restaurantId: staff.restaurantId,
        date: new Date(date),
        isClosed: isClosed ?? true,
        reason: reason || null,
        openTime: openTime || null,
        closeTime: closeTime || null,
      },
    })

    res.json({
      success: true,
      data: {
        id: specialHour.id,
        date: specialHour.date,
        isClosed: specialHour.isClosed,
        reason: specialHour.reason,
        openTime: specialHour.openTime,
        closeTime: specialHour.closeTime,
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/settings/special-hours/:id - Supprimer jour special (OWNER/MANAGER)
router.delete('/special-hours/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const specialHour = await prisma.specialHours.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!specialHour) {
      return next(new AppError('Jour special non trouve', 404, 'NOT_FOUND'))
    }

    await prisma.specialHours.delete({ where: { id } })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/theme - Mettre a jour le theme (OWNER/MANAGER)
router.put('/theme', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const body = req.body

    const themeFields = [
      'baseTheme', 'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor',
      'headingFont', 'bodyFont', 'layoutStyle', 'headerStyle', 'customCss', 'socialLinks',
      'heroTitle', 'heroSubtitle', 'heroCtaText', 'aboutTitle', 'aboutText', 'footerText',
      'announcementText', 'announcementActive', 'announcementBgColor', 'announcementLink',
      'logoPosition', 'showRatings', 'showPrepTime', 'showAllergens', 'showCuisineTypes',
      'heroStyle', 'heroOverlayOpacity', 'heroImageUrl', 'heroImages', 'heroVideoUrl', 'heroCtaLink',
      'menuStyle', 'productCardStyle', 'showProductImages', 'productConfig',
      'buttonStyle', 'buttonSize',
      'showAboutPage', 'showContactPage', 'showGallery', 'showTestimonials', 'showNewsletter', 'showMap',
      'legalText', 'privacyText',
      'headerDesign', 'headerSticky', 'headerTransparent', 'headerBgOpacity', 'headerTextColor',
      'footerDesign', 'navigationConfig', 'cartConfig',
    ]

    const data: Record<string, unknown> = {}
    for (const field of themeFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    const theme = await prisma.restaurantTheme.upsert({
      where: { restaurantId: staff.restaurantId },
      create: {
        restaurantId: staff.restaurantId,
        ...data,
      },
      update: data,
    })

    res.json({
      success: true,
      data: {
        id: theme.id,
        baseTheme: theme.baseTheme,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        backgroundColor: theme.backgroundColor,
        textColor: theme.textColor,
        headingFont: theme.headingFont,
        bodyFont: theme.bodyFont,
        layoutStyle: theme.layoutStyle,
        headerStyle: theme.headerStyle,
        headerDesign: theme.headerDesign,
        headerSticky: theme.headerSticky,
        headerTransparent: theme.headerTransparent,
        headerBgOpacity: theme.headerBgOpacity,
        headerTextColor: theme.headerTextColor,
        footerDesign: theme.footerDesign,
        customCss: theme.customCss,
        socialLinks: theme.socialLinks,
        heroTitle: theme.heroTitle,
        heroSubtitle: theme.heroSubtitle,
        heroCtaText: theme.heroCtaText,
        aboutTitle: theme.aboutTitle,
        aboutText: theme.aboutText,
        footerText: theme.footerText,
        announcementText: theme.announcementText,
        announcementActive: theme.announcementActive,
        announcementBgColor: theme.announcementBgColor,
        announcementLink: theme.announcementLink,
        logoPosition: theme.logoPosition,
        showRatings: theme.showRatings,
        showPrepTime: theme.showPrepTime,
        showAllergens: theme.showAllergens,
        showCuisineTypes: theme.showCuisineTypes,
        heroStyle: theme.heroStyle,
        heroOverlayOpacity: theme.heroOverlayOpacity,
        heroImageUrl: theme.heroImageUrl,
        heroImages: theme.heroImages,
        heroVideoUrl: theme.heroVideoUrl,
        heroCtaLink: theme.heroCtaLink,
        menuStyle: theme.menuStyle,
        productCardStyle: theme.productCardStyle,
        showProductImages: theme.showProductImages,
        productConfig: theme.productConfig,
        buttonStyle: theme.buttonStyle,
        buttonSize: theme.buttonSize,
        showAboutPage: theme.showAboutPage,
        showContactPage: theme.showContactPage,
        showGallery: theme.showGallery,
        showTestimonials: theme.showTestimonials,
        showNewsletter: theme.showNewsletter,
        showMap: theme.showMap,
        legalText: theme.legalText,
        privacyText: theme.privacyText,
        navigationConfig: theme.navigationConfig,
        cartConfig: theme.cartConfig,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/seo - Mettre a jour SEO et legal (OWNER/MANAGER)
router.put('/seo', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const {
      metaTitle,
      metaDescription,
      metaKeywords,
      termsUrl,
      privacyUrl,
      legalNotice,
    } = req.body

    const settings = await prisma.restaurantSettings.upsert({
      where: { restaurantId: staff.restaurantId },
      create: {
        restaurantId: staff.restaurantId,
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(metaKeywords !== undefined && { metaKeywords }),
        ...(termsUrl !== undefined && { termsUrl }),
        ...(privacyUrl !== undefined && { privacyUrl }),
        ...(legalNotice !== undefined && { legalNotice }),
      },
      update: {
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(metaKeywords !== undefined && { metaKeywords }),
        ...(termsUrl !== undefined && { termsUrl }),
        ...(privacyUrl !== undefined && { privacyUrl }),
        ...(legalNotice !== undefined && { legalNotice }),
      },
    })

    res.json({
      success: true,
      data: {
        metaTitle: settings.metaTitle,
        metaDescription: settings.metaDescription,
        metaKeywords: settings.metaKeywords,
        termsUrl: settings.termsUrl,
        privacyUrl: settings.privacyUrl,
        legalNotice: settings.legalNotice,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/security/password - Changer mot de passe
router.put('/security/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifie', 401, 'UNAUTHORIZED'))
    }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return next(new AppError('Mot de passe actuel et nouveau requis', 400, 'PASSWORDS_REQUIRED'))
    }

    if (newPassword.length < 8) {
      return next(new AppError('Le nouveau mot de passe doit contenir au moins 8 caracteres', 400, 'PASSWORD_TOO_SHORT'))
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return next(new AppError('Utilisateur non trouve', 404, 'USER_NOT_FOUND'))
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return next(new AppError('Mot de passe actuel incorrect', 400, 'INVALID_PASSWORD'))
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    })

    res.json({
      success: true,
      message: 'Mot de passe mis a jour',
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// STAFF MANAGEMENT (OWNER/MANAGER only)
// ============================================

// GET /restaurant/settings/staff - Liste des membres du staff
router.get('/staff', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const members = await prisma.restaurantStaff.findMany({
      where: { restaurantId: staff.restaurantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            inviteToken: true,
            inviteExpires: true,
            emailVerified: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    res.json({
      success: true,
      data: members.map(m => {
        const isPending = !!m.user.inviteToken && (!m.user.inviteExpires || m.user.inviteExpires > new Date())
        const isExpired = !!m.user.inviteToken && m.user.inviteExpires && m.user.inviteExpires <= new Date()
        
        return {
          id: m.id,
          role: m.role,
          position: m.position,
          employeeId: m.employeeId,
          isActive: m.isActive,
          permissions: m.permissions,
          createdAt: m.createdAt,
          inviteStatus: isPending ? 'pending' : isExpired ? 'expired' : 'accepted',
          user: {
            id: m.user.id,
            email: m.user.email,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            avatar: m.user.avatar,
          },
        }
      }),
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/settings/staff/invite - Inviter un nouveau membre
router.post('/staff/invite', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentStaff = req.restaurantStaff!
    const { email, firstName, lastName, role = 'STAFF', position } = req.body

    if (!email || !firstName || !lastName) {
      return next(new AppError('Email, prenom et nom requis', 400, 'MISSING_FIELDS'))
    }

    const validRoles = ['MANAGER', 'STAFF', 'CASHIER', 'KITCHEN']
    if (!validRoles.includes(role)) {
      return next(new AppError('Role invalide', 400, 'INVALID_ROLE'))
    }

    if (currentStaff.role !== 'OWNER' && role === 'MANAGER') {
      return next(new AppError('Seul le proprietaire peut ajouter un manager', 403, 'FORBIDDEN'))
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    if (user) {
      const existingStaff = await prisma.restaurantStaff.findFirst({
        where: { userId: user.id },
      })

      if (existingStaff) {
        if (existingStaff.restaurantId === currentStaff.restaurantId) {
          return next(new AppError('Cet utilisateur fait deja partie de l\'equipe', 400, 'ALREADY_MEMBER'))
        }
        return next(new AppError('Cet utilisateur est deja membre d\'un autre restaurant', 400, 'USER_IN_OTHER_RESTAURANT'))
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName,
          inviteToken,
          inviteExpires,
        },
      })
    } else {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          firstName,
          lastName,
          passwordHash: '',
          emailVerified: false,
          userType: 'RESTAURANT',
          inviteToken,
          inviteExpires,
        },
      })
    }

    const newStaff = await prisma.restaurantStaff.create({
      data: {
        restaurantId: currentStaff.restaurantId,
        userId: user.id,
        role: role as 'MANAGER' | 'STAFF' | 'CASHIER' | 'KITCHEN',
        position: position || null,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            inviteToken: true,
          },
        },
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    })

    const inviterUser = await prisma.user.findUnique({
      where: { id: currentStaff.userId },
      select: { firstName: true, lastName: true },
    })

    if (newStaff.user.inviteToken) {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const inviteLink = `${baseUrl}/setup-password?token=${newStaff.user.inviteToken}`

      console.log('[Staff Invite] Sending invitation email to:', newStaff.user.email)
      console.log('[Staff Invite] Invite link:', inviteLink)

      try {
        const emailResult = await sendStaffInvitationEmail({
          to: newStaff.user.email,
          firstName: newStaff.user.firstName,
          restaurantName: newStaff.restaurant.name,
          role: newStaff.role,
          inviterName: inviterUser ? `${inviterUser.firstName} ${inviterUser.lastName}` : 'L\'equipe',
          inviteLink,
        })
        console.log('[Staff Invite] Email result:', emailResult)
      } catch (emailError) {
        console.error('[Staff Invite] Email error:', emailError)
      }
    } else {
      console.log('[Staff Invite] No inviteToken found for user:', newStaff.user.email)
    }

    res.json({
      success: true,
      message: 'Invitation envoyee avec succes',
      data: {
        id: newStaff.id,
        role: newStaff.role,
        position: newStaff.position,
        isActive: newStaff.isActive,
        user: {
          id: newStaff.user.id,
          email: newStaff.user.email,
          firstName: newStaff.user.firstName,
          lastName: newStaff.user.lastName,
          avatar: newStaff.user.avatar,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/staff/:id - Modifier un membre
router.put('/staff/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentStaff = req.restaurantStaff!
    const { id } = req.params
    const { role, isActive, position } = req.body

    const targetStaff = await prisma.restaurantStaff.findFirst({
      where: {
        id,
        restaurantId: currentStaff.restaurantId,
      },
    })

    if (!targetStaff) {
      return next(new AppError('Membre non trouve', 404, 'STAFF_NOT_FOUND'))
    }

    if (targetStaff.role === 'OWNER') {
      return next(new AppError('Impossible de modifier le proprietaire', 403, 'CANNOT_MODIFY_OWNER'))
    }

    if (targetStaff.id === currentStaff.id) {
      return next(new AppError('Vous ne pouvez pas modifier votre propre compte ici', 400, 'CANNOT_MODIFY_SELF'))
    }

    if (role && currentStaff.role !== 'OWNER' && role === 'MANAGER') {
      return next(new AppError('Seul le proprietaire peut promouvoir en manager', 403, 'FORBIDDEN'))
    }

    const updateData: Record<string, unknown> = {}
    if (role !== undefined) {
      const validRoles = ['MANAGER', 'STAFF', 'CASHIER', 'KITCHEN']
      if (!validRoles.includes(role)) {
        return next(new AppError('Role invalide', 400, 'INVALID_ROLE'))
      }
      updateData.role = role
    }
    if (isActive !== undefined) updateData.isActive = isActive
    if (position !== undefined) updateData.position = position

    const updatedStaff = await prisma.restaurantStaff.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: {
        id: updatedStaff.id,
        role: updatedStaff.role,
        position: updatedStaff.position,
        isActive: updatedStaff.isActive,
        user: updatedStaff.user,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/settings/staff/:id/resend-invite - Renvoyer l'invitation
router.post('/staff/:id/resend-invite', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentStaff = req.restaurantStaff!
    const { id } = req.params

    const targetStaff = await prisma.restaurantStaff.findFirst({
      where: {
        id,
        restaurantId: currentStaff.restaurantId,
      },
      include: {
        user: true,
        restaurant: {
          select: { name: true },
        },
      },
    })

    if (!targetStaff) {
      return next(new AppError('Membre non trouve', 404, 'STAFF_NOT_FOUND'))
    }

    if (!targetStaff.user.inviteToken) {
      return next(new AppError('Ce membre a deja accepte son invitation', 400, 'ALREADY_ACCEPTED'))
    }

    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: targetStaff.userId },
      data: {
        inviteToken,
        inviteExpires,
      },
    })

    const inviterUser = await prisma.user.findUnique({
      where: { id: currentStaff.userId },
      select: { firstName: true, lastName: true },
    })

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/setup-password?token=${inviteToken}`

    console.log('[Staff Invite] Resending invitation email to:', targetStaff.user.email)

    try {
      await sendStaffInvitationEmail({
        to: targetStaff.user.email,
        firstName: targetStaff.user.firstName,
        restaurantName: targetStaff.restaurant.name,
        role: targetStaff.role,
        inviterName: inviterUser ? `${inviterUser.firstName} ${inviterUser.lastName}` : 'L\'equipe',
        inviteLink,
      })
    } catch (emailError) {
      console.error('[Staff Invite] Email error:', emailError)
    }

    res.json({
      success: true,
      message: 'Invitation renvoyee',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/settings/staff/:id - Supprimer un membre
router.delete('/staff/:id', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentStaff = req.restaurantStaff!
    const { id } = req.params

    const targetStaff = await prisma.restaurantStaff.findFirst({
      where: {
        id,
        restaurantId: currentStaff.restaurantId,
      },
    })

    if (!targetStaff) {
      return next(new AppError('Membre non trouve', 404, 'STAFF_NOT_FOUND'))
    }

    if (targetStaff.role === 'OWNER') {
      return next(new AppError('Impossible de supprimer le proprietaire', 403, 'CANNOT_DELETE_OWNER'))
    }

    if (targetStaff.id === currentStaff.id) {
      return next(new AppError('Vous ne pouvez pas vous supprimer vous-meme', 400, 'CANNOT_DELETE_SELF'))
    }

    if (currentStaff.role !== 'OWNER' && targetStaff.role === 'MANAGER') {
      return next(new AppError('Seul le proprietaire peut supprimer un manager', 403, 'FORBIDDEN'))
    }

    await prisma.restaurantStaff.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Membre supprime',
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// MONEROO PAYMENT CONFIGURATION
// ============================================

// GET /restaurant/settings/moneroo - Recuperer la configuration Moneroo
router.get('/moneroo', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: staff.restaurantId },
      select: {
        monerooSecretKey: true,
        monerooWebhookSecret: true,
        monerooConfigured: true,
      }
    })

    if (!settings) {
      return next(new AppError('Parametres non trouves', 404, 'SETTINGS_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        secretKey: settings.monerooSecretKey ? '••••••••' + settings.monerooSecretKey.slice(-4) : '',
        webhookSecret: settings.monerooWebhookSecret ? '••••••••' + settings.monerooWebhookSecret.slice(-4) : '',
        isConfigured: settings.monerooConfigured,
        hasSecretKey: !!settings.monerooSecretKey,
        hasWebhookSecret: !!settings.monerooWebhookSecret,
      }
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/settings/moneroo - Mettre a jour la configuration Moneroo
router.put('/moneroo', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { secretKey, webhookSecret } = req.body

    if (!secretKey && !webhookSecret) {
      return next(new AppError('Au moins une cle est requise', 400, 'KEY_REQUIRED'))
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

    await prisma.restaurantSettings.update({
      where: { restaurantId: staff.restaurantId },
      data: updateData,
    })

    res.json({
      success: true,
      message: 'Configuration Moneroo mise a jour'
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/settings/moneroo/test - Tester la connexion Moneroo
router.post('/moneroo/test', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: staff.restaurantId },
      select: {
        monerooSecretKey: true,
      }
    })

    if (!settings?.monerooSecretKey) {
      return res.status(400).json({
        success: false,
        error: 'NOT_CONFIGURED',
        message: 'Moneroo non configure'
      })
    }

    const response = await fetch('https://api.moneroo.io/v1/apps/current', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${settings.monerooSecretKey}`,
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
        message: 'Echec de la connexion - verifiez vos cles'
      })
    }
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/settings/moneroo - Supprimer la configuration Moneroo
router.delete('/moneroo', requireRole('OWNER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    await prisma.restaurantSettings.update({
      where: { restaurantId: staff.restaurantId },
      data: {
        monerooSecretKey: null,
        monerooWebhookSecret: null,
        monerooConfigured: false,
      },
    })

    res.json({
      success: true,
      message: 'Configuration Moneroo supprimee'
    })
  } catch (error) {
    next(error)
  }
})

export { router as restaurantSettingsRoutes }
