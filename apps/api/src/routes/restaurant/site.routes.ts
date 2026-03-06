import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'

const router = Router()

router.use(loadStaff)
router.use(requireRole('OWNER', 'MANAGER'))

// GET /restaurant/site - Infos du site (subdomain, status, stats)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: staff.restaurantId },
      include: {
        site: true,
        theme: true,
      },
    })

    if (!restaurant) {
      return next(new AppError('Restaurant non trouvé', 404, 'NOT_FOUND'))
    }

    const [bannersCount, pagesCount, messagesCount, unreadMessagesCount] = await Promise.all([
      prisma.storeBanner.count({ where: { restaurantId: staff.restaurantId } }),
      prisma.storePage.count({ where: { restaurantId: staff.restaurantId } }),
      prisma.contactMessage.count({ where: { restaurantId: staff.restaurantId } }),
      prisma.contactMessage.count({ where: { restaurantId: staff.restaurantId, isRead: false } }),
    ])

    res.json({
      success: true,
      data: {
        site: restaurant.site ? {
          id: restaurant.site.id,
          subdomain: restaurant.site.subdomain,
          customDomain: restaurant.site.customDomain,
          status: restaurant.site.status,
          publishedAt: restaurant.site.publishedAt,
          expiresAt: restaurant.site.expiresAt,
        } : null,
        theme: restaurant.theme ? {
          id: restaurant.theme.id,
          baseTheme: restaurant.theme.baseTheme,
          primaryColor: restaurant.theme.primaryColor,
        } : null,
        stats: {
          banners: bannersCount,
          pages: pagesCount,
          messages: messagesCount,
          unreadMessages: unreadMessagesCount,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// BANNERS
// ============================================

// GET /restaurant/site/banners - Liste des bannières
router.get('/banners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const banners = await prisma.storeBanner.findMany({
      where: { restaurantId: staff.restaurantId },
      include: {
        coupon: {
          select: { id: true, code: true, description: true, discountType: true, discountValue: true, isActive: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    res.json({
      success: true,
      data: banners.map(b => ({
        id: b.id,
        displayType: b.displayType,
        contentMode: b.contentMode,
        title: b.title,
        subtitle: b.subtitle,
        image: b.image,
        ctaText: b.ctaText,
        ctaLink: b.ctaLink,
        couponId: b.couponId,
        coupon: b.coupon,
        isActive: b.isActive,
        sortOrder: b.sortOrder,
        pages: b.pages,
        position: b.position,
        dismissable: b.dismissable,
        sticky: b.sticky,
        styles: b.styles,
        startDate: b.startDate,
        endDate: b.endDate,
        createdAt: b.createdAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/site/banners/coupons - Liste des coupons pour sélection dans les bannières
router.get('/banners/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const coupons = await prisma.coupon.findMany({
      where: { restaurantId: staff.restaurantId, isActive: true },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        endDate: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: coupons })
  } catch (error) {
    next(error)
  }
})

const VALID_POSITIONS = ['top', 'hero', 'between', 'bottom']
const VALID_DISPLAY_TYPES = ['strip', 'banner']
const VALID_CONTENT_MODES = ['simple', 'promo']

// POST /restaurant/site/banners - Créer une bannière
router.post('/banners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const {
      displayType, contentMode,
      title, subtitle, image, ctaText, ctaLink,
      couponId, isActive, startDate, endDate,
      pages, position, dismissable, sticky, styles,
    } = req.body

    const bannerDisplayType = VALID_DISPLAY_TYPES.includes(displayType) ? displayType : 'banner'
    const bannerContentMode = VALID_CONTENT_MODES.includes(contentMode) ? contentMode : 'simple'
    const bannerPages: string[] = Array.isArray(pages) && pages.length > 0 ? pages : ['home']
    const bannerPosition: string = VALID_POSITIONS.includes(position) ? position : 'hero'

    if (bannerDisplayType === 'banner' && !image) {
      return next(new AppError('Image requise pour une bannière large', 400, 'IMAGE_REQUIRED'))
    }

    if (isActive !== false) {
      const activeCount = await prisma.storeBanner.count({
        where: { restaurantId: staff.restaurantId, isActive: true },
      })
      if (activeCount >= 10) {
        return next(new AppError('Maximum 10 bannières actives autorisées', 400, 'MAX_BANNERS_REACHED'))
      }
    }

    if (couponId) {
      const couponExists = await prisma.coupon.findFirst({
        where: { id: couponId, restaurantId: staff.restaurantId },
      })
      if (!couponExists) {
        return next(new AppError('Code promo introuvable', 400, 'COUPON_NOT_FOUND'))
      }
    }

    const maxOrder = await prisma.storeBanner.aggregate({
      where: { restaurantId: staff.restaurantId },
      _max: { sortOrder: true },
    })

    const banner = await prisma.storeBanner.create({
      data: {
        restaurantId: staff.restaurantId,
        displayType: bannerDisplayType,
        contentMode: bannerContentMode,
        title: title || null,
        subtitle: subtitle || null,
        image: image || null,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
        couponId: couponId || null,
        isActive: isActive ?? true,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        pages: bannerPages,
        position: bannerPosition,
        dismissable: dismissable ?? false,
        sticky: sticky ?? false,
        styles: styles ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    res.status(201).json({ success: true, data: banner })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/site/banners/:id - Modifier une bannière
router.put('/banners/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const {
      displayType, contentMode,
      title, subtitle, image, ctaText, ctaLink,
      couponId, isActive, startDate, endDate,
      pages, position, dismissable, sticky, styles,
    } = req.body

    const existing = await prisma.storeBanner.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Bannière non trouvée', 404, 'NOT_FOUND'))
    }

    if (isActive === true && !existing.isActive) {
      const activeCount = await prisma.storeBanner.count({
        where: { restaurantId: staff.restaurantId, isActive: true },
      })
      if (activeCount >= 10) {
        return next(new AppError('Maximum 10 bannières actives autorisées', 400, 'MAX_BANNERS_REACHED'))
      }
    }

    if (couponId !== undefined && couponId) {
      const couponExists = await prisma.coupon.findFirst({
        where: { id: couponId, restaurantId: staff.restaurantId },
      })
      if (!couponExists) {
        return next(new AppError('Code promo introuvable', 400, 'COUPON_NOT_FOUND'))
      }
    }

    const banner = await prisma.storeBanner.update({
      where: { id },
      data: {
        displayType: displayType !== undefined ? (VALID_DISPLAY_TYPES.includes(displayType) ? displayType : existing.displayType) : undefined,
        contentMode: contentMode !== undefined ? (VALID_CONTENT_MODES.includes(contentMode) ? contentMode : existing.contentMode) : undefined,
        title: title !== undefined ? (title || null) : undefined,
        subtitle: subtitle !== undefined ? (subtitle || null) : undefined,
        image: image !== undefined ? (image || null) : undefined,
        ctaText: ctaText !== undefined ? (ctaText || null) : undefined,
        ctaLink: ctaLink !== undefined ? (ctaLink || null) : undefined,
        couponId: couponId !== undefined ? (couponId || null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        pages: pages !== undefined ? (Array.isArray(pages) && pages.length > 0 ? pages : ['home']) : undefined,
        position: position !== undefined ? (VALID_POSITIONS.includes(position) ? position : existing.position) : undefined,
        dismissable: dismissable !== undefined ? dismissable : undefined,
        sticky: sticky !== undefined ? sticky : undefined,
        styles: styles !== undefined ? styles : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      },
    })

    res.json({ success: true, data: banner })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/site/banners/:id - Supprimer une bannière
router.delete('/banners/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existing = await prisma.storeBanner.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Bannière non trouvée', 404, 'NOT_FOUND'))
    }

    await prisma.storeBanner.delete({ where: { id } })

    res.json({ success: true, message: 'Bannière supprimée' })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/site/banners/reorder - Réordonner les bannières
router.patch('/banners/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { orderedIds } = req.body

    if (!Array.isArray(orderedIds)) {
      return next(new AppError('Liste d\'IDs requise', 400, 'INVALID_INPUT'))
    }

    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.storeBanner.updateMany({
          where: { id, restaurantId: staff.restaurantId },
          data: { sortOrder: index },
        })
      )
    )

    res.json({ success: true, message: 'Ordre mis à jour' })
  } catch (error) {
    next(error)
  }
})

// ============================================
// PAGES
// ============================================

const DEFAULT_PAGES = [
  {
    slug: 'accueil',
    title: 'Accueil',
    pageType: 'home',
    content: '',
    sortOrder: 0,
    showInNav: true,
  },
  {
    slug: 'menu',
    title: 'Menu',
    pageType: 'menu',
    content: '',
    sortOrder: 1,
    showInNav: true,
  },
  {
    slug: 'a-propos',
    title: 'À propos',
    pageType: 'about',
    content: '',
    sortOrder: 2,
    showInNav: true,
  },
  {
    slug: 'contact',
    title: 'Contact',
    pageType: 'contact',
    content: '',
    sortOrder: 3,
    showInNav: true,
  },
  {
    slug: 'checkout',
    title: 'Paiement',
    pageType: 'checkout',
    content: '',
    sortOrder: 100,
    showInNav: false,
  },
  {
    slug: 'thanks',
    title: 'Confirmation',
    pageType: 'thanks',
    content: '',
    sortOrder: 101,
    showInNav: false,
  },
  {
    slug: 'login',
    title: 'Connexion',
    pageType: 'login',
    content: '',
    sortOrder: 102,
    showInNav: false,
  },
  {
    slug: 'register',
    title: 'Inscription',
    pageType: 'register',
    content: '',
    sortOrder: 103,
    showInNav: false,
  },
  {
    slug: 'account',
    title: 'Mon compte',
    pageType: 'account',
    content: '',
    sortOrder: 104,
    showInNav: false,
  },
  {
    slug: 'track',
    title: 'Suivi de commande',
    pageType: 'track',
    content: '',
    sortOrder: 105,
    showInNav: false,
  },
]

async function ensureDefaultPages(restaurantId: string) {
  const existing = await prisma.storePage.findMany({
    where: { restaurantId, isDefault: true },
  })

  const existingTypes = new Set(existing.map(p => p.pageType))

  for (const page of DEFAULT_PAGES) {
    if (!existingTypes.has(page.pageType)) {
      await prisma.storePage.create({
        data: {
          restaurantId,
          slug: page.slug,
          title: page.title,
          content: page.content,
          pageType: page.pageType,
          isDefault: true,
          isActive: true,
          sortOrder: page.sortOrder,
          showInNav: page.showInNav,
        },
      })
    }
  }
}

// GET /restaurant/site/pages - Liste des pages
router.get('/pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    await ensureDefaultPages(staff.restaurantId)

    const pages = await prisma.storePage.findMany({
      where: { restaurantId: staff.restaurantId },
      orderBy: { sortOrder: 'asc' },
    })

    res.json({
      success: true,
      data: pages.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        content: p.content,
        isDefault: p.isDefault,
        pageType: p.pageType,
        isActive: p.isActive,
        sortOrder: p.sortOrder,
        showInNav: p.showInNav,
        sections: p.sections,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/site/pages - Créer une page
router.post('/pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { slug, title, content, isActive, showInNav, metaTitle, metaDescription, sections } = req.body

    if (!slug || !title || !content) {
      return next(new AppError('Slug, titre et contenu requis', 400, 'INVALID_INPUT'))
    }

    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      return next(new AppError('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets', 400, 'INVALID_SLUG'))
    }

    const existing = await prisma.storePage.findUnique({
      where: { restaurantId_slug: { restaurantId: staff.restaurantId, slug } },
    })

    if (existing) {
      return next(new AppError('Une page avec ce slug existe déjà', 409, 'SLUG_EXISTS'))
    }

    const maxOrder = await prisma.storePage.aggregate({
      where: { restaurantId: staff.restaurantId },
      _max: { sortOrder: true },
    })

    const page = await prisma.storePage.create({
      data: {
        restaurantId: staff.restaurantId,
        slug,
        title,
        content,
        isActive: isActive ?? true,
        showInNav: showInNav ?? true,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        sections: sections || null,
      },
    })

    res.status(201).json({ success: true, data: page })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/site/pages/:id - Modifier une page
router.put('/pages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const { slug, title, content, isActive, showInNav, metaTitle, metaDescription, sections } = req.body

    const existing = await prisma.storePage.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Page non trouvée', 404, 'NOT_FOUND'))
    }

    if (existing.isDefault && slug && slug !== existing.slug) {
      return next(new AppError('Le slug d\'une page par défaut ne peut pas être modifié', 400, 'DEFAULT_PAGE_SLUG'))
    }

    if (slug && slug !== existing.slug) {
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(slug)) {
        return next(new AppError('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets', 400, 'INVALID_SLUG'))
      }
      const duplicate = await prisma.storePage.findUnique({
        where: { restaurantId_slug: { restaurantId: staff.restaurantId, slug } },
      })
      if (duplicate) {
        return next(new AppError('Une page avec ce slug existe déjà', 409, 'SLUG_EXISTS'))
      }
    }

    const page = await prisma.storePage.update({
      where: { id },
      data: {
        slug: slug || undefined,
        title: title || undefined,
        content: content !== undefined ? content : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        showInNav: showInNav !== undefined ? showInNav : undefined,
        metaTitle: metaTitle !== undefined ? (metaTitle || null) : undefined,
        metaDescription: metaDescription !== undefined ? (metaDescription || null) : undefined,
        sections: sections !== undefined ? sections : undefined,
      },
    })

    res.json({ success: true, data: page })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/site/pages/:id - Supprimer une page
router.delete('/pages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existing = await prisma.storePage.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Page non trouvée', 404, 'NOT_FOUND'))
    }

    if (existing.isDefault) {
      return next(new AppError('Les pages par défaut ne peuvent pas être supprimées', 400, 'DEFAULT_PAGE'))
    }

    await prisma.storePage.delete({ where: { id } })

    res.json({ success: true, message: 'Page supprimée' })
  } catch (error) {
    next(error)
  }
})

// ============================================
// SEO
// ============================================

// GET /restaurant/site/seo - Récupérer les paramètres SEO
router.get('/seo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: staff.restaurantId },
      select: {
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        termsUrl: true,
        privacyUrl: true,
        legalNotice: true,
      },
    })

    res.json({ success: true, data: settings || { metaTitle: null, metaDescription: null, metaKeywords: [], termsUrl: null, privacyUrl: null, legalNotice: null } })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/site/seo - Mettre à jour les paramètres SEO
router.put('/seo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { metaTitle, metaDescription, metaKeywords, termsUrl, privacyUrl, legalNotice } = req.body

    const settings = await prisma.restaurantSettings.upsert({
      where: { restaurantId: staff.restaurantId },
      update: {
        metaTitle: metaTitle !== undefined ? (metaTitle || null) : undefined,
        metaDescription: metaDescription !== undefined ? (metaDescription || null) : undefined,
        metaKeywords: metaKeywords !== undefined ? metaKeywords : undefined,
        termsUrl: termsUrl !== undefined ? (termsUrl || null) : undefined,
        privacyUrl: privacyUrl !== undefined ? (privacyUrl || null) : undefined,
        legalNotice: legalNotice !== undefined ? (legalNotice || null) : undefined,
      },
      create: {
        restaurantId: staff.restaurantId,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || [],
        termsUrl: termsUrl || null,
        privacyUrl: privacyUrl || null,
        legalNotice: legalNotice || null,
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

// ============================================
// DOMAIN
// ============================================

// GET /restaurant/site/domain - Récupérer la configuration du domaine
router.get('/domain', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: staff.restaurantId },
      include: { site: true },
    })

    if (!restaurant?.site) {
      return next(new AppError('Site non trouvé', 404, 'NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        subdomain: restaurant.site.subdomain,
        customDomain: restaurant.site.customDomain,
        status: restaurant.site.status,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/site/domain - Configurer le domaine personnalisé
router.put('/domain', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { customDomain } = req.body

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: staff.restaurantId },
      include: { site: true },
    })

    if (!restaurant?.site) {
      return next(new AppError('Site non trouvé', 404, 'NOT_FOUND'))
    }

    if (customDomain) {
      const existing = await prisma.site.findUnique({
        where: { customDomain },
      })
      if (existing && existing.id !== restaurant.site.id) {
        return next(new AppError('Ce domaine est déjà utilisé', 409, 'DOMAIN_TAKEN'))
      }
    }

    const site = await prisma.site.update({
      where: { id: restaurant.site.id },
      data: {
        customDomain: customDomain || null,
      },
    })

    res.json({
      success: true,
      data: {
        subdomain: site.subdomain,
        customDomain: site.customDomain,
        status: site.status,
      },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// CONTACT MESSAGES
// ============================================

// GET /restaurant/site/messages - Liste des messages de contact
router.get('/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { page = '1', limit = '20', unreadOnly } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = { restaurantId: staff.restaurantId }
    if (unreadOnly === 'true') {
      where.isRead = false
    }

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contactMessage.count({ where }),
    ])

    res.json({
      success: true,
      data: messages.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        subject: m.subject,
        message: m.message,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/site/messages/:id/read - Marquer un message comme lu
router.patch('/messages/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existing = await prisma.contactMessage.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Message non trouvé', 404, 'NOT_FOUND'))
    }

    await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    })

    res.json({ success: true, message: 'Message marqué comme lu' })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/site/messages/:id - Supprimer un message
router.delete('/messages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const existing = await prisma.contactMessage.findFirst({
      where: { id, restaurantId: staff.restaurantId },
    })

    if (!existing) {
      return next(new AppError('Message non trouvé', 404, 'NOT_FOUND'))
    }

    await prisma.contactMessage.delete({ where: { id } })

    res.json({ success: true, message: 'Message supprimé' })
  } catch (error) {
    next(error)
  }
})

