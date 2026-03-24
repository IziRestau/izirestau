'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Bike,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
  Mail,
  ToggleLeft,
  ToggleRight,
  Star,
  MapPin,
  Car,
  Footprints,
  Send,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import { DashboardLayout } from '@/components/shared/dashboard'
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
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { DriverFormModal } from '@/components/restaurant/delivery/DriverFormModal'

type VehicleType = 'BIKE' | 'SCOOTER' | 'CAR' | 'WALK'

interface Driver {
  id: string
  userId: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string | null
    avatar: string | null
  }
  invitePending: boolean
  inviteExpired: boolean
  licenseNumber: string | null
  vehicleType: VehicleType
  vehiclePlate: string | null
  isActive: boolean
  isOnline: boolean
  isAvailable: boolean
  currentLatitude: number | null
  currentLongitude: number | null
  lastLocationUpdate: string | null
  totalDeliveries: number
  avgRating: number | null
  currentDeliveryId: string | null
  createdAt: string
  updatedAt: string
}

const vehicleTypeLabels: Record<VehicleType, string> = {
  BIKE: 'Velo',
  SCOOTER: 'Scooter',
  CAR: 'Voiture',
  WALK: 'A pied',
}

const vehicleTypeIcons: Record<VehicleType, typeof Bike> = {
  BIKE: Bike,
  SCOOTER: Bike,
  CAR: Car,
  WALK: Footprints,
}

