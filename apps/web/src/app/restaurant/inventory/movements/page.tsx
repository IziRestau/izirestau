'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Search, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShoppingCart,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { api, apiClient } from '@/lib/api-client'
import { DashboardLayout } from '@/components/shared/dashboard'
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
  INGREDIENT_UNIT_ABBREVIATIONS,
  STOCK_MOVEMENT_TYPE_LABELS,
  type StockMovement,
  type IngredientUnit,
  type StockMovementType,
} from '@/types/inventory'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const MOVEMENT_TYPE_ICONS: Record<StockMovementType, { icon: typeof ArrowUp; color: string; bg: string }> = {
  PURCHASE: { icon: ArrowDown, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  SALE: { icon: ArrowUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ADJUSTMENT: { icon: RotateCcw, color: 'text-blue-600', bg: 'bg-blue-50' },
  WASTE: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
  TRANSFER: { icon: ArrowUpDown, color: 'text-purple-600', bg: 'bg-purple-50' },
  RETURN: { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50' },
  PRODUCTION: { icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
}

export default function MovementsPage() {
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

  const [search, setSearch] = useState('')
  const [type, setType] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', currentRestaurantId, search, type, page],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.stockMovements.list({
        search: search || undefined,
        type: type || undefined,
        page,
        limit: 20,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const movements: StockMovement[] = data?.data?.items || []
  const pagination = data?.data?.pagination
  const stats = data?.data?.stats

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
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50">
            <ArrowUpDown size={24} className="text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Mouvements de stock</h1>
              {stats && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {stats.total} mouvements
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Historique des entrées et sorties de stock
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Rechercher par ingrédient..."
              className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          <Select
            value={type || 'all'}
            onValueChange={(value) => {
              setType(value === 'all' ? '' : value)
              setPage(1)
            }}
          >
            <SelectTrigger 
              className="w-full sm:w-[180px] h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(STOCK_MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrédient</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Coût</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Raison</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse ml-auto" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse ml-auto" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                  </tr>
                ))
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <ArrowUpDown className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500">Aucun mouvement de stock trouvé</p>
                  </td>
                </tr>
              ) : (
                movements.map((movement) => {
                  const typeConfig = MOVEMENT_TYPE_ICONS[movement.type as StockMovementType] || MOVEMENT_TYPE_ICONS.ADJUSTMENT
                  const Icon = typeConfig.icon
                  const isPositive = movement.quantity > 0
                  
                  return (
                    <tr key={movement.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">
                              {format(new Date(movement.createdAt), 'dd MMM yyyy', { locale: fr })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(movement.createdAt), 'HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: primaryBgLight }}
                          >
                            <Package className="w-4 h-4" style={{ color: primaryColor }} />
                          </div>
                          <span className="font-medium text-gray-900">{movement.ingredient?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${typeConfig.bg}`}>
                            <Icon className={`w-3.5 h-3.5 ${typeConfig.color}`} />
                          </div>
                          <span className="text-sm text-gray-700">
                            {STOCK_MOVEMENT_TYPE_LABELS[movement.type as StockMovementType] || movement.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{movement.quantity} {INGREDIENT_UNIT_ABBREVIATIONS[movement.ingredient?.unit as IngredientUnit] || ''}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden md:table-cell">
                        {movement.totalCost ? (
                          <span className="text-gray-900">{formatCurrency(movement.totalCost)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-600 truncate max-w-[200px] block">
                          {movement.reason || '-'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
              </div>
            ))
          ) : movements.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowUpDown className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">Aucun mouvement de stock trouvé</p>
            </div>
          ) : (
            movements.map((movement, index) => {
              const typeConfig = MOVEMENT_TYPE_ICONS[movement.type as StockMovementType] || MOVEMENT_TYPE_ICONS.ADJUSTMENT
              const Icon = typeConfig.icon
              const isPositive = movement.quantity > 0
              
              return (
                <div 
                  key={movement.id} 
                  className={`p-5 ${index !== movements.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(movement.createdAt), 'dd MMM yyyy', { locale: fr })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(movement.createdAt), 'HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{movement.quantity} {INGREDIENT_UNIT_ABBREVIATIONS[movement.ingredient?.unit as IngredientUnit] || ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: primaryBgLight }}
                    >
                      <Package className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <span className="font-medium text-gray-900">{movement.ingredient?.name || '-'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${typeConfig.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${typeConfig.color}`} />
                      </div>
                      <span className="text-sm text-gray-700">
                        {STOCK_MOVEMENT_TYPE_LABELS[movement.type as StockMovementType] || movement.type}
                      </span>
                    </div>
                    {movement.totalCost ? (
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(movement.totalCost)}</span>
                    ) : null}
                  </div>

                  {movement.reason && (
                    <p className="mt-2 text-xs text-gray-500 truncate">
                      {movement.reason}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {pagination.page} sur {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="h-9 rounded-lg transition-colors"
                onMouseEnter={(e) => {
                  if (page > 1) {
                    e.currentTarget.style.backgroundColor = primaryColor
                    e.currentTarget.style.borderColor = primaryColor
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.color = ''
                }}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="h-9 rounded-lg transition-colors"
                onMouseEnter={(e) => {
                  if (page < pagination.totalPages) {
                    e.currentTarget.style.backgroundColor = primaryColor
                    e.currentTarget.style.borderColor = primaryColor
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.color = ''
                }}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
