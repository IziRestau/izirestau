'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { 
  Package, 
  Truck, 
  ArrowUpDown, 
  ChefHat,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Calendar,
  DollarSign,
  Activity,
  PieChart,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { api, apiClient } from '@/lib/api-client'
import { DashboardLayout } from '@/components/shared/dashboard'
import { Button } from '@/components/ui/button'
import { 
  INGREDIENT_UNIT_ABBREVIATIONS, 
  type IngredientUnit,
} from '@/types/inventory'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function InventoryPage() {
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const { format: formatCurrency } = useRestaurantCurrency()
  
  const primaryColor = organization?.primaryColor || '#10b981'
  const primaryBgLight = hexToRgba(primaryColor, 0.1)

  const handleSwitchRestaurant = (restaurantId: string) => {
    if (accessToken) {
      switchRestaurant(accessToken, restaurantId)
    }
  }

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['inventory-stats', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.ingredients.getStats(currentRestaurantId || undefined)
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const { data: lowStockData, isLoading: isLoadingLowStock } = useQuery({
    queryKey: ['low-stock', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.ingredients.getLowStock(currentRestaurantId || undefined)
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const { data: suppliersStats } = useQuery({
    queryKey: ['suppliers-stats', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.suppliers.getStats(currentRestaurantId || undefined)
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const { data: recipesStats } = useQuery({
    queryKey: ['recipes-stats', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.recipes.getStats(currentRestaurantId || undefined)
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const { data: movementsData } = useQuery({
    queryKey: ['movements-chart', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.stockMovements.list({ limit: 100, restaurantId: currentRestaurantId || undefined })
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const stats = statsData?.data
  const lowStockItems = lowStockData?.data || []
  const movements = movementsData?.data?.movements || []

  // Préparer les données pour le graphique des mouvements par jour (7 derniers jours)
  const movementsByDay = (() => {
    const days: { [key: string]: { entries: number; exits: number; adjustments: number } } = {}
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toLocaleDateString('fr-FR', { weekday: 'short' })
      days[key] = { entries: 0, exits: 0, adjustments: 0 }
    }

    movements.forEach((m: any) => {
      const date = new Date(m.createdAt)
      const key = date.toLocaleDateString('fr-FR', { weekday: 'short' })
      if (days[key]) {
        if (m.type === 'PURCHASE' || m.type === 'RETURN') {
          days[key].entries += Number(m.quantity)
        } else if (m.type === 'SALE' || m.type === 'WASTE' || m.type === 'RECIPE_PRODUCTION') {
          days[key].exits += Math.abs(Number(m.quantity))
        } else {
          days[key].adjustments += Math.abs(Number(m.quantity))
        }
      }
    })

    return Object.entries(days).map(([day, data]) => ({
      day,
      ...data,
    }))
  })()

  // Données pour le graphique des catégories
  const categoryData = stats?.topCategories?.map((cat: { name: string; count: number }, index: number) => ({
    name: cat.name,
    value: cat.count,
    color: [primaryColor, '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6'][index % 6],
  })) || []

  // Calculer les tendances
  const todayMovements = movements.filter((m: any) => {
    const today = new Date()
    const moveDate = new Date(m.createdAt)
    return moveDate.toDateString() === today.toDateString()
  })
  
  const entriesCount = todayMovements.filter((m: any) => m.type === 'PURCHASE' || m.type === 'RETURN').length
  const exitsCount = todayMovements.filter((m: any) => m.type === 'SALE' || m.type === 'WASTE').length

  const statCards = [
    {
      label: 'Ingrédients',
      value: stats?.totalIngredients ?? 0,
      subtitle: `${stats?.trackedIngredients ?? 0} suivis`,
      icon: Package,
      href: '/restaurant/inventory/ingredients',
      usePrimary: true,
    },
    {
      label: 'Fournisseurs',
      value: suppliersStats?.data?.totalSuppliers ?? 0,
      subtitle: `${suppliersStats?.data?.activeSuppliers ?? 0} actifs`,
      icon: Truck,
      href: '/restaurant/inventory/suppliers',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Recettes',
      value: recipesStats?.data?.totalRecipes ?? 0,
      subtitle: `${recipesStats?.data?.activeRecipes ?? 0} actives`,
      icon: ChefHat,
      href: '/restaurant/inventory/recipes',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-500',
    },
    {
      label: 'Valeur du stock',
      value: stats?.totalValue ?? 0,
      subtitle: `${stats?.movementsToday ?? 0} mouvements aujourd'hui`,
      icon: TrendingUp,
      format: 'currency' as const,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
  ]

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
      {/* Dynamic accent color */}
      <style>{`
        [data-radix-select-viewport] [data-highlighted] {
          background-color: ${primaryColor} !important;
          color: white !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: primaryBgLight }}
          >
            <Package size={24} style={{ color: primaryColor }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Inventaire</h1>
              {stats && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {stats.totalIngredients} ingrédients
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">Gérez vos ingrédients, fournisseurs et recettes</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            asChild
            className="h-11 rounded-xl transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = primaryBgLight
              e.currentTarget.style.borderColor = primaryColor
              e.currentTarget.style.color = primaryColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = ''
              e.currentTarget.style.borderColor = ''
              e.currentTarget.style.color = ''
            }}
          >
            <Link href="/restaurant/inventory/movements">
              <ArrowUpDown size={16} className="mr-2" />
              Mouvements
            </Link>
          </Button>
          <Button
            asChild
            style={{ backgroundColor: primaryColor }}
            className="text-white h-11 rounded-xl"
          >
            <Link href="/restaurant/inventory/ingredients?new=true">
              <Plus size={16} className="mr-2" />
              Nouvel ingrédient
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        {isLoadingStats ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              </div>
            </div>
          ))
        ) : (
          statCards.map((stat) => {
            const Icon = stat.icon
            const content = (
              <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${!stat.usePrimary ? stat.bgColor : ''}`}
                  style={stat.usePrimary ? { backgroundColor: primaryBgLight } : undefined}
                >
                  <Icon 
                    className={`w-6 h-6 ${!stat.usePrimary ? stat.iconColor : ''}`}
                    style={stat.usePrimary ? { color: primaryColor } : undefined}
                  />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.format === 'currency' ? formatCurrency(stat.value) : stat.value.toLocaleString('fr-FR')}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                  {stat.subtitle && (
                    <div className="text-xs text-gray-400">{stat.subtitle}</div>
                  )}
                </div>
              </div>
            )
            
            return stat.href ? (
              <Link key={stat.label} href={stat.href}>{content}</Link>
            ) : (
              <div key={stat.label}>{content}</div>
            )
          })
        )}
      </div>

      {/* Graphique des mouvements + Activité du jour */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Graphique des mouvements */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Mouvements de stock</h2>
              <p className="text-xs text-gray-500">7 derniers jours</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                <span className="text-gray-600">Entrées</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-gray-600">Sorties</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementsByDay} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e2128', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="entries" fill={primaryColor} radius={[4, 4, 0, 0]} name="Entrées" />
                <Bar dataKey="exits" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Sorties" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activité du jour */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5" style={{ color: primaryColor }} />
            <h2 className="font-semibold text-gray-900">Aujourd'hui</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}>
                  <ArrowDown className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Entrées</p>
                  <p className="text-xs text-gray-500">Achats, retours</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">{entriesCount}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sorties</p>
                  <p className="text-xs text-gray-500">Ventes, pertes</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">{exitsCount}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Alertes</p>
                  <p className="text-xs text-gray-500">Stock bas</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-amber-600">{lowStockItems.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock bas + Catégories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Stock bas */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Stock bas</h2>
              {lowStockItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  {lowStockItems.length}
                </span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild 
              className="text-sm hover:bg-transparent"
              style={{ color: primaryColor }}
            >
              <Link href="/restaurant/inventory/ingredients?lowStock=true">
                Voir tout
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
          </div>

          {isLoadingLowStock ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">Aucun ingrédient en stock bas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item: any) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.currentStock} {INGREDIENT_UNIT_ABBREVIATIONS[item.unit as IngredientUnit]} 
                      {' / '}
                      {item.reorderPoint} {INGREDIENT_UNIT_ABBREVIATIONS[item.unit as IngredientUnit]} min
                    </p>
                  </div>
                  <span 
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      Number(item.currentStock) <= 0 
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {Number(item.currentStock) <= 0 ? 'Rupture' : 'Bas'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Répartition par catégorie */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5" style={{ color: primaryColor }} />
            <h2 className="font-semibold text-gray-900">Répartition par catégorie</h2>
          </div>
          {categoryData.length === 0 ? (
            <div className="py-8 text-center">
              <PieChart className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">Aucune catégorie définie</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e2128', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categoryData.slice(0, 5).map((cat: any) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Accès rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link 
            href="/restaurant/inventory/ingredients"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-center"
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: primaryBgLight }}
            >
              <Package className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Ingrédients</p>
              <p className="text-xs text-gray-500">{stats?.totalIngredients ?? 0} articles</p>
            </div>
          </Link>

          <Link 
            href="/restaurant/inventory/suppliers"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Truck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Fournisseurs</p>
              <p className="text-xs text-gray-500">{suppliersStats?.data?.totalSuppliers ?? 0} contacts</p>
            </div>
          </Link>

          <Link 
            href="/restaurant/inventory/movements"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <ArrowUpDown className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Mouvements</p>
              <p className="text-xs text-gray-500">{stats?.movementsToday ?? 0} aujourd'hui</p>
            </div>
          </Link>

          <Link 
            href="/restaurant/inventory/recipes"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Recettes</p>
              <p className="text-xs text-gray-500">{recipesStats?.data?.totalRecipes ?? 0} recettes</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
