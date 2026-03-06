'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Send,
  Clock,
  Users,
  Target,
  Calendar,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Campaign {
  id: string
  name: string
  subject: string
  type: string
  status: string
  recipientCount: number
  scheduledAt: string | null
  targetAll?: boolean
  targetingRules?: unknown
}

interface SendCampaignModalProps {
  open: boolean
  onClose: () => void
  campaign: Campaign | null
  primaryColor: string
  onSend: (campaignId: string, scheduledAt?: string) => void
  isLoading?: boolean
}

export function SendCampaignModal({
  open,
  onClose,
  campaign,
  primaryColor,
  onSend,
  isLoading = false,
}: SendCampaignModalProps) {
  const { accessToken } = useAuthStore()
  const [sendMode, setSendMode] = useState<'now' | 'scheduled'>('now')
  const [scheduledDate, setScheduledDate] = useState<string>('')

  // Déterminer si la campagne est déjà programmée
  const isAlreadyScheduled = campaign?.scheduledAt !== null

  // Reset le mode quand le modal s'ouvre
  useEffect(() => {
    if (open && campaign) {
      // Si déjà programmé, on reste en mode programmation par défaut
      if (campaign.scheduledAt) {
        setSendMode('scheduled')
        const date = new Date(campaign.scheduledAt)
        setScheduledDate(date.toISOString().slice(0, 16))
      } else {
        setSendMode('now')
        setScheduledDate('')
      }
    }
  }, [open, campaign])

  // Récupérer l'estimation des destinataires
  const { data: previewData, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['campaign-preview', campaign?.id],
    queryFn: async () => {
      if (!campaign) return null
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.campaigns.get(campaign.id)
      return res.data
    },
    enabled: !!accessToken && !!campaign && open,
  })

  // Récupérer le nombre de destinataires ciblés
  const { data: targetingPreview } = useQuery({
    queryKey: ['targeting-preview', campaign?.id, previewData?.targetingRules],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.previewTargeting(
        previewData?.targetingRules || null
      )
      return res.data
    },
    enabled: !!accessToken && !!previewData && open,
  })

  const handleSend = () => {
    if (!campaign) return
    if (sendMode === 'scheduled' && scheduledDate) {
      onSend(campaign.id, new Date(scheduledDate).toISOString())
    } else {
      onSend(campaign.id)
    }
  }

  if (!campaign) return null

  const estimatedRecipients = targetingPreview?.count ?? campaign.recipientCount ?? 0
  const hasTargeting = previewData?.targetingRules && !previewData?.targetAll

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Send className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <span className="block">Envoyer la campagne</span>
              <span className="text-sm font-normal text-gray-500">{campaign.name}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Résumé de la campagne */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Sujet</p>
                <p className="text-sm font-medium text-gray-900">{campaign.subject}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Ciblage</p>
                <p className="text-sm font-medium text-gray-900">
                  {hasTargeting ? 'Ciblage personnalisé' : 'Tous les clients'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Destinataires estimés</p>
                <p className="text-sm font-medium text-gray-900">
                  {isLoadingPreview ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : (
                    `${estimatedRecipients} client${estimatedRecipients > 1 ? 's' : ''}`
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Info programmation existante */}
          {isAlreadyScheduled && campaign.scheduledAt && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Programmée pour le {format(new Date(campaign.scheduledAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}</p>
              </div>
            </div>
          )}

          {/* Mode d'envoi */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Action</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSendMode('now')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  sendMode === 'now'
                    ? 'border-current'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={sendMode === 'now' ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" style={sendMode === 'now' ? { color: primaryColor } : { color: '#9ca3af' }} />
                  <span className="font-medium text-sm">Envoyer maintenant</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSendMode('scheduled')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  sendMode === 'scheduled'
                    ? 'border-current'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={sendMode === 'scheduled' ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={sendMode === 'scheduled' ? { color: primaryColor } : { color: '#9ca3af' }} />
                  <span className="font-medium text-sm">{isAlreadyScheduled ? 'Modifier la date' : 'Programmer'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Date de programmation */}
          {sendMode === 'scheduled' && (
            <div className="space-y-2">
              <Label htmlFor="scheduledDate" className="text-sm">
                {isAlreadyScheduled ? 'Nouvelle date' : "Date et heure d'envoi"}
              </Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="h-10 rounded-xl"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          )}

          {/* Avertissement */}
          {estimatedRecipients === 0 && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Aucun destinataire</p>
                <p className="text-xs text-amber-600 mt-1">
                  Aucun client ne correspond aux critères de ciblage ou n'a accepté les emails marketing.
                </p>
              </div>
            </div>
          )}

          {estimatedRecipients > 0 && sendMode === 'now' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {isAlreadyScheduled 
                  ? `Attention : ${estimatedRecipients} email${estimatedRecipients > 1 ? 's' : ''} seront envoyés immédiatement, la programmation sera ignorée.`
                  : `${estimatedRecipients} email${estimatedRecipients > 1 ? 's' : ''} seront envoyés immédiatement.`
                }
              </p>
            </div>
          )}

          {estimatedRecipients > 0 && sendMode === 'scheduled' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700">
                {estimatedRecipients} email{estimatedRecipients > 1 ? 's' : ''} seront envoyés à la date programmée.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl"
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || estimatedRecipients === 0 || (sendMode === 'scheduled' && !scheduledDate)}
            className="flex-1 h-11 rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {sendMode === 'now' ? 'Envoyer maintenant' : 'Programmer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
