import { prisma } from '@iziresto/database'
import { getTargetedCustomers, TargetingRules } from './targeting.service'
import { sendCampaignEmails } from './email.service'

/**
 * Vérifie et envoie les campagnes planifiées dont l'heure d'envoi est passée
 * Cette fonction doit être appelée périodiquement (ex: toutes les minutes via cron)
 */
export async function processScheduledCampaigns(): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  const now = new Date()
  let processed = 0
  let totalSent = 0
  let totalFailed = 0

  // Récupérer les campagnes PENDING avec une date de programmation passée
  const scheduledCampaigns = await prisma.emailCampaign.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now, not: null },
    },
    include: {
      restaurant: {
        select: { id: true, name: true },
      },
    },
  })

  for (const campaign of scheduledCampaigns) {
    try {
      console.log(`[Campaign Scheduler] Processing campaign: ${campaign.name} (${campaign.id})`)

      // Récupérer les clients ciblés
      const targetingRules = campaign.targetingRules as TargetingRules | null
      const customers = await getTargetedCustomers(
        campaign.restaurantId,
        targetingRules,
        { marketingOptInOnly: true }
      )

      if (customers.length === 0) {
        console.log(`[Campaign Scheduler] No recipients for campaign ${campaign.id}, marking as sent`)
        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: {
            status: 'SENT',
            sentAt: now,
            sentCount: 0,
            recipientCount: 0,
          },
        })
        processed++
        continue
      }

      // Créer les destinataires
      const recipientData = customers.map(c => ({
        campaignId: campaign.id,
        customerId: c.id,
        email: c.email,
      }))

      await prisma.$transaction([
        prisma.emailCampaignRecipient.createMany({
          data: recipientData,
          skipDuplicates: true,
        }),
        prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: {
            status: 'SENDING',
            recipientCount: customers.length,
          },
        }),
      ])

      // Récupérer les points de fidélité des clients
      const customersWithPoints = await prisma.restaurantCustomer.findMany({
        where: { id: { in: customers.map(c => c.id) } },
        select: { id: true, email: true, firstName: true, lastName: true, loyaltyPoints: true },
      })

      // Envoyer les emails
      const { sent, failed } = await sendCampaignEmails(
        campaign.id,
        campaign.subject,
        campaign.content,
        campaign.restaurant.name,
        customersWithPoints
      )

      // Mettre à jour la campagne
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'SENT',
          sentAt: now,
          sentCount: sent,
        },
      })

      console.log(`[Campaign Scheduler] Campaign ${campaign.id} sent to ${sent} recipients (${failed} failed)`)
      processed++
      totalSent += sent
      totalFailed += failed
    } catch (error) {
      console.error(`[Campaign Scheduler] Error processing campaign ${campaign.id}:`, error)
      
      // Marquer la campagne comme échouée (on la remet en DRAFT pour permettre un renvoi)
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: 'DRAFT' },
      })
    }
  }

  return { processed, sent: totalSent, failed: totalFailed }
}
