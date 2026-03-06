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
  Users,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  Store,
  MoreHorizontal,
  Mail,
  Ban,
  Trash2,
  Play,
  Download,
  KeyRound,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ConfirmModal } from '@/components/shared/ConfirmModal'

const userTypeLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  RESELLER: 'Revendeur',
  RESTAURANT: 'Restaurant',
  DRIVER: 'Livreur',
  CUSTOMER: 'Client',
}

const userTypeColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  RESELLER: 'bg-blue-100 text-blue-700',
  RESTAURANT: 'bg-orange-100 text-orange-700',
  DRIVER: 'bg-green-100 text-green-700',
  CUSTOMER: 'bg-gray-100 text-gray-600',
}

interface PlatformUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  userType: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  isSuperAdmin: boolean
  language: string
  timezone: string
  createdAt: string
  updatedAt: string
  resellerProfile?: {
    id: string
    role: string
    isActive: boolean
    organization: {
      id: string
      name: string
      slug: string
    }
  } | null
  restaurantProfile?: {
    id: string
    role: string
    isActive: boolean
    restaurant: {
      id: string
      name: string
    }
  } | null
}

interface UsersResponse {
  users: PlatformUser[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface StatsResponse {
  total: number
  byType: {
    superAdmins: number
    resellers: number
    restaurants: number
    drivers: number
    customers: number
  }
  security: {
    emailVerified: number
    twoFactorEnabled: number
  }
  newUsers: {
    thisMonth: number
    thisWeek: number
    today: number
  }
}

export default function PlatformUsersPage() {
  const router = useRouter()
  const { accessToken, user: currentUser } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'activate' | 'delete' | 'reset-password' | 'toggle-admin'
    id: string
    name: string
    isSuperAdmin?: boolean
  } | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['platform-users-stats'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get<StatsResponse>('/platform/users/stats')
      return res.data
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['platform-users', searchQuery, userTypeFilter, sortBy, sortOrder, page],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (userTypeFilter !== 'all') params.append('userType', userTypeFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      params.append('page', page.toString())
      params.append('limit', '20')

      const res = await apiClient.get<UsersResponse>(`/platform/users?${params.toString()}`)
      return res as unknown as UsersResponse
    },
    enabled: !!accessToken,
    placeholderData: (previousData) => previousData,
  })

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/platform/users/${id}/suspend`)
    },
    onSuccess: () => {
      toast.success('Utilisateur suspendu')
      setConfirmAction(null)
      refetch()
    },
    onError: () => {
      toast.error('Erreur lors de la suspension')
    },
  })

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/platform/users/${id}/activate`)
    },
    onSuccess: () => {
      toast.success('Utilisateur reactive')
      setConfirmAction(null)
      refetch()
    },
    onError: () => {
      toast.error('Erreur lors de l\'activation')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/platform/users/${id}`)
    },
    onSuccess: () => {
      toast.success('Utilisateur supprime')
      setConfirmAction(null)
      refetch()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/platform/users/${id}/reset-password`)
    },
    onSuccess: () => {
      toast.success('Email de reinitialisation envoye')
      setConfirmAction(null)
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi')
    },
  })

  const toggleAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/platform/users/${id}/toggle-admin`)
    },
    onSuccess: () => {
      toast.success('Droits admin mis a jour')
      setConfirmAction(null)
      refetch()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la modification')
    },
  })

  const handleConfirmAction = () => {
    if (!confirmAction) return
    switch (confirmAction.type) {
      case 'suspend':
        suspendMutation.mutate(confirmAction.id)
        break
      case 'activate':
        activateMutation.mutate(confirmAction.id)
        break
      case 'delete':
        deleteMutation.mutate(confirmAction.id)
        break
      case 'reset-password':
        resetPasswordMutation.mutate(confirmAction.id)
        break
      case 'toggle-admin':
        toggleAdminMutation.mutate(confirmAction.id)
        break
    }
  }

  const isUserActive = (user: PlatformUser) => {
    if (user.resellerProfile) return user.resellerProfile.isActive
    if (user.restaurantProfile) return user.restaurantProfile.isActive
    return true
  }

  const getUserOrganization = (user: PlatformUser) => {
    if (user.resellerProfile?.organization) {
      return {
        type: 'reseller',
        name: user.resellerProfile.organization.name,
        id: user.resellerProfile.organization.id,
      }
    }
    if (user.restaurantProfile?.restaurant) {
      return {
        type: 'restaurant',
        name: user.restaurantProfile.restaurant.name,
        id: user.restaurantProfile.restaurant.id,
      }
    }
    return null
  }

  if (isLoading && !data) {
    return (
      <PageSkeleton
        navigation={platformNavigation}
        basePath="/platform"
        title="Utilisateurs"
        variant="list"
      />
    )
  }

  const users = data?.users || []
  const pagination = data?.pagination

  const exportToCSV = async () => {
    try {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const params = new URLSearchParams()
      if (userTypeFilter !== 'all') params.append('userType', userTypeFilter)
      
      const res = await apiClient.get<PlatformUser[]>(`/platform/users/export?${params.toString()}`)
      const exportUsers = res.data || []
      
      if (!exportUsers.length) {
        toast.error('Aucun utilisateur a exporter')
        return
      }

      const headers = ['Prenom', 'Nom', 'Email', 'Telephone', 'Type', 'Organisation', 'Email verifie', '2FA', 'Super Admin', 'Date creation']
      const rows = exportUsers.map((u: any) => {
        const org = u.resellerProfile?.organization?.name || u.restaurantProfile?.restaurant?.name || ''
        return [
          u.firstName,
          u.lastName,
          u.email,
          u.phone || '',
          userTypeLabels[u.userType] || u.userType,
          org,
          u.emailVerified ? 'Oui' : 'Non',
          u.twoFactorEnabled ? 'Oui' : 'Non',
          u.isSuperAdmin ? 'Oui' : 'Non',
          format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: fr }),
        ]
      })

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
      ].join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `utilisateurs_${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Export CSV telecharge')
    } catch {
      toast.error('Erreur lors de l\'export')
    }
  }

  return (
    <DashboardLayout
      navigation={platformNavigation}
      basePath="/platform"
    >
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des utilisateurs de la plateforme"
        icon={Users}
        actions={
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download size={16} />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.total || 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.byType?.resellers || 0}</p>
              <p className="text-xs text-gray-500">Revendeurs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Store size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.byType?.restaurants || 0}</p>
              <p className="text-xs text-gray-500">Restaurants</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.byType?.superAdmins || 0}</p>
              <p className="text-xs text-gray-500">Admins</p>
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
              placeholder="Rechercher un utilisateur..."
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
              value={userTypeFilter}
              onValueChange={(value) => {
                setUserTypeFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="RESELLER">Revendeurs</SelectItem>
                <SelectItem value="RESTAURANT">Restaurants</SelectItem>
                <SelectItem value="DRIVER">Livreurs</SelectItem>
                <SelectItem value="CUSTOMER">Clients</SelectItem>
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
                <SelectItem value="firstName-asc">Prenom A-Z</SelectItem>
                <SelectItem value="firstName-desc">Prenom Z-A</SelectItem>
                <SelectItem value="email-asc">Email A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun utilisateur trouve</p>
          </div>
        ) : (
          <>
            {/* Mobile view */}
            <div className="md:hidden divide-y divide-gray-100">
              {users.map((user) => {
                const org = getUserOrganization(user)
                const isActive = isUserActive(user)
                return (
                  <div
                    key={user.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/platform/users/${user.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-medium text-gray-500">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.isSuperAdmin && (
                            <Shield size={14} className="text-purple-500 flex-shrink-0" />
                          )}
                          {!isActive && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600 flex-shrink-0">
                              Inactif
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full font-medium',
                            userTypeColors[user.userType] || 'bg-gray-100 text-gray-600'
                          )}>
                            {userTypeLabels[user.userType] || user.userType}
                          </span>
                          {org && (
                            <span className="text-gray-500 truncate">{org.name}</span>
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
                            onClick={(e) => { e.stopPropagation(); router.push(`/platform/users/${user.id}`) }}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <Eye size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Voir les details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'reset-password', id: user.id, name: `${user.firstName} ${user.lastName}` }) }}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <KeyRound size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Reset mot de passe</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          {!user.isSuperAdmin && (
                            <>
                              {isActive ? (
                                <DropdownMenuItem
                                  onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'suspend', id: user.id, name: `${user.firstName} ${user.lastName}` }) }}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                                >
                                  <Ban size={16} className="mr-3" />
                                  <span className="text-[13px]">Suspendre</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'activate', id: user.id, name: `${user.firstName} ${user.lastName}` }) }}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                                >
                                  <Play size={16} className="mr-3" />
                                  <span className="text-[13px]">Reactiver</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'toggle-admin', id: user.id, name: `${user.firstName} ${user.lastName}`, isSuperAdmin: user.isSuperAdmin }) }}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <ShieldCheck size={16} className="mr-3 text-purple-500" />
                                <span className="text-[13px] text-gray-700">Promouvoir Admin</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'delete', id: user.id, name: `${user.firstName} ${user.lastName}` }) }}
                                className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                              >
                                <Trash2 size={16} className="mr-3" />
                                <span className="text-[13px]">Supprimer</span>
                              </DropdownMenuItem>
                            </>
                          )}
                          {user.isSuperAdmin && user.id !== currentUser?.id && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'toggle-admin', id: user.id, name: `${user.firstName} ${user.lastName}`, isSuperAdmin: user.isSuperAdmin }) }}
                              className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                            >
                              <ShieldOff size={16} className="mr-3" />
                              <span className="text-[13px]">Retirer droits Admin</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organisation
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Securite
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cree le
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => {
                    const org = getUserOrganization(user)
                    const isActive = isUserActive(user)
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/platform/users/${user.id}`)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-500">
                                  {user.firstName[0]}{user.lastName[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </p>
                                {user.isSuperAdmin && (
                                  <Shield size={14} className="text-purple-500" />
                                )}
                                {!isActive && (
                                  <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600">
                                    Inactif
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            userTypeColors[user.userType] || 'bg-gray-100 text-gray-600'
                          )}>
                            {userTypeLabels[user.userType] || user.userType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {org ? (
                            <div className="flex items-center gap-2">
                              {org.type === 'reseller' ? (
                                <Building2 size={14} className="text-gray-400" />
                              ) : (
                                <Store size={14} className="text-gray-400" />
                              )}
                              <span className="text-sm text-gray-700">{org.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center gap-1" title={user.emailVerified ? 'Email verifie' : 'Email non verifie'}>
                              <Mail size={14} className={user.emailVerified ? 'text-green-500' : 'text-gray-300'} />
                            </div>
                            <div className="flex items-center gap-1" title={user.twoFactorEnabled ? '2FA active' : '2FA inactif'}>
                              <Shield size={14} className={user.twoFactorEnabled ? 'text-green-500' : 'text-gray-300'} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600">
                            {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
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
                                  onClick={(e) => { e.stopPropagation(); router.push(`/platform/users/${user.id}`) }}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                                >
                                  <Eye size={16} className="mr-3 text-gray-400" />
                                  <span className="text-[13px] text-gray-700">Voir les details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'reset-password', id: user.id, name: `${user.firstName} ${user.lastName}` }) }}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                                >
                                  <KeyRound size={16} className="mr-3 text-gray-400" />
                                  <span className="text-[13px] text-gray-700">Reset mot de passe</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                {!user.isSuperAdmin && (
                                  <>
                                    {isActive ? (
                                      <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'suspend', id: user.id, name: `${user.firstName} ${user.lastName}` }) }}
                                        className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                                      >
                                        <Ban size={16} className="mr-3" />
                                        <span className="text-[13px]">Suspendre</span>
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'activate', id: user.id, name: `${user.firstName} ${user.lastName}` }) }}
                                        className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                                      >
                                        <Play size={16} className="mr-3" />
                                        <span className="text-[13px]">Reactiver</span>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'toggle-admin', id: user.id, name: `${user.firstName} ${user.lastName}`, isSuperAdmin: user.isSuperAdmin }) }}
                                      className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                                    >
                                      <ShieldCheck size={16} className="mr-3 text-purple-500" />
                                      <span className="text-[13px] text-gray-700">Promouvoir Admin</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem
                                      onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'delete', id: user.id, name: `${user.firstName} ${user.lastName}` }) }}
                                      className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                                    >
                                      <Trash2 size={16} className="mr-3" />
                                      <span className="text-[13px]">Supprimer</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {user.isSuperAdmin && user.id !== currentUser?.id && (
                                  <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'toggle-admin', id: user.id, name: `${user.firstName} ${user.lastName}`, isSuperAdmin: user.isSuperAdmin }) }}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                                  >
                                    <ShieldOff size={16} className="mr-3" />
                                    <span className="text-[13px]">Retirer droits Admin</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  Affichage de {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                  {pagination.total} utilisateurs
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-sm text-gray-600 px-2">
                    Page {pagination.page} sur {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmAction?.type === 'suspend'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title="Suspendre l'utilisateur"
        message={`Etes-vous sur de vouloir suspendre ${confirmAction?.name} ? L'utilisateur ne pourra plus se connecter.`}
        confirmText="Suspendre"
        variant="warning"
        isLoading={suspendMutation.isPending}
        icon="pause"
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'activate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title="Reactiver l'utilisateur"
        message={`Etes-vous sur de vouloir reactiver ${confirmAction?.name} ?`}
        confirmText="Reactiver"
        variant="info"
        isLoading={activateMutation.isPending}
        icon="play"
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'delete'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title="Supprimer l'utilisateur"
        message={`Etes-vous sur de vouloir supprimer definitivement ${confirmAction?.name} ? Cette action est irreversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
        icon="trash"
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'reset-password'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title="Reinitialiser le mot de passe"
        message={`Un email de reinitialisation sera envoye a ${confirmAction?.name}.`}
        confirmText="Envoyer"
        variant="info"
        isLoading={resetPasswordMutation.isPending}
        icon="mail"
      />

      <ConfirmModal
        isOpen={confirmAction?.type === 'toggle-admin'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmAction?.isSuperAdmin ? 'Retirer les droits Admin' : 'Promouvoir Super Admin'}
        message={confirmAction?.isSuperAdmin
          ? `Etes-vous sur de vouloir retirer les droits Super Admin a ${confirmAction?.name} ?`
          : `Etes-vous sur de vouloir promouvoir ${confirmAction?.name} en Super Admin ? Il aura acces a toute la plateforme.`
        }
        confirmText={confirmAction?.isSuperAdmin ? 'Retirer' : 'Promouvoir'}
        variant={confirmAction?.isSuperAdmin ? 'warning' : 'info'}
        isLoading={toggleAdminMutation.isPending}
        icon="alert"
      />
    </DashboardLayout>
  )
}
