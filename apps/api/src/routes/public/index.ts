import { Router, Request, Response } from 'express'
import { prisma } from '@iziresto/database'
import customerAuthRoutes from './customer-auth.routes'
import customerAccountRoutes from './customer-account.routes'
import { monerooService } from '../../services/moneroo.service'
import { sendLoyaltyPointsRedeemedEmail } from '../../services/email.service'

const router = Router()

// Customer auth routes
router.use('/:subdomain/auth', customerAuthRoutes)

// Customer account routes
router.use('/:subdomain/account', customerAccountRoutes)

// Helper: Resoudre un site par subdomain avec validation du statut
async function resolveSite(subdomain: string) {
  const site = await prisma.site.findUnique({
    where: { subdomain },
    select: {
      id: true,
      subdomain: true,
      status: true,
      restaurantId: true,
    },
  })

  if (!site || !site.restaurantId) return null
  if (site.status !== 'ACTIVE') return null

  return site
}

// Helper: Récupérer les sections des pages par pageType
async function getPagesSectionsMap(restaurantId: string): Promise<Record<string, { sections: Record<string, unknown> | null }>> {
  const pages = await prisma.storePage.findMany({
    where: { restaurantId, isActive: true },
    select: {
      pageType: true,
      sections: true,
    },
  })

  const map: Record<string, { sections: Record<string, unknown> | null }> = {}
  for (const page of pages) {
    if (page.pageType) {
      map[page.pageType] = {
        sections: page.sections as Record<string, unknown> | null,
      }
    }
  }
  return map
}

