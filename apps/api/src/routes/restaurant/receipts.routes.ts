import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { loadStaff, requireRole } from '../../middlewares/restaurant-role.middleware'
import { receiptService } from '../../services/receipt.service'
import { templateService } from '../../services/template.service'
import { pdfService } from '../../services/pdf.service'
import { sendReceiptEmail } from '../../services/email.service'
import { escposService } from '../../services/escpos.service'

const router = Router()

// Schemas de validation
const createReceiptSchema = z.object({
  type: z.enum(['TICKET', 'INVOICE_SIMPLE', 'INVOICE_FULL']).optional(),
  templateId: z.string().optional(),
})

const listReceiptsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.enum(['TICKET', 'INVOICE_SIMPLE', 'INVOICE_FULL']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
})

const voidReceiptSchema = z.object({
  reason: z.string().min(1, 'La raison est requise'),
})

const sendEmailSchema = z.object({
  email: z.string().email('Email invalide'),
})

const thermalPrintSchema = z.object({
  printerHost: z.string().optional(),
  printerPort: z.number().optional(),
  width: z.enum(['58mm', '80mm']).optional(),
})

// Middleware pour charger le staff
router.use(loadStaff)

// ============================================
// TEMPLATES
// ============================================

// GET /restaurant/receipts/templates - Liste des templates disponibles
router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'RESTAURANT_NOT_FOUND'))
    }

    // Récupérer les templates système et les templates custom du restaurant
    const templates = await prisma.receiptTemplate.findMany({
      where: {
        OR: [
          { restaurantId: null, isSystem: true },
          { restaurantId },
        ],
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    })

    res.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/receipts/templates/:id/preview - Prévisualisation d'un template
router.get('/templates/:id/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId

    const template = await prisma.receiptTemplate.findFirst({
      where: {
        id,
        OR: [
          { restaurantId: null, isSystem: true },
          { restaurantId },
        ],
      },
    })

    if (!template) {
      return next(new AppError('Template non trouvé', 404, 'TEMPLATE_NOT_FOUND'))
    }

    // Récupérer les données du restaurant avec son thème
    const restaurant = restaurantId ? await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        name: true,
        address: true,
        city: true,
        postalCode: true,
        phone: true,
        email: true,
        siret: true,
        vatNumber: true,
        theme: {
          select: {
            primaryColor: true,
          },
        },
      },
    }) : null

    // Récupérer les settings de reçus
    const receiptSettings = restaurantId ? await prisma.receiptSettings.findUnique({
      where: { restaurantId },
    }) : null

    // Générer une prévisualisation avec les données réelles du restaurant
    const previewData = templateService.getPreviewData({
      restaurant: restaurant ? {
        name: restaurant.name,
        address: restaurant.address || '123 Rue de la Gastronomie',
        city: restaurant.city || 'Paris',
        postalCode: restaurant.postalCode || '75001',
        phone: restaurant.phone || '01 23 45 67 89',
        email: restaurant.email || undefined,
        siret: restaurant.siret || undefined,
        vatNumber: restaurant.vatNumber || undefined,
      } : undefined,
      settings: {
        primaryColor: restaurant?.theme?.primaryColor || '#10b981',
        logo: receiptSettings?.logo || undefined,
        thankYouMessage: receiptSettings?.thankYouMessage || 'Merci de votre visite !',
        footerText: receiptSettings?.footerText || undefined,
        showQrCode: receiptSettings?.showQrCode || false,
      },
    })

    const html = await templateService.renderWithStyles(
      template.htmlTemplate,
      template.cssStyles,
      previewData
    )

    // Retourner le HTML directement
    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    next(error)
  }
})

// ============================================
// SETTINGS
// ============================================

