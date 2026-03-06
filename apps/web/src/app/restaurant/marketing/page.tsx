'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import {
  Megaphone,
  Ticket,
  Percent,
  Star,
  Heart,
  Settings2,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  Users,
  ShoppingBag,
  Mail,
} from 'lucide-react'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function MarketingPage() {
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const primaryColor = organization?.primaryColor || '#10b981'
  const primaryBgLight = hexToRgba(primaryColor, 0.1)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['marketing-stats', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.getStats()
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
        title="Marketing"
        variant="dashboard"
      />
    )
  }

  const quickLinks = [
    {
      label: 'Coupons',
      description: 'Codes promo et réductions',
      href: '/restaurant/marketing/coupons',
      icon: Ticket,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      stat: stats?.coupons.active || 0,
      statLabel: 'actifs',
    },
    {
      label: 'Promotions',
      description: 'Offres spéciales et happy hours',
      href: '/restaurant/marketing/promotions',
      icon: Percent,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      stat: stats?.promotions.active || 0,
      statLabel: 'actives',
    },
    {
      label: 'Avis clients',
      description: 'Gérez les retours clients',
      href: '/restaurant/marketing/reviews',
      icon: Star,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-500',
      stat: stats?.reviews.avgRating || '-',
      statLabel: 'note moyenne',
    },
    {
      label: 'Fidélité',
      description: 'Programme de fidélisation',
      href: '/restaurant/marketing/loyalty',
      icon: Heart,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      stat: stats?.loyalty.customersWithPoints || 0,
      statLabel: 'clients fidèles',
    },
    {
      label: 'Campagnes email',
      description: 'Envoyez des emails à vos clients',
      href: '/restaurant/marketing/campaigns',
      icon: Mail,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
    },
    {
      label: 'Réglages',
      description: 'Configuration marketing',
      href: '/restaurant/marketing/settings',
      icon: Settings2,
      iconBg: 'bg-gray-50',
      iconColor: 'text-gray-500',
    },
  ]

  const kpis = [
    {
      label: 'Coupons utilisés',
      value: stats?.coupons.totalUsed || 0,
      icon: Ticket,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Commandes avec coupon',
      value: stats?.orders.withCoupon || 0,
      icon: ShoppingBag,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Avis ce mois',
      value: stats?.reviews.thisMonth || 0,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Clients fidèles',
      value: stats?.loyalty.customersWithPoints || 0,
      icon: Users,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
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
        title="Marketing"
        subtitle="Gérez vos promotions, coupons et fidélisation client"
        icon={Megaphone}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        <Link href="/restaurant/marketing/coupons" className="group bg-white rounded-2xl p-5 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primaryBgLight }}
          >
            <Ticket className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900">{stats?.coupons.totalUsed || 0}</div>
            <div className="text-sm text-gray-500">Coupons utilisés</div>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ backgroundColor: `${primaryColor}10` }}
          >
            <ArrowUpRight size={16} style={{ color: primaryColor }} />
          </div>
        </Link>

        <Link href="/restaurant/marketing/coupons" className="group bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-50">
            <ShoppingBag className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900">{stats?.orders.withCoupon || 0}</div>
            <div className="text-sm text-gray-500">Commandes avec coupon</div>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ backgroundColor: `${primaryColor}10` }}
          >
            <ArrowUpRight size={16} style={{ color: primaryColor }} />
          </div>
        </Link>

        <Link href="/restaurant/marketing/reviews" className="group bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-yellow-50">
            <Star className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900">{stats?.reviews.thisMonth || 0}</div>
            <div className="text-sm text-gray-500">Avis ce mois</div>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ backgroundColor: `${primaryColor}10` }}
          >
            <ArrowUpRight size={16} style={{ color: primaryColor }} />
          </div>
        </Link>

        <Link href="/restaurant/marketing/loyalty" className="group bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-rose-50">
            <Users className="w-6 h-6 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900">{stats?.loyalty.customersWithPoints || 0}</div>
            <div className="text-sm text-gray-500">Clients fidèles</div>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ backgroundColor: `${primaryColor}10` }}
          >
            <ArrowUpRight size={16} style={{ color: primaryColor }} />
          </div>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Accès rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${link.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={24} className={link.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 group-hover:text-gray-700">{link.label}</p>
                    {link.stat !== undefined && (
                      <span 
                        className="text-sm font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: primaryBgLight, color: primaryColor }}
                      >
                        {link.stat} {link.statLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{link.description}</p>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coupons Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Coupons</h3>
            <Link 
              href="/restaurant/marketing/coupons"
              className="text-sm font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              Voir tout
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Total créés</span>
              <span className="font-semibold text-gray-900">{stats?.coupons.total || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Actifs</span>
              <span className="font-semibold text-emerald-600">{stats?.coupons.active || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Utilisations totales</span>
              <span className="font-semibold text-gray-900">{stats?.coupons.totalUsed || 0}</span>
            </div>
          </div>
        </div>

        {/* Reviews Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Avis clients</h3>
            <Link 
              href="/restaurant/marketing/reviews"
              className="text-sm font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              Voir tout
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Total avis</span>
              <span className="font-semibold text-gray-900">{stats?.reviews.total || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Note moyenne</span>
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-gray-900">
                  {stats?.reviews.avgRating ? stats.reviews.avgRating.toFixed(1) : '-'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Ce mois-ci</span>
              <div className="flex items-center gap-1">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="font-semibold text-emerald-600">{stats?.reviews.thisMonth || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
