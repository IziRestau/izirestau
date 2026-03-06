import { Router, Request, Response } from 'express'
import multer from 'multer'
import { prisma } from '@iziresto/database'
import { authenticate } from '../middlewares/auth.middleware'
import { 
  storage, 
  StorageFolder,
  validateImageFile,
  validateDocumentFile,
} from '../services/storage.service'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

router.post(
  '/image',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file
      const folder = req.body.folder as StorageFolder

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'NO_FILE',
          message: 'Aucun fichier fourni',
        })
      }

      if (!folder) {
        return res.status(400).json({
          success: false,
          error: 'NO_FOLDER',
          message: 'Dossier de destination requis',
        })
      }

      const validFolders: StorageFolder[] = ['avatars', 'logos', 'restaurants', 'products', 'categories', 'restaurant-logos', 'covers', 'branding']
      if (!validFolders.includes(folder)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_FOLDER',
          message: 'Dossier invalide',
        })
      }

      const validation = validateImageFile(file.mimetype, file.size)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_FILE',
          message: validation.error,
        })
      }

      const result = await storage.upload(file.buffer, file.originalname, {
        folder,
        metadata: {
          uploadedBy: req.user?.userId || 'unknown',
          originalName: file.originalname,
        },
      })

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'UPLOAD_FAILED',
          message: result.error || 'Erreur lors de l\'upload',
        })
      }

      // Enregistrer dans MediaItem si restaurantId est fourni
      const restaurantId = req.body.restaurantId as string | undefined
      let mediaItem = null

      if (restaurantId && result.url) {
        try {
          mediaItem = await prisma.mediaItem.create({
            data: {
              restaurantId,
              filename: result.key || file.originalname,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              url: result.url,
              folder,
              uploadedBy: req.user?.userId,
            },
          })
        } catch (err) {
          console.warn('[Upload] Failed to save to MediaItem:', err)
        }
      }

      return res.json({
        success: true,
        data: {
          url: result.url,
          key: result.key,
          mediaItem,
        },
      })
    } catch (error) {
      console.error('[Upload] Image upload error:', error)
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Erreur serveur',
      })
    }
  }
)

router.post(
  '/document',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file
      const folder = req.body.folder as StorageFolder

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'NO_FILE',
          message: 'Aucun fichier fourni',
        })
      }

      if (!folder) {
        return res.status(400).json({
          success: false,
          error: 'NO_FOLDER',
          message: 'Dossier de destination requis',
        })
      }

      const validFolders: StorageFolder[] = ['documents', 'invoices']
      if (!validFolders.includes(folder)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_FOLDER',
          message: 'Dossier invalide',
        })
      }

      const validation = validateDocumentFile(file.mimetype, file.size)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_FILE',
          message: validation.error,
        })
      }

      const result = await storage.upload(file.buffer, file.originalname, {
        folder,
        metadata: {
          uploadedBy: req.user?.userId || 'unknown',
          originalName: file.originalname,
        },
      })

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'UPLOAD_FAILED',
          message: result.error || 'Erreur lors de l\'upload',
        })
      }

      return res.json({
        success: true,
        data: {
          url: result.url,
          key: result.key,
        },
      })
    } catch (error) {
      console.error('[Upload] Document upload error:', error)
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Erreur serveur',
      })
    }
  }
)

router.delete(
  '/',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { url, key } = req.body

      let fileKey = key
      if (!fileKey && url) {
        fileKey = storage.extractKey(url)
      }

      if (!fileKey) {
        return res.status(400).json({
          success: false,
          error: 'NO_KEY',
          message: 'Cle ou URL du fichier requise',
        })
      }

      const deleted = await storage.delete(fileKey)

      if (!deleted) {
        return res.status(500).json({
          success: false,
          error: 'DELETE_FAILED',
          message: 'Erreur lors de la suppression',
        })
      }

      return res.json({
        success: true,
        message: 'Fichier supprime',
      })
    } catch (error) {
      console.error('[Upload] Delete error:', error)
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Erreur serveur',
      })
    }
  }
)

router.get(
  '/status',
  authenticate,
  (_req: Request, res: Response) => {
    return res.json({
      success: true,
      data: {
        configured: storage.isConfigured(),
      },
    })
  }
)

export const uploadRoutes = router
