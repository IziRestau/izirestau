import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'

const router = Router()

// Schémas de validation pour les configurations avancées
const heroConfigSchema = z.object({
  layout: z.enum(['centered', 'split', 'video']).optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  image: z.string().optional().nullable(),
  video: z.string().optional().nullable(),
  showStats: z.boolean().optional(),
  stats: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  ctaText: z.string().max(50).optional(),
  ctaAction: z.enum(['pricing', 'contact', 'custom']).optional(),
  ctaCustomUrl: z.string().optional().nullable(),
}).optional().nullable()

const productModuleSchema = z.object({
  id: z.string(),
  icon: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.string().optional().nullable(),
  enabled: z.boolean(),
})

const productConfigSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  modules: z.array(productModuleSchema).optional(),
  layout: z.enum(['grid', 'list', 'tabs', 'accordion']).optional(),
}).optional().nullable()

const howItWorksConfigSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  steps: z.array(z.object({
    id: z.string(),
    number: z.number().optional(),
    icon: z.string().optional(),
    title: z.string(),
    description: z.string(),
    image: z.string().optional().nullable(),
  })).optional(),
  layout: z.enum(['horizontal', 'vertical', 'timeline', 'numbered']).optional(),
}).optional().nullable()

const benefitsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  items: z.array(z.object({
    id: z.string(),
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })).optional(),
  layout: z.enum(['grid', 'cards', 'icons', 'alternating']).optional(),
}).optional().nullable()

const pricingConfigSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  layout: z.enum(['cards', 'table', 'comparison']).optional(),
  highlightedPlanId: z.string().optional().nullable(),
  showFeatures: z.boolean().optional(),
  ctaText: z.string().max(50).optional(),
}).optional().nullable()

const testimonialsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    company: z.string().optional(),
    role: z.string().optional(),
    quote: z.string(),
    avatar: z.string().optional().nullable(),
    rating: z.number().min(1).max(5).optional(),
  })).optional(),
  layout: z.enum(['grid', 'carousel', 'large']).optional(),
}).optional().nullable()

const faqConfigSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  items: z.array(z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
    category: z.string().optional(),
  })).optional(),
  layout: z.enum(['accordion', 'grid', 'categorized']).optional(),
}).optional().nullable()

const contactConfigSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  showForm: z.boolean().optional(),
  showInfo: z.boolean().optional(),
  showMap: z.boolean().optional(),
}).optional().nullable()

const footerConfigSchema = z.object({
  showBadges: z.boolean().optional(),
  badges: z.array(z.object({
    type: z.enum(['ssl', 'secure', 'support', 'custom']),
    label: z.string().optional(),
    icon: z.string().optional(),
  })).optional(),
  links: z.array(z.object({
    label: z.string(),
    url: z.string(),
  })).optional(),
  socials: z.array(z.object({
    type: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'whatsapp']),
    url: z.string(),
  })).optional(),
  copyrightText: z.string().optional(),
}).optional().nullable()

const globalStylesSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontFamily: z.enum(['inter', 'poppins', 'roboto', 'open-sans', 'montserrat']).optional(),
  borderRadius: z.enum(['none', 'small', 'medium', 'large', 'full']).optional(),
  cardStyle: z.enum(['flat', 'bordered', 'shadow', 'elevated']).optional(),
  buttonStyle: z.enum(['solid', 'outline', 'ghost']).optional(),
  spacing: z.enum(['compact', 'normal', 'relaxed']).optional(),
}).optional().nullable()

const updateShowcaseSchema = z.object({
  isEnabled: z.boolean().optional(),
  // Configurations avancées
  heroConfig: heroConfigSchema,
  productConfig: productConfigSchema,
  howItWorksConfig: howItWorksConfigSchema,
  benefitsConfig: benefitsConfigSchema,
  pricingConfig: pricingConfigSchema,
  testimonialsConfig: testimonialsConfigSchema,
  faqConfig: faqConfigSchema,
  contactConfig: contactConfigSchema,
  footerConfig: footerConfigSchema,
  sectionsOrder: z.array(z.enum(['hero', 'product', 'howItWorks', 'benefits', 'pricing', 'testimonials', 'faq', 'contact'])).optional().nullable(),
  globalStyles: globalStylesSchema,
  template: z.enum(['modern', 'professional', 'dynamic', 'minimal']).optional(),
  // SEO
  metaTitle: z.string().max(100).optional().nullable().or(z.literal('')),
  metaDescription: z.string().max(300).optional().nullable().or(z.literal('')),
})

// GET /reseller/showcase - Config vitrine
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true }
    })

    if (!member) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    let showcase = await prisma.resellerShowcase.findUnique({
      where: { organizationId: member.organizationId }
    })

    if (!showcase) {
      showcase = await prisma.resellerShowcase.create({
        data: {
          organizationId: member.organizationId,
          isEnabled: false,
        }
      })
    }

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: member.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        customDomain: true,
        domainVerified: true,
        monerooConfigured: true,
      }
    })

    res.json({
      success: true,
      data: {
        showcase,
        organization,
        canPublish: organization?.monerooConfigured && organization?.domainVerified,
      }
    })
  } catch (error) {
    next(error)
  }
})

// PUT /reseller/showcase - Modifier config
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true, role: true }
    })

    if (!member) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      return next(new AppError('Permission refusée', 403, 'FORBIDDEN'))
    }

    const validation = updateShowcaseSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    // Convertir les valeurs null en undefined pour Prisma
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value])
    )

    const showcase = await prisma.resellerShowcase.upsert({
      where: { organizationId: member.organizationId },
      create: {
        organizationId: member.organizationId,
        ...cleanData,
      },
      update: cleanData,
    })

    res.json({
      success: true,
      data: showcase
    })
  } catch (error) {
    next(error)
  }
})

// POST /reseller/showcase/toggle - Activer/désactiver
router.post('/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true, role: true }
    })

    if (!member) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      return next(new AppError('Permission refusée', 403, 'FORBIDDEN'))
    }

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: member.organizationId },
      select: {
        monerooConfigured: true,
        domainVerified: true,
        customDomain: true,
      }
    })

    const { enable } = req.body

    if (enable && !organization?.monerooConfigured) {
      return next(new AppError('Veuillez configurer Moneroo avant d\'activer la vitrine', 400, 'MONEROO_NOT_CONFIGURED'))
    }

    const showcase = await prisma.resellerShowcase.upsert({
      where: { organizationId: member.organizationId },
      create: {
        organizationId: member.organizationId,
        isEnabled: enable,
      },
      update: {
        isEnabled: enable,
      },
    })

    res.json({
      success: true,
      data: {
        isEnabled: showcase.isEnabled,
        message: showcase.isEnabled 
          ? 'Vitrine activée' 
          : 'Vitrine désactivée',
      }
    })
  } catch (error) {
    next(error)
  }
})

export { router as showcaseRoutes }
