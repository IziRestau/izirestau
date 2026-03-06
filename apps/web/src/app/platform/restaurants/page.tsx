'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { platformNavigation } from '@/config/platform-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import {
  Store,
  Search,
  Filter,
  Eye,
  MapPin,
  Phone,
  Mail,
  Globe,
  ShoppingBag,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  ACTIVE: 'Actif',
  DRAFT: 'Brouillon',
  SUSPENDED: 'Suspendu',
  EXPIRED: 'Expire',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
}

const businessTypeLabels: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  FAST_FOOD: 'Fast Food',
  CAFE: 'Cafe',
  BAKERY: 'Boulangerie',
  PIZZERIA: 'Pizzeria',
  FOOD_TRUCK: 'Food Truck',
  DARK_KITCHEN: 'Dark Kitchen',
  CATERING: 'Traiteur',
  OTHER: 'Autre',
}

interface Restaurant {
  id: string
  name: string
  email: string
  phone: string
  businessType: string
  cuisineTypes: string[]
  logo: string | null
  city: string
  country: string
  createdAt: string
  status: string
  subdomain: string
  resellerOrg: { id: string; name: string } | null
  client: { id: string; name: string } | null
  ordersCount: number
  productsCount: number
  staffCount: number
}

interface RestaurantsResponse {
  restaurants: Restaurant[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: {
    total: number
    active: number
    suspended: number
    draft: number
  }
}

export default function PlatformRestaurantsPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['platform-restaurants', searchQuery, statusFilter, page],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('page', page.toString())
      params.append('limit', '20')

      const res = await apiClient.get<RestaurantsResponse>(`/platform/restaurants?${params.toString()}`)
      return res.data
    },
    enabled: !!accessToken,
  })

  if (isLoading && !data) {
    return (
      <PageSkeleton
        navigation={platformNavigation}
        basePath="/platform"
        title="Restaurants"
        variant="list"
      />
    )
  }

  const restaurants = data?.restaurants || []
  const pagination = data?.pagination
  const stats = data?.stats

  return (
    <DashboardLayout
      navigation={platformNavigation}
      basePath="/platform"
    >
      <PageHeader
        title="Restaurants"
        subtitle="Gestion de tous les restaurants de la plateforme"
        icon={Store}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-semibold text-gray-900">{stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Actifs</p>
          <p className="text-2xl font-semibold text-green-600">{stats?.active || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Suspendus</p>
          <p className="text-2xl font-semibold text-red-600">{stats?.suspended || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Brouillons</p>
          <p className="text-2xl font-semibold text-gray-600">{stats?.draft || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un restaurant..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Tous les statuts</option>
              <option value="ACTIVE">Actifs</option>
              <option value="SUSPENDED">Suspendus</option>
              <option value="DRAFT">Brouillons</option>
              <option value="EXPIRED">Expires</option>
            </select>
          </div>
        </div>

        {restaurants.length === 0 ? (
          <div className="p-12 text-center">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun restaurant trouve</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Restaurant</th>
                    <th className="px-4 py-3">Revendeur</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Ville</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-center">Produits</th>
                    <th className="px-4 py-3 text-center">Commandes</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {restaurants.map((restaurant) => (
                    <tr
                      key={restaurant.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/platform/restaurants/${restaurant.id}`)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {restaurant.logo ? (
                              <img
                                src={restaurant.logo}
                                alt={restaurant.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Store size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{restaurant.name}</p>
                            <p className="text-xs text-gray-500">{restaurant.subdomain}.iziresto.com</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{restaurant.resellerOrg?.name || '-'}</p>
                        {restaurant.client && (
                          <p className="text-xs text-gray-500">{restaurant.client.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {businessTypeLabels[restaurant.businessType] || restaurant.businessType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin size={14} />
                          {restaurant.city || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          statusColors[restaurant.status] || 'bg-gray-100 text-gray-600'
                        )}>
                          {statusLabels[restaurant.status] || restaurant.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <ShoppingBag size={14} />
                          {restaurant.productsCount}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm text-gray-600">{restaurant.ordersCount}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/platform/restaurants/${restaurant.id}`)
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} sur {pagination.pages} ({pagination.total} restaurants)
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
    </DashboardLayout>
  )
}
