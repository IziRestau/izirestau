'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { platformNavigation } from '@/config/platform-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import {
  Building2,
  Search,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Store,
  Users,
  MoreHorizontal,
  Mail,
  Ban,
  Trash2,
  Play,
  Pause,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CreateResellerModal } from './_components/CreateResellerModal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  CANCELLED: 'Annule',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

interface Reseller {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  logo: string | null
  status: string
  createdAt: string
  license: {
    id: string
    status: string
    plan: {
      id: string
      name: string
    }
  } | null
  _count: {
    sites: number
    members: number
    clients: number
  }
}

interface ResellersResponse {
  resellers: Reseller[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: {
    total: number
    active: number
    pending: number
    suspended: number
    cancelled: number
  }
}

export default function PlatformResellersPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'suspend' | 'activate' | 'resend'; id: string; name: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'suspend' | 'activate' | null>(null)

  const { data: licensePlans } = useQuery({
    queryKey: ['license-plans'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get<{ id: string; name: string; slug: string }[]>('/platform/licenses/plans')
      return res.data
    },
    enabled: !!accessToken,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['platform-resellers', searchQuery, statusFilter, planFilter, sortBy, sortOrder, page],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (planFilter !== 'all') params.append('planId', planFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      params.append('page', page.toString())
      params.append('limit', '20')

      const res = await apiClient.get<ResellersResponse>(`/platform/resellers?${params.toString()}`)
      return res.data
    },
    enabled: !!accessToken,
    placeholderData: (previousData) => previousData,
  })

