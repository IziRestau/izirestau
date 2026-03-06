'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ShoppingBag,
  Package,
  UserCheck,
  Star,
  TrendingUp,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  Calendar,
} from 'lucide-react'
import type { RestaurantDetails, Order, Review } from '../types'
import { orderStatusLabels, orderStatusColors, serviceTypeLabels } from '../types'
import { cn } from '@/lib/utils'

interface OverviewTabProps {
  restaurant: RestaurantDetails
}

export function OverviewTab({ restaurant }: OverviewTabProps) {
  const { accessToken } = useAuthStore()

  const { data: ordersData } = useQuery({
    queryKey: ['platform-restaurant-orders', restaurant.id, 'recent'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get(`/platform/restaurants/${restaurant.id}/orders?limit=5`)
      return res.data as { orders: Order[] }
    },
    enabled: !!accessToken,
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['platform-restaurant-reviews', restaurant.id, 'recent'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get(`/platform/restaurants/${restaurant.id}/reviews?limit=3`)
      return res.data as { reviews: Review[] }
    },
    enabled: !!accessToken,
  })

  const currency = restaurant.settings?.currency || 'XOF'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency, notation: 'compact' }).format(Number(restaurant.stats.totalRevenue))}
              </p>
              <p className="text-xs text-gray-500">CA total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{restaurant._count.orders}</p>
              <p className="text-xs text-gray-500">Commandes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <UserCheck size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{restaurant._count.customers}</p>
              <p className="text-xs text-gray-500">Clients</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {restaurant.stats.avgRating ? restaurant.stats.avgRating.toFixed(1) : '-'}
              </p>
              <p className="text-xs text-gray-500">Note ({restaurant._count.reviews})</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Dernieres commandes</h3>
            <span className="text-xs text-gray-500">{restaurant.stats.ordersThisMonth} ce mois</span>
          </div>
          <div className="divide-y divide-gray-50">
            {ordersData?.orders && ordersData.orders.length > 0 ? (
              ordersData.orders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">#{order.displayNumber}</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        orderStatusColors[order.status] || 'bg-gray-100 text-gray-600'
                      )}>
                        {orderStatusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(order.total))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {order.customer 
                        ? `${order.customer.firstName} ${order.customer.lastName}`
                        : order.guestName || 'Client anonyme'
                      }
                    </span>
                    <span>{format(new Date(order.createdAt), 'dd/MM HH:mm')}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                Aucune commande
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-900">Derniers avis</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
              reviewsData.reviews.map((review) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {review.customer.firstName} {review.customer.lastName}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {format(new Date(review.createdAt), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                Aucun avis
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-900">Revendeur</h3>
          </div>
          <div className="p-4">
            {restaurant.site ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Building2 size={24} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{restaurant.site.organization.name}</p>
                  <p className="text-sm text-gray-500">{restaurant.site.organization.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun revendeur associe</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-900">Client</h3>
          </div>
          <div className="p-4">
            {restaurant.site?.client ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{restaurant.site.client.name}</p>
                  <p className="text-sm text-gray-500">
                    {restaurant.site.client.contactFirstName} {restaurant.site.client.contactLastName}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun client associe</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-900">Dates</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Cree le</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(restaurant.createdAt), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Derniere mise a jour</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(restaurant.updatedAt), 'dd MMMM yyyy a HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{restaurant._count.products}</p>
              <p className="text-xs text-gray-500">Produits</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{restaurant._count.categories}</p>
              <p className="text-xs text-gray-500">Categories</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{restaurant._count.staff}</p>
              <p className="text-xs text-gray-500">Staff</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{restaurant._count.reviews}</p>
              <p className="text-xs text-gray-500">Avis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
