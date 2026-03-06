'use strict'

import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'
import { storage, validateImageFile } from '../../services/storage.service'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

// GET /restaurant/media - Liste des medias avec pagination et filtres
router.get('/', requireRole('OWNER', 'MANAGER', 'STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { 
      folder, 
      search, 
      page = '1', 
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20))
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {
      restaurantId: staff.restaurantId,
    }

    if (folder && folder !== 'all') {
      where.folder = folder as string
    }

    if (search) {
      where.OR = [
        { originalName: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } },
      ]
    }

    const orderBy: Record<string, string> = {}
    if (sortBy === 'name') {
      orderBy.originalName = sortOrder as string
    } else if (sortBy === 'size') {
      orderBy.size = sortOrder as string
    } else {
      orderBy.createdAt = sortOrder as string
    }

    const [items, total] = await Promise.all([
      prisma.mediaItem.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          url: true,
          thumbnailUrl: true,
          width: true,
          height: true,
          title: true,
          folder: true,
          tags: true,
          alt: true,
          createdAt: true,
        },
      }),
      prisma.mediaItem.count({ where }),
    ])

    // Statistiques par dossier
    const folderStats = await prisma.mediaItem.groupBy({
      by: ['folder'],
      where: { restaurantId: staff.restaurantId },
      _count: { id: true },
      _sum: { size: true },
    })

    const folders = folderStats.map(f => ({
      name: f.folder || 'Sans dossier',
      count: f._count.id,
      size: f._sum.size || 0,
    }))

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        folders,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/media - Upload et enregistrement d'un media
router.post('/', requireRole('OWNER', 'MANAGER', 'STAFF'), upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const file = req.file
    const { folder = 'general', title, alt, tags } = req.body

    if (!file) {
      return next(new AppError('Aucun fichier fourni', 400, 'NO_FILE'))
    }

    const validation = validateImageFile(file.mimetype, file.size)
    if (!validation.valid) {
      return next(new AppError(validation.error || 'Fichier invalide', 400, 'INVALID_FILE'))
    }

    // Upload vers R2
    const result = await storage.upload(file.buffer, file.originalname, {
      folder: folder as 'products' | 'logos' | 'avatars' | 'restaurants' | 'categories' | 'restaurant-logos' | 'covers' | 'branding',
      metadata: {
        uploadedBy: req.user?.userId || 'unknown',
        restaurantId: staff.restaurantId,
      },
    })

    if (!result.success || !result.url) {
      return next(new AppError('Erreur lors de l\'upload', 500, 'UPLOAD_FAILED'))
    }

    // Enregistrer en BDD
    const mediaItem = await prisma.mediaItem.create({
      data: {
        restaurantId: staff.restaurantId,
        filename: result.key || file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: result.url,
        folder: folder as string,
        title: title || null,
        alt: alt || null,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
        uploadedBy: req.user?.userId,
      },
    })

    res.status(201).json({
      success: true,
      data: mediaItem,
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/media/:id - Detail d'un media
router.get('/:id', requireRole('OWNER', 'MANAGER', 'STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const mediaItem = await prisma.mediaItem.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!mediaItem) {
      return next(new AppError('Média non trouvé', 404, 'MEDIA_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: mediaItem,
    })
  } catch (error) {
    next(error)
  }
})

// PUT /restaurant/media/:id - Modifier les metadonnees d'un media
router.put('/:id', requireRole('OWNER', 'MANAGER', 'STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params
    const { title, alt, description, folder, tags } = req.body

    const existing = await prisma.mediaItem.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!existing) {
      return next(new AppError('Média non trouvé', 404, 'MEDIA_NOT_FOUND'))
    }

    const mediaItem = await prisma.mediaItem.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        alt: alt !== undefined ? alt : existing.alt,
        description: description !== undefined ? description : existing.description,
        folder: folder !== undefined ? folder : existing.folder,
        tags: tags !== undefined ? (Array.isArray(tags) ? tags : [tags]) : existing.tags,
      },
    })

    res.json({
      success: true,
      data: mediaItem,
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /restaurant/media/:id - Supprimer un media
router.delete('/:id', requireRole('MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!
    const { id } = req.params

    const mediaItem = await prisma.mediaItem.findFirst({
      where: {
        id,
        restaurantId: staff.restaurantId,
      },
    })

    if (!mediaItem) {
      return next(new AppError('Média non trouvé', 404, 'MEDIA_NOT_FOUND'))
    }

    // Supprimer de R2
    const key = storage.extractKey(mediaItem.url)
    if (key) {
      await storage.delete(key)
    }

    // Supprimer de la BDD
    await prisma.mediaItem.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Média supprimé',
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/media/folders/list - Liste des dossiers uniques
router.get('/folders/list', requireRole('OWNER', 'MANAGER', 'STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = req.restaurantStaff!

    const folderStats = await prisma.mediaItem.groupBy({
      by: ['folder'],
      where: { restaurantId: staff.restaurantId },
      _count: { id: true },
    })

    const folders = folderStats
      .filter(f => f.folder)
      .map(f => ({
        name: f.folder,
        count: f._count.id,
      }))

    res.json({
      success: true,
      data: folders,
    })
  } catch (error) {
    next(error)
  }
})

export const restaurantMediaRoutes = router