// GET /store/:subdomain/branding - Infos publiques de l'organisation pour le branding
router.get('/:subdomain/branding', async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params

    const site = await prisma.site.findUnique({
      where: { subdomain },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            primaryColor: true,
            email: true,
            phone: true,
          },
        },
        restaurant: {
          select: {
            name: true,
            logo: true,
          },
        },
      },
    })

    if (!site) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND' })
    }

    res.json({
      success: true,
      data: {
        organization: site.organization,
        restaurant: site.restaurant,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// GET /store/:subdomain - Infos completes du restaurant (theme, settings, horaires)
router.get('/:subdomain', async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params
    const site = await resolveSite(subdomain)

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND', message: 'Site introuvable ou inactif' })
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: site.restaurantId! },
      include: {
        theme: true,
        settings: {
          select: {
            currency: true,
            language: true,
            acceptCash: true,
            acceptCard: true,
            acceptOnlinePayment: true,
            tipsEnabled: true,
            suggestedTips: true,
            avgPrepTime: true,
            pickupEnabled: true,
            dineInEnabled: true,
            metaTitle: true,
            metaDescription: true,
            metaKeywords: true,
            favicon: true,
            ogImage: true,
            facebookPixelId: true,
            googleAnalyticsId: true,
            googleTagManagerId: true,
            tiktokPixelId: true,
            snapPixelId: true,
            customHeadScript: true,
            termsUrl: true,
            privacyUrl: true,
            homePageId: true,
          },
        },
        openingHours: {
          include: {
            slots: true,
          },
          orderBy: { dayOfWeek: 'asc' },
        },
        deliverySettings: {
          select: {
            isEnabled: true,
            minOrderAmount: true,
            baseFee: true,
            freeDeliveryMin: true,
            avgDeliveryTime: true,
          },
        },
        storeBanners: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            displayType: true,
            contentMode: true,
            title: true,
            subtitle: true,
            image: true,
            ctaText: true,
            ctaLink: true,
            couponId: true,
            coupon: {
              select: { id: true, code: true, discountType: true, discountValue: true },
            },
            pages: true,
            position: true,
            dismissable: true,
            sticky: true,
            styles: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    })

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'RESTAURANT_NOT_FOUND' })
    }

    res.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          description: restaurant.description,
          shortDescription: restaurant.shortDescription,
          logo: restaurant.logo,
          coverImage: restaurant.coverImage,
          images: restaurant.images,
          address: restaurant.address,
          addressLine2: restaurant.addressLine2,
          city: restaurant.city,
          postalCode: restaurant.postalCode,
          country: restaurant.country,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          phone: restaurant.phone,
          email: restaurant.email,
          website: restaurant.website,
          businessType: restaurant.businessType,
          cuisineTypes: restaurant.cuisineTypes,
        },
        theme: restaurant.theme ? {
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
          customCss: restaurant.theme.customCss,
          socialLinks: restaurant.theme.socialLinks,
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
          globalComponents: {
            cart: restaurant.theme.cartConfig || null,
          },
        } : null,
        settings: restaurant.settings ? {
          currency: restaurant.settings.currency,
          language: restaurant.settings.language,
          acceptCash: restaurant.settings.acceptCash,
          acceptCard: restaurant.settings.acceptCard,
          acceptOnlinePayment: restaurant.settings.acceptOnlinePayment,
          tipsEnabled: restaurant.settings.tipsEnabled,
          suggestedTips: restaurant.settings.suggestedTips,
          avgPrepTime: restaurant.settings.avgPrepTime,
          deliveryEnabled: restaurant.deliverySettings?.isEnabled ?? false,
          pickupEnabled: restaurant.settings.pickupEnabled,
          dineInEnabled: restaurant.settings.dineInEnabled,
          metaTitle: restaurant.settings.metaTitle,
          metaDescription: restaurant.settings.metaDescription,
          metaKeywords: restaurant.settings.metaKeywords,
          favicon: restaurant.settings.favicon,
          ogImage: restaurant.settings.ogImage,
          facebookPixelId: restaurant.settings.facebookPixelId,
          googleAnalyticsId: restaurant.settings.googleAnalyticsId,
          googleTagManagerId: restaurant.settings.googleTagManagerId,
          tiktokPixelId: restaurant.settings.tiktokPixelId,
          snapPixelId: restaurant.settings.snapPixelId,
          customHeadScript: restaurant.settings.customHeadScript,
          termsUrl: restaurant.settings.termsUrl,
          privacyUrl: restaurant.settings.privacyUrl,
          homePageId: restaurant.settings.homePageId,
        } : null,
        openingHours: restaurant.openingHours.map(oh => ({
          dayOfWeek: oh.dayOfWeek,
          isOpen: oh.isOpen,
          slots: oh.slots.map(s => ({
            openTime: s.openTime,
            closeTime: s.closeTime,
            serviceTypes: s.serviceTypes,
          })),
        })),
        delivery: restaurant.deliverySettings ? {
          isEnabled: restaurant.deliverySettings.isEnabled,
          minOrderAmount: restaurant.deliverySettings.minOrderAmount ? Number(restaurant.deliverySettings.minOrderAmount) : null,
          baseFee: restaurant.deliverySettings.baseFee ? Number(restaurant.deliverySettings.baseFee) : null,
          freeDeliveryMin: restaurant.deliverySettings.freeDeliveryMin ? Number(restaurant.deliverySettings.freeDeliveryMin) : null,
          avgDeliveryTime: restaurant.deliverySettings.avgDeliveryTime,
        } : null,
        banners: restaurant.storeBanners
          .filter((b: { startDate: Date | null; endDate: Date | null }) => {
            const now = new Date()
            if (b.startDate && new Date(b.startDate) > now) return false
            if (b.endDate && new Date(b.endDate) < now) return false
            return true
          })
          .map((b: Record<string, unknown>) => ({
            id: b.id,
            displayType: b.displayType || 'banner',
            contentMode: b.contentMode || 'simple',
            title: b.title,
            subtitle: b.subtitle,
            image: b.image,
            ctaText: b.ctaText,
            ctaLink: b.ctaLink,
            couponId: b.couponId || null,
            coupon: b.coupon || null,
            pages: b.pages,
            position: b.position,
            dismissable: b.dismissable ?? false,
            sticky: b.sticky ?? false,
            styles: b.styles || null,
            startDate: b.startDate || null,
            endDate: b.endDate || null,
          })),
        pages: await getPagesSectionsMap(site.restaurantId!).catch(() => ({})),
      },
    })
  } catch (error) {
    console.error('Error fetching store data:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// GET /store/:subdomain/menu - Menu complet (categories + produits + variants + modifiers)
router.get('/:subdomain/menu', async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params
    const site = await resolveSite(subdomain)

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND' })
    }

    const categories = await prisma.category.findMany({
      where: {
        restaurantId: site.restaurantId!,
        isActive: true,
        isVisible: true,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: {
            isActive: true,
            isVisible: true,
          },
          orderBy: { sortOrder: 'asc' },
          include: {
            variants: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                name: true,
                price: true,
                compareAtPrice: true,
                sortOrder: true,
              },
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
                        sortOrder: true,
                      },
                    },
                  },
                },
              },
            },
            taxRate: {
              select: {
                id: true,
                name: true,
                rate: true,
              },
            },
          },
        },
      },
    })

    const formattedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      nameEn: cat.nameEn,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      sortOrder: cat.sortOrder,
      products: cat.products.map(prod => ({
        id: prod.id,
        name: prod.name,
        nameEn: prod.nameEn,
        slug: prod.slug,
        description: prod.description,
        descriptionEn: prod.descriptionEn,
        price: Number(prod.price),
        compareAtPrice: prod.compareAtPrice ? Number(prod.compareAtPrice) : null,
        image: prod.image,
        images: prod.images,
        isFeatured: prod.isFeatured,
        prepTime: prod.prepTime,
        calories: prod.calories,
        allergens: prod.allergens,
        dietaryTags: prod.dietaryTags,
        taxRate: prod.taxRate ? {
          id: prod.taxRate.id,
          name: prod.taxRate.name,
          rate: Number(prod.taxRate.rate),
        } : null,
        taxIncluded: prod.taxIncluded,
        variants: prod.variants.map(v => ({
            id: v.id,
            name: v.name,
            price: Number(v.price),
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          })),
        modifierGroups: prod.modifierGroups.map(pmg => ({
          id: pmg.modifierGroup.id,
          name: pmg.modifierGroup.name,
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
      })),
    }))

    res.json({
      success: true,
      data: {
        categories: formattedCategories,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// GET /store/:subdomain/pages - Pages actives du storefront (navigation)
router.get('/:subdomain/pages', async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params
    const site = await resolveSite(subdomain)

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND' })
    }

    const pages = await (prisma as any).storePage.findMany({
      where: {
        restaurantId: site.restaurantId!,
        isActive: true,
        showInNav: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        pageType: true,
        sections: true,
      },
    })

    res.json({
      success: true,
      data: pages,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// GET /store/:subdomain/pages/:slug - Récupérer une page par slug
router.get('/:subdomain/pages/:slug', async (req: Request, res: Response) => {
  try {
    const { subdomain, slug } = req.params
    const site = await resolveSite(subdomain)

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND' })
    }

    const page = await (prisma as any).storePage.findFirst({
      where: {
        restaurantId: site.restaurantId!,
        slug,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        pageType: true,
        sections: true,
        metaTitle: true,
        metaDescription: true,
      },
    })

    if (!page) {
      return res.status(404).json({ success: false, error: 'PAGE_NOT_FOUND' })
    }

    res.json({ success: true, data: page })
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// POST /store/:subdomain/pages/:slug/view - Incrémenter les vues d'une page
router.post('/:subdomain/pages/:slug/view', async (req: Request, res: Response) => {
  try {
    const { subdomain, slug } = req.params
    const site = await resolveSite(subdomain)

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND' })
    }

    await (prisma as any).storePage.updateMany({
      where: {
        restaurantId: site.restaurantId!,
        slug,
        isActive: true,
      },
      data: {
        views: { increment: 1 },
      },
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// POST /store/:subdomain/orders - Creer une commande depuis le storefront
router.post('/:subdomain/orders', async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params
    const site = await resolveSite(subdomain)

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND' })
    }

    const {
      serviceType,
      items,
      customerName,
      customerPhone,
      customerEmail,
      customerNotes,
      deliveryAddress,
      paymentMethod,
      customerId,
      loyaltyPointsToUse,
    } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'INVALID_ITEMS', message: 'Au moins un article est requis' })
    }

    if (!serviceType || !['PICKUP', 'DELIVERY', 'DINE_IN'].includes(serviceType)) {
      return res.status(400).json({ success: false, error: 'INVALID_SERVICE_TYPE', message: 'Type de service invalide' })
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, error: 'MISSING_CUSTOMER_INFO', message: 'Nom et t\u00e9l\u00e9phone requis' })
    }

    if (serviceType === 'DELIVERY' && !deliveryAddress) {
      return res.status(400).json({ success: false, error: 'MISSING_DELIVERY_ADDRESS', message: 'Adresse de livraison requise' })
    }

    const restaurantId = site.restaurantId!

    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId },
    })

    const productIds = items.map((item: { productId: string }) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        restaurantId,
        isActive: true,
      },
      include: {
        variants: true,
      },
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    let subtotal = 0
    const orderItems: {
      productId: string
      productName: string
      variantName: string | null
      quantity: number
      unitPrice: number
      totalPrice: number
      modifiers: { id: string; name: string; price: number }[]
      notes: string | null
    }[] = []

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return res.status(400).json({
          success: false,
          error: 'PRODUCT_NOT_FOUND',
          message: `Produit introuvable : ${item.productId}`,
        })
      }

      let unitPrice = Number(product.price)
      let variantName: string | null = null

      if (item.variantId) {
        const variant = product.variants.find((v: { id: string }) => v.id === item.variantId)
        if (variant) {
          unitPrice = Number(variant.price)
          variantName = variant.name
        }
      }

      let modifierTotal = 0
      const modifiers: { id: string; name: string; price: number }[] = item.modifiers || []
      for (const mod of modifiers) {
        modifierTotal += Number(mod.price || 0)
      }

      const quantity = Math.max(1, parseInt(item.quantity) || 1)
      const itemUnitPrice = unitPrice + modifierTotal
      const itemTotal = itemUnitPrice * quantity

      subtotal += itemTotal

      orderItems.push({
        productId: product.id,
        productName: product.name,
        variantName,
        quantity,
        unitPrice: itemUnitPrice,
        totalPrice: itemTotal,
        modifiers,
        notes: item.notes || null,
      })
    }

    const orderPrefix = settings?.orderPrefix || 'ORD'
    const orderCount = await prisma.order.count({ where: { restaurantId } })
    const orderNumber = `${orderPrefix}-${String(orderCount + 1).padStart(4, '0')}`

    const displayNumber = String(orderCount + 1)

    const isMobileMoneyPayment = paymentMethod === 'MOBILE_MONEY' || paymentMethod === 'ONLINE'

    // Gestion des points de fidélité
    let loyaltyPointsUsed = 0
    let loyaltyDiscount = 0
    let customerForLoyalty: { id: string; loyaltyPoints: number } | null = null

    if (loyaltyPointsToUse && loyaltyPointsToUse > 0 && customerId && settings?.loyaltyEnabled !== false) {
      // Récupérer le client et ses points
      customerForLoyalty = await prisma.restaurantCustomer.findUnique({
        where: { id: customerId },
        select: { id: true, loyaltyPoints: true },
      })

      // Vérifier le minimum de points requis
      const minPointsToRedeem = settings?.loyaltyMinPointsToRedeem ?? 100
      
      if (customerForLoyalty && customerForLoyalty.loyaltyPoints >= minPointsToRedeem) {
        // Taux de conversion (configurable via settings)
        const pointsToMoneyRate = settings?.loyaltyPointsToMoneyRate ?? 100
        
        // Limiter aux points disponibles
        const maxPointsToUse = Math.min(loyaltyPointsToUse, customerForLoyalty.loyaltyPoints)
        
        // Calculer la réduction maximale (ne peut pas dépasser le subtotal)
        const maxDiscount = maxPointsToUse / pointsToMoneyRate
        loyaltyDiscount = Math.min(maxDiscount, subtotal)
        
        // Recalculer les points réellement utilisés
        loyaltyPointsUsed = Math.round(loyaltyDiscount * pointsToMoneyRate)
      }
    }

    const finalTotal = Math.max(0, subtotal - loyaltyDiscount)

    const order = await prisma.order.create({
      data: {
        restaurantId,
        orderNumber,
        displayNumber,
        source: 'WEBSITE',
        serviceType: serviceType as 'PICKUP' | 'DELIVERY' | 'DINE_IN',
        status: isMobileMoneyPayment ? 'PENDING' : 'PENDING',
        paymentStatus: isMobileMoneyPayment ? 'PENDING' : 'PENDING',
        paymentMethod: isMobileMoneyPayment ? 'MOBILE_MONEY' : (paymentMethod || 'CASH'),
        subtotal,
        taxAmount: 0,
        loyaltyPointsUsed,
        loyaltyDiscount,
        total: finalTotal,
        customerId: customerId || null,
        guestName: customerName,
        guestPhone: customerPhone,
        guestEmail: customerEmail || null,
        customerNotes: customerNotes || null,
        deliveryAddress: deliveryAddress || null,
        items: {
          create: orderItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            specialInstructions: item.notes,
            modifiers: item.modifiers.length > 0 ? {
              create: item.modifiers.map(mod => ({
                modifierId: mod.id,
                name: mod.name,
                price: mod.price,
              })),
            } : undefined,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // Débiter les points de fidélité si utilisés
    if (loyaltyPointsUsed > 0 && customerForLoyalty) {
      const newBalance = customerForLoyalty.loyaltyPoints - loyaltyPointsUsed

      // Mettre à jour le solde du client
      await prisma.restaurantCustomer.update({
        where: { id: customerForLoyalty.id },
        data: { loyaltyPoints: newBalance },
      })

      // Créer la transaction de débit
      await prisma.loyaltyTransaction.create({
        data: {
          restaurantId,
          customerId: customerForLoyalty.id,
          type: 'REDEEM',
          points: -loyaltyPointsUsed,
          balanceAfter: newBalance,
          description: `Utilisé pour la commande #${orderNumber}`,
          orderId: order.id,
        },
      })

      // Envoyer l'email de points utilisés
      if (customerEmail) {
        const restaurantInfo = await prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: { name: true, logo: true },
        })
        const formatCurrency = (amount: number) => 
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: settings?.currency || 'XOF' }).format(amount)
        
        sendLoyaltyPointsRedeemedEmail({
          to: customerEmail,
          customerName: customerName.split(' ')[0],
          restaurantName: restaurantInfo?.name || 'Restaurant',
          restaurantLogo: restaurantInfo?.logo || undefined,
          pointsUsed: loyaltyPointsUsed,
          discountAmount: formatCurrency(loyaltyDiscount),
          remainingPoints: newBalance,
          orderNumber,
        }).catch(err => console.error('Erreur envoi email points utilisés:', err))
      }
    }

    // Si paiement Mobile Money, initialiser Moneroo
    if (isMobileMoneyPayment && settings?.monerooConfigured && settings?.monerooSecretKey) {
      try {
        const baseUrl = process.env.API_URL || 'http://localhost:4000'
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
        
        const nameParts = customerName.split(' ')
        const firstName = nameParts[0] || 'Client'
        const lastName = nameParts.slice(1).join(' ') || 'Storefront'

        const paymentResponse = await monerooService.initializePayment(
          {
            publicKey: settings.monerooPublicKey || '',
            secretKey: settings.monerooSecretKey,
          },
          {
            amount: Math.round(subtotal),
            currency: settings.currency || 'XOF',
            description: `Commande #${orderNumber}`,
            return_url: `${frontendUrl}/store/${subdomain}/thanks?orderId=${order.id}`,
            customer: {
              email: customerEmail || `${customerPhone}@guest.iziresto.com`,
              first_name: firstName,
              last_name: lastName,
              phone: customerPhone,
            },
            metadata: {
              orderId: order.id,
              orderNumber: orderNumber,
              restaurantId: restaurantId,
              subdomain: subdomain,
            },
          }
        )

        // Mettre à jour la commande avec l'ID de paiement Moneroo
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentIntentId: paymentResponse.data.id,
          },
        })

        return res.status(201).json({
          success: true,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: Number(order.total),
            estimatedTime: settings?.avgPrepTime || 30,
            paymentUrl: paymentResponse.data.checkout_url,
            requiresPayment: true,
          },
        })
      } catch (paymentError) {
        console.error('Erreur initialisation paiement Moneroo:', paymentError)
        // En cas d'erreur, on retourne quand même la commande mais sans URL de paiement
        return res.status(201).json({
          success: true,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: Number(order.total),
            estimatedTime: settings?.avgPrepTime || 30,
            paymentError: 'Erreur lors de l\'initialisation du paiement',
          },
        })
      }
    }

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        estimatedTime: settings?.avgPrepTime || 30,
      },
    })
  } catch (error) {
    console.error('Erreur création commande storefront:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// GET /store/:subdomain/orders/:orderId - Récupérer les détails d'une commande (pour page Thanks)
router.get('/:subdomain/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const { subdomain, orderId } = req.params
    const site = await resolveSite(subdomain)

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND' })
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: site.restaurantId!,
      },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            variantId: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            modifiers: true,
          },
        },
      },
    })

    if (!order) {
      return res.status(404).json({ success: false, error: 'ORDER_NOT_FOUND' })
    }

    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: site.restaurantId! },
      select: { avgPrepTime: true },
    })

    res.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        displayNumber: order.displayNumber,
        status: order.status,
        serviceType: order.serviceType,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        total: Number(order.total),
        estimatedTime: settings?.avgPrepTime || 30,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          modifiers: item.modifiers,
        })),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// GET /store/:subdomain/team - Récupérer l'équipe publique du restaurant
