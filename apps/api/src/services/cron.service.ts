import cron from 'node-cron'
import { processScheduledCampaigns } from './campaign-scheduler.service'

/**
 * Démarre tous les jobs cron internes
 */
export function startCronJobs() {
  console.log('[Cron] Starting internal cron jobs...')

  // Traiter les campagnes planifiées toutes les minutes
  cron.schedule('* * * * *', async () => {
    try {
      const result = await processScheduledCampaigns()
      if (result.processed > 0) {
        console.log(`[Cron] Processed ${result.processed} campaigns, sent ${result.sent} emails, ${result.failed} failed`)
      }
    } catch (error) {
      console.error('[Cron] Error processing scheduled campaigns:', error)
    }
  })

  console.log('[Cron] Cron jobs started successfully')
}