// GET /restaurant/receipts/settings - Récupérer les paramètres de reçus
router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'RESTAURANT_NOT_FOUND'))
    }

    let settings = await prisma.receiptSettings.findUnique({
      where: { restaurantId },
    })

    // Créer les settings par défaut si inexistants
    if (!settings) {
      settings = await prisma.receiptSettings.create({
        data: {
          restaurantId,
        },
      })
    }

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /restaurant/receipts/settings - Mettre à jour les paramètres
router.patch('/settings', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const {
      ticketTemplateId,
      invoiceSimpleTemplateId,
      invoiceFullTemplateId,
      logo,
      thankYouMessage,
      footerText,
      showQrCode,
      qrCodeType,
      qrCodeCustomUrl,
      autoPrintOnOrder,
      autoEmailOnOrder,
      defaultReceiptType,
      receiptPrefix,
    } = req.body

    const settings = await prisma.receiptSettings.upsert({
      where: { restaurantId },
      update: {
        ...(ticketTemplateId !== undefined && { ticketTemplateId }),
        ...(invoiceSimpleTemplateId !== undefined && { invoiceSimpleTemplateId }),
        ...(invoiceFullTemplateId !== undefined && { invoiceFullTemplateId }),
        ...(logo !== undefined && { logo }),
        ...(thankYouMessage !== undefined && { thankYouMessage }),
        ...(footerText !== undefined && { footerText }),
        ...(showQrCode !== undefined && { showQrCode }),
        ...(qrCodeType !== undefined && { qrCodeType }),
        ...(qrCodeCustomUrl !== undefined && { qrCodeCustomUrl }),
        ...(autoPrintOnOrder !== undefined && { autoPrintOnOrder }),
        ...(autoEmailOnOrder !== undefined && { autoEmailOnOrder }),
        ...(defaultReceiptType !== undefined && { defaultReceiptType }),
        ...(receiptPrefix !== undefined && { receiptPrefix }),
      },
      create: {
        restaurantId,
        ticketTemplateId,
        invoiceSimpleTemplateId,
        invoiceFullTemplateId,
        logo,
        thankYouMessage,
        footerText,
        showQrCode,
        qrCodeType,
        qrCodeCustomUrl,
        autoPrintOnOrder,
        autoEmailOnOrder,
        defaultReceiptType,
        receiptPrefix,
      },
    })

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// RECEIPTS
// ============================================

// GET /restaurant/receipts - Liste des reçus
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.restaurantStaff?.restaurantId
    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const params = listReceiptsSchema.parse(req.query)

    const result = await receiptService.listReceipts(restaurantId, {
      page: params.page,
      limit: params.limit,
      type: params.type as 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL' | undefined,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      search: params.search,
    })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Paramètres invalides', 400, 'INVALID_PARAMS'))
    }
    next(error)
  }
})

// GET /restaurant/receipts/:id - Détail d'un reçu
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId

    const receipt = await prisma.receipt.findFirst({
      where: {
        id,
        restaurantId,
      },
      include: {
        template: true,
        order: {
          select: {
            orderNumber: true,
            serviceType: true,
            paymentMethod: true,
            total: true,
            createdAt: true,
          },
        },
      },
    })

    if (!receipt) {
      return next(new AppError('Reçu non trouvé', 404, 'RECEIPT_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: receipt,
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/receipts/:id/html - Rendu HTML d'un reçu
router.get('/:id/html', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId

    // Vérifier que le reçu appartient au restaurant
    const receipt = await prisma.receipt.findFirst({
      where: { id, restaurantId },
    })

    if (!receipt) {
      return next(new AppError('Reçu non trouvé', 404, 'RECEIPT_NOT_FOUND'))
    }

    const html = await receiptService.renderReceiptHtml(id)

    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/receipts/:id/pdf - Télécharger le PDF d'un reçu
router.get('/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId

    const isPdfAvailable = await pdfService.isAvailableAsync()
    if (!isPdfAvailable) {
      return next(new AppError('Service PDF non disponible', 503, 'PDF_SERVICE_UNAVAILABLE'))
    }

    // Vérifier que le reçu appartient au restaurant
    const receipt = await prisma.receipt.findFirst({
      where: { id, restaurantId },
      include: { template: true },
    })

    if (!receipt) {
      return next(new AppError('Reçu non trouvé', 404, 'RECEIPT_NOT_FOUND'))
    }

    // Générer le HTML
    const html = await receiptService.renderReceiptHtml(id)

    // Générer le PDF selon le type de reçu
    let pdfBuffer: Buffer
    if (receipt.type === 'TICKET') {
      // Format ticket thermique
      const width = receipt.template.name.includes('58mm') ? '58mm' : '80mm'
      pdfBuffer = await pdfService.generateReceiptPdf(html, width)
    } else {
      // Format facture A4
      pdfBuffer = await pdfService.generateInvoicePdf(html)
    }

    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="recu-${receipt.receiptNumber}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/orders/:orderId/receipt - Générer un reçu pour une commande
router.post('/orders/:orderId/receipt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId
    const userId = req.user?.userId

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'RESTAURANT_NOT_FOUND'))
    }

    // Vérifier que la commande appartient au restaurant
    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    })

    if (!order) {
      return next(new AppError('Commande non trouvée', 404, 'ORDER_NOT_FOUND'))
    }

    const body = createReceiptSchema.parse(req.body)

    const receipt = await receiptService.createReceipt({
      orderId,
      restaurantId,
      type: body.type as 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL' | undefined,
      templateId: body.templateId,
      cashierId: userId,
    })

    res.status(201).json({
      success: true,
      data: receipt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Données invalides', 400, 'INVALID_DATA'))
    }
    if (error instanceof Error && error.message.includes('existe déjà')) {
      return next(new AppError(error.message, 409, 'RECEIPT_EXISTS'))
    }
    next(error)
  }
})

