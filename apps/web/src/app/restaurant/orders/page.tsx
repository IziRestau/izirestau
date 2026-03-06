'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api, apiClient } from '@/lib/api-client'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { useRestaurantPermissions } from '@/hooks/use-restaurant-permissions'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Truck,
  Package,
  DollarSign,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Copy,
} from 'lucide-react'
import { DashboardLayout } from '@/components/shared/dashboard/dashboard-layout'
import { toast } from 'sonner'
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
import { OrderStatusBadge } from '@/components/restaurant/orders/OrderStatusBadge'
import { OrderDetailPanel } from '@/components/restaurant/orders/OrderDetailPanel'
import { ChangeStatusModal } from '@/components/restaurant/orders/ChangeStatusModal'
import { CancelOrderModal } from '@/components/restaurant/orders/CancelOrderModal'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'

const serviceTypeLabels: Record<string, string> = {
  DELIVERY: 'Livraison',
  PICKUP: 'À emporter',
  DINE_IN: 'Sur place',
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'En attente',
  AUTHORIZED: 'Autorisé',
  PAID: 'Payé',
  PARTIALLY_REFUNDED: 'Partiellement remboursé',
  REFUNDED: 'Remboursé',
  FAILED: 'Échoué',
  CANCELLED: 'Annulé',
}

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  AUTHORIZED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-700',
  REFUNDED: 'bg-orange-100 text-orange-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Espèces',
  CARD: 'Carte',
  CARD_ONLINE: 'Carte en ligne',
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
  OTHER: 'Autre',
}

