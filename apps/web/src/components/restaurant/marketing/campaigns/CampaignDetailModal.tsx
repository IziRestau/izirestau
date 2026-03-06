'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Mail,
  Users,
  BarChart3,
  MousePointer,
  Clock,
  CheckCircle,
  Edit,
  XCircle,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface CampaignDetailModalProps {
  open: boolean
  onClose: () => void
  campaign: {
    id: string
    name: string
    subject: string
    type: string
    status: string
  } | null
  primaryColor: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: Edit },
  SCHEDULED: { label: 'Planifiée', color: 'bg-blue-100 text-blue-700', icon: Clock },
  SENDING: { label: 'En cours', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  SENT: { label: 'Envoyée', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const typeConfig: Record<string, { label: string; color: string }> = {
  PROMOTIONAL: { label: 'Promotionnel', color: 'bg-purple-100 text-purple-700' },
  NEWSLETTER: { label: 'Newsletter', color: 'bg-blue-100 text-blue-700' },
  ANNOUNCEMENT: { label: 'Annonce', color: 'bg-amber-100 text-amber-700' },
  LOYALTY: { label: 'Fidélité', color: 'bg-rose-100 text-rose-700' },
  BIRTHDAY: { label: 'Anniversaire', color: 'bg-pink-100 text-pink-700' },
  REACTIVATION: { label: 'Réactivation', color: 'bg-orange-100 text-orange-700' },
}

export function CampaignDetailModal({ open, onClose, campaign, primaryColor }: CampaignDetailModalProps) {
  const { accessToken } = useAuthStore()

  const { data: details, isLoading } = useQuery({
    queryKey: ['campaign-detail', campaign?.id],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.campaigns.get(campaign!.id)
      return res.data
    },
    enabled: !!accessToken && !!campaign?.id && open,
  })

  if (!campaign) return null

  const status = statusConfig[campaign.status] || statusConfig.DRAFT
  const type = typeConfig[campaign.type] || typeConfig.PROMOTIONAL
  const StatusIcon = status.icon

  const openRate = details?.sentCount && details.sentCount > 0
    ? Math.round((details.openCount / details.sentCount) * 100)
    : 0
  const clickRate = details?.openCount && details.openCount > 0
    ? Math.round((details.clickCount / details.openCount) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: primaryColor }} />
            {campaign.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={`${status.color} flex items-center gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </Badge>
              <Badge className={type.color}>{type.label}</Badge>
            </div>

            {/* Stats */}
            {details.status === 'SENT' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Users className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                  <div className="text-2xl font-bold">{details.recipientCount}</div>
                  <div className="text-xs text-gray-500">Destinataires</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Mail className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                  <div className="text-2xl font-bold">{details.sentCount}</div>
                  <div className="text-xs text-gray-500">Envoyés</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <BarChart3 className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                  <div className="text-2xl font-bold">{openRate}%</div>
                  <div className="text-xs text-gray-500">Taux d'ouverture</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <MousePointer className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                  <div className="text-2xl font-bold">{clickRate}%</div>
                  <div className="text-xs text-gray-500">Taux de clic</div>
                </div>
              </div>
            )}

            {/* Sujet */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Sujet</h4>
              <p className="text-gray-900">{details.subject}</p>
            </div>

            {/* Contenu */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Contenu</h4>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                {details.content}
              </div>
            </div>

            {/* Ciblage */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Ciblage</h4>
              <p className="text-gray-900">
                {details.targetAll ? 'Tous les clients' : (
                  details.targetSegment === 'loyal' ? 'Clients fidèles' :
                  details.targetSegment === 'inactive' ? 'Clients inactifs' :
                  details.targetSegment === 'new' ? 'Nouveaux clients' :
                  'Segment personnalisé'
                )}
                {details.targetMinPoints && ` (min ${details.targetMinPoints} points)`}
                {details.targetMaxPoints && ` (max ${details.targetMaxPoints} points)`}
              </p>
            </div>

            {/* Dates */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <div>
                <span className="font-medium">Créée le :</span>{' '}
                {format(new Date(details.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </div>
              {details.sentAt && (
                <div>
                  <span className="font-medium">Envoyée le :</span>{' '}
                  {format(new Date(details.sentAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </div>
              )}
            </div>

            {/* Destinataires récents */}
            {details.recipients && details.recipients.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Destinataires ({details.recipientCount})
                </h4>
                <div className="bg-gray-50 rounded-lg divide-y max-h-48 overflow-y-auto">
                  {details.recipients.slice(0, 10).map((r) => (
                    <div key={r.id} className="px-4 py-2 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{r.customer.firstName} {r.customer.lastName}</span>
                        <span className="text-gray-500 ml-2">{r.email}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {r.status === 'SENT' ? 'Envoyé' :
                         r.status === 'OPENED' ? 'Ouvert' :
                         r.status === 'CLICKED' ? 'Cliqué' :
                         r.status === 'BOUNCED' ? 'Rebond' :
                         'En attente'}
                      </Badge>
                    </div>
                  ))}
                  {details.recipientCount > 10 && (
                    <div className="px-4 py-2 text-center text-sm text-gray-500">
                      Et {details.recipientCount - 10} autres...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
