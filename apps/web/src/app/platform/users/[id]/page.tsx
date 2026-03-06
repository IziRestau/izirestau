'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { platformNavigation } from '@/config/platform-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldOff,
  Building2,
  Store,
  CheckCircle,
  XCircle,
  KeyRound,
  Ban,
  Play,
  Trash2,
  Globe,
  Clock,
  Edit,
  MessageSquare,
  Loader2,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { EditUserModal } from '@/components/platform/EditUserModal'

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

interface UserDetail {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  userType: string
  emailVerified: boolean
  emailVerifiedAt: string | null
  twoFactorEnabled: boolean
  twoFactorVerifiedAt: string | null
  isSuperAdmin: boolean
  language: string
  timezone: string
  notifyEmailInvoice: boolean
  notifyEmailPayment: boolean
  notifyEmailNewSite: boolean
  notifyEmailNewClient: boolean
  notifyEmailWeeklyReport: boolean
  notifyEmailMarketing: boolean
  createdAt: string
  updatedAt: string
  resellerProfile?: {
    id: string
    role: string
    isActive: boolean
    permissions: string[]
    invitedAt: string | null
    joinedAt: string | null
    organization: {
      id: string
      name: string
      slug: string
      email: string
      logo: string | null
      status: string
    }
  } | null
  restaurantProfile?: {
    id: string
    role: string
    isActive: boolean
    position: string | null
    permissions: string[]
    restaurant: {
      id: string
      name: string
      logo: string | null
      site?: {
        id: string
        subdomain: string
        status: string
      } | null
    }
  } | null
  _count: {
    ticketsCreated: number
    ticketsAssigned: number
  }
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accessToken, user: currentUser } = useAuthStore()
  const userId = params.id as string

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'activate' | 'delete' | 'reset-password' | 'toggle-admin'
    isSuperAdmin?: boolean
  } | null>(null)

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['platform-user', userId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get<UserDetail>(`/platform/users/${userId}`)
      return res.data
    },
    enabled: !!accessToken && !!userId,
  })

  const suspendMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/platform/users/${userId}/suspend`)
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
    mutationFn: async () => {
      await apiClient.post(`/platform/users/${userId}/activate`)
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
    mutationFn: async () => {
      await apiClient.delete(`/platform/users/${userId}`)
    },
    onSuccess: () => {
      toast.success('Utilisateur supprime')
      queryClient.invalidateQueries({ queryKey: ['platform-users'] })
      router.push('/platform/users')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/platform/users/${userId}/reset-password`)
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
    mutationFn: async () => {
      await apiClient.post(`/platform/users/${userId}/toggle-admin`)
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
        suspendMutation.mutate()
        break
      case 'activate':
        activateMutation.mutate()
        break
      case 'delete':
        deleteMutation.mutate()
        break
      case 'reset-password':
        resetPasswordMutation.mutate()
        break
      case 'toggle-admin':
        toggleAdminMutation.mutate()
        break
    }
  }

  if (isLoading || !user) {
    return (
      <PageSkeleton
        navigation={platformNavigation}
        basePath="/platform"
        title="Utilisateur"
        variant="detail"
      />
    )
  }

  const isActive = user.resellerProfile?.isActive ?? user.restaurantProfile?.isActive ?? true
  const canModify = !user.isSuperAdmin || user.id !== currentUser?.id

  return (
    <DashboardLayout
      navigation={platformNavigation}
      basePath="/platform"
    >
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/platform/users')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={16} />
          Retour aux utilisateurs
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-medium text-gray-500">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                {user.isSuperAdmin && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                    <Shield size={12} />
                    Super Admin
                  </span>
                )}
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  userTypeColors[user.userType] || 'bg-gray-100 text-gray-600'
                )}>
                  {userTypeLabels[user.userType] || user.userType}
                </span>
                {!isActive && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Inactif
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail size={14} />
                  {user.email}
                </span>
                {user.phone && <span>{user.phone}</span>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} className="gap-2">
                <Edit size={14} />
                Modifier
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MoreHorizontal size={14} />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg">
                  <DropdownMenuItem
                    onClick={() => setConfirmAction({ type: 'reset-password' })}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                  >
                    <KeyRound size={16} className="mr-3 text-gray-400" />
                    <span className="text-[13px] text-gray-700">Reset mot de passe</span>
                  </DropdownMenuItem>
                  {canModify && (
                    <>
                      <DropdownMenuSeparator />
                      {!user.isSuperAdmin && (
                        <>
                          {isActive ? (
                            <DropdownMenuItem
                              onClick={() => setConfirmAction({ type: 'suspend' })}
                              className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                            >
                              <Ban size={16} className="mr-3" />
                              <span className="text-[13px]">Suspendre</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setConfirmAction({ type: 'activate' })}
                              className="rounded-lg px-3 py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                            >
                              <Play size={16} className="mr-3" />
                              <span className="text-[13px]">Reactiver</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: 'toggle-admin', isSuperAdmin: false })}
                            className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                          >
                            <ShieldCheck size={16} className="mr-3 text-purple-500" />
                            <span className="text-[13px] text-gray-700">Promouvoir Admin</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ type: 'delete' })}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                          >
                            <Trash2 size={16} className="mr-3" />
                            <span className="text-[13px]">Supprimer</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.isSuperAdmin && user.id !== currentUser?.id && (
                        <DropdownMenuItem
                          onClick={() => setConfirmAction({ type: 'toggle-admin', isSuperAdmin: true })}
                          className="rounded-lg px-3 py-2.5 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                        >
                          <ShieldOff size={16} className="mr-3" />
                          <span className="text-[13px]">Retirer droits Admin</span>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Telephone</p>
                  <p className="text-sm font-medium text-gray-900">{user.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Globe size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Langue</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.language === 'fr' ? 'Francais' : user.language === 'en' ? 'English' : user.language}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Clock size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Fuseau horaire</p>
                  <p className="text-sm font-medium text-gray-900">{user.timezone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Cree le</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Derniere mise a jour</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(user.updatedAt), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Organisation */}
          {(user.resellerProfile || user.restaurantProfile) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Organisation</h2>
              
              {user.resellerProfile && (
                <div
                  className="p-4 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => router.push(`/platform/resellers/${user.resellerProfile!.organization.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                      {user.resellerProfile.organization.logo ? (
                        <img
                          src={user.resellerProfile.organization.logo}
                          alt={user.resellerProfile.organization.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 size={24} className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.resellerProfile.organization.name}</p>
                      <p className="text-sm text-gray-500">{user.resellerProfile.organization.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {user.resellerProfile.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.resellerProfile.isActive ? 'Actif' : 'Inactif'}
                      </p>
                    </div>
                  </div>
                  {user.resellerProfile.joinedAt && (
                    <p className="text-xs text-gray-500 mt-3">
                      Membre depuis le {format(new Date(user.resellerProfile.joinedAt), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  )}
                </div>
              )}

              {user.restaurantProfile && (
                <div
                  className="p-4 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => user.restaurantProfile?.restaurant.site && router.push(`/platform/restaurants/${user.restaurantProfile.restaurant.site.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                      {user.restaurantProfile.restaurant.logo ? (
                        <img
                          src={user.restaurantProfile.restaurant.logo}
                          alt={user.restaurantProfile.restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store size={24} className="text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.restaurantProfile.restaurant.name}</p>
                      {user.restaurantProfile.position && (
                        <p className="text-sm text-gray-500">{user.restaurantProfile.position}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        {user.restaurantProfile.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.restaurantProfile.isActive ? 'Actif' : 'Inactif'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activite Support */}
          {(user._count.ticketsCreated > 0 || user._count.ticketsAssigned > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activite Support</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <MessageSquare size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{user._count.ticketsCreated}</p>
                  <p className="text-sm text-gray-500">Tickets crees</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <Users size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{user._count.ticketsAssigned}</p>
                  <p className="text-sm text-gray-500">Tickets assignes</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Securite */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Securite</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail size={18} className={user.emailVerified ? 'text-green-500' : 'text-gray-400'} />
                  <span className="text-sm text-gray-700">Email verifie</span>
                </div>
                {user.emailVerified ? (
                  <CheckCircle size={18} className="text-green-500" />
                ) : (
                  <XCircle size={18} className="text-gray-400" />
                )}
              </div>
              {user.emailVerifiedAt && (
                <p className="text-xs text-gray-500 -mt-2 ml-9">
                  Verifie le {format(new Date(user.emailVerifiedAt), 'dd/MM/yyyy', { locale: fr })}
                </p>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield size={18} className={user.twoFactorEnabled ? 'text-green-500' : 'text-gray-400'} />
                  <span className="text-sm text-gray-700">2FA active</span>
                </div>
                {user.twoFactorEnabled ? (
                  <CheckCircle size={18} className="text-green-500" />
                ) : (
                  <XCircle size={18} className="text-gray-400" />
                )}
              </div>
              {user.twoFactorVerifiedAt && (
                <p className="text-xs text-gray-500 -mt-2 ml-9">
                  Active le {format(new Date(user.twoFactorVerifiedAt), 'dd/MM/yyyy', { locale: fr })}
                </p>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className={user.isSuperAdmin ? 'text-purple-500' : 'text-gray-400'} />
                  <span className="text-sm text-gray-700">Super Admin</span>
                </div>
                {user.isSuperAdmin ? (
                  <CheckCircle size={18} className="text-purple-500" />
                ) : (
                  <XCircle size={18} className="text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications Email</h2>
            <div className="space-y-3">
              {[
                { key: 'notifyEmailInvoice', label: 'Factures' },
                { key: 'notifyEmailPayment', label: 'Paiements' },
                { key: 'notifyEmailNewSite', label: 'Nouveaux sites' },
                { key: 'notifyEmailNewClient', label: 'Nouveaux clients' },
                { key: 'notifyEmailWeeklyReport', label: 'Rapport hebdo' },
                { key: 'notifyEmailMarketing', label: 'Marketing' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{label}</span>
                  {(user as any)[key] ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => refetch()}
        user={user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          language: user.language,
          timezone: user.timezone,
          emailVerified: user.emailVerified,
        } : null}
      />

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmAction?.type === 'suspend'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title="Suspendre l'utilisateur"
        message={`Etes-vous sur de vouloir suspendre ${user.firstName} ${user.lastName} ? L'utilisateur ne pourra plus se connecter.`}
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
        message={`Etes-vous sur de vouloir reactiver ${user.firstName} ${user.lastName} ?`}
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
        message={`Etes-vous sur de vouloir supprimer definitivement ${user.firstName} ${user.lastName} ? Cette action est irreversible.`}
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
        message={`Un email de reinitialisation sera envoye a ${user.email}.`}
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
          ? `Etes-vous sur de vouloir retirer les droits Super Admin a ${user.firstName} ${user.lastName} ?`
          : `Etes-vous sur de vouloir promouvoir ${user.firstName} ${user.lastName} en Super Admin ? Il aura acces a toute la plateforme.`
        }
        confirmText={confirmAction?.isSuperAdmin ? 'Retirer' : 'Promouvoir'}
        variant={confirmAction?.isSuperAdmin ? 'warning' : 'info'}
        isLoading={toggleAdminMutation.isPending}
        icon="alert"
      />
    </DashboardLayout>
  )
}