  const cancelInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/platform/resellers/${id}`)
    },
    onSuccess: () => {
      toast.success('Invitation annulee')
      refetch()
    },
    onError: () => {
      toast.error('Erreur lors de l\'annulation')
    },
  })

  const resendInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/platform/resellers/${id}/resend-invite`)
    },
    onSuccess: () => {
      toast.success('Invitation renvoyee')
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi')
    },
  })

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/platform/resellers/${id}/suspend`)
    },
    onSuccess: () => {
      toast.success('Revendeur suspendu')
      refetch()
    },
    onError: () => {
      toast.error('Erreur lors de la suspension')
    },
  })

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/platform/resellers/${id}/activate`)
    },
    onSuccess: () => {
      toast.success('Revendeur active')
      refetch()
    },
    onError: () => {
      toast.error('Erreur lors de l\'activation')
    },
  })

  const bulkSuspendMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiClient.post(`/platform/resellers/${id}/suspend`)))
    },
    onSuccess: () => {
      toast.success(`${selectedIds.length} revendeur(s) suspendu(s)`)
      setSelectedIds([])
      setBulkAction(null)
      refetch()
    },
    onError: () => {
      toast.error('Erreur lors de la suspension')
    },
  })

  const bulkActivateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiClient.post(`/platform/resellers/${id}/activate`)))
    },
    onSuccess: () => {
      toast.success(`${selectedIds.length} revendeur(s) active(s)`)
      setSelectedIds([])
      setBulkAction(null)
      refetch()
    },
    onError: () => {
      toast.error('Erreur lors de l\'activation')
    },
  })

  const toggleSelectAll = () => {
    if (selectedIds.length === resellers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(resellers.map(r => r.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  if (isLoading && !data) {
    return (
      <PageSkeleton
        navigation={platformNavigation}
        basePath="/platform"
        title="Revendeurs"
        variant="list"
      />
    )
  }

  const resellers = data?.resellers || []
  const pagination = data?.pagination
  const stats = data?.stats

  const exportToCSV = () => {
    if (!resellers.length) return
    
    const headers = ['Nom', 'Email', 'Telephone', 'Statut', 'Licence', 'Sites', 'Membres', 'Clients', 'Date creation']
    const rows = resellers.map(r => [
      r.name,
      r.email,
      r.phone || '',
      statusLabels[r.status] || r.status,
      r.license?.plan?.name || 'Aucune',
      r._count.sites.toString(),
      r._count.members.toString(),
      r._count.clients.toString(),
      format(new Date(r.createdAt), 'dd/MM/yyyy', { locale: fr }),
    ])
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `revendeurs_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Export CSV telecharge')
  }

  return (
    <DashboardLayout
      navigation={platformNavigation}
      basePath="/platform"
    >
      <PageHeader
        title="Revendeurs"
        subtitle="Gestion des revendeurs de la plateforme"
        icon={Building2}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download size={16} />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus size={16} />
              <span className="hidden sm:inline">Nouveau revendeur</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.total || 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.active || 0}</p>
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.pending || 0}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.suspended || 0}</p>
              <p className="text-xs text-gray-500">Suspendus</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un revendeur..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Actifs</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="SUSPENDED">Suspendus</SelectItem>
                <SelectItem value="CANCELLED">Annules</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={planFilter}
              onValueChange={(value) => {
                setPlanFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Licence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les licences</SelectItem>
                {licensePlans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split('-')
                setSortBy(field)
                setSortOrder(order as 'asc' | 'desc')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Plus recents</SelectItem>
                <SelectItem value="createdAt-asc">Plus anciens</SelectItem>
                <SelectItem value="name-asc">Nom A-Z</SelectItem>
                <SelectItem value="name-desc">Nom Z-A</SelectItem>
                <SelectItem value="sites-desc">Plus de sites</SelectItem>
                <SelectItem value="sites-asc">Moins de sites</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-sm text-blue-700 font-medium">
              {selectedIds.length} revendeur(s) selectionne(s)
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setBulkAction('activate')}
                className="gap-2 h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white"
              >
                <Play size={14} />
                Activer
              </Button>
              <Button
                size="sm"
                onClick={() => setBulkAction('suspend')}
                className="gap-2 h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Pause size={14} />
                Suspendre
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedIds([])}
                className="h-9 px-4 rounded-xl"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {resellers.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun revendeur trouve</p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-gray-100">
              {resellers.map((reseller) => (
                <div
                  key={reseller.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/platform/resellers/${reseller.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {reseller.logo ? (
                        <img
                          src={reseller.logo}
                          alt={reseller.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">{reseller.name}</p>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                          statusColors[reseller.status] || 'bg-gray-100 text-gray-600'
                        )}>
                          {statusLabels[reseller.status] || reseller.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{reseller.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Store size={12} />
                          {reseller._count.sites} sites
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {reseller._count.members} membres
                        </span>
                        {reseller.license?.plan && (
                          <span>{reseller.license.plan.name}</span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={16} className="text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); router.push(`/platform/resellers/${reseller.id}`) }}
                          className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                        >
                          <Eye size={16} className="mr-3 text-gray-400" />
                          <span className="text-[13px] text-gray-700">Voir les details</span>
                        </DropdownMenuItem>
                        {reseller.status === 'PENDING' && (
                          <>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'resend', id: reseller.id, name: reseller.name }) }}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Mail size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Renvoyer l'invitation</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'cancel', id: reseller.id, name: reseller.name }) }}
                              className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                            >
                              <Trash2 size={16} className="mr-3" />
                              <span className="text-[13px]">Annuler l'invitation</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        {reseller.status === 'ACTIVE' && (
                          <>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'suspend', id: reseller.id, name: reseller.name }) }}
                              className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                            >
                              <Pause size={16} className="mr-3" />
                              <span className="text-[13px]">Suspendre</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        {reseller.status === 'SUSPENDED' && (
                          <>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'activate', id: reseller.id, name: reseller.name }) }}
                              className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                            >
                              <Play size={16} className="mr-3" />
                              <span className="text-[13px]">Reactiver</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 w-10">
                      <Checkbox
                        checked={selectedIds.length === resellers.length && resellers.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3">Revendeur</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Licence</th>
                    <th className="px-4 py-3 text-center">Sites</th>
                    <th className="px-4 py-3 text-center">Membres</th>
                    <th className="px-4 py-3">Cree le</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resellers.map((reseller) => (
                    <tr
                      key={reseller.id}
                      className={cn(
                        "hover:bg-gray-50 transition-colors cursor-pointer",
                        selectedIds.includes(reseller.id) && "bg-blue-50"
                      )}
                      onClick={() => router.push(`/platform/resellers/${reseller.id}`)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(reseller.id)}
                          onCheckedChange={() => toggleSelect(reseller.id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {reseller.logo ? (
                              <img
                                src={reseller.logo}
                                alt={reseller.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{reseller.name}</p>
                            <p className="text-xs text-gray-500">{reseller.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{reseller.email}</p>
                        {reseller.phone && (
                          <p className="text-xs text-gray-500">{reseller.phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          statusColors[reseller.status] || 'bg-gray-100 text-gray-600'
                        )}>
                          {statusLabels[reseller.status] || reseller.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {reseller.license?.plan ? (
                          <span className="text-sm text-gray-900">{reseller.license.plan.name}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <Store size={14} />
                          {reseller._count.sites}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <Users size={14} />
                          {reseller._count.members}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {format(new Date(reseller.createdAt), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button 
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal size={18} className="text-gray-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); router.push(`/platform/resellers/${reseller.id}`) }}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Eye size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Voir les details</span>
                              </DropdownMenuItem>
                              {reseller.status === 'PENDING' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'resend', id: reseller.id, name: reseller.name }) }}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                                  >
                                    <Mail size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Renvoyer l'invitation</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1" />
                                  <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'cancel', id: reseller.id, name: reseller.name }) }}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                                  >
                                    <Trash2 size={16} className="mr-3" />
                                    <span className="text-[13px]">Annuler l'invitation</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {reseller.status === 'ACTIVE' && (
                                <>
                                  <DropdownMenuSeparator className="my-1" />
                                  <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'suspend', id: reseller.id, name: reseller.name }) }}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                                  >
                                    <Pause size={16} className="mr-3" />
                                    <span className="text-[13px]">Suspendre</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {reseller.status === 'SUSPENDED' && (
                                <>
                                  <DropdownMenuSeparator className="my-1" />
                                  <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'activate', id: reseller.id, name: reseller.name }) }}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                                  >
                                    <Play size={16} className="mr-3" />
                                    <span className="text-[13px]">Reactiver</span>
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

            {pagination && pagination.pages > 1 && (
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-500 text-center sm:text-left">
                  Page {pagination.page} sur {pagination.pages} ({pagination.total} revendeurs)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateResellerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          refetch()
        }}
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) {
            cancelInvitationMutation.mutate(confirmAction.id)
            setConfirmAction(null)
          }
        }}
        title="Annuler l'invitation"
        message={`Etes-vous sur de vouloir annuler l'invitation pour "${confirmAction?.name}" ? Cette action est irreversible.`}
        confirmText="Annuler l'invitation"
        cancelText="Retour"
        variant="danger"
        icon="trash"
        isLoading={cancelInvitationMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'suspend'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) {
            suspendMutation.mutate(confirmAction.id)
            setConfirmAction(null)
          }
        }}
        title="Suspendre le revendeur"
        message={`Etes-vous sur de vouloir suspendre "${confirmAction?.name}" ? Le revendeur n'aura plus acces a son espace.`}
        confirmText="Suspendre"
        cancelText="Annuler"
        variant="warning"
        icon="pause"
        isLoading={suspendMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'activate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) {
            activateMutation.mutate(confirmAction.id)
            setConfirmAction(null)
          }
        }}
        title="Reactiver le revendeur"
        message={`Etes-vous sur de vouloir reactiver "${confirmAction?.name}" ? Le revendeur aura de nouveau acces a son espace.`}
        confirmText="Reactiver"
        cancelText="Annuler"
        variant="info"
        icon="play"
        isLoading={activateMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'resend'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) {
            resendInvitationMutation.mutate(confirmAction.id)
            setConfirmAction(null)
          }
        }}
        title="Renvoyer l'invitation"
        message={`Voulez-vous renvoyer l'invitation a "${confirmAction?.name}" ?`}
        confirmText="Renvoyer"
        cancelText="Annuler"
        variant="info"
        icon="mail"
        isLoading={resendInvitationMutation.isPending}
      />

      <ConfirmModal
        isOpen={bulkAction === 'suspend'}
        onClose={() => setBulkAction(null)}
        onConfirm={() => bulkSuspendMutation.mutate(selectedIds)}
        title="Suspendre les revendeurs"
        message={`Etes-vous sur de vouloir suspendre ${selectedIds.length} revendeur(s) ? Ils n'auront plus acces a leur espace.`}
        confirmText="Suspendre"
        cancelText="Annuler"
        variant="warning"
        icon="pause"
        isLoading={bulkSuspendMutation.isPending}
      />

      <ConfirmModal
        isOpen={bulkAction === 'activate'}
        onClose={() => setBulkAction(null)}
        onConfirm={() => bulkActivateMutation.mutate(selectedIds)}
        title="Activer les revendeurs"
        message={`Etes-vous sur de vouloir activer ${selectedIds.length} revendeur(s) ?`}
        confirmText="Activer"
        cancelText="Annuler"
        variant="info"
        icon="play"
        isLoading={bulkActivateMutation.isPending}
      />
    </DashboardLayout>
  )
}
