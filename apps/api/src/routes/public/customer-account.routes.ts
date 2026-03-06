import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { requireCustomerAuth } from '../../middlewares/customer-auth.middleware'
import { monerooService } from '../../services/moneroo.service'

const router = Router({ mergeParams: true })

// Schemas de validation
const addAddressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(1, 'Adresse requise'),
  streetLine2: z.string().optional(),
  city: z.string().min(1, 'Ville requise'),
  postalCode: z.string().min(1, 'Code postal requis'),
  country: z.string().default('FR'),
  instructions: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

const updateAddressSchema = addAddressSchema.partial()

// GET /store/:subdomain/account/addresses - Liste des adresses
router.get('/addresses', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!

    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: customer.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    res.json({
      success: true,
      data: addresses,
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/account/addresses - Ajouter une adresse
router.post('/addresses', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!

    const validation = addAddressSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    // Si c'est la première adresse ou isDefault=true, mettre les autres à false
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      })
    }

    // Vérifier si c'est la première adresse
    const addressCount = await prisma.customerAddress.count({
      where: { customerId: customer.id },
    })

    const address = await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        label: data.label,
        street: data.street,
        streetLine2: data.streetLine2,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        instructions: data.instructions,
        latitude: data.latitude,
        longitude: data.longitude,
        isDefault: addressCount === 0 ? true : data.isDefault,
      },
    })

    // Mettre à jour defaultAddressId si c'est la première ou default
    if (address.isDefault) {
      await prisma.restaurantCustomer.update({
        where: { id: customer.id },
        data: { defaultAddressId: address.id },
      })
    }

    res.status(201).json({
      success: true,
      data: address,
    })
  } catch (error) {
    next(error)
  }
})

// PUT /store/:subdomain/account/addresses/:addressId - Modifier une adresse
router.put('/addresses/:addressId', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!
    const { addressId } = req.params

    const validation = updateAddressSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError(validation.error.errors[0].message, 400, 'VALIDATION_ERROR'))
    }

    const data = validation.data

    // Vérifier que l'adresse appartient au client
    const existingAddress = await prisma.customerAddress.findFirst({
      where: {
        id: addressId,
        customerId: customer.id,
      },
    })

    if (!existingAddress) {
      return next(new AppError('Adresse non trouvée', 404, 'ADDRESS_NOT_FOUND'))
    }

    // Si on définit comme default, mettre les autres à false
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: customer.id, id: { not: addressId } },
        data: { isDefault: false },
      })
    }

    const address = await prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.street && { street: data.street }),
        ...(data.streetLine2 !== undefined && { streetLine2: data.streetLine2 }),
        ...(data.city && { city: data.city }),
        ...(data.postalCode && { postalCode: data.postalCode }),
        ...(data.country && { country: data.country }),
        ...(data.instructions !== undefined && { instructions: data.instructions }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    })

    // Mettre à jour defaultAddressId si nécessaire
    if (address.isDefault) {
      await prisma.restaurantCustomer.update({
        where: { id: customer.id },
        data: { defaultAddressId: address.id },
      })
    }

    res.json({
      success: true,
      data: address,
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /store/:subdomain/account/addresses/:addressId - Supprimer une adresse
router.delete('/addresses/:addressId', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!
    const { addressId } = req.params

    // Vérifier que l'adresse appartient au client
    const existingAddress = await prisma.customerAddress.findFirst({
      where: {
        id: addressId,
        customerId: customer.id,
      },
    })

    if (!existingAddress) {
      return next(new AppError('Adresse non trouvée', 404, 'ADDRESS_NOT_FOUND'))
    }

    await prisma.customerAddress.delete({
      where: { id: addressId },
    })

    // Si c'était l'adresse par défaut, mettre à jour
    if (existingAddress.isDefault) {
      const newDefault = await prisma.customerAddress.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
      })

      await prisma.restaurantCustomer.update({
        where: { id: customer.id },
        data: { defaultAddressId: newDefault?.id || null },
      })

      if (newDefault) {
        await prisma.customerAddress.update({
          where: { id: newDefault.id },
          data: { isDefault: true },
        })
      }
    }

    res.json({
      success: true,
      message: 'Adresse supprimée',
    })
  } catch (error) {
    next(error)
  }
})

