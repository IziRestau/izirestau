'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
} from 'lucide-react'
import type { RestaurantDetails } from '../types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AnalyticsTabProps {
  restaurant: RestaurantDetails
}

interface AnalyticsData {
  revenue: {
    total: number
    avgOrderValue: number
  }
  orders: {
    total: number
    byStatus: Record<string, number>
  }
  customers: {
    new: number
    returning: number
    total: number
  }
  products: {
    topSelling: Array<{
      id: string
      name: string
      image: string | null
      quantity: number
    }>
    lowStock: Array<{
      id: string
      name: string
      stockQuantity: number
      lowStockAlert: number | null
    }>
  }
}

export function AnalyticsTab({ restaurant }: AnalyticsTabProps) {
  const { accessToken } = useAuthStore()
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  const { data, isLoading } = useQuery({
    queryKey: ['platform-restaurant-analytics', restaurant.id, period],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get(`/platform/restaurants/${restaurant.id}/analytics?period=${period}`)
      return res.data as AnalyticsData
    },
    enabled: !!accessToken,
  })

  const currency = restaurant.settings?.currency || 'XOF'

  const periodLabels: Record<string, string> = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '90 derniers jours',
    '1y': 'Cette annee',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Statistiques</h3>
        <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
            <SelectItem value="1y">Cette annee</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Chargement...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency, notation: 'compact' }).format(Number(data?.revenue.total || 0))}
                  </p>
                  <p className="text-xs text-gray-500">CA</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency, notation: 'compact' }).format(Number(data?.revenue.avgOrderValue || 0))}
                  </p>
                  <p className="text-xs text-gray-500">Panier moyen</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{data?.orders.total || 0}</p>
                  <p className="text-xs text-gray-500">Commandes</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{data?.customers.new || 0}</p>
                  <p className="text-xs text-gray-500">Nouveaux</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-medium text-gray-900">Repartition des commandes</h3>
              </div>
              <div className="p-4">
                {data?.orders.byStatus && Object.keys(data.orders.byStatus).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(data.orders.byStatus).map(([status, count]) => {
                      const total = data.orders.total || 1
                      const percentage = (count / total) * 100
                      const statusLabels: Record<string, string> = {
                        PENDING: 'En attente',
                        CONFIRMED: 'Confirmees',
                        PREPARING: 'En preparation',
                        READY: 'Pretes',
                        COMPLETED: 'Terminees',
                        CANCELLED: 'Annulees',
                      }
                      const statusColors: Record<string, string> = {
                        PENDING: 'bg-yellow-500',
                        CONFIRMED: 'bg-blue-500',
                        PREPARING: 'bg-purple-500',
                        READY: 'bg-green-500',
                        COMPLETED: 'bg-emerald-500',
                        CANCELLED: 'bg-red-500',
                      }
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-28">{statusLabels[status] || status}</span>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${statusColors[status] || 'bg-gray-400'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Aucune donnee</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-medium text-gray-900">Clients</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-xl text-center">
                    <p className="text-3xl font-bold text-emerald-700">{data?.customers.new || 0}</p>
                    <p className="text-sm text-emerald-600">Nouveaux</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <p className="text-3xl font-bold text-blue-700">{data?.customers.returning || 0}</p>
                    <p className="text-sm text-blue-600">Fideles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-medium text-gray-900">Produits les plus vendus</h3>
              </div>
              <div className="p-4">
                {data?.products.topSelling && data.products.topSelling.length > 0 ? (
                  <div className="space-y-3">
                    {data.products.topSelling.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={16} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-sm text-gray-900 truncate">{product.name}</span>
                        <span className="text-sm font-medium text-gray-600">{product.quantity} vendus</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Aucune donnee</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" />
                <h3 className="font-medium text-gray-900">Stock bas</h3>
              </div>
              <div className="p-4">
                {data?.products.lowStock && data.products.lowStock.length > 0 ? (
                  <div className="space-y-3">
                    {data.products.lowStock.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <span className="text-sm text-gray-900">{product.name}</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          {product.stockQuantity} restants
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun produit en stock bas</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
