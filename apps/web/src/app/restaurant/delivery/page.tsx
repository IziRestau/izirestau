'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Truck,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  User,
  Package,
  ChevronRight,
  Filter,
  RefreshCw,
  Bike,
  Navigation,
  Star,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { useRestaurantPermissions } from '@/hooks/use-restaurant-permissions'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AssignDriverModal } from '@/components/restaurant/delivery/AssignDriverModal'

type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'DRIVER_EN_ROUTE' | 'AT_RESTAURANT' | 'PICKED_UP' | 'EN_ROUTE' | 'ARRIVED' | 'DELIVERED' | 'FAILED' | 'CANCELLED'

interface Delivery {
  id: string
  orderId: string
  order: {
    id: string
    orderNumber: string
    total: number
    customerName: string | null
    customerPhone: string | null
    createdAt: string
  }
  driver: {
    id: string
    name: string
    phone: string | null
    avatar: string | null
    vehicleType: string
  } | null
  status: DeliveryStatus
  address: Record<string, string>
  latitude: number | null
  longitude: number | null
  distanceKm: number | null
  estimatedTime: number | null
  assignedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  customerNotes: string | null
  customerRating: number | null
  createdAt: string
}

const statusConfig: Record<DeliveryStatus, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  ASSIGNED: { label: 'Assigne', color: 'bg-blue-100 text-blue-700', icon: User },
  DRIVER_EN_ROUTE: { label: 'Livreur en route', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  AT_RESTAURANT: { label: 'Au restaurant', color: 'bg-purple-100 text-purple-700', icon: MapPin },
  PICKED_UP: { label: 'Recupere', color: 'bg-cyan-100 text-cyan-700', icon: Package },
  EN_ROUTE: { label: 'En livraison', color: 'bg-blue-100 text-blue-700', icon: Truck },
  ARRIVED: { label: 'Arrive', color: 'bg-teal-100 text-teal-700', icon: MapPin },
  DELIVERED: { label: 'Livre', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  FAILED: { label: 'Echoue', color: 'bg-red-100 text-red-700', icon: XCircle },
  CANCELLED: { label: 'Annule', color: 'bg-gray-100 text-gray-600', icon: XCircle },
}

export default function DeliveriesPage() {
  const queryClient = useQueryClient()
  const { accessToken, user } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const { format: formatCurrency } = useRestaurantCurrency()
  const { isDriver } = useRestaurantPermissions()
  
  const primaryColor = organization?.primaryColor || '#10b981'

  const handleSwitchRestaurant = (restaurantId: string) => {
    if (accessToken) {
      switchRestaurant(accessToken, restaurantId)
    }
  }

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [deliveryToAssign, setDeliveryToAssign] = useState<Delivery | null>(null)

  // Données pour le livreur
  const { data: driverDeliveriesData, isLoading: driverLoading, refetch: refetchDriver } = useQuery({
    queryKey: ['driver-deliveries', statusFilter],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const status = statusFilter === 'active' ? 'active' : statusFilter === 'completed' ? 'completed' : undefined
      return api.driver.getDeliveries(status)
    },
    enabled: !!accessToken && isDriver,
    refetchInterval: 15000,
  })

  const { data: currentDeliveryData, refetch: refetchCurrent } = useQuery({
    queryKey: ['driver-current-delivery'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.driver.getCurrentDelivery()
    },
    enabled: !!accessToken && isDriver,
    refetchInterval: 10000,
  })

  const { data: driverStatsData } = useQuery({
    queryKey: ['driver-stats'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.driver.getStats()
    },
    enabled: !!accessToken && isDriver,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.driver.updateDeliveryStatus(id, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['driver-current-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['driver-stats'] })
      toast.success('Statut mis a jour')
    },
    onError: (error: any) => {
      const errorCode = error?.response?.data?.error || error?.error
      const errorMessage = error?.response?.data?.message || error?.message
      
      if (errorCode === 'ORDER_NOT_READY') {
        toast.error('La commande n\'est pas encore prete. Attendez que le restaurant la prepare.')
      } else if (errorCode === 'INVALID_TRANSITION') {
        toast.error('Cette action n\'est pas possible dans l\'etat actuel.')
      } else {
        toast.error(errorMessage || 'Erreur lors de la mise a jour')
      }
    },
  })

  const { data: deliveriesData, isLoading, refetch } = useQuery({
    queryKey: ['deliveries', currentRestaurantId, statusFilter],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const url = `/restaurant/deliveries${params.toString() ? `?${params.toString()}` : ''}`
      const response = await apiClient.get<{
        data: Delivery[]
        pagination: { total: number }
      }>(url)
      return response
    },
    enabled: !!accessToken && !!currentRestaurantId && !isDriver,
    refetchInterval: 30000,
  })

  const { data: statsResponse } = useQuery({
    queryKey: ['deliveries-stats', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const response = await apiClient.get<{
        totalToday: number
        pendingCount: number
        inProgressCount: number
        completedToday: number
        avgDeliveryTime: number
      }>('/restaurant/deliveries/stats')
      return response
    },
    enabled: !!accessToken && !!currentRestaurantId && !isDriver,
    refetchInterval: 60000,
  })

  const deliveries: Delivery[] = (deliveriesData as any)?.data || []
  const stats = statsResponse as { totalToday: number; pendingCount: number; inProgressCount: number; completedToday: number; avgDeliveryTime: number } | undefined

  const handleViewDetail = (delivery: Delivery) => {
    setSelectedDelivery(delivery)
    setIsDetailOpen(true)
  }

  const handleAssign = (delivery: Delivery) => {
    setDeliveryToAssign(delivery)
    setIsAssignModalOpen(true)
  }

  const handleAssignSuccess = () => {
    setIsAssignModalOpen(false)
    setDeliveryToAssign(null)
    queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    queryClient.invalidateQueries({ queryKey: ['deliveries-stats'] })
  }

  // Labels pour les statuts livreur
  const driverStatusLabels: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
    'ASSIGNED': { label: 'Assignee', color: 'bg-blue-100 text-blue-700', next: 'DRIVER_EN_ROUTE', nextLabel: 'En route vers le restaurant' },
    'DRIVER_EN_ROUTE': { label: 'En route', color: 'bg-amber-100 text-amber-700', next: 'AT_RESTAURANT', nextLabel: 'Arrive au restaurant' },
    'AT_RESTAURANT': { label: 'Au restaurant', color: 'bg-orange-100 text-orange-700', next: 'PICKED_UP', nextLabel: 'Commande recuperee' },
    'PICKED_UP': { label: 'Recuperee', color: 'bg-purple-100 text-purple-700', next: 'EN_ROUTE', nextLabel: 'En route vers le client' },
    'EN_ROUTE': { label: 'En livraison', color: 'bg-indigo-100 text-indigo-700', next: 'ARRIVED', nextLabel: 'Arrive chez le client' },
    'ARRIVED': { label: 'Arrive', color: 'bg-teal-100 text-teal-700', next: 'DELIVERED', nextLabel: 'Livraison terminee' },
    'DELIVERED': { label: 'Livree', color: 'bg-emerald-100 text-emerald-700' },
    'FAILED': { label: 'Echouee', color: 'bg-red-100 text-red-700' },
    'CANCELLED': { label: 'Annulee', color: 'bg-gray-100 text-gray-600' },
  }

  const currentDelivery = currentDeliveryData?.data
  const driverDeliveries = driverDeliveriesData?.data || []
  const driverStats = driverStatsData?.data

  // Vue Livreur
  if (isDriver) {
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
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Mes livraisons</h1>
              <p className="text-sm text-gray-500">
                Bonjour {user?.firstName} !
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => refetchDriver()}
            className="h-11 rounded-xl"
          >
            <RefreshCw size={16} className="mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500">Aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-900">{driverStats?.todayDeliveries || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500">Cette semaine</p>
            <p className="text-2xl font-bold text-blue-600">{driverStats?.weekDeliveries || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{driverStats?.totalDeliveries || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500">Note moyenne</p>
            <p className="text-2xl font-bold text-amber-600 flex items-center gap-1">
              <Star size={18} fill="currentColor" />
              {driverStats?.avgRating ? driverStats.avgRating.toFixed(1) : '-'}
            </p>
          </div>
        </div>

        {/* Livraison en cours */}
        {currentDelivery && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package size={18} style={{ color: primaryColor }} />
                Livraison en cours
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${driverStatusLabels[currentDelivery.status]?.color || 'bg-gray-100'}`}>
                {driverStatusLabels[currentDelivery.status]?.label || currentDelivery.status}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Commande */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Commande</p>
                  <p className="font-semibold text-gray-900">#{currentDelivery.order.orderNumber}</p>
                </div>
                <p className="font-medium" style={{ color: primaryColor }}>
                  {formatCurrency(currentDelivery.order.subtotal)}
                </p>
              </div>

              {/* Restaurant */}
              {'restaurant' in currentDelivery.order && currentDelivery.order.restaurant && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Restaurant</p>
                  <p className="font-medium text-gray-900">{(currentDelivery.order.restaurant as { name: string }).name}</p>
                  {(currentDelivery.order.restaurant as { address?: string | null }).address && (
                    <p className="text-sm text-gray-600">{(currentDelivery.order.restaurant as { address: string }).address}</p>
                  )}
                  {(currentDelivery.order.restaurant as { phone?: string | null }).phone && (
                    <a href={`tel:${(currentDelivery.order.restaurant as { phone: string }).phone}`} className="flex items-center gap-1 text-sm mt-1" style={{ color: primaryColor }}>
                      <Phone size={14} />
                      {(currentDelivery.order.restaurant as { phone: string }).phone}
                    </a>
                  )}
                </div>
              )}

              {/* Client */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Client</p>
                <p className="font-medium text-gray-900">
                  {currentDelivery.order.customer.firstName} {currentDelivery.order.customer.lastName}
                </p>
                {currentDelivery.order.customer.phone && (
                  <a href={`tel:${currentDelivery.order.customer.phone}`} className="flex items-center gap-1 text-sm mt-1" style={{ color: primaryColor }}>
                    <Phone size={14} />
                    {currentDelivery.order.customer.phone}
                  </a>
                )}
              </div>

              {/* Adresse de livraison */}
              {currentDelivery.address && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Adresse de livraison</p>
                  <p className="font-medium text-gray-900">
                    {typeof currentDelivery.address === 'object' && currentDelivery.address !== null
                      ? (currentDelivery.address as { street?: string }).street || JSON.stringify(currentDelivery.address)
                      : String(currentDelivery.address)
                    }
                  </p>
                  {currentDelivery.latitude && currentDelivery.longitude && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${currentDelivery.latitude},${currentDelivery.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm mt-1"
                      style={{ color: primaryColor }}
                    >
                      <Navigation size={14} />
                      Ouvrir dans Maps
                    </a>
                  )}
                </div>
              )}

              {/* Articles */}
              {currentDelivery.order.items && currentDelivery.order.items.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">Articles ({currentDelivery.order.items.length})</p>
                  <div className="space-y-1">
                    {currentDelivery.order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">{item.product.name}</span>
                        <span className="text-gray-500">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {driverStatusLabels[currentDelivery.status]?.next && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateStatusMutation.mutate({ id: currentDelivery.id, status: driverStatusLabels[currentDelivery.status].next! })}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    {driverStatusLabels[currentDelivery.status]?.nextLabel}
                  </Button>
                  {currentDelivery.status === 'ARRIVED' && (
                    <Button
                      onClick={() => updateStatusMutation.mutate({ id: currentDelivery.id, status: 'FAILED' })}
                      disabled={updateStatusMutation.isPending}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle size={16} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={statusFilter || 'all'}
              onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}
            >
              <SelectTrigger 
                className="w-full sm:w-[200px] h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              >
                <Filter size={16} className="mr-2 text-gray-400" />
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="active">En cours</SelectItem>
                <SelectItem value="completed">Terminees</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Historique des livraisons */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Historique</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {driverLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : driverDeliveries.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">Aucune livraison</p>
              </div>
            ) : (
              driverDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Package size={18} style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">#{delivery.order.orderNumber}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${driverStatusLabels[delivery.status]?.color || 'bg-gray-100'}`}>
                          {driverStatusLabels[delivery.status]?.label || delivery.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {delivery.order.customer.firstName} {delivery.order.customer.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(delivery.order.subtotal)}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(delivery.createdAt), 'dd/MM HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Vue Restaurant (non-livreur)
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
            <Truck size={24} style={{ color: primaryColor }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Livraisons</h1>
              {stats && stats.pendingCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  {stats.pendingCount} en attente
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Suivez et gerez vos livraisons en temps reel
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          className="h-11 rounded-xl"
        >
          <RefreshCw size={16} className="mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500">Aujourd'hui</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalToday || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-amber-600">{stats?.pendingCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500">En cours</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.inProgressCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-sm text-gray-500">Livrees</p>
          <p className="text-2xl font-bold text-emerald-600">{stats?.completedToday || 0}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={statusFilter || 'all'}
            onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}
          >
            <SelectTrigger 
              className="w-full sm:w-[200px] h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <Filter size={16} className="mr-2 text-gray-400" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="ASSIGNED">Assigne</SelectItem>
              <SelectItem value="PICKED_UP">Recupere</SelectItem>
              <SelectItem value="EN_ROUTE">En livraison</SelectItem>
              <SelectItem value="DELIVERED">Livre</SelectItem>
              <SelectItem value="FAILED">Echoue</SelectItem>
              <SelectItem value="CANCELLED">Annule</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des livraisons */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Truck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">Aucune livraison trouvee</p>
          </div>
        ) : (
          deliveries.map((delivery) => {
            const status = statusConfig[delivery.status]
            const StatusIcon = status.icon
            
            return (
              <div 
                key={delivery.id} 
                className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetail(delivery)}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Package size={20} style={{ color: primaryColor }} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        #{delivery.order.orderNumber}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(delivery.order.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {delivery.order.customerName && (
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {delivery.order.customerName}
                        </span>
                      )}
                      {delivery.address?.street && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={12} />
                          {delivery.address.street}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {delivery.driver ? (
                      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                          {delivery.driver.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{delivery.driver.name}</span>
                      </div>
                    ) : delivery.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAssign(delivery)
                        }}
                        className="h-8 text-xs"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        Assigner
                      </Button>
                    )}
                    
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                    
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Panel détail */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Details de la livraison</SheetTitle>
          </SheetHeader>

          {selectedDelivery && (
            <div className="space-y-6">
              {/* Statut */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[selectedDelivery.status].color}`}>
                  {(() => {
                    const StatusIcon = statusConfig[selectedDelivery.status].icon
                    return <StatusIcon size={14} />
                  })()}
                  {statusConfig[selectedDelivery.status].label}
                </span>
              </div>

              {/* Commande */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">Commande #{selectedDelivery.order.orderNumber}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-medium">{formatCurrency(selectedDelivery.order.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span>{format(new Date(selectedDelivery.order.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                  </div>
                </div>
              </div>

              {/* Client */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Client</h4>
                {selectedDelivery.order.customerName && (
                  <div className="flex items-center gap-3 text-sm">
                    <User size={16} className="text-gray-400" />
                    <span>{selectedDelivery.order.customerName}</span>
                  </div>
                )}
                {selectedDelivery.order.customerPhone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-gray-400" />
                    <span>{selectedDelivery.order.customerPhone}</span>
                  </div>
                )}
                {selectedDelivery.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p>{selectedDelivery.address.street}</p>
                      <p className="text-gray-500">{selectedDelivery.address.postalCode} {selectedDelivery.address.city}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Livreur */}
              {selectedDelivery.driver ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Livreur</h4>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {selectedDelivery.driver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedDelivery.driver.name}</p>
                      {selectedDelivery.driver.phone && (
                        <p className="text-sm text-gray-500">{selectedDelivery.driver.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedDelivery.status === 'PENDING' && (
                <Button
                  onClick={() => {
                    setIsDetailOpen(false)
                    handleAssign(selectedDelivery)
                  }}
                  className="w-full text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Assigner un livreur
                </Button>
              )}

              {/* Timeline */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Historique</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-gray-500">Cree le {format(new Date(selectedDelivery.createdAt), 'dd/MM HH:mm')}</span>
                  </div>
                  {selectedDelivery.assignedAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-500">Assigne le {format(new Date(selectedDelivery.assignedAt), 'dd/MM HH:mm')}</span>
                    </div>
                  )}
                  {selectedDelivery.pickedUpAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span className="text-gray-500">Recupere le {format(new Date(selectedDelivery.pickedUpAt), 'dd/MM HH:mm')}</span>
                    </div>
                  )}
                  {selectedDelivery.deliveredAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-gray-500">Livre le {format(new Date(selectedDelivery.deliveredAt), 'dd/MM HH:mm')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedDelivery.customerNotes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Notes client</h4>
                  <p className="text-sm text-gray-600 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    {selectedDelivery.customerNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal assignation */}
      <AssignDriverModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false)
          setDeliveryToAssign(null)
        }}
        delivery={deliveryToAssign}
        onSuccess={handleAssignSuccess}
        primaryColor={primaryColor}
      />
    </DashboardLayout>
  )
}
