'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import {
  Mail,
  Plus,
  Search,
  MoreHorizontal,
  Send,
  Edit,
  Trash2,
  Eye,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { SendCampaignModal } from '@/components/restaurant/marketing/campaigns/SendCampaignModal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'

type Campaign = {
  id: string
  name: string
  subject: string
  type: string
  status: string
  recipientCount: number
  sentCount: number
  openCount: number
  clickCount: number
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
}

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

export default function CampaignsPage() {
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const queryClient = useQueryClient()
  const primaryColor = organization?.primaryColor || '#10b981'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null)
  const [sendingCampaign, setSendingCampaign] = useState<Campaign | null>(null)

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', currentRestaurantId, statusFilter],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const params: Record<string, string> = {}
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      const res = await api.restaurant.marketing.campaigns.list(params)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.campaigns.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campagne supprimée')
      setDeletingCampaign(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.campaigns.send(id)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success(res.data?.message || 'Campagne envoyée')
      setSendingCampaign(null)
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi')
    },
  })

  const filteredCampaigns = campaigns?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  ) || []

  if (isLoading && !campaigns) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Campagnes email"
        variant="list"
      />
    )
  }

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
      <PageHeader
        title="Campagnes email"
        subtitle="Créez et envoyez des campagnes email à vos clients"
        icon={Mail}
        actions={
          <Link href="/restaurant/marketing/campaigns/new">
            <Button
              className="h-10 px-4 rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={18} className="mr-2" />
              Nouvelle campagne
            </Button>
          </Link>
        }
      />

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher une campagne..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger 
              className="w-full sm:w-48 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="all">Toutes les campagnes</SelectItem>
              <SelectItem value="DRAFT">Brouillons</SelectItem>
              <SelectItem value="PENDING">Programmées</SelectItem>
              <SelectItem value="SENT">Envoyées</SelectItem>
              <SelectItem value="CANCELLED">Annulées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des campagnes */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <Mail size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune campagne</h3>
          <p className="text-gray-500 mb-4">
            Créez votre première campagne email pour communiquer avec vos clients
          </p>
          <Link href="/restaurant/marketing/campaigns/new">
            <Button
              className="h-10 px-4 rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={18} className="mr-2" />
              Créer votre première campagne
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Vue mobile - Cartes */}
          <div className="md:hidden space-y-3">
            {filteredCampaigns.map((campaign) => {
              const isScheduled = campaign.status === 'DRAFT' && campaign.scheduledAt !== null
              const status = statusConfig[campaign.status] || statusConfig.DRAFT
              const type = typeConfig[campaign.type] || typeConfig.PROMOTIONAL
              const StatusIcon = status.icon
              const openRate = campaign.sentCount > 0 
                ? Math.round((campaign.openCount / campaign.sentCount) * 100) 
                : 0

              return (
                <div key={campaign.id} className="bg-white rounded-xl border border-gray-100 p-4 overflow-hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{campaign.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{campaign.subject}</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0">
                          <MoreHorizontal size={16} className="text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                        <DropdownMenuItem 
                          onClick={() => window.location.href = `/restaurant/marketing/campaigns/${campaign.id}`}
                          className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                        >
                          <Eye size={16} className="mr-3 text-gray-400" />
                          <span className="text-[13px] text-gray-700">Voir les détails</span>
                        </DropdownMenuItem>
                        {(campaign.status === 'DRAFT' || campaign.status === 'PENDING') && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => window.location.href = `/restaurant/marketing/campaigns/${campaign.id}/edit`}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Edit size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Modifier</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setSendingCampaign(campaign)}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Send size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">{campaign.status === 'PENDING' ? 'Gérer l\'envoi' : 'Envoyer'}</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        {campaign.status !== 'SENDING' && (
                          <>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem 
                              onClick={() => setDeletingCampaign(campaign)}
                              className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                            >
                              <Trash2 size={16} className="mr-3" />
                              <span className="text-[13px]">Supprimer</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${type.color}`}>
                      {type.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {(campaign.status === 'SENT' || campaign.status === 'SENDING') && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{campaign.recipientCount}</span>
                        </div>
                      )}
                      {campaign.status === 'SENT' && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>{openRate}%</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {campaign.scheduledAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(campaign.scheduledAt), 'dd/MM HH:mm', { locale: fr })}
                        </div>
                      ) : campaign.sentAt ? (
                        format(new Date(campaign.sentAt), 'dd/MM/yy HH:mm', { locale: fr })
                      ) : (
                        format(new Date(campaign.createdAt), 'dd/MM/yy', { locale: fr })
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Vue desktop - Tableau */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Campagne</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destinataires</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ouvertures</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCampaigns.map((campaign) => {
                    const isScheduled = campaign.status === 'DRAFT' && campaign.scheduledAt !== null
                    const status = statusConfig[campaign.status] || statusConfig.DRAFT
                    const type = typeConfig[campaign.type] || typeConfig.PROMOTIONAL
                    const StatusIcon = status.icon
                    const openRate = campaign.sentCount > 0 
                      ? Math.round((campaign.openCount / campaign.sentCount) * 100) 
                      : 0

                    return (
                      <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{campaign.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{campaign.subject}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${type.color}`}>
                            {type.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {campaign.status === 'SENT' || campaign.status === 'SENDING' ? (
                            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span>{campaign.recipientCount}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {campaign.status === 'SENT' ? (
                            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                              <BarChart3 className="w-4 h-4 text-gray-400" />
                              <span>{openRate}%</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {campaign.scheduledAt ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span>{format(new Date(campaign.scheduledAt), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                            </div>
                          ) : campaign.sentAt ? (
                            format(new Date(campaign.sentAt), 'dd MMM yyyy HH:mm', { locale: fr })
                          ) : (
                            format(new Date(campaign.createdAt), 'dd MMM yyyy', { locale: fr })
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
                                <MoreHorizontal size={16} className="text-gray-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                              <DropdownMenuItem 
                                onClick={() => window.location.href = `/restaurant/marketing/campaigns/${campaign.id}`}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Eye size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Voir les détails</span>
                              </DropdownMenuItem>
                              {(campaign.status === 'DRAFT' || campaign.status === 'PENDING') && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => window.location.href = `/restaurant/marketing/campaigns/${campaign.id}/edit`}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                                  >
                                    <Edit size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Modifier</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setSendingCampaign(campaign)}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                                  >
                                    <Send size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">{campaign.status === 'PENDING' ? 'Gérer l\'envoi' : 'Envoyer'}</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {campaign.status !== 'SENDING' && (
                                <>
                                  <DropdownMenuSeparator className="my-1" />
                                  <DropdownMenuItem 
                                    onClick={() => setDeletingCampaign(campaign)}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                                  >
                                    <Trash2 size={16} className="mr-3" />
                                    <span className="text-[13px]">Supprimer</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={!!deletingCampaign}
        onClose={() => setDeletingCampaign(null)}
        onConfirm={() => deletingCampaign && deleteMutation.mutate(deletingCampaign.id)}
        title="Supprimer la campagne"
        message={`Êtes-vous sûr de vouloir supprimer la campagne "${deletingCampaign?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        icon="trash"
        isLoading={deleteMutation.isPending}
      />

      <SendCampaignModal
        open={!!sendingCampaign}
        onClose={() => setSendingCampaign(null)}
        campaign={sendingCampaign}
        primaryColor={primaryColor}
        onSend={(campaignId, scheduledAt) => {
          if (scheduledAt) {
            // TODO: Implémenter la mise à jour avec scheduledAt
            sendMutation.mutate(campaignId)
          } else {
            sendMutation.mutate(campaignId)
          }
        }}
        isLoading={sendMutation.isPending}
      />
    </DashboardLayout>
  )
}
