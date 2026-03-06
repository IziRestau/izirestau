import { Router, Request, Response, NextFunction } from 'express'
import { processScheduledCampaigns } from '../services/campaign-scheduler.service'

const router = Router()

// Middleware pour vérifier le secret cron
const verifyCronSecret = (req: Request, res: Response, next: NextFunction) => {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  // En développement, on permet l'accès sans secret
  if (process.env.NODE_ENV === 'development') {
    return next()
  }

  if (!cronSecret) {
    console.warn('[Cron] CRON_SECRET not configured')
    return res.status(500).json({ success: false, error: 'CRON_SECRET not configured' })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  next()
}

router.use(verifyCronSecret)

// POST /cron/process-scheduled-campaigns - Traiter les campagnes planifiées
router.post('/process-scheduled-campaigns', async (req: Request, res: Response) => {
  try {
    console.log('[Cron] Processing scheduled campaigns...')
    const result = await processScheduledCampaigns()
    console.log(`[Cron] Processed ${result.processed} campaigns, sent ${result.sent} emails, ${result.failed} failed`)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[Cron] Error processing scheduled campaigns:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process scheduled campaigns',
    })
  }
})

export default router