router.get('/:subdomain/team', async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.params
    const site = await resolveSite(subdomain)

    if (!site) {
      return res.status(404).json({ success: false, error: 'SITE_NOT_FOUND' })
    }

    const staffMembers = await prisma.restaurantStaff.findMany({
      where: {
        restaurantId: site.restaurantId!,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    const team = staffMembers.map(member => ({
      id: member.id,
      name: `${member.user.firstName} ${member.user.lastName}`.trim(),
      position: member.position || member.role,
      role: member.role,
      avatar: member.user.avatar,
    }))

    res.json({
      success: true,
      data: team,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

// ============================================
// EMAIL TRACKING
// ============================================

// GET /store/email/track/open/:recipientId - Pixel de tracking d'ouverture
router.get('/email/track/open/:recipientId', async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.params

    // Mettre à jour le statut du destinataire
    const recipient = await prisma.emailCampaignRecipient.findUnique({
      where: { id: recipientId },
      select: { id: true, campaignId: true, status: true },
    })

    if (recipient && recipient.status === 'SENT') {
      await prisma.$transaction([
        prisma.emailCampaignRecipient.update({
          where: { id: recipientId },
          data: { status: 'OPENED', openedAt: new Date() },
        }),
        prisma.emailCampaign.update({
          where: { id: recipient.campaignId },
          data: { openCount: { increment: 1 } },
        }),
      ])
    }

    // Retourner un pixel transparent 1x1
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    res.set('Content-Type', 'image/gif')
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.send(pixel)
  } catch (error) {
    // Retourner le pixel même en cas d'erreur
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    res.set('Content-Type', 'image/gif')
    res.send(pixel)
  }
})

// GET /store/email/track/click/:recipientId - Tracking de clic avec redirection
router.get('/email/track/click/:recipientId', async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.params
    const { url } = req.query

    // Mettre à jour le statut du destinataire
    const recipient = await prisma.emailCampaignRecipient.findUnique({
      where: { id: recipientId },
      select: { id: true, campaignId: true, status: true },
    })

    if (recipient && (recipient.status === 'SENT' || recipient.status === 'OPENED')) {
      await prisma.$transaction([
        prisma.emailCampaignRecipient.update({
          where: { id: recipientId },
          data: { status: 'CLICKED', clickedAt: new Date() },
        }),
        prisma.emailCampaign.update({
          where: { id: recipient.campaignId },
          data: { clickCount: { increment: 1 } },
        }),
      ])
    }

    // Rediriger vers l'URL cible
    const targetUrl = typeof url === 'string' ? url : '/'
    res.redirect(targetUrl)
  } catch (error) {
    res.redirect('/')
  }
})

// GET /store/unsubscribe - Page de désabonnement
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { email, token } = req.query

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email requis' })
    }

    // Désabonner le client de tous les restaurants
    await prisma.restaurantCustomer.updateMany({
      where: { email },
      data: { marketingOptIn: false },
    })

    // Retourner une page HTML simple de confirmation
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Désabonnement confirmé</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f6f9fc; }
          .card { background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          h1 { color: #10b981; margin-bottom: 16px; }
          p { color: #525f7f; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Désabonnement confirmé</h1>
          <p>Vous ne recevrez plus d'emails marketing de notre part.</p>
          <p>Vous pouvez fermer cette page.</p>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors du désabonnement' })
  }
})

export { router as publicRoutes }