// POST /restaurant/receipts/:id/void - Annuler un reçu
router.post('/:id/void', requireRole('OWNER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId
    const userId = req.user?.userId

    if (!restaurantId || !userId) {
      return next(new AppError('Non autorisé', 401, 'UNAUTHORIZED'))
    }

    // Vérifier que le reçu appartient au restaurant
    const receipt = await prisma.receipt.findFirst({
      where: { id, restaurantId },
    })

    if (!receipt) {
      return next(new AppError('Reçu non trouvé', 404, 'RECEIPT_NOT_FOUND'))
    }

    const body = voidReceiptSchema.parse(req.body)

    const updatedReceipt = await receiptService.voidReceipt(id, userId, body.reason)

    res.json({
      success: true,
      data: updatedReceipt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('La raison est requise', 400, 'REASON_REQUIRED'))
    }
    if (error instanceof Error && error.message.includes('déjà annulé')) {
      return next(new AppError(error.message, 400, 'ALREADY_VOIDED'))
    }
    next(error)
  }
})

// POST /restaurant/receipts/:id/print - Marquer comme imprimé
router.post('/:id/print', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId
    const userId = req.user?.userId

    if (!restaurantId || !userId) {
      return next(new AppError('Non autorisé', 401, 'UNAUTHORIZED'))
    }

    // Vérifier que le reçu appartient au restaurant
    const receipt = await prisma.receipt.findFirst({
      where: { id, restaurantId },
    })

    if (!receipt) {
      return next(new AppError('Reçu non trouvé', 404, 'RECEIPT_NOT_FOUND'))
    }

    const updatedReceipt = await receiptService.markAsPrinted(id, userId)

    res.json({
      success: true,
      data: updatedReceipt,
    })
  } catch (error) {
    next(error)
  }
})

// GET /restaurant/orders/:orderId/receipt - Récupérer le reçu d'une commande
router.get('/orders/:orderId/receipt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const receipt = await prisma.receipt.findFirst({
      where: {
        orderId,
        restaurantId,
      },
      include: {
        template: true,
        order: {
          select: {
            orderNumber: true,
            serviceType: true,
            paymentMethod: true,
            total: true,
          },
        },
      },
    })

    if (!receipt) {
      return next(new AppError('Aucun reçu pour cette commande', 404, 'RECEIPT_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: receipt,
    })
  } catch (error) {
    next(error)
  }
})

