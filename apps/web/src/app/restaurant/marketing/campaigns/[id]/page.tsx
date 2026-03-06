'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  ArrowLeft, 
  Mail, 
  Users, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  MousePointer,
  BarChart3,
  Calendar,
  Edit,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle,
  Ban
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api } from '@/lib/api-client'

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: Edit },
  PENDING: { label: 'Programmée', color: 'bg-blue-100 text-blue-700', icon: Clock },
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

const recipientStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'En attente', color: 'bg-gray-100 text-gray-700', icon: Clock },
  SENT: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700', icon: Send },
  DELIVERED: { label: 'Délivré', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  OPENED: { label: 'Ouvert', color: 'bg-green-100 text-green-700', icon: Eye },
  CLICKED: { label: 'Cliqué', color: 'bg-indigo-100 text-indigo-700', icon: MousePointer },
  BOUNCED: { label: 'Rebond', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  FAILED: { label: 'Échec', color: 'bg-red-100 text-red-700', icon: XCircle },
  UNSUBSCRIBED: { label: 'Désabonné', color: 'bg-gray-100 text-gray-600', icon: Ban },
}

export default function CampaignDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const primaryColor = organization?.primaryColor || '#E63946'

  const [page, setPage] = useState(1)
  const [recipientStatusFilter, setRecipientStatusFilter] = useState('all')

  const { data: campaign, isLoading, refetch } = useQuery({
    queryKey: ['campaign-details', campaignId, page, recipientStatusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page),
        limit: '50',
      }
      if (recipientStatusFilter !== 'all') {
        params.recipientStatus = recipientStatusFilter
      }
      const response = await api.restaurant.marketing.campaigns.get(campaignId, params)
      return response.data
    },
    enabled: !!accessToken && !!campaignId,
  })

  if (isLoading && !campaign) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Détails de la campagne"
        variant="detail"
      />
    )
  }

  if (!campaign) {
    return (
      <DashboardLayout
        navigation={navigation}
        basePath="/restaurant"
        logoText={organization?.name || 'Restaurant'}
        primaryColor={primaryColor}
        restaurants={restaurants}
        currentRestaurantId={currentRestaurantId}
        onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="w-12 h-12 text-gray-400" />
          <p className="text-gray-500">Campagne non trouvée</p>
          <Button variant="outline" onClick={() => router.push('/restaurant/marketing/campaigns')}>
            Retour aux campagnes
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const status = statusConfig[campaign.status] || statusConfig.DRAFT
  const type = typeConfig[campaign.type] || typeConfig.PROMOTIONAL
  const StatusIcon = status.icon
  const stats = campaign.recipientStats

  const openRate = stats.total > 0 ? Math.round((stats.opened / stats.total) * 100) : 0
  const clickRate = stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0
  const deliveryRate = stats.total > 0 ? Math.round(((stats.delivered + stats.opened + stats.clicked) / stats.total) * 100) : 0
  const bounceRate = stats.total > 0 ? Math.round(((stats.bounced + stats.failed) / stats.total) * 100) : 0

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/restaurant/marketing/campaigns')}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ backgroundColor: `${primaryColor}10` }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: primaryColor }} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{campaign.name}</h1>
            <p className="text-sm text-gray-500 truncate">{campaign.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => refetch()}
            className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: `${primaryColor}10`, 
              color: primaryColor,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}20`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          {(campaign.status === 'DRAFT' || campaign.status === 'PENDING') && (
            <Button
              onClick={() => router.push(`/restaurant/marketing/campaigns/${campaignId}/edit`)}
              className="h-10 px-4 rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Edit className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Modifier</span>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Info Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <StatusIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: primaryColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium ${status.color}`}>
                {status.label}
              </span>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Statut</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-50">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium ${type.color}`}>
                {type.label}
              </span>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Type</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs sm:text-sm text-gray-500">Destinataires</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-50">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base sm:text-lg font-bold text-gray-900">
                {format(new Date(campaign.sentAt || campaign.scheduledAt || campaign.createdAt), 'dd MMM yyyy', { locale: fr })}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                {campaign.sentAt ? 'Envoyée' : campaign.scheduledAt ? 'Programmée' : 'Créée'} à {format(new Date(campaign.sentAt || campaign.scheduledAt || campaign.createdAt), 'HH:mm', { locale: fr })}
              </div>
            </div>
          </div>
        </div>

      {/* Statistics */}
      {(campaign.status === 'SENT' || campaign.status === 'SENDING') && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistiques d'envoi</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500 mt-1">En attente</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
              <p className="text-xs text-gray-500 mt-1">Envoyés</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-600">{stats.delivered}</p>
              <p className="text-xs text-gray-500 mt-1">Délivrés</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-green-50">
              <p className="text-2xl font-bold text-green-600">{stats.opened}</p>
              <p className="text-xs text-gray-500 mt-1">Ouverts</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-indigo-50">
              <p className="text-2xl font-bold text-indigo-600">{stats.clicked}</p>
              <p className="text-xs text-gray-500 mt-1">Cliqués</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-orange-50">
              <p className="text-2xl font-bold text-orange-600">{stats.bounced}</p>
              <p className="text-xs text-gray-500 mt-1">Rebonds</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-50">
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-xs text-gray-500 mt-1">Échecs</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-gray-600">{stats.unsubscribed}</p>
              <p className="text-xs text-gray-500 mt-1">Désabonnés</p>
            </div>
          </div>

          {/* Rates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{deliveryRate}%</p>
                <p className="text-xs text-gray-500">Taux de délivrabilité</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{openRate}%</p>
                <p className="text-xs text-gray-500">Taux d'ouverture</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{clickRate}%</p>
                <p className="text-xs text-gray-500">Taux de clic</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{bounceRate}%</p>
                <p className="text-xs text-gray-500">Taux d'échec</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipients List */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Destinataires ({stats.total})
            {recipientStatusFilter !== 'all' && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({campaign.pagination.total} filtrés)
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select value={recipientStatusFilter} onValueChange={(v) => { setRecipientStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-40 h-9 rounded-lg text-sm">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="SENT">Envoyés</SelectItem>
                <SelectItem value="DELIVERED">Délivrés</SelectItem>
                <SelectItem value="OPENED">Ouverts</SelectItem>
                <SelectItem value="CLICKED">Cliqués</SelectItem>
                <SelectItem value="BOUNCED">Rebonds</SelectItem>
                <SelectItem value="FAILED">Échecs</SelectItem>
                <SelectItem value="UNSUBSCRIBED">Désabonnés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {campaign.recipients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {recipientStatusFilter !== 'all' 
              ? 'Aucun destinataire avec ce statut'
              : 'Aucun destinataire pour cette campagne'
            }
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {campaign.recipients.map((recipient) => {
                const rStatus = recipientStatusConfig[recipient.status] || recipientStatusConfig.PENDING
                const RStatusIcon = rStatus.icon
                return (
                  <div key={recipient.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {recipient.customer.firstName} {recipient.customer.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{recipient.email}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${rStatus.color}`}>
                        <RStatusIcon className="w-3 h-3" />
                        {rStatus.label}
                      </span>
                    </div>
                    {recipient.errorMessage && (
                      <div className="mt-2 p-2 rounded-lg bg-red-50 text-xs text-red-600">
                        {recipient.errorMessage}
                      </div>
                    )}
                    {recipient.openedAt && (
                      <p className="mt-2 text-xs text-gray-400">
                        Ouvert le {format(new Date(recipient.openedAt), 'dd/MM/yy HH:mm', { locale: fr })}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Destinataire</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-center font-medium">Statut</th>
                    <th className="px-4 py-3 text-left font-medium">Envoyé</th>
                    <th className="px-4 py-3 text-left font-medium">Ouvert</th>
                    <th className="px-4 py-3 text-left font-medium">Erreur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaign.recipients.map((recipient) => {
                    const rStatus = recipientStatusConfig[recipient.status] || recipientStatusConfig.PENDING
                    const RStatusIcon = rStatus.icon
                    return (
                      <tr key={recipient.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {recipient.customer.firstName} {recipient.customer.lastName}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {recipient.email}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${rStatus.color}`}>
                            <RStatusIcon className="w-3 h-3" />
                            {rStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {recipient.sentAt 
                            ? format(new Date(recipient.sentAt), 'dd/MM HH:mm', { locale: fr })
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {recipient.openedAt 
                            ? format(new Date(recipient.openedAt), 'dd/MM HH:mm', { locale: fr })
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3">
                          {recipient.errorMessage ? (
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              {recipient.errorMessage}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {campaign.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {campaign.pagination.page} sur {campaign.pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(campaign.pagination.totalPages, p + 1))}
                    disabled={page === campaign.pagination.totalPages}
                    className="rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

        {/* Email Content Preview */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenu de l'email</h2>
          <div 
            className="prose prose-sm max-w-none border border-gray-200 rounded-xl p-4 bg-gray-50"
            dangerouslySetInnerHTML={{ __html: campaign.content }}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
