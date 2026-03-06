'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
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
import { cn } from '@/lib/utils'
import type { RestaurantDetails, Order } from '../types'
import { orderStatusLabels, orderStatusColors, serviceTypeLabels } from '../types'

interface OrdersTabProps {
  restaurant: RestaurantDetails
}

interface OrdersData {
  orders: Order[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: {
    total: number
    pending: number
    completed: number
    cancelled: number
    revenue: number
  }
}

export function OrdersTab({ restaurant }: OrdersTabProps) {
  const { accessToken } = useAuthStore()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['platform-restaurant-orders', restaurant.id, page, statusFilter],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '20')
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await apiClient.get(`/platform/restaurants/${restaurant.id}/orders?${params.toString()}`)
      return res.data as OrdersData
    },
    enabled: !!accessToken,
  })

  const currency = restaurant.settings?.currency || 'XOF'

  const filteredOrders = data?.orders.filter(order => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(search) ||
      order.displayNumber.toLowerCase().includes(search) ||
      order.guestName?.toLowerCase().includes(search) ||
      order.guestEmail?.toLowerCase().includes(search) ||
      `${order.customer?.firstName} ${order.customer?.lastName}`.toLowerCase().includes(search)
    )
  }) || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{data?.stats.total || 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{data?.stats.pending || 0}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{data?.stats.completed || 0}</p>
              <p className="text-xs text-gray-500">Terminees</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency, notation: 'compact' }).format(Number(data?.stats.revenue || 0))}
              </p>
              <p className="text-xs text-gray-500">CA</p>
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
              placeholder="Rechercher une commande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="CONFIRMED">Confirmees</SelectItem>
              <SelectItem value="PREPARING">En preparation</SelectItem>
              <SelectItem value="READY">Pretes</SelectItem>
              <SelectItem value="COMPLETED">Terminees</SelectItem>
              <SelectItem value="CANCELLED">Annulees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucune commande trouvee</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Commande</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Paiement</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">#{order.displayNumber}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">
                          {order.customer 
                            ? `${order.customer.firstName} ${order.customer.lastName}`
                            : order.guestName || 'Anonyme'
                          }
                        </p>
                        {order.guestEmail && (
                          <p className="text-xs text-gray-500">{order.guestEmail}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {serviceTypeLabels[order.serviceType] || order.serviceType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          orderStatusColors[order.status] || 'bg-gray-100 text-gray-600'
                        )}>
                          {orderStatusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                          order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {order.paymentStatus === 'PAID' ? 'Paye' :
                           order.paymentStatus === 'PENDING' ? 'En attente' :
                           order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-medium text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(order.total))}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(order.createdAt), 'HH:mm')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.pagination && data.pagination.pages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {data.pagination.page} sur {data.pagination.pages} ({data.pagination.total} commandes)
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
                    onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
