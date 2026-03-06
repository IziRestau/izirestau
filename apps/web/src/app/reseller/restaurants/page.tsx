'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { resellerNavigation, resellerPromoCard } from '@/config/reseller-navigation'
import { StatsCard, InvitationModal } from '@/components/reseller'
import { useResellerSites, useResellerDashboard, useResellerClients } from '@/hooks/use-reseller'
import { 
  Store,
  Plus,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Globe,
  Eye,
  Loader2,
  Search,
  Settings,
  Power,
  Copy,
  Mail,
  Clock,
  UserCheck,
  Send,
} from 'lucide-react'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function ResellerRestaurantsPage() {
  const router = useRouter()
  const { data: dashboardData } = useResellerDashboard()
  const { sites, isLoading, refetch: refetchSites } = useResellerSites()
  const { clients, refetch: refetchClients } = useResellerClients()
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all')
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; type: 'client' | 'site' } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusConfirm, setStatusConfirm] = useState<{ siteId: string; name: string; action: 'activate' | 'suspend' } | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Afficher skeleton si chargement initial
  if (isLoading && sites.length === 0) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Restaurants"
        variant="list"
      />
    )
  }

  const stats = dashboardData?.stats
  
  // Clients en attente (LEAD = invitation envoyee, pas encore acceptee)
  const pendingClients = clients.filter(c => c.status === 'LEAD')
  const activeClients = clients.filter(c => c.status === 'ACTIVE')
  
  // Creer une liste combinee
  type ListItem = {
    id: string
    type: 'restaurant' | 'pending'
    name: string
    email: string
    status: 'ACTIVE' | 'DRAFT' | 'SUSPENDED' | 'EXPIRED' | 'PENDING'
    subdomain?: string
    clientName?: string
    clientInitials?: string
    createdAt: string
    siteId?: string
  }

  const combinedList: ListItem[] = [
    // Restaurants actifs (sites avec client ACTIVE)
    ...sites.map(site => ({
      id: site.id,
      type: 'restaurant' as const,
      name: site.restaurant?.name || site.subdomain,
      email: site.client?.email || '',
      status: site.status as 'ACTIVE' | 'DRAFT' | 'SUSPENDED' | 'EXPIRED',
      subdomain: site.subdomain,
      clientName: site.client?.name,
      clientInitials: site.client ? `${site.client.contactFirstName[0]}${site.client.contactLastName[0]}` : undefined,
      createdAt: site.createdAt,
      siteId: site.id,
    })),
    // Invitations en attente (clients LEAD sans site)
    ...pendingClients
      .filter(client => !sites.some(site => site.client?.id === client.id))
      .map(client => ({
        id: client.id,
        type: 'pending' as const,
        name: client.businessName || client.name,
        email: client.email,
        status: 'PENDING' as const,
        clientName: client.name,
        clientInitials: `${client.contactFirstName[0]}${client.contactLastName[0]}`,
        createdAt: client.createdAt,
      })),
  ]

  // Filtrer selon le filtre actif
  const filteredList = combinedList.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (filter === 'active') return item.type === 'restaurant' && item.status === 'ACTIVE'
    if (filter === 'pending') return item.type === 'pending'
    return true
  })

  const handleResendInvitation = async (clientId: string, email: string) => {
    setResendingId(clientId)
    try {
      const { accessToken } = useAuthStore.getState()
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      await api.reseller.resendInvitation(clientId)
      toast.success(`Invitation renvoyee a ${email}`)
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du renvoi')
    } finally {
      setResendingId(null)
    }
  }

  const handleDeleteClient = async () => {
    if (!deleteConfirm) return
    setIsDeleting(true)
    try {
      const { accessToken } = useAuthStore.getState()
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      await api.reseller.deleteClient(deleteConfirm.id)
      toast.success('Invitation annulee')
      refetchClients()
      refetchSites()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const handleStatusChange = async () => {
    if (!statusConfirm) return
    setIsUpdatingStatus(true)
    try {
      const { accessToken } = useAuthStore.getState()
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const newStatus = statusConfirm.action === 'activate' ? 'ACTIVE' : 'SUSPENDED'
      await api.reseller.updateSiteStatus(statusConfirm.siteId, newStatus)
      toast.success(statusConfirm.action === 'activate' ? 'Site active' : 'Site suspendu')
      refetchSites()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise a jour')
    } finally {
      setIsUpdatingStatus(false)
      setStatusConfirm(null)
    }
  }

  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
      promoCard={{
        ...resellerPromoCard,
        onButtonClick: () => router.push(resellerPromoCard.href),
      }}
    >
      <PageHeader
        title="Restaurants"
        subtitle="Gerez les restaurants de vos clients"
        icon={Store}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nouvelle Invitation</span>
          </button>
        }
      />
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6">
        <StatsCard
          icon={Store}
          value={stats?.sitesCount || 0}
          label="Total Restaurants"
        />
        <StatsCard
          icon={Globe}
          value={stats?.sitesActive || 0}
          label="Actifs"
        />
        <StatsCard
          icon={Clock}
          value={pendingClients.length}
          label="En attente"
        />
        <StatsCard
          icon={Plus}
          value={stats?.sitesRemaining || 0}
          label="Disponibles"
        />
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'En attente'}
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-white/20">
                {f === 'all' ? combinedList.length : f === 'active' ? sites.filter(s => s.status === 'ACTIVE').length : pendingClients.length}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucun restaurant</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Invitez votre premier client pour creer un restaurant.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus size={18} />
              Inviter un client
            </button>
          </div>
        ) : (
          <>
            {/* Vue Mobile - Cartes */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredList.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className={`flex items-start gap-3 min-w-0 flex-1 ${item.type === 'restaurant' ? 'cursor-pointer' : ''}`}
                      onClick={() => item.type === 'restaurant' && item.siteId && router.push(`/reseller/restaurants/${item.siteId}`)}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.type === 'pending' ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        {item.type === 'pending' ? (
                          <Clock className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Store className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm truncate hover:text-emerald-600 transition-colors">{item.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                            item.status === 'ACTIVE' 
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.status === 'ACTIVE' ? 'Actif' : item.status === 'PENDING' ? 'En attente' : 'Brouillon'}
                          </span>
                        </div>
                        {item.subdomain ? (
                          <div className="text-xs text-gray-500 truncate">{item.subdomain}.iziresto.com</div>
                        ) : (
                          <div className="text-xs text-gray-400">Invitation en attente</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1 truncate">{item.email}</div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
                          <MoreHorizontal size={16} className="text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                        {item.type === 'pending' ? (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleResendInvitation(item.id, item.email)}
                              disabled={resendingId === item.id}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              {resendingId === item.id ? (
                                <Loader2 size={16} className="mr-3 text-gray-400 animate-spin" />
                              ) : (
                                <Send size={16} className="mr-3 text-gray-400" />
                              )}
                              <span className="text-[13px] text-gray-700">Renvoyer l'invitation</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                              <Mail size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Copier le lien</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirm({ id: item.id, name: item.name, type: 'client' })}
                              className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                            >
                              <Trash2 size={16} className="mr-3" />
                              <span className="text-[13px]">Annuler l'invitation</span>
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => router.push(`/reseller/restaurants/${item.siteId}`)} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                              <Eye size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Voir details</span>
                            </DropdownMenuItem>
                            {item.subdomain && (
                              <>
                                <DropdownMenuItem onClick={() => window.open(`https://${item.subdomain}.iziresto.com`, '_blank')} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                                  <ExternalLink size={16} className="mr-3 text-gray-400" />
                                  <span className="text-[13px] text-gray-700">Ouvrir le site</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`https://${item.subdomain}.iziresto.com`)} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                                  <Copy size={16} className="mr-3 text-gray-400" />
                                  <span className="text-[13px] text-gray-700">Copier le lien</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator className="my-1" />
                            {item.status === 'ACTIVE' ? (
                              <DropdownMenuItem 
                                onClick={() => setStatusConfirm({ siteId: item.siteId || item.id, name: item.name, action: 'suspend' })}
                                className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                              >
                                <Power size={16} className="mr-3" />
                                <span className="text-[13px]">Suspendre</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => setStatusConfirm({ siteId: item.siteId || item.id, name: item.name, action: 'activate' })}
                                className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                              >
                                <Power size={16} className="mr-3" />
                                <span className="text-[13px]">Activer</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirm({ id: item.siteId || item.id, name: item.name, type: 'site' })}
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
                </div>
              ))}
            </div>

            {/* Vue Desktop - Tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Restaurant / Client</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div 
                          className={`flex items-center gap-3 ${item.type === 'restaurant' ? 'cursor-pointer group' : ''}`}
                          onClick={() => item.type === 'restaurant' && item.siteId && router.push(`/reseller/restaurants/${item.siteId}`)}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            item.type === 'pending' ? 'bg-amber-100' : 'bg-gray-100'
                          }`}>
                            {item.type === 'pending' ? (
                              <Clock className="w-5 h-5 text-amber-600" />
                            ) : (
                              <Store className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{item.name}</div>
                            {item.subdomain ? (
                              <div className="text-sm text-gray-500 truncate">{item.subdomain}.iziresto.com</div>
                            ) : (
                              <div className="text-sm text-gray-400">Invitation en attente</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {item.clientInitials && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              item.type === 'pending' ? 'bg-amber-100' : 'bg-emerald-100'
                            }`}>
                              <span className={`text-xs font-semibold ${
                                item.type === 'pending' ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                {item.clientInitials}
                              </span>
                            </div>
                          )}
                          <span className="text-sm text-gray-700 truncate">{item.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          item.status === 'ACTIVE' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : item.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-600'
                            : item.status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.status === 'ACTIVE' ? 'Actif' : item.status === 'PENDING' ? 'En attente' : item.status === 'DRAFT' ? 'Brouillon' : item.status === 'SUSPENDED' ? 'Suspendu' : 'Expire'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 hidden lg:table-cell">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                                <MoreHorizontal size={18} className="text-gray-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                              {item.type === 'pending' ? (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleResendInvitation(item.id, item.email)}
                                    disabled={resendingId === item.id}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                                  >
                                    {resendingId === item.id ? (
                                      <Loader2 size={16} className="mr-3 text-gray-400 animate-spin" />
                                    ) : (
                                      <Send size={16} className="mr-3 text-gray-400" />
                                    )}
                                    <span className="text-[13px] text-gray-700">Renvoyer l'invitation</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                                    <Mail size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Copier le lien</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1" />
                                  <DropdownMenuItem 
                                    onClick={() => setDeleteConfirm({ id: item.id, name: item.name, type: 'client' })}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                                  >
                                    <Trash2 size={16} className="mr-3" />
                                    <span className="text-[13px]">Annuler l'invitation</span>
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => router.push(`/reseller/restaurants/${item.siteId}`)} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                                    <Eye size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Voir details</span>
                                  </DropdownMenuItem>
                                  {item.subdomain && (
                                    <>
                                      <DropdownMenuItem onClick={() => window.open(`https://${item.subdomain}.iziresto.com`, '_blank')} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                                        <ExternalLink size={16} className="mr-3 text-gray-400" />
                                        <span className="text-[13px] text-gray-700">Ouvrir le site</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`https://${item.subdomain}.iziresto.com`)} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                                        <Copy size={16} className="mr-3 text-gray-400" />
                                        <span className="text-[13px] text-gray-700">Copier le lien</span>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator className="my-1" />
                                  {item.status === 'ACTIVE' ? (
                                    <DropdownMenuItem 
                                      onClick={() => setStatusConfirm({ siteId: item.siteId || item.id, name: item.name, action: 'suspend' })}
                                      className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                                    >
                                      <Power size={16} className="mr-3" />
                                      <span className="text-[13px]">Suspendre</span>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => setStatusConfirm({ siteId: item.siteId || item.id, name: item.name, action: 'activate' })}
                                      className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                                    >
                                      <Power size={16} className="mr-3" />
                                      <span className="text-[13px]">Activer</span>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => setDeleteConfirm({ id: item.siteId || item.id, name: item.name, type: 'site' })}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <InvitationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refetchSites()
          refetchClients()
        }}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteClient}
        title={deleteConfirm?.type === 'client' ? "Annuler l'invitation" : "Supprimer le site"}
        message={deleteConfirm?.type === 'client' 
          ? `Etes-vous sur de vouloir annuler l'invitation pour "${deleteConfirm?.name}" ? Cette action est irreversible.`
          : `Etes-vous sur de vouloir supprimer le site "${deleteConfirm?.name}" ? Cette action est irreversible.`
        }
        confirmText={deleteConfirm?.type === 'client' ? "Annuler l'invitation" : "Supprimer"}
        cancelText="Retour"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={handleStatusChange}
        title={statusConfirm?.action === 'activate' ? 'Activer le site' : 'Suspendre le site'}
        message={
          statusConfirm?.action === 'activate'
            ? `Etes-vous sur de vouloir activer "${statusConfirm?.name}" ? Le site sera visible et accessible aux clients.`
            : `Etes-vous sur de vouloir suspendre "${statusConfirm?.name}" ? Le site ne sera plus accessible aux clients.`
        }
        confirmText={statusConfirm?.action === 'activate' ? 'Activer' : 'Suspendre'}
        cancelText="Annuler"
        variant={statusConfirm?.action === 'activate' ? 'info' : 'warning'}
        isLoading={isUpdatingStatus}
      />
    </DashboardLayout>
  )
}
