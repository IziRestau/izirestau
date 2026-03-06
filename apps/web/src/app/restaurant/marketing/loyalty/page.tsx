'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { api, apiClient } from '@/lib/api-client'
import {
  Heart,
  Users,
  Award,
  TrendingUp,
  Crown,
  Star,
  ShoppingBag,
  Gift,
  Settings2,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function LoyaltyPage() {
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const { format: formatCurrency } = useRestaurantCurrency()

  const primaryColor = organization?.primaryColor || '#10b981'
  const primaryBgLight = hexToRgba(primaryColor, 0.1)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['marketing-loyalty-stats', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.loyalty.getStats()
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading && !stats) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Programme de fidélité"
        variant="dashboard"
      />
    )
  }

  const kpis = [
    {
      label: 'Clients total',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Clients fidèles',
      value: stats?.customersWithPoints || 0,
      icon: Heart,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      label: 'Points distribués',
      value: stats?.totalPoints || 0,
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Points moyens',
      value: stats?.avgPoints || 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ]

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <PageHeader
        title="Programme de fidélité"
        subtitle="Récompensez vos clients les plus fidèles"
        icon={Heart}
        actions={
          <Link href="/restaurant/marketing/settings?tab=loyalty">
            <Button 
              className="h-11 rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Settings2 size={16} className="mr-2" />
              Configurer
            </Button>
          </Link>
        }
      />

      {/* Info Banner */}
      <div 
        className="flex items-start gap-3 p-4 rounded-2xl mb-6"
        style={{ backgroundColor: primaryBgLight }}
      >
        <Info size={20} style={{ color: primaryColor }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900">Programme de fidélité</p>
          <p className="text-sm text-gray-600">
            Les clients accumulent des points à chaque commande. Configurez les règles de points et les récompenses 
            dans les réglages marketing.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900">
              {(stats?.totalCustomers || 0).toLocaleString('fr-FR')}
            </div>
            <div className="text-sm text-gray-500">Clients total</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-rose-50">
            <Heart className="w-6 h-6 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900">
              {(stats?.customersWithPoints || 0).toLocaleString('fr-FR')}
            </div>
            <div className="text-sm text-gray-500">Clients fidèles</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-50">
            <Award className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900">
              {(stats?.totalPoints || 0).toLocaleString('fr-FR')}
            </div>
            <div className="text-sm text-gray-500">Points distribués</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-50">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900">
              {(stats?.avgPoints || 0).toLocaleString('fr-FR')}
            </div>
            <div className="text-sm text-gray-500">Points moyens</div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-amber-500" />
            <h3 className="font-semibold text-gray-900">Top clients fidèles</h3>
          </div>
          <Link 
            href="/restaurant/customers"
            className="text-sm font-medium hover:underline"
            style={{ color: primaryColor }}
          >
            Voir tous les clients
          </Link>
        </div>

        {stats?.topCustomers && stats.topCustomers.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Rang</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Client</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Points</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Commandes</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Total dépensé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.topCustomers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{
                          backgroundColor: index === 0 ? '#FEF3C7' : index === 1 ? '#E5E7EB' : index === 2 ? '#FED7AA' : '#F3F4F6',
                        }}>
                          {index < 3 ? (
                            <Crown size={16} className={
                              index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-400' : 'text-orange-400'
                            } />
                          ) : (
                            <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-medium text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-amber-500 fill-amber-500" />
                          <span className="font-semibold text-gray-900">{customer.loyaltyPoints.toLocaleString('fr-FR')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-gray-600">
                          <ShoppingBag size={14} />
                          <span>{customer.totalOrders}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(customer.totalSpent)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden divide-y divide-gray-50">
              {stats.topCustomers.map((customer, index) => (
                <div key={customer.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0" style={{
                      backgroundColor: index === 0 ? '#FEF3C7' : index === 1 ? '#E5E7EB' : index === 2 ? '#FED7AA' : '#F3F4F6',
                    }}>
                      {index < 3 ? (
                        <Crown size={18} className={
                          index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-400' : 'text-orange-400'
                        } />
                      ) : (
                        <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star size={12} className="text-amber-500 fill-amber-500" />
                          <span className="font-semibold text-gray-900 text-sm">{customer.loyaltyPoints.toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                        <span>{customer.email}</span>
                        <span className="flex items-center gap-1">
                          <ShoppingBag size={10} />
                          {customer.totalOrders} commandes
                        </span>
                        <span className="font-medium text-gray-700">{formatCurrency(customer.totalSpent)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">Aucun client fidèle pour le moment</p>
            <p className="text-sm text-gray-400">
              Les clients accumuleront des points au fur et à mesure de leurs commandes
            </p>
          </div>
        )}
      </div>

      {/* Coming Soon Features */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-6 text-center opacity-60">
          <Gift size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="font-medium text-gray-600">Récompenses</p>
          <p className="text-sm text-gray-400 mt-1">Bientôt disponible</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-6 text-center opacity-60">
          <Award size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="font-medium text-gray-600">Paliers VIP</p>
          <p className="text-sm text-gray-400 mt-1">Bientôt disponible</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-6 text-center opacity-60">
          <TrendingUp size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="font-medium text-gray-600">Statistiques avancées</p>
          <p className="text-sm text-gray-400 mt-1">Bientôt disponible</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
