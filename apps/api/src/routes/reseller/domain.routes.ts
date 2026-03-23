import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { vercelService } from '../../services/vercel.service'

const router = Router()

const addDomainSchema = z.object({
  domain: z.string()
    .min(3)
    .max(253)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$/, 'Format de domaine invalide'),
})

// GET /reseller/domain - Récupérer la config domaine
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

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: member.organizationId },
      select: {
        id: true,
        slug: true,
        customDomain: true,
        domainVerified: true,
        domainTxtRecord: true,
      }
    })

    const vercelConfigured = vercelService.isConfigured()

    let vercelStatus = null
    if (organization?.customDomain && vercelConfigured) {
      const domainInfo = await vercelService.getDomain(organization.customDomain)
      if (domainInfo.success && domainInfo.domain) {
        vercelStatus = {
          verified: domainInfo.domain.verified,
          verification: domainInfo.domain.verification,
        }
      }
    }

    res.json({
      success: true,
      data: {
        slug: organization?.slug,
        customDomain: organization?.customDomain,
        domainVerified: organization?.domainVerified,
        domainTxtRecord: organization?.domainTxtRecord,
        vercelConfigured,
        vercelStatus,
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /reseller/domain - Ajouter un domaine personnalisé
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'))
    }

    const validation = addDomainSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Données invalides', 400, 'VALIDATION_ERROR'))
    }

    const { domain } = validation.data
    const normalizedDomain = domain.toLowerCase().trim()

    const member = await prisma.resellerMember.findUnique({
      where: { userId },
      select: { organizationId: true, role: true }
    })

    if (!member) {
      return next(new AppError('Organisation non trouvée', 404, 'ORGANIZATION_NOT_FOUND'))
    }

    if (member.role !== 'OWNER' && member.role !== 'ADMIN') {
      return next(new AppError('Permission refusée', 403, 'FORBIDDEN'))
    }

    // Vérifier si le domaine est déjà utilisé
    const existingDomain = await prisma.resellerOrganization.findFirst({
      where: {
        customDomain: normalizedDomain,
        id: { not: member.organizationId }
      }
    })

    if (existingDomain) {
      return next(new AppError('Ce domaine est déjà utilisé', 400, 'DOMAIN_ALREADY_USED'))
    }

    // Ajouter le domaine sur Vercel
    if (!vercelService.isConfigured()) {
      return next(new AppError('Configuration Vercel manquante', 500, 'VERCEL_NOT_CONFIGURED'))
    }

    const vercelResult = await vercelService.addDomain(normalizedDomain)

    if (!vercelResult.success) {
      if (vercelResult.error === 'DOMAIN_ALREADY_EXISTS') {
        // Le domaine existe déjà sur Vercel, on peut continuer
      } else {
        return next(new AppError(
          `Erreur Vercel: ${vercelResult.error}`,
          400,
          'VERCEL_ERROR'
        ))
      }
    }

    // Mettre à jour l'organisation
    const organization = await prisma.resellerOrganization.update({
      where: { id: member.organizationId },
      data: {
        customDomain: normalizedDomain,
        domainVerified: false,
        domainTxtRecord: vercelResult.verification ? JSON.stringify(vercelResult.verification) : null,
      },
      select: {
        customDomain: true,
        domainVerified: true,
        domainTxtRecord: true,
      }
    })

    res.json({
      success: true,
      data: {
        customDomain: organization.customDomain,
        domainVerified: organization.domainVerified,
        verification: vercelResult.verification,
        message: 'Domaine ajouté. Configurez les enregistrements DNS puis vérifiez.',
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /reseller/domain/verify - Vérifier le domaine
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
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

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: member.organizationId },
      select: { customDomain: true }
    })

    if (!organization?.customDomain) {
      return next(new AppError('Aucun domaine configuré', 400, 'NO_DOMAIN_CONFIGURED'))
    }

    if (!vercelService.isConfigured()) {
      return next(new AppError('Configuration Vercel manquante', 500, 'VERCEL_NOT_CONFIGURED'))
    }

    const verifyResult = await vercelService.verifyDomain(organization.customDomain)

    if (verifyResult.verified) {
      await prisma.resellerOrganization.update({
        where: { id: member.organizationId },
        data: {
          domainVerified: true,
          domainTxtRecord: null,
        }
      })

      res.json({
        success: true,
        data: {
          verified: true,
          message: 'Domaine vérifié avec succès !',
        }
      })
    } else {
      // Récupérer les infos de vérification actuelles
      const domainInfo = await vercelService.getDomain(organization.customDomain)

      res.json({
        success: true,
        data: {
          verified: false,
          verification: domainInfo.domain?.verification,
          message: 'Le domaine n\'est pas encore vérifié. Vérifiez vos enregistrements DNS.',
        }
      })
    }
  } catch (error) {
    next(error)
  }
})

// DELETE /reseller/domain - Supprimer le domaine personnalisé
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
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

    if (member.role !== 'OWNER' && member.role !== 'ADMIN') {
      return next(new AppError('Permission refusée', 403, 'FORBIDDEN'))
    }

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: member.organizationId },
      select: { customDomain: true }
    })

    if (organization?.customDomain && vercelService.isConfigured()) {
      await vercelService.removeDomain(organization.customDomain)
    }

    await prisma.resellerOrganization.update({
      where: { id: member.organizationId },
      data: {
        customDomain: null,
        domainVerified: false,
        domainTxtRecord: null,
      }
    })

    res.json({
      success: true,
      data: {
        message: 'Domaine supprimé',
      }
    })
  } catch (error) {
    next(error)
  }
})

export const domainRoutes = router
