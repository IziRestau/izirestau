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
  const { canViewRevenue } = useRestaurantPermissions()
  
  const primaryColor = organization?.primaryColor || '#10b981'
  const primaryBgLight = hexToRgba(primaryColor, 0.1)

  const { data: stats } = useQuery({
    queryKey: ['restaurant-dashboard-stats', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getDashboardStats(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 2 * 60 * 1000,
  })

  const { data: trendingProducts } = useQuery({
    queryKey: ['restaurant-trending-products', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getTrendingProducts(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: revenueChartData } = useQuery({
    queryKey: ['restaurant-revenue-chart', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getRevenueChart(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  const restaurantName = organization?.name || restaurant?.name || 'Restaurant'

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
