import { Router, Request, Response } from 'express'
import { prisma } from '@iziresto/database'
import { monerooService, MonerooWebhookPayload } from '../../services/moneroo.service'
import { receiptService } from '../../services/receipt.service'
import { sendReceiptEmail, sendLoyaltyPointsEarnedEmail } from '../../services/email.service'

enum ReceiptType {
  TICKET = 'TICKET',
  INVOICE_SIMPLE = 'INVOICE_SIMPLE',
  INVOICE_FULL = 'INVOICE_FULL',
}

const router = Router()

router.post('/stripe', (req, res) => {
  res.json({ received: true })
})

router.post('/paytech', (req, res) => {
  res.json({ received: true })
})

// Webhook Moneroo pour les paiements storefront
router.post('/moneroo/storefront', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-moneroo-signature'] as string
    const payload = JSON.stringify(req.body)
    const webhookPayload = req.body as MonerooWebhookPayload

    console.log('Webhook Moneroo reçu:', webhookPayload.event, webhookPayload.data?.id)

    const { event, data } = webhookPayload

    if (!data?.metadata?.orderId) {
      console.log('Webhook Moneroo: pas d\'orderId dans metadata')
      return res.json({ received: true })
    }

    const orderId = data.metadata.orderId

    // Récupérer la commande
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          include: {
            settings: true,
          },
        },
      },
    })

    if (!order) {
      console.log('Webhook Moneroo: commande introuvable', orderId)
      return res.status(404).json({ error: 'Order not found' })
    }

    // Vérifier la signature si le webhook secret est configuré
    if (order.restaurant.settings?.monerooWebhookSecret && signature) {
      const isValid = monerooService.verifyWebhookSignature(
        payload,
        signature,
        order.restaurant.settings.monerooWebhookSecret
      )
      if (!isValid) {
        console.log('Webhook Moneroo: signature invalide')
        return res.status(401).json({ error: 'Invalid signature' })
      }
    }

    // Mettre à jour le statut de paiement selon l'événement
    let paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' = 'PENDING'
    let orderStatus = order.status

    switch (event) {
      case 'payment.success':
        paymentStatus = 'PAID'
        // Confirmer automatiquement la commande si le paiement est réussi
        if (orderStatus === 'PENDING') {
          orderStatus = 'CONFIRMED'
        }
        break
      case 'payment.failed':
        paymentStatus = 'FAILED'
        break
      case 'payment.cancelled':
        paymentStatus = 'FAILED'
        orderStatus = 'CANCELLED'
        break
      default:
        // payment.initiated - ne rien faire
        break
    }

    // Mettre à jour la commande
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        status: orderStatus,
        paidAt: paymentStatus === 'PAID' ? new Date() : undefined,
      },
    })

    console.log(`Webhook Moneroo: commande ${orderId} mise à jour - paymentStatus: ${paymentStatus}, status: ${orderStatus}`)

    // Si paiement réussi, créer le reçu et envoyer l'email au client
    if (event === 'payment.success') {
      try {
        // Récupérer les détails complets de la commande pour le reçu
        const orderWithDetails = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            customer: true,
            restaurant: {
              include: {
                settings: true,
              },
            },
          },
        })

        if (orderWithDetails) {
          // Créer le reçu
          const total = Number(orderWithDetails.total)
          const receiptTypeValue = total >= 150 ? ReceiptType.INVOICE_SIMPLE : ReceiptType.TICKET
          
          const receipt = await receiptService.createReceipt({
            orderId: orderWithDetails.id,
            restaurantId: orderWithDetails.restaurantId,
            type: receiptTypeValue,
          })

          console.log(`Webhook Moneroo: reçu ${receipt.receiptNumber} créé pour commande ${orderId}`)

          // Envoyer l'email du reçu au client si email disponible
          const customerEmail = orderWithDetails.customer?.email || orderWithDetails.guestEmail
          const customerName = orderWithDetails.customer 
            ? `${orderWithDetails.customer.firstName} ${orderWithDetails.customer.lastName || ''}`.trim()
            : orderWithDetails.guestName || 'Client'

          if (customerEmail) {
            const currency = orderWithDetails.restaurant.settings?.currency || 'XOF'
            const formatCurrency = (amount: number) => 
              new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)

            const receiptItems = orderWithDetails.items.map((item) => ({
              name: item.productName + (item.variantName ? ` - ${item.variantName}` : ''),
              quantity: item.quantity,
              total: Number(item.totalPrice),
            }))

            const subtotal = receiptItems.reduce((sum, item) => sum + item.total, 0)

            await sendReceiptEmail({
              to: customerEmail,
              customerName,
              restaurantName: orderWithDetails.restaurant.name,
              restaurantLogo: orderWithDetails.restaurant.logo || undefined,
              primaryColor: '#10b981',
              receiptNumber: receipt.receiptNumber,
              orderNumber: orderWithDetails.orderNumber,
              date: new Date().toLocaleDateString('fr-FR'),
              items: receiptItems,
              subtotal,
              taxAmount: 0,
              total,
              receiptType: receiptTypeValue,
            })

            console.log(`Webhook Moneroo: email de reçu envoyé à ${customerEmail}`)
          }

          // Accumuler les points de fidélité si le client est connecté
          if (orderWithDetails.customerId && orderWithDetails.restaurant.settings?.loyaltyPointsPerUnit) {
            const pointsRate = Number(orderWithDetails.restaurant.settings.loyaltyPointsPerUnit)
            const pointsEarned = Math.floor(total * pointsRate)

            if (pointsEarned > 0) {
              const customer = await prisma.restaurantCustomer.findUnique({
                where: { id: orderWithDetails.customerId },
              })

              if (customer) {
                const newBalance = customer.loyaltyPoints + pointsEarned

                await prisma.$transaction([
                  prisma.restaurantCustomer.update({
                    where: { id: customer.id },
                    data: { loyaltyPoints: newBalance },
                  }),
                  prisma.loyaltyTransaction.create({
                    data: {
                      customerId: customer.id,
                      restaurantId: orderWithDetails.restaurantId,
                      type: 'EARN',
                      points: pointsEarned,
                      balanceAfter: newBalance,
                      description: `Points gagnés pour la commande #${orderWithDetails.orderNumber}`,
                      orderId: orderWithDetails.id,
                    },
                  }),
                ])

                // Envoyer l'email de points gagnés
                if (customerEmail) {
                  const currency = orderWithDetails.restaurant.settings?.currency || 'XOF'
                  const formatCurrency = (amount: number) => 
                    new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)

                  await sendLoyaltyPointsEarnedEmail({
                    to: customerEmail,
                    customerName: customer.firstName,
                    restaurantName: orderWithDetails.restaurant.name,
                    restaurantLogo: orderWithDetails.restaurant.logo || undefined,
                    primaryColor: '#10b981',
                    pointsEarned,
                    totalPoints: newBalance,
                    orderNumber: orderWithDetails.orderNumber,
                    orderTotal: formatCurrency(total),
                  })

                  console.log(`Webhook Moneroo: email de points envoyé à ${customerEmail}`)
                }
              }
            }
          }
        }
      } catch (receiptError) {
        console.error('Webhook Moneroo: erreur création reçu/email:', receiptError)
      }
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Erreur webhook Moneroo:', error)
    res.status(500).json({ error: 'Internal error' })
  }
})

export { router as webhookRoutes }