// POST /restaurant/receipts/:id/email - Envoyer un reçu par email
router.post('/:id/email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const body = sendEmailSchema.parse(req.body)

    // Récupérer le reçu avec toutes les infos nécessaires
    const receipt = await prisma.receipt.findFirst({
      where: { id, restaurantId },
      include: {
        order: {
          include: {
            customer: true,
            restaurant: {
              include: {
                receiptSettings: true,
                theme: true,
              },
            },
          },
        },
      },
    })

    if (!receipt) {
      return next(new AppError('Reçu non trouvé', 404, 'RECEIPT_NOT_FOUND'))
    }

    // Préparer les données pour l'email
    const restaurant = receipt.order.restaurant
    const restaurantInfo = receipt.restaurantInfo as {
      name: string
      address?: string
      phone?: string
      email?: string
      logo?: string
    }
    const items = receipt.items as Array<{
      name: string
      quantity: number
      total: number
    }>
    const totals = receipt.totals as {
      subtotal: number
      subtotalHT: number
      taxes: Array<{ rate: number; amount: number }>
      discount: number
      deliveryFee: number
      total: number
    }
    const customerInfo = receipt.customerInfo as {
      name?: string
      email?: string
    } | null

    // Nom du client
    const customerName = customerInfo?.name || 
      (receipt.order.customer 
        ? `${receipt.order.customer.firstName} ${receipt.order.customer.lastName}`
        : receipt.order.guestName || 'Client')

    // Couleur primaire du restaurant
    const primaryColor = restaurant.theme?.primaryColor || '#10b981'

    // Formater la date
    const dateStr = receipt.createdAt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // Calculer la TVA totale
    const taxAmount = totals.taxes?.reduce((sum, t) => sum + t.amount, 0) || 0

    // Envoyer l'email
    const result = await sendReceiptEmail({
      to: body.email,
      customerName,
      restaurantName: restaurantInfo.name || restaurant.name,
      restaurantLogo: restaurant.receiptSettings?.logo || restaurant.logo || undefined,
      restaurantAddress: restaurantInfo.address || `${restaurant.address}, ${restaurant.postalCode} ${restaurant.city}`,
      restaurantPhone: restaurantInfo.phone || restaurant.phone || undefined,
      restaurantEmail: restaurantInfo.email || restaurant.email || undefined,
      primaryColor,
      receiptNumber: receipt.receiptNumber,
      orderNumber: receipt.order.orderNumber,
      date: dateStr,
      items,
      subtotal: totals.subtotal,
      taxAmount,
      discount: totals.discount,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      receiptType: receipt.type as 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL',
      thankYouMessage: restaurant.receiptSettings?.thankYouMessage || undefined,
    })

    if (!result.success) {
      return next(new AppError('Erreur lors de l\'envoi de l\'email', 500, 'EMAIL_SEND_FAILED'))
    }

    // Marquer le reçu comme envoyé par email
    await receiptService.markAsEmailed(id, body.email)

    res.json({
      success: true,
      message: `Reçu envoyé à ${body.email}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Email invalide', 400, 'INVALID_EMAIL'))
    }
    next(error)
  }
})

// POST /restaurant/receipts/:id/thermal - Générer commandes ESC/POS pour impression thermique
router.post('/:id/thermal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'RESTAURANT_NOT_FOUND'))
    }

    const body = thermalPrintSchema.parse(req.body)

    // Récupérer le reçu avec toutes les infos nécessaires
    const receipt = await prisma.receipt.findFirst({
      where: { id, restaurantId },
      include: {
        order: {
          include: {
            restaurant: true,
          },
        },
      },
    })

    if (!receipt) {
      return next(new AppError('Reçu non trouvé', 404, 'RECEIPT_NOT_FOUND'))
    }

    // Extraire les données du reçu
    const restaurantInfo = receipt.restaurantInfo as {
      name: string
      address?: string
      phone?: string
      siret?: string
      tvaNumber?: string
    }
    const items = receipt.items as Array<{
      name: string
      quantity: number
      unitPrice: number
      total: number
      options?: string[]
    }>
    const totals = receipt.totals as {
      subtotal: number
      taxes: Array<{ rate: number; amount: number }>
      discount: number
      deliveryFee: number
      total: number
    }
    const paymentInfo = receipt.paymentInfo as {
      method?: string
      amountPaid?: number
      change?: number
    } | null

    // Formater la date
    const dateStr = receipt.createdAt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // Nom du caissier
    const cashierName = receipt.printedBy 
      ? `${receipt.printedBy.firstName} ${receipt.printedBy.lastName}`
      : undefined

    // Générer les commandes ESC/POS
    const width = body.width || '80mm'
    const commands = escposService.buildReceiptCommands({
      restaurantName: restaurantInfo.name,
      restaurantAddress: restaurantInfo.address,
      restaurantPhone: restaurantInfo.phone,
      restaurantSiret: restaurantInfo.siret,
      restaurantTva: restaurantInfo.tvaNumber,
      receiptNumber: receipt.receiptNumber,
      orderNumber: receipt.order.orderNumber,
      date: dateStr,
      cashierName,
      items,
      subtotal: totals.subtotal,
      taxes: totals.taxes || [],
      discount: totals.discount,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      paymentMethod: paymentInfo?.method,
      amountPaid: paymentInfo?.amountPaid,
      change: paymentInfo?.change,
      thankYouMessage: receipt.order.restaurant.receiptSettings?.thankYouMessage || undefined,
      footerText: receipt.order.restaurant.receiptSettings?.footerText || undefined,
    }, width)

    // Si une imprimante réseau est spécifiée, imprimer directement
    if (body.printerHost) {
      try {
        await escposService.print({
          commands,
          printerConfig: {
            type: 'network',
            host: body.printerHost,
            port: body.printerPort || 9100,
            width,
          },
        })

        // Marquer comme imprimé
        await receiptService.markAsPrinted(id, req.user?.userId || '')

        res.json({
          success: true,
          message: 'Impression envoyée',
          printed: true,
        })
      } catch (printError) {
        return next(new AppError(
          `Erreur d'impression: ${printError instanceof Error ? printError.message : 'Erreur inconnue'}`,
          500,
          'PRINT_ERROR'
        ))
      }
    } else {
      // Sinon, retourner les commandes en base64 pour impression côté client
      const commandsBase64 = escposService.getCommandsAsBase64(commands)

      res.json({
        success: true,
        data: {
          commands: commandsBase64,
          width,
        },
        printed: false,
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Paramètres invalides', 400, 'INVALID_PARAMS'))
    }
    next(error)
  }
})