export default function DriversPage() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  
  const primaryColor = organization?.primaryColor || '#10b981'

  const handleSwitchRestaurant = (restaurantId: string) => {
    if (accessToken) {
      switchRestaurant(accessToken, restaurantId)
    }
  }

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isResendInviteModalOpen, setIsResendInviteModalOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.getDrivers()
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.deleteDriver(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('Livreur supprime')
      setIsDeleteModalOpen(false)
      setSelectedDriver(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.toggleDriverStatus(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('Statut modifie')
    },
    onError: () => {
      toast.error('Erreur lors de la modification')
    },
  })

  const resendInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.resendDriverInvite(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('Invitation renvoyee')
      setIsResendInviteModalOpen(false)
      setSelectedDriver(null)
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi')
    },
  })

  const drivers: Driver[] = (data?.data || []) as Driver[]
  
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = search === '' || 
      driver.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      driver.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      driver.user.email.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === '' ||
      (statusFilter === 'active' && driver.isActive) ||
      (statusFilter === 'inactive' && !driver.isActive) ||
      (statusFilter === 'online' && driver.isOnline) ||
      (statusFilter === 'available' && driver.isAvailable)
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: drivers.length,
    active: drivers.filter(d => d.isActive).length,
    online: drivers.filter(d => d.isOnline).length,
    available: drivers.filter(d => d.isAvailable).length,
  }

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver)
    setIsFormModalOpen(true)
  }

  const handleDelete = (driver: Driver) => {
    setSelectedDriver(driver)
    setIsDeleteModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedDriver(null)
    setIsFormModalOpen(true)
  }

  const handleToggle = (driver: Driver) => {
    toggleMutation.mutate(driver.id)
  }

  const handleResendInvite = (driver: Driver) => {
    setSelectedDriver(driver)
    setIsResendInviteModalOpen(true)
  }

  const confirmResendInvite = () => {
    if (selectedDriver) {
      resendInviteMutation.mutate(selectedDriver.id)
    }
  }

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={handleSwitchRestaurant}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Bike size={24} style={{ color: primaryColor }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Livreurs</h1>
              {stats.total > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {stats.total} livreur{stats.total > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Gerez vos livreurs et leurs disponibilites
            </p>
          </div>
        </div>

        <Button
          onClick={handleCreate}
          style={{ backgroundColor: primaryColor }}
          className="text-white h-11 rounded-xl"
        >
          <Plus size={16} className="mr-2" />
          Ajouter un livreur
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500">Actifs</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500">En ligne</p>
          <p className="text-2xl font-bold text-blue-600">{stats.online}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500">Disponibles</p>
          <p className="text-2xl font-bold text-amber-600">{stats.available}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un livreur..."
              className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          <Select
            value={statusFilter || 'all'}
            onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}
          >
            <SelectTrigger 
              className="w-full sm:w-[180px] h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
              <SelectItem value="online">En ligne</SelectItem>
              <SelectItem value="available">Disponibles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Livreur</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicule</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-40 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Bike className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500 mb-2">Aucun livreur trouve</p>
                    <Button 
                      variant="link" 
                      onClick={handleCreate}
                      style={{ color: primaryColor }}
                    >
                      Ajouter un livreur
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => {
                  const VehicleIcon = vehicleTypeIcons[driver.vehicleType]
                  return (
                    <tr key={driver.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {driver.user.avatar ? (
                              <img 
                                src={driver.user.avatar} 
                                alt={driver.user.firstName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                                style={{ backgroundColor: primaryColor }}
                              >
                                {driver.user.firstName[0]}{driver.user.lastName[0]}
                              </div>
                            )}
                            {driver.isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {driver.user.firstName} {driver.user.lastName}
                            </p>
                            {driver.lastLocationUpdate && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={10} />
                                Derniere position il y a {getTimeAgo(driver.lastLocationUpdate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]">{driver.user.email}</span>
                          </div>
                          {driver.user.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{driver.user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <VehicleIcon size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-900">{vehicleTypeLabels[driver.vehicleType]}</span>
                        </div>
                        {driver.vehiclePlate && (
                          <p className="text-xs text-gray-500 mt-0.5">{driver.vehiclePlate}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-900">{driver.totalDeliveries} livraisons</p>
                          {driver.avgRating && (
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Star size={12} fill="currentColor" />
                              <span>{driver.avgRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          {driver.invitePending ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              driver.inviteExpired 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {driver.inviteExpired ? (
                                <><AlertCircle size={10} /> Expiree</>
                              ) : (
                                <><Clock size={10} /> En attente</>
                              )}
                            </span>
                          ) : (
                            <>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                driver.isActive 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {driver.isActive ? 'Actif' : 'Inactif'}
                              </span>
                              {driver.isActive && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  driver.isAvailable 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {driver.isAvailable ? 'Disponible' : 'En course'}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[180px]">
                            <DropdownMenuItem onClick={() => handleEdit(driver)}>
                              <Pencil size={14} className="mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            {driver.invitePending && (
                              <DropdownMenuItem 
                                onClick={() => handleResendInvite(driver)}
                                disabled={resendInviteMutation.isPending}
                              >
                                <Send size={14} className="mr-2" />
                                Renvoyer l'invitation
                              </DropdownMenuItem>
                            )}
                            {!driver.invitePending && (
                              <DropdownMenuItem onClick={() => handleToggle(driver)}>
                                {driver.isActive ? (
                                  <>
                                    <ToggleLeft size={14} className="mr-2" />
                                    Desactiver
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight size={14} className="mr-2" />
                                    Activer
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(driver)}
                              className="text-red-600"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal création/édition */}
      <DriverFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedDriver(null)
        }}
        driver={selectedDriver}
        primaryColor={primaryColor}
      />

      {/* Modal suppression */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedDriver(null)
        }}
        onConfirm={() => selectedDriver && deleteMutation.mutate(selectedDriver.id)}
        title="Supprimer le livreur"
        message={`Etes-vous sur de vouloir supprimer ${selectedDriver?.user.firstName} ${selectedDriver?.user.lastName} ? Cette action est irreversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Modal renvoi invitation */}
      <ConfirmModal
        isOpen={isResendInviteModalOpen}
        onClose={() => {
          setIsResendInviteModalOpen(false)
          setSelectedDriver(null)
        }}
        onConfirm={confirmResendInvite}
        title="Renvoyer l'invitation"
        message={`Voulez-vous renvoyer l'invitation a ${selectedDriver?.user.firstName} ${selectedDriver?.user.lastName} (${selectedDriver?.user.email}) ?`}
        confirmText="Renvoyer"
        variant="info"
        isLoading={resendInviteMutation.isPending}
      />
    </DashboardLayout>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'quelques secondes'
  if (diffMins < 60) return `${diffMins} min`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}j`
}
