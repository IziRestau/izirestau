'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { DashboardLayout } from '@/components/shared/dashboard'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { useRestaurantPermissions } from '@/hooks/use-restaurant-permissions'
import { api, apiClient } from '@/lib/api-client'
import { 
  StatsCard,
  OrdersSummary,
  RevenueChart,
  CustomerMap,
  DailyTrending,
} from '@/components/restaurant'
import { 
  ShoppingBag, 
  UtensilsCrossed,
  Users,
  DollarSign,
  Bike,
  Package,
  Star,
  Clock,
} from 'lucide-react'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function RestaurantDashboardPage() {
  const { user, accessToken } = useAuthStore()
  const { restaurant, organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const { format } = useRestaurantCurrency()
  const navigation = useRestaurantNavigation()
  const { canViewRevenue, isDriver } = useRestaurantPermissions()
  
  const primaryColor = organization?.primaryColor || '#10b981'
  const primaryBgLight = hexToRgba(primaryColor, 0.1)

  // Stats pour le restaurant (non-livreurs)
  const { data: stats } = useQuery({
    queryKey: ['restaurant-dashboard-stats', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getDashboardStats(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId && !isDriver,
    staleTime: 2 * 60 * 1000,
  })

  // Stats pour le livreur
  const { data: driverStats } = useQuery({
    queryKey: ['driver-stats'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.driver.getStats()
    },
    enabled: !!accessToken && isDriver,
    staleTime: 2 * 60 * 1000,
  })

  // Livraison en cours pour le livreur
  const { data: currentDeliveryData } = useQuery({
    queryKey: ['driver-current-delivery'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.driver.getCurrentDelivery()
    },
    enabled: !!accessToken && isDriver,
    refetchInterval: 10000,
  })

  const { data: trendingProducts } = useQuery({
    queryKey: ['restaurant-trending-products', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getTrendingProducts(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId && !isDriver,
    staleTime: 5 * 60 * 1000,
  })

  const { data: revenueChartData } = useQuery({
    queryKey: ['restaurant-revenue-chart', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getRevenueChart(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId && !isDriver,
    staleTime: 5 * 60 * 1000,
  })

  const restaurantName = organization?.name || restaurant?.name || 'Restaurant'
  const driverStatsData = driverStats?.data
  const currentDelivery = currentDeliveryData?.data

  // Dashboard Livreur
  if (isDriver) {
    return (
      <DashboardLayout
        navigation={navigation}
        basePath="/restaurant"
        title="Mes livraisons"
        subtitle={`Bienvenue ${user?.firstName || ''} !`}
        logoText={restaurantName}
        primaryColor={organization?.primaryColor}
        restaurants={restaurants}
        currentRestaurantId={currentRestaurantId}
        onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
      >
        {/* Stats Cards Livreur */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
          <StatsCard
            icon={Package}
            value={driverStatsData?.todayDeliveries || 0}
            label="Aujourd'hui"
            iconBgStyle={{ backgroundColor: primaryBgLight }}
            iconStyle={{ color: primaryColor }}
            primaryColor={primaryColor}
          />
          <StatsCard
            icon={Bike}
            value={driverStatsData?.weekDeliveries || 0}
            label="Cette semaine"
            iconBgStyle={{ backgroundColor: primaryBgLight }}
            iconStyle={{ color: primaryColor }}
            primaryColor={primaryColor}
          />
          <StatsCard
            icon={ShoppingBag}
            value={driverStatsData?.totalDeliveries || 0}
            label="Total livraisons"
            iconBgStyle={{ backgroundColor: primaryBgLight }}
            iconStyle={{ color: primaryColor }}
            primaryColor={primaryColor}
          />
          <StatsCard
            icon={Star}
            value={driverStatsData?.avgRating ? driverStatsData.avgRating.toFixed(1) : '-'}
            label="Note moyenne"
            iconBgStyle={{ backgroundColor: primaryBgLight }}
            iconStyle={{ color: primaryColor }}
            primaryColor={primaryColor}
          />
        </div>

        {/* Livraison en cours */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bike size={18} style={{ color: primaryColor }} />
              Livraison en cours
            </h2>
          </div>

          {currentDelivery ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Commande</p>
                  <p className="font-semibold text-gray-900">#{currentDelivery.order.orderNumber}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {currentDelivery.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 mb-1">Client</p>
                <p className="font-medium text-gray-900">
                  {currentDelivery.order.customer.firstName} {currentDelivery.order.customer.lastName}
                </p>
                {currentDelivery.order.customer.phone && (
                  <a href={`tel:${currentDelivery.order.customer.phone}`} className="text-sm" style={{ color: primaryColor }}>
                    {currentDelivery.order.customer.phone}
                  </a>
                )}
              </div>

              <a
                href="/restaurant/delivery"
                className="block w-full py-2 text-center text-white rounded-lg font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Voir les details
              </a>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Aucune livraison en cours</p>
              <p className="text-sm text-gray-400 mt-1">En attente d'une nouvelle commande...</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    )
  }

  // Dashboard Restaurant (non-livreur)
  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      title="Dashboard"
      subtitle={`Bienvenue ${user?.firstName || ''} !`}
      logoText={restaurantName}
      primaryColor={organization?.primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
      promoCard={{
        icon: UtensilsCrossed,
        title: 'Organisez vos menus',
        description: 'via le bouton ci-dessous',
        buttonText: '+ Ajouter un menu',
      }}
    >
      {/* Stats Cards - 4 colonnes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        <StatsCard
          icon={UtensilsCrossed}
          value={stats?.products.total || 0}
          label="Produits"
          iconBgStyle={{ backgroundColor: primaryBgLight }}
          iconStyle={{ color: primaryColor }}
          href="/restaurant/menu"
          primaryColor={primaryColor}
        />
        <StatsCard
          icon={DollarSign}
          value={format(stats?.revenue.month || 0)}
          label="Revenus du mois"
          iconBgStyle={{ backgroundColor: primaryBgLight }}
          iconStyle={{ color: primaryColor }}
          href="/restaurant/analytics"
          primaryColor={primaryColor}
        />
        <StatsCard
          icon={ShoppingBag}
          value={stats?.orders.month || 0}
          label="Commandes du mois"
          iconBgStyle={{ backgroundColor: primaryBgLight }}
          iconStyle={{ color: primaryColor }}
          href="/restaurant/orders"
          primaryColor={primaryColor}
        />
        <StatsCard
          icon={Users}
          value={stats?.customers.total || 0}
          label="Clients"
          iconBgStyle={{ backgroundColor: primaryBgLight }}
          iconStyle={{ color: primaryColor }}
          href="/restaurant/customers"
          primaryColor={primaryColor}
        />
      </div>

      {/* Orders Summary + Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-6">
        <OrdersSummary
          totalAmount={stats?.revenue.month || 0}
          targetAmount={500000}
          percentage={Math.round(((stats?.revenue.month || 0) / 500000) * 100)}
          onDelivery={stats?.orders.preparing || 0}
          delivered={stats?.orders.month || 0}
          cancelled={0}
          formatValue={format}
          primaryColor={primaryColor}
        />
        <RevenueChart 
          totalRevenue={stats?.revenue.month || 0}
          formattedRevenue={format(stats?.revenue.month || 0)}
          chartData={revenueChartData}
          formatValue={format}
          primaryColor={primaryColor}
        />
      </div>

      {/* Customer Map + Daily Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <CustomerMap primaryColor={primaryColor} />
        <DailyTrending items={trendingProducts?.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          image: p.image || undefined,
        }))} />
      </div>
    </DashboardLayout>
  )
}