// ============================================
// THEME MARKETPLACE
// ============================================

async function syncActiveThemeInstallation(restaurantId: string) {
  const restaurantTheme = await prisma.restaurantTheme.findUnique({
    where: { restaurantId },
    select: { baseTheme: true },
  })
  if (!restaurantTheme?.baseTheme) return

  let theme = await prisma.theme.findUnique({
    where: { slug: restaurantTheme.baseTheme },
  })

  if (!theme) {
    theme = await prisma.theme.findUnique({ where: { slug: 'default' } })
    if (!theme) return
    await prisma.restaurantTheme.update({
      where: { restaurantId },
      data: { baseTheme: 'default' },
    })
  }

  const existing = await prisma.themeInstallation.findUnique({
    where: { restaurantId_themeId: { restaurantId, themeId: theme.id } },
  })

  if (!existing) {
    await prisma.themeInstallation.create({
      data: { restaurantId, themeId: theme.id, isActive: true },
    })
  } else if (!existing.isActive) {
    await prisma.themeInstallation.update({
      where: { id: existing.id },
      data: { isActive: true },
    })
  }
}

// GET /restaurant/site/themes - Catalogue de thèmes
router.get('/themes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    await syncActiveThemeInstallation(staff.restaurantId)

    const { category, isPremium, search, page = '1', limit = '12' } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = { isActive: true }
    if (category) where.category = category
    if (isPremium === 'true') where.isPremium = true
    if (isPremium === 'false') where.isPremium = false
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [(search as string).toLowerCase()] } },
      ]
    }

    const [themes, total] = await Promise.all([
      prisma.theme.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ isFeatured: 'desc' }, { installCount: 'desc' }],
      }),
      prisma.theme.count({ where }),
    ])

    res.json({
      success: true,
      data: themes.map(t => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        shortDescription: t.shortDescription,
        thumbnailUrl: t.thumbnailUrl,
        category: t.category,
        tags: t.tags,
        isPremium: t.isPremium,
        price: t.price ? Number(t.price) : null,
        isFeatured: t.isFeatured,
        installCount: t.installCount,
        rating: t.rating,
        ratingCount: t.ratingCount,
        features: t.features,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/site/themes/installed/list - Mes thèmes installés
router.get('/themes/installed/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    await syncActiveThemeInstallation(staff.restaurantId)

    const installations = await prisma.themeInstallation.findMany({
      where: { restaurantId: staff.restaurantId },
      include: { theme: true },
      orderBy: { installedAt: 'desc' },
    })

    res.json({
      success: true,
      data: installations.map(inst => ({
        id: inst.id,
        isActive: inst.isActive,
        installedAt: inst.installedAt,
        customizations: inst.customizations,
        theme: {
          id: inst.theme.id,
          slug: inst.theme.slug,
          name: inst.theme.name,
          shortDescription: inst.theme.shortDescription,
          thumbnailUrl: inst.theme.thumbnailUrl,
          category: inst.theme.category,
          version: inst.theme.version,
        },
      })),
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/site/themes/:slug - Détail d'un thème
router.get('/themes/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { slug } = req.params

    await syncActiveThemeInstallation(staff.restaurantId)

    const theme = await prisma.theme.findUnique({
      where: { slug },
    })

    if (!theme || !theme.isActive) {
      return next(new AppError('Thème non trouvé', 404, 'NOT_FOUND'))
    }

    const installation = await prisma.themeInstallation.findUnique({
      where: { restaurantId_themeId: { restaurantId: staff.restaurantId, themeId: theme.id } },
    })

    res.json({
      success: true,
      data: {
        id: theme.id,
        slug: theme.slug,
        name: theme.name,
        description: theme.description,
        shortDescription: theme.shortDescription,
        version: theme.version,
        author: theme.author,
        previewImages: theme.previewImages,
        thumbnailUrl: theme.thumbnailUrl,
        demoUrl: theme.demoUrl,
        category: theme.category,
        tags: theme.tags,
        isPremium: theme.isPremium,
        price: theme.price ? Number(theme.price) : null,
        isFeatured: theme.isFeatured,
        installCount: theme.installCount,
        rating: theme.rating,
        ratingCount: theme.ratingCount,
        features: theme.features,
        supportedPages: theme.supportedPages,
        colorPresets: theme.colorPresets,
        isInstalled: !!installation,
        isActive: installation?.isActive ?? false,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/site/themes/:slug/install - Installer un thème
router.post('/themes/:slug/install', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { slug } = req.params

    const theme = await prisma.theme.findUnique({ where: { slug } })

    if (!theme || !theme.isActive) {
      return next(new AppError('Thème non trouvé', 404, 'NOT_FOUND'))
    }

    const existing = await prisma.themeInstallation.findUnique({
      where: { restaurantId_themeId: { restaurantId: staff.restaurantId, themeId: theme.id } },
    })

    if (existing) {
      return next(new AppError('Thème déjà installé', 409, 'ALREADY_INSTALLED'))
    }

    const installation = await prisma.themeInstallation.create({
      data: {
        restaurantId: staff.restaurantId,
        themeId: theme.id,
        isActive: false,
      },
    })

    await prisma.theme.update({
      where: { id: theme.id },
      data: { installCount: { increment: 1 } },
    })

    res.status(201).json({ success: true, data: installation })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/site/themes/:slug/activate - Activer un thème installé
router.put('/themes/:slug/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { slug } = req.params

    const theme = await prisma.theme.findUnique({ where: { slug } })

    if (!theme) {
      return next(new AppError('Thème non trouvé', 404, 'NOT_FOUND'))
    }

    const installation = await prisma.themeInstallation.findUnique({
      where: { restaurantId_themeId: { restaurantId: staff.restaurantId, themeId: theme.id } },
    })

    if (!installation) {
      return next(new AppError('Thème non installé', 404, 'NOT_INSTALLED'))
    }

    const colorPresets = (theme.colorPresets as Record<string, unknown>) || {}
    const themeUpdate: Record<string, unknown> = { baseTheme: theme.slug }
    const allowedKeys = [
      'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor',
      'headingFont', 'bodyFont', 'buttonStyle', 'headerDesign', 'footerDesign',
    ]
    for (const key of allowedKeys) {
      if (colorPresets[key] !== undefined) {
        themeUpdate[key] = colorPresets[key]
      }
    }

    await prisma.$transaction([
      prisma.themeInstallation.updateMany({
        where: { restaurantId: staff.restaurantId },
        data: { isActive: false },
      }),
      prisma.themeInstallation.update({
        where: { id: installation.id },
        data: { isActive: true },
      }),
      prisma.restaurantTheme.upsert({
        where: { restaurantId: staff.restaurantId },
        update: themeUpdate,
        create: { restaurantId: staff.restaurantId, ...themeUpdate } as never,
      }),
    ])

    res.json({ success: true, message: 'Thème activé' })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/site/themes/:slug/uninstall - Désinstaller un thème
router.delete('/themes/:slug/uninstall', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { slug } = req.params

    const theme = await prisma.theme.findUnique({ where: { slug } })

    if (!theme) {
      return next(new AppError('Thème non trouvé', 404, 'NOT_FOUND'))
    }

    const installation = await prisma.themeInstallation.findUnique({
      where: { restaurantId_themeId: { restaurantId: staff.restaurantId, themeId: theme.id } },
    })

    if (!installation) {
      return next(new AppError('Thème non installé', 404, 'NOT_INSTALLED'))
    }

    if (installation.isActive) {
      await prisma.restaurantTheme.upsert({
        where: { restaurantId: staff.restaurantId },
        update: { baseTheme: 'default' },
        create: { restaurantId: staff.restaurantId, baseTheme: 'default' },
      })
    }

    await prisma.themeInstallation.delete({ where: { id: installation.id } })

    await prisma.theme.update({
      where: { id: theme.id },
      data: { installCount: { decrement: 1 } },
    })

    res.json({ success: true, message: 'Thème désinstallé' })
  } catch (error) {
    next(error)
  }
})

// ============================================
// SITE SETTINGS (Réglages centralisés)
// ============================================

// GET /restaurant/site/settings - Récupérer tous les réglages du site
router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const [settings, restaurant, pages] = await Promise.all([
      prisma.restaurantSettings.findUnique({
        where: { restaurantId: staff.restaurantId },
      }),
      prisma.restaurant.findUnique({
        where: { id: staff.restaurantId },
        include: { site: true },
      }),
      prisma.storePage.findMany({
        where: { restaurantId: staff.restaurantId, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, title: true, slug: true, pageType: true, isDefault: true },
      }),
    ])

    res.json({
      success: true,
      data: {
        general: {
          homePageId: settings?.homePageId || null,
          aboutPageId: settings?.aboutPageId || null,
          language: settings?.language || 'fr',
          currency: settings?.currency || 'XOF',
        },
        seo: {
          metaTitle: settings?.metaTitle || null,
          metaDescription: settings?.metaDescription || null,
          metaKeywords: settings?.metaKeywords || [],
          favicon: settings?.favicon || null,
          ogImage: settings?.ogImage || null,
        },
        conversion: {
          facebookPixelId: settings?.facebookPixelId || null,
          googleAnalyticsId: settings?.googleAnalyticsId || null,
          googleTagManagerId: settings?.googleTagManagerId || null,
          tiktokPixelId: settings?.tiktokPixelId || null,
          snapPixelId: settings?.snapPixelId || null,
          customHeadScript: settings?.customHeadScript || null,
        },
        domain: {
          subdomain: restaurant?.site?.subdomain || null,
          customDomain: restaurant?.site?.customDomain || null,
          status: restaurant?.site?.status || null,
        },
        legal: {
          termsUrl: settings?.termsUrl || null,
          privacyUrl: settings?.privacyUrl || null,
          legalNotice: settings?.legalNotice || null,
        },
        pages,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/site/settings - Mettre à jour les réglages du site
router.put('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const {
      homePageId,
      aboutPageId,
      metaTitle,
      metaDescription,
      metaKeywords,
      favicon,
      ogImage,
      facebookPixelId,
      googleAnalyticsId,
      googleTagManagerId,
      tiktokPixelId,
      snapPixelId,
      customHeadScript,
      termsUrl,
      privacyUrl,
      legalNotice,
      customDomain,
    } = req.body

    if (homePageId !== undefined && homePageId !== null) {
      const page = await prisma.storePage.findFirst({
        where: { id: homePageId, restaurantId: staff.restaurantId, isActive: true },
      })
      if (!page) {
        return next(new AppError('Page d\'accueil non trouvée', 404, 'PAGE_NOT_FOUND'))
      }
    }

    if (aboutPageId !== undefined && aboutPageId !== null) {
      const page = await prisma.storePage.findFirst({
        where: { id: aboutPageId, restaurantId: staff.restaurantId, isActive: true },
      })
      if (!page) {
        return next(new AppError('Page à propos non trouvée', 404, 'PAGE_NOT_FOUND'))
      }
    }

    const settingsData: Record<string, unknown> = {}
    if (homePageId !== undefined) settingsData.homePageId = homePageId || null
    if (aboutPageId !== undefined) settingsData.aboutPageId = aboutPageId || null
    if (metaTitle !== undefined) settingsData.metaTitle = metaTitle || null
    if (metaDescription !== undefined) settingsData.metaDescription = metaDescription || null
    if (metaKeywords !== undefined) settingsData.metaKeywords = metaKeywords
    if (favicon !== undefined) settingsData.favicon = favicon || null
    if (ogImage !== undefined) settingsData.ogImage = ogImage || null
    if (facebookPixelId !== undefined) settingsData.facebookPixelId = facebookPixelId || null
    if (googleAnalyticsId !== undefined) settingsData.googleAnalyticsId = googleAnalyticsId || null
    if (googleTagManagerId !== undefined) settingsData.googleTagManagerId = googleTagManagerId || null
    if (tiktokPixelId !== undefined) settingsData.tiktokPixelId = tiktokPixelId || null
    if (snapPixelId !== undefined) settingsData.snapPixelId = snapPixelId || null
    if (customHeadScript !== undefined) settingsData.customHeadScript = customHeadScript || null
    if (termsUrl !== undefined) settingsData.termsUrl = termsUrl || null
    if (privacyUrl !== undefined) settingsData.privacyUrl = privacyUrl || null
    if (legalNotice !== undefined) settingsData.legalNotice = legalNotice || null

    const settings = await prisma.restaurantSettings.upsert({
      where: { restaurantId: staff.restaurantId },
      update: settingsData,
      create: {
        restaurantId: staff.restaurantId,
        ...settingsData,
      },
    })

    if (customDomain !== undefined) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: staff.restaurantId },
        include: { site: true },
      })

      if (restaurant?.site) {
        if (customDomain) {
          const existing = await prisma.site.findUnique({
            where: { customDomain },
          })
          if (existing && existing.id !== restaurant.site.id) {
            return next(new AppError('Ce domaine est déjà utilisé', 409, 'DOMAIN_TAKEN'))
          }
        }

        await prisma.site.update({
          where: { id: restaurant.site.id },
          data: { customDomain: customDomain || null },
        })
      }
    }

    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
})

export { router as siteRoutes }
