import { prisma, Prisma } from '@iziresto/database'
import { templateService, ReceiptData } from './template.service'
import crypto from 'crypto'

// Enum local pour ReceiptType (correspond au schema Prisma)
enum ReceiptType {
  TICKET = 'TICKET',
  INVOICE_SIMPLE = 'INVOICE_SIMPLE',
  INVOICE_FULL = 'INVOICE_FULL',
}

// Types pour les items de commande
interface OrderItemWithDetails {
  quantity: number
  unitPrice: Prisma.Decimal
  total: Prisma.Decimal
  notes: string | null
  productName: string | null
  product: {
    name: string
  } | null
  modifiers: Array<{
    price: Prisma.Decimal
    modifierName: string | null
    modifier: {
      name: string
    } | null
  }>
}

interface CreateReceiptInput {
  orderId: string
  restaurantId: string
  type?: ReceiptType
  templateId?: string
  cashierId?: string
}

interface ReceiptTotals {
  subtotal: number
  subtotalHT: number
  taxes: Array<{ rate: number; amount: number }>
  discount: number
  deliveryFee: number
  tip: number
  total: number
}

class ReceiptService {
  /**
   * Génère le prochain numéro de reçu séquentiel
   */
  async getNextReceiptNumber(restaurantId: string): Promise<{
    receiptNumber: string
    fiscalYear: number
    sequenceNumber: number
  }> {
    const now = new Date()
    const fiscalYear = now.getFullYear()
    const dateStr = `${fiscalYear}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

    // Récupérer ou créer les settings
    let settings = await prisma.receiptSettings.findUnique({
      where: { restaurantId },
    })

    if (!settings) {
      settings = await prisma.receiptSettings.create({
        data: {
          restaurantId,
          receiptPrefix: 'TK',
          nextSequenceNumber: 1,
        },
      })
    }

    // Récupérer le dernier numéro de séquence pour cette année fiscale
    const lastReceipt = await prisma.receipt.findFirst({
      where: {
        restaurantId,
        fiscalYear,
      },
      orderBy: { sequenceNumber: 'desc' },
    })

    const sequenceNumber = lastReceipt ? lastReceipt.sequenceNumber + 1 : 1
    const receiptNumber = `${settings.receiptPrefix}-${dateStr}-${String(sequenceNumber).padStart(4, '0')}`

    return { receiptNumber, fiscalYear, sequenceNumber }
  }

  /**
   * Génère la signature SHA-256 pour la conformité fiscale
   */
  generateSignature(data: {
    receiptNumber: string
    total: number
    createdAt: Date
    previousHash?: string
  }): string {
    const content = `${data.receiptNumber}|${data.total}|${data.createdAt.toISOString()}|${data.previousHash || ''}`
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  /**
   * Récupère le hash du dernier reçu pour le chaînage
   */
  async getLastReceiptHash(restaurantId: string): Promise<string | null> {
    const lastReceipt = await prisma.receipt.findFirst({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      select: { signature: true },
    })
    return lastReceipt?.signature || null
  }

  /**
   * Prépare les données du reçu à partir d'une commande
   */
  async prepareReceiptData(
    orderId: string,
    restaurantId: string,
    cashierId?: string
  ): Promise<{
    restaurantInfo: Prisma.JsonValue
    customerInfo: Prisma.JsonValue | null
    items: Prisma.JsonValue
    totals: Prisma.JsonValue
  }> {
    // Récupérer la commande avec tous les détails
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
        customer: true,
        restaurant: {
          include: {
            settings: true,
          },
        },
      },
    })

    if (!order) {
      throw new Error('Commande non trouvée')
    }

    // Infos restaurant
    const restaurantInfo = {
      name: order.restaurant.name,
      address: order.restaurant.address,
      addressLine2: order.restaurant.addressLine2,
      city: order.restaurant.city,
      postalCode: order.restaurant.postalCode,
      phone: order.restaurant.phone,
      email: order.restaurant.email,
      siret: order.restaurant.siret,
      vatNumber: order.restaurant.vatNumber,
      logo: order.restaurant.logo,
    }

    // Infos client (si disponible)
    let customerInfo = null
    if (order.customer) {
      customerInfo = {
        name: `${order.customer.firstName} ${order.customer.lastName}`,
        email: order.customer.email,
        phone: order.customer.phone,
      }
    } else if (order.guestName || order.guestEmail) {
      customerInfo = {
        name: order.guestName,
        email: order.guestEmail,
        phone: order.guestPhone,
      }
    }

    // Items de la commande
    const items = order.items.map((item) => ({
      name: item.product?.name || item.productName || 'Produit',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      unitPriceHT: Number(item.unitPrice) / 1.1, // Approximation, à ajuster selon le taux de TVA
      total: Number(item.total),
      totalHT: Number(item.total) / 1.1,
      notes: item.notes,
      modifiers: item.modifiers.map((mod) => ({
        name: mod.modifier?.name || mod.modifierName || 'Option',
        price: Number(mod.price),
      })),
    }))

    // Calcul des totaux
    const subtotal = Number(order.subtotal)
    const taxAmount = Number(order.taxAmount)
    const subtotalHT = subtotal - taxAmount
    
    const totals: ReceiptTotals = {
      subtotal,
      subtotalHT,
      taxes: [
        { rate: 10, amount: taxAmount }, // À ajuster selon les taux réels
      ],
      discount: Number(order.discount),
      deliveryFee: Number(order.deliveryFee),
      tip: Number(order.tip),
      total: Number(order.total),
    }

    return {
      restaurantInfo,
      customerInfo,
      items,
      totals,
    }
  }

  /**
   * Crée un nouveau reçu pour une commande
   */
  async createReceipt(input: CreateReceiptInput) {
    const { orderId, restaurantId, type = ReceiptType.TICKET, templateId, cashierId } = input

    // Vérifier si un reçu existe déjà pour cette commande
    const existingReceipt = await prisma.receipt.findUnique({
      where: { orderId },
    })

    if (existingReceipt) {
      throw new Error('Un reçu existe déjà pour cette commande')
    }

    // Récupérer le template
    let template
    if (templateId) {
      template = await prisma.receiptTemplate.findUnique({
        where: { id: templateId },
      })
    } else {
      // Récupérer le template par défaut pour ce type
      template = await prisma.receiptTemplate.findFirst({
        where: {
          OR: [
            { restaurantId, type, isDefault: true },
            { restaurantId: null, type, isSystem: true, isDefault: true },
          ],
        },
        orderBy: { restaurantId: 'desc' }, // Priorité au template du restaurant
      })
    }

    if (!template) {
      // Fallback sur n'importe quel template système du bon type
      template = await prisma.receiptTemplate.findFirst({
        where: {
          type,
          isSystem: true,
        },
      })
    }

    if (!template) {
      throw new Error('Aucun template disponible pour ce type de reçu')
    }

    // Préparer les données
    const { restaurantInfo, customerInfo, items, totals } = await this.prepareReceiptData(
      orderId,
      restaurantId,
      cashierId
    )

    // Générer le numéro de reçu
    const { receiptNumber, fiscalYear, sequenceNumber } = await this.getNextReceiptNumber(restaurantId)

    // Récupérer le hash précédent pour le chaînage
    const previousHash = await this.getLastReceiptHash(restaurantId)

    // Générer la signature
    const signature = this.generateSignature({
      receiptNumber,
      total: (totals as ReceiptTotals).total,
      createdAt: new Date(),
      previousHash: previousHash || undefined,
    })

    // Créer le reçu
    const receipt = await prisma.receipt.create({
      data: {
        restaurantId,
        orderId,
        templateId: template.id,
        receiptNumber,
        fiscalYear,
        sequenceNumber,
        type,
        restaurantInfo,
        customerInfo,
        items,
        totals,
        signature,
        previousHash,
      },
      include: {
        template: true,
        order: true,
      },
    })

    return receipt
  }

  /**
   * Rend le HTML d'un reçu
   */
  async renderReceiptHtml(receiptId: string): Promise<string> {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        template: true,
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
      throw new Error('Reçu non trouvé')
    }

    // Préparer les données pour le template
    const data: ReceiptData = {
      restaurant: receipt.restaurantInfo as ReceiptData['restaurant'],
      receipt: {
        receiptNumber: receipt.receiptNumber,
        createdAt: receipt.createdAt,
        type: receipt.type,
        signature: receipt.signature || undefined,
      },
      order: {
        orderNumber: receipt.order.orderNumber,
        serviceType: receipt.order.serviceType,
        paymentMethod: receipt.order.paymentMethod || 'CASH',
        customerNotes: receipt.order.customerNotes || undefined,
      },
      items: receipt.items as ReceiptData['items'],
      totals: receipt.totals as ReceiptData['totals'],
      customer: receipt.customerInfo as ReceiptData['customer'],
      settings: {
        logo: receipt.order.restaurant.receiptSettings?.logo || receipt.order.restaurant.logo || undefined,
        thankYouMessage: receipt.order.restaurant.receiptSettings?.thankYouMessage || undefined,
        footerText: receipt.order.restaurant.receiptSettings?.footerText || undefined,
        showQrCode: receipt.order.restaurant.receiptSettings?.showQrCode ?? true,
      },
    }

    // Rendre le template
    return templateService.renderWithStyles(
      receipt.template.htmlTemplate,
      receipt.template.cssStyles,
      data
    )
  }

  /**
   * Liste les reçus d'un restaurant
   */
  async listReceipts(
    restaurantId: string,
    options: {
      page?: number
      limit?: number
      type?: ReceiptType
      startDate?: Date
      endDate?: Date
      search?: string
    } = {}
  ) {
    const { page = 1, limit = 20, type, startDate, endDate, search } = options

    const where: Prisma.ReceiptWhereInput = {
      restaurantId,
      ...(type && { type }),
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
      ...(search && {
        OR: [
          { receiptNumber: { contains: search, mode: 'insensitive' } },
          { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              serviceType: true,
              paymentMethod: true,
              total: true,
            },
          },
          template: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.receipt.count({ where }),
    ])

    return {
      items: receipts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Annule un reçu (ne peut pas être supprimé pour conformité fiscale)
   */
  async voidReceipt(receiptId: string, userId: string, reason: string) {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
    })

    if (!receipt) {
      throw new Error('Reçu non trouvé')
    }

    if (receipt.isVoided) {
      throw new Error('Ce reçu est déjà annulé')
    }

    return prisma.receipt.update({
      where: { id: receiptId },
      data: {
        isVoided: true,
        voidedAt: new Date(),
        voidedBy: userId,
        voidReason: reason,
      },
    })
  }

  /**
   * Marque un reçu comme imprimé
   */
  async markAsPrinted(receiptId: string, userId: string) {
    return prisma.receipt.update({
      where: { id: receiptId },
      data: {
        printedAt: new Date(),
        printedBy: userId,
      },
    })
  }

  /**
   * Marque un reçu comme envoyé par email
   */
  async markAsEmailed(receiptId: string, email: string) {
    return prisma.receipt.update({
      where: { id: receiptId },
      data: {
        emailSentAt: new Date(),
        emailSentTo: email,
      },
    })
  }
}

export const receiptService = new ReceiptService()