const paymentMethodIcons: Record<string, string> = {
  CASH: 'Espèces',
  CARD: 'CB',
  CARD_ONLINE: 'En ligne',
  APPLE_PAY: 'Apple',
  GOOGLE_PAY: 'Google',
  OTHER: 'Autre',
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function OrdersPage() {
  const { accessToken } = useAuthStore()
  const { restaurant, organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const queryClient = useQueryClient()
  const { format: formatCurrency } = useRestaurantCurrency()
  const { canCancelOrders, canViewRevenue } = useRestaurantPermissions()
  const navigation = useRestaurantNavigation()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [statusFilter, setStatusFilter] = useState('all')
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [changeStatusModalOpen, setChangeStatusModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  const primaryColor = organization?.primaryColor || '#10b981'
  const primaryBgLight = hexToRgba(primaryColor, 0.1)
  const logoText = organization?.name || restaurant?.name || 'Restaurant'

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['restaurant-orders', currentRestaurantId, page, limit, statusFilter, serviceTypeFilter, debouncedSearch],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getOrders({
        restaurantId: currentRestaurantId || undefined,
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        serviceType: serviceTypeFilter !== 'all' ? serviceTypeFilter : undefined,
        search: debouncedSearch || undefined,
      })
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    refetchInterval: 30000,
  })

  const orders = data?.orders || []
  const pagination = data?.pagination
  const stats = data?.stats

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setDetailModalOpen(true)
  }

  const handleChangeStatus = (orderId: string) => {
    setSelectedOrderId(orderId)
    setChangeStatusModalOpen(true)
  }

  const handleCancelOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setCancelModalOpen(true)
  }

  const handleStatusChanged = () => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] })
    setChangeStatusModalOpen(false)
  }

  const handleOrderCancelled = () => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] })
    setCancelModalOpen(false)
  }

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      title="Commandes"
      subtitle="Gérez vos commandes"
      logoText={logoText}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <ShoppingBag size={24} style={{ color: primaryColor }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Commandes</h1>
              {stats && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {stats.total} commandes
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">Gérez et suivez toutes vos commandes</p>
          </div>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="self-start sm:self-auto text-white h-11 rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          <RefreshCw size={16} className={`mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryBgLight }}>
            <ShoppingBag className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
            <div className="text-sm text-gray-500">Total commandes</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-yellow-50">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{(stats?.pending || 0) + (stats?.confirmed || 0)}</div>
            <div className="text-sm text-gray-500">En attente</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-purple-50">
            <ChefHat className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{(stats?.preparing || 0) + (stats?.ready || 0)}</div>
            <div className="text-sm text-gray-500">En cours</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryBgLight }}>
            <DollarSign className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.revenueToday || 0)}</div>
            <div className="text-sm text-gray-500">CA du jour</div>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ zIndex: 1 }} />
              <Input
                type="text"
                placeholder="Rechercher par numéro, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ 
                  '--tw-ring-color': primaryColor,
                } as React.CSSProperties}
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger 
                  className="w-full sm:w-44 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                >
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent accentColor={primaryColor}>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmées</SelectItem>
                  <SelectItem value="PREPARING">En préparation</SelectItem>
                  <SelectItem value="READY">Prêtes</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">En livraison</SelectItem>
                  <SelectItem value="COMPLETED">Terminées</SelectItem>
                  <SelectItem value="CANCELLED">Annulées</SelectItem>
                </SelectContent>
              </Select>
              <Select value={serviceTypeFilter} onValueChange={(v) => { setServiceTypeFilter(v); setPage(1) }}>
                <SelectTrigger 
                  className="w-full sm:w-44 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                >
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent accentColor={primaryColor}>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="DELIVERY">Livraison</SelectItem>
                  <SelectItem value="PICKUP">À emporter</SelectItem>
                  <SelectItem value="DINE_IN">Sur place</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table - Desktop */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: primaryBgLight }}>
              <ShoppingBag size={28} style={{ color: primaryColor }} />
            </div>
            <p className="text-gray-900 font-medium mb-1">Aucune commande</p>
            <p className="text-sm text-gray-500">Les commandes apparaitront ici</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode paiement</th>
                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                    <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr 
                      key={order.id} 
                      className={cn(
                        "hover:bg-gray-50/50 transition-colors cursor-pointer",
                        index !== orders.length - 1 && "border-b border-gray-50"
                      )}
                      onClick={() => handleViewOrder(order.id)}
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900">#{order.displayNumber}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{order.itemsCount} article{order.itemsCount > 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {order.customer 
                            ? `${order.customer.firstName} ${order.customer.lastName}`
                            : order.guestName || 'Anonyme'
                          }
                        </p>
                        {(order.customer?.phone || order.guestPhone) && (
                          <p className="text-xs text-gray-500 mt-0.5">{order.customer?.phone || order.guestPhone}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">
                          {serviceTypeLabels[order.serviceType] || order.serviceType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">
                          {order.paymentMethod ? paymentMethodLabels[order.paymentMethod] : '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-600'
                        )}>
                          {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-900">
                          {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: fr })}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(order.createdAt), 'HH:mm')}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg transition-colors"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${primaryColor}15`
                                e.currentTarget.style.color = primaryColor
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = ''
                                e.currentTarget.style.color = ''
                              }}
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                            <DropdownMenuItem 
                              onClick={() => handleViewOrder(order.id)}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Eye size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Voir details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                navigator.clipboard.writeText(order.displayNumber)
                                toast.success('Numero copie')
                              }}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Copy size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Copier le numero</span>
                            </DropdownMenuItem>
                            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && order.status !== 'REFUNDED' && (
                              <>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem 
                                  onClick={() => handleChangeStatus(order.id)}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                                >
                                  <RefreshCw size={16} className="mr-3 text-gray-400" />
                                  <span className="text-[13px] text-gray-700">Changer statut</span>
                                </DropdownMenuItem>
                                {canCancelOrders && (
                                  <>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem 
                                      onClick={() => handleCancelOrder(order.id)}
                                      className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                                    >
                                      <XCircle size={16} className="mr-3" />
                                      <span className="text-[13px]">Annuler</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {orders.map((order, index) => (
                <div 
                  key={order.id} 
                  className={cn(
                    "p-5 cursor-pointer hover:bg-gray-50/50 transition-colors",
                    index !== orders.length - 1 && "border-b border-gray-100"
                  )}
                  onClick={() => handleViewOrder(order.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-semibold text-gray-900">#{order.displayNumber}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(order.createdAt), 'dd MMM yyyy a HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.customer 
                          ? `${order.customer.firstName} ${order.customer.lastName}`
                          : order.guestName || 'Anonyme'
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {serviceTypeLabels[order.serviceType]} - {order.itemsCount} article{order.itemsCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    {order.paymentMethod && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
                        {paymentMethodLabels[order.paymentMethod]}
                      </span>
                    )}
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-lg',
                      paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-600'
                    )}>
                      {paymentStatusLabels[order.paymentStatus]}
                    </span>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-10 rounded-xl"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                      onClick={() => handleViewOrder(order.id)}
                    >
                      <Eye size={14} className="mr-2" />
                      Details
                    </Button>
                    {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && order.status !== 'REFUNDED' && (
                      <Button 
                        size="sm" 
                        className="flex-1 h-10 rounded-xl text-white"
                        style={{ backgroundColor: primaryColor }}
                        onClick={() => handleChangeStatus(order.id)}
                      >
                        <RefreshCw size={14} className="mr-2" />
                        Statut
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Afficher</span>
                  <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1) }}>
                    <SelectTrigger 
                      className="w-20 h-9 rounded-lg focus:ring-2 focus:ring-offset-0"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent accentColor={primaryColor}>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">par page</span>
                </div>
                <p className="text-sm text-gray-500">
                  Page {pagination.page} sur {pagination.pages} ({pagination.total} commandes)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg"
                    style={{ borderColor: page === 1 ? undefined : primaryColor, color: page === 1 ? undefined : primaryColor }}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg"
                    style={{ borderColor: page === pagination.pages ? undefined : primaryColor, color: page === pagination.pages ? undefined : primaryColor }}
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

      {/* Panel Details (Sheet) */}
      <OrderDetailPanel
        orderId={selectedOrderId}
        isOpen={detailModalOpen}
        onClose={() => {
          if (!changeStatusModalOpen && !cancelModalOpen) {
            setDetailModalOpen(false)
            setSelectedOrderId(null)
          }
        }}
        primaryColor={primaryColor}
        onChangeStatus={() => {
          setChangeStatusModalOpen(true)
        }}
        onCancel={canCancelOrders ? () => {
          setCancelModalOpen(true)
        } : undefined}
      />

      {/* Modals */}
      <ChangeStatusModal
        orderId={selectedOrderId}
        isOpen={changeStatusModalOpen}
        onClose={() => setChangeStatusModalOpen(false)}
        onSuccess={handleStatusChanged}
        primaryColor={primaryColor}
      />
      <CancelOrderModal
        orderId={selectedOrderId}
        orderNumber={orders.find(o => o.id === selectedOrderId)?.displayNumber}
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={handleOrderCancelled}
      />
    </DashboardLayout>
  )
}