// GET /store/:subdomain/account/orders - Historique des commandes
router.get('/orders', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!
    const { page = '1', limit = '10' } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10))
    const skip = (pageNum - 1) * limitNum

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          orderNumber: true,
          displayNumber: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          serviceType: true,
          subtotal: true,
          taxAmount: true,
          deliveryFee: true,
          tip: true,
          discount: true,
          total: true,
          createdAt: true,
          updatedAt: true,
          customerNotes: true,
          deliveryAddress: true,
          estimatedPrepTime: true,
          scheduledFor: true,
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
              specialInstructions: true,
            },
          },
        },
      }),
      prisma.order.count({
        where: { customerId: customer.id },
      }),
    ])

    // Récupérer les reviews pour ces commandes
    const orderIds = orders.map(o => o.id)
    const reviews = await prisma.review.findMany({
      where: {
        orderId: { in: orderIds },
        customerId: customer.id,
      },
      select: {
        orderId: true,
        rating: true,
        foodRating: true,
        serviceRating: true,
        deliveryRating: true,
        comment: true,
        createdAt: true,
      },
    })
    const reviewMap = new Map(reviews.map(r => [r.orderId, r]))

    res.json({
      success: true,
      data: orders.map(order => ({
        ...order,
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : 0,
        tip: order.tip ? Number(order.tip) : 0,
        discount: order.discount ? Number(order.discount) : 0,
        total: Number(order.total),
        items: order.items.map((item: { unitPrice: unknown; totalPrice: unknown; [key: string]: unknown }) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        review: reviewMap.get(order.id) || null,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /store/:subdomain/account/orders/:orderId - Détail d'une commande
router.get('/orders/:orderId', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!
    const { orderId } = req.params

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
      },
      include: {
        items: true,
        restaurant: {
          select: {
            name: true,
            phone: true,
            address: true,
            city: true,
          },
        },
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvée', 404, 'ORDER_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        ...order,
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : 0,
        tip: order.tip ? Number(order.tip) : 0,
        discount: order.discount ? Number(order.discount) : 0,
        total: Number(order.total),
        items: order.items.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/account/orders/:orderId/picked-up - Marquer comme récupérée par le client
router.post('/orders/:orderId/picked-up', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subdomain, orderId } = req.params

    const site = await prisma.site.findFirst({
      where: {
        OR: [{ subdomain }],
        status: 'ACTIVE',
      },
      select: { restaurantId: true },
    })

    if (!site || !site.restaurantId) {
      return next(new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND'))
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: site.restaurantId,
      },
      select: {
        id: true,
        status: true,
        serviceType: true,
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvée', 404, 'ORDER_NOT_FOUND'))
    }

    if (order.serviceType !== 'PICKUP') {
      return next(new AppError('Cette action est réservée aux commandes à emporter', 400, 'INVALID_SERVICE_TYPE'))
    }

    if (order.status !== 'READY') {
      return next(new AppError('La commande doit être prête pour être marquée comme récupérée', 400, 'INVALID_STATUS'))
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'PICKED_UP',
      },
    })

    res.json({
      success: true,
      message: 'Commande marquée comme récupérée',
    })
  } catch (error) {
    next(error)
  }
})

// GET /store/:subdomain/account/orders/:orderId/track - Suivi de commande (public avec orderId)
router.get('/orders/:orderId/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subdomain, orderId } = req.params

    // Résoudre le site
    const site = await prisma.site.findFirst({
      where: {
        OR: [{ subdomain }],
        status: 'ACTIVE',
      },
      select: { restaurantId: true },
    })

    if (!site || !site.restaurantId) {
      return next(new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND'))
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: site.restaurantId,
      },
      select: {
        id: true,
        orderNumber: true,
        displayNumber: true,
        status: true,
        paymentStatus: true,
        serviceType: true,
        total: true,
        estimatedPrepTime: true,
        scheduledFor: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            name: true,
            phone: true,
            address: true,
            city: true,
          },
        },
        items: {
          select: {
            productName: true,
            variantName: true,
            quantity: true,
            totalPrice: true,
          },
        },
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvée', 404, 'ORDER_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: {
        ...order,
        total: Number(order.total),
        items: order.items.map((item: { totalPrice: number | { toNumber(): number }; [key: string]: unknown }) => ({
          ...item,
          totalPrice: Number(item.totalPrice),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/account/orders/:orderId/review - Soumettre un avis sur une commande
router.post('/orders/:orderId/review', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!
    const { subdomain, orderId } = req.params
    const { rating, foodRating, serviceRating, deliveryRating, comment } = req.body

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return next(new AppError('Note globale requise (1-5)', 400, 'INVALID_RATING'))
    }

    // Résoudre le site
    const site = await prisma.site.findFirst({
      where: {
        OR: [{ subdomain }],
        status: 'ACTIVE',
      },
      select: { restaurantId: true },
    })

    if (!site || !site.restaurantId) {
      return next(new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND'))
    }

    // Récupérer la commande
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
        restaurantId: site.restaurantId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        serviceType: true,
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvée', 404, 'ORDER_NOT_FOUND'))
    }

    // Vérifier que la commande est terminée
    const completedStatuses = ['COMPLETED', 'DELIVERED', 'PICKED_UP']
    if (!completedStatuses.includes(order.status)) {
      return next(new AppError('Vous ne pouvez noter que les commandes terminées', 400, 'ORDER_NOT_COMPLETED'))
    }

    // Vérifier si un avis existe déjà
    const existingReview = await prisma.review.findFirst({
      where: {
        orderId: order.id,
        customerId: customer.id,
      },
    })

    if (existingReview) {
      return next(new AppError('Vous avez déjà noté cette commande', 400, 'REVIEW_EXISTS'))
    }

    // Créer l'avis
    const review = await prisma.review.create({
      data: {
        restaurantId: site.restaurantId,
        customerId: customer.id,
        orderId: order.id,
        rating: Math.min(5, Math.max(1, rating)),
        foodRating: foodRating ? Math.min(5, Math.max(1, foodRating)) : null,
        serviceRating: serviceRating ? Math.min(5, Math.max(1, serviceRating)) : null,
        deliveryRating: order.serviceType === 'DELIVERY' && deliveryRating 
          ? Math.min(5, Math.max(1, deliveryRating)) 
          : null,
        comment: comment || null,
        isVerified: true,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Merci pour votre avis !',
      data: {
        reviewId: review.id,
        rating: review.rating,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /store/:subdomain/account/orders/:orderId/review - Vérifier si un avis existe
router.get('/orders/:orderId/review', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!
    const { orderId } = req.params

    const review = await prisma.review.findFirst({
      where: {
        orderId,
        customerId: customer.id,
      },
      select: {
        id: true,
        rating: true,
        foodRating: true,
        serviceRating: true,
        deliveryRating: true,
        comment: true,
        createdAt: true,
      },
    })

    res.json({
      success: true,
      data: review,
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/account/orders/:orderId/switch-to-cash - Changer le paiement en espèces
router.post('/orders/:orderId/switch-to-cash', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!
    const { subdomain, orderId } = req.params

    // Résoudre le site
    const site = await prisma.site.findFirst({
      where: {
        OR: [{ subdomain }],
        status: 'ACTIVE',
      },
      select: { restaurantId: true },
    })

    if (!site || !site.restaurantId) {
      return next(new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND'))
    }

    // Récupérer la commande
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
        restaurantId: site.restaurantId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvée', 404, 'ORDER_NOT_FOUND'))
    }

    // Vérifier que la commande est en attente de paiement Mobile Money
    if (order.paymentStatus !== 'PENDING') {
      return next(new AppError('Cette commande a déjà été payée ou annulée', 400, 'INVALID_PAYMENT_STATUS'))
    }

    if (order.paymentMethod !== 'MOBILE_MONEY' && order.paymentMethod !== 'CARD_ONLINE') {
      return next(new AppError('Cette commande n\'est pas en paiement en ligne', 400, 'INVALID_PAYMENT_METHOD'))
    }

    // Mettre à jour la commande pour paiement en espèces
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: 'CASH',
        paymentIntentId: null,
      },
    })

    res.json({
      success: true,
      message: 'Méthode de paiement changée en espèces',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: 'CASH',
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/account/orders/:orderId/pay - Récupérer/régénérer l'URL de paiement
router.post('/orders/:orderId/pay', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!
    const { subdomain, orderId } = req.params

    // Résoudre le site
    const site = await prisma.site.findFirst({
      where: {
        OR: [{ subdomain }],
        status: 'ACTIVE',
      },
      select: { restaurantId: true },
    })

    if (!site || !site.restaurantId) {
      return next(new AppError('Site non trouvé', 404, 'SITE_NOT_FOUND'))
    }

    // Récupérer la commande
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
        restaurantId: site.restaurantId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentIntentId: true,
        total: true,
        guestName: true,
        guestPhone: true,
        guestEmail: true,
      },
    })

    if (!order) {
      return next(new AppError('Commande non trouvée', 404, 'ORDER_NOT_FOUND'))
    }

    // Vérifier que la commande est en attente de paiement
    if (order.paymentStatus !== 'PENDING') {
      return next(new AppError('Cette commande a déjà été payée ou annulée', 400, 'INVALID_PAYMENT_STATUS'))
    }

    // Vérifier que c'est un paiement Mobile Money ou en ligne
    if (order.paymentMethod !== 'MOBILE_MONEY' && order.paymentMethod !== 'CARD_ONLINE') {
      return next(new AppError('Cette commande ne nécessite pas de paiement en ligne', 400, 'INVALID_PAYMENT_METHOD'))
    }

    // Récupérer les settings du restaurant pour Moneroo
    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: site.restaurantId },
    })

    if (!settings?.monerooConfigured || !settings?.monerooSecretKey) {
      return next(new AppError('Paiement en ligne non configuré', 400, 'PAYMENT_NOT_CONFIGURED'))
    }

    // Si on a un paymentIntentId, vérifier son statut
    if (order.paymentIntentId) {
      try {
        const verifyResponse = await monerooService.verifyPayment(
          {
            publicKey: settings.monerooPublicKey || '',
            secretKey: settings.monerooSecretKey,
          },
          order.paymentIntentId
        )

        // Si le paiement est toujours pending, retourner l'URL existante
        if (verifyResponse.data.status === 'pending') {
          return res.json({
            success: true,
            data: {
              paymentUrl: verifyResponse.data.checkout_url,
              orderId: order.id,
              orderNumber: order.orderNumber,
            },
          })
        }

        // Si le paiement a réussi, mettre à jour la commande
        if (verifyResponse.data.status === 'success') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
            },
          })
          return res.json({
            success: true,
            data: {
              alreadyPaid: true,
              orderId: order.id,
              orderNumber: order.orderNumber,
            },
          })
        }
      } catch {
        // Si erreur lors de la vérification, on régénère un nouveau paiement
      }
    }

    // Générer une nouvelle URL de paiement
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    
    const nameParts = (order.guestName || customer.firstName + ' ' + customer.lastName).split(' ')
    const firstName = nameParts[0] || 'Client'
    const lastName = nameParts.slice(1).join(' ') || 'Storefront'

    const paymentResponse = await monerooService.initializePayment(
      {
        publicKey: settings.monerooPublicKey || '',
        secretKey: settings.monerooSecretKey,
      },
      {
        amount: Math.round(Number(order.total)),
        currency: settings.currency || 'XOF',
        description: `Commande #${order.orderNumber}`,
        return_url: `${frontendUrl}/store/${subdomain}/thanks?orderId=${order.id}`,
        customer: {
          email: order.guestEmail || customer.email || `${order.guestPhone}@guest.iziresto.com`,
          first_name: firstName,
          last_name: lastName,
          phone: order.guestPhone || customer.phone || undefined,
        },
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          restaurantId: site.restaurantId,
          subdomain: subdomain,
        },
      }
    )

    // Mettre à jour la commande avec le nouveau paymentIntentId
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentIntentId: paymentResponse.data.id,
      },
    })

    res.json({
      success: true,
      data: {
        paymentUrl: paymentResponse.data.checkout_url,
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// LOYALTY (FIDÉLITÉ CLIENT)
// ============================================

// GET /store/:subdomain/account/loyalty - Infos fidélité du client
router.get('/loyalty', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!

    // Récupérer les dernières transactions
    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Calculer les stats
    const totalEarned = transactions
      .filter(t => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0)
    
    const totalRedeemed = transactions
      .filter(t => t.points < 0)
      .reduce((sum, t) => sum + Math.abs(t.points), 0)

    res.json({
      success: true,
      data: {
        currentPoints: customer.loyaltyPoints,
        totalEarned,
        totalRedeemed,
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          points: t.points,
          balanceAfter: t.balanceAfter,
          description: t.description,
          orderId: t.orderId,
          createdAt: t.createdAt,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /store/:subdomain/account/loyalty/history - Historique complet des points
router.get('/loyalty/history', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!
    const { page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.loyaltyTransaction.count({ where: { customerId: customer.id } }),
    ])

    res.json({
      success: true,
      data: transactions.map(t => ({
        id: t.id,
        type: t.type,
        points: t.points,
        balanceAfter: t.balanceAfter,
        description: t.description,
        orderId: t.orderId,
        createdAt: t.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /store/:subdomain/account/loyalty/calculate - Calculer la réduction potentielle
router.post('/loyalty/calculate', requireCustomerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = req.customer!
    const { pointsToUse, subtotal } = req.body

    if (!pointsToUse || pointsToUse <= 0) {
      return res.json({
        success: true,
        data: {
          pointsToUse: 0,
          discount: 0,
          newTotal: subtotal || 0,
        },
      })
    }

    // Récupérer les settings du restaurant
    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: customer.restaurantId },
    })

    const pointsToMoneyRate = (settings as { loyaltyPointsToMoneyRate?: number })?.loyaltyPointsToMoneyRate || 100
    const availablePoints = customer.loyaltyPoints

    // Limiter aux points disponibles
    const maxPointsToUse = Math.min(pointsToUse, availablePoints)

    // Calculer la réduction (ne peut pas dépasser le subtotal)
    const maxDiscount = maxPointsToUse / pointsToMoneyRate
    const discount = Math.min(maxDiscount, subtotal || 0)

    // Recalculer les points réellement utilisés
    const actualPointsUsed = Math.round(discount * pointsToMoneyRate)

    res.json({
      success: true,
      data: {
        availablePoints,
        pointsToUse: actualPointsUsed,
        discount,
        newTotal: Math.max(0, (subtotal || 0) - discount),
        pointsToMoneyRate,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