// GET /restaurant/receipts/:id/thermal/preview - Prévisualiser le ticket en texte
router.get('/:id/thermal/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.restaurantStaff?.restaurantId
    const width = (req.query.width as '58mm' | '80mm') || '80mm'

    if (!restaurantId) {
      return next(new AppError('Restaurant non trouvé', 404, 'RESTAURANT_NOT_FOUND'))
    }

    // Récupérer le reçu
    const receipt = await prisma.receipt.findFirst({
      where: { id, restaurantId },
      include: {
        order: {
          include: {
            restaurant: {
              include: {
                receiptSettings: true,
              },
            },
          },
        },
      },
    })

    if (!receipt) {
      return next(new AppError('Reçu non trouvé', 404, 'RECEIPT_NOT_FOUND'))
    }

    // Extraire les données
    const restaurantInfo = receipt.restaurantInfo as {
      name: string
      address?: string
      phone?: string
      siret?: string
      tvaNumber?: string
    }
    const items = receipt.items as Array<{
      name: string
      quantity: number
      unitPrice: number
      total: number
    }>
    const totals = receipt.totals as {
      subtotal: number
      taxes: Array<{ rate: number; amount: number }>
      discount: number
      deliveryFee: number
      total: number
    }

    const lineWidth = width === '58mm' ? 32 : 48
    const lines: string[] = []

    // Header
    lines.push(restaurantInfo.name.substring(0, lineWidth).padStart((lineWidth + restaurantInfo.name.length) / 2))
    if (restaurantInfo.address) {
      lines.push(restaurantInfo.address.substring(0, lineWidth))
    }
    if (restaurantInfo.phone) {
      lines.push(`Tél: ${restaurantInfo.phone}`)
    }
    lines.push('='.repeat(lineWidth))

    // Receipt info
    lines.push(`Ticket N°: ${receipt.receiptNumber}`)
    lines.push(`Commande: ${receipt.order.orderNumber}`)
    lines.push(`Date: ${receipt.createdAt.toLocaleDateString('fr-FR')}`)
    lines.push('-'.repeat(lineWidth))

    // Items
    for (const item of items) {
      const itemText = `${item.quantity}x ${item.name}`
      const priceText = `${item.total.toFixed(2)}€`
      const spaces = lineWidth - itemText.length - priceText.length
      lines.push(itemText + ' '.repeat(Math.max(1, spaces)) + priceText)
    }

    lines.push('-'.repeat(lineWidth))

    // Totals
    const totalText = `TOTAL: ${totals.total.toFixed(2)}€`
    lines.push(totalText.padStart((lineWidth + totalText.length) / 2))

    lines.push('='.repeat(lineWidth))

    if (receipt.order.restaurant.receiptSettings?.thankYouMessage) {
      lines.push('')
      lines.push(receipt.order.restaurant.receiptSettings.thankYouMessage.substring(0, lineWidth))
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.send(lines.join('\n'))
  } catch (error) {
    next(error)
  }
})

export const receiptsRoutes = router
