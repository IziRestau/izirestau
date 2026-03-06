'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Package,
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { IngredientFormModal } from '@/components/restaurant/inventory/IngredientFormModal'
import { AdjustStockModal } from '@/components/restaurant/inventory/AdjustStockModal'
import { 
  INGREDIENT_UNIT_ABBREVIATIONS,
  type Ingredient,
  type IngredientUnit,
} from '@/types/inventory'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function IngredientsPage() {
  const queryClient = useQueryClient()
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
  const [category, setCategory] = useState<string>('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['ingredients', currentRestaurantId, search, category, lowStockOnly, page],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.ingredients.list({
        search: search || undefined,
        category: category || undefined,
        lowStock: lowStockOnly || undefined,
        page,
        limit: 20,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['ingredient-categories', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.ingredients.getCategories(currentRestaurantId || undefined)
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.ingredients.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      toast.success('Ingrédient supprimé')
      setIsDeleteModalOpen(false)
      setSelectedIngredient(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const ingredients: Ingredient[] = data?.data?.items || []
  const pagination = data?.data?.pagination
  const stats = data?.data?.stats
  const categories: string[] = categoriesData?.data || []

  const handleEdit = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setIsFormModalOpen(true)
  }

  const handleAdjustStock = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setIsAdjustStockModalOpen(true)
  }

  const handleDelete = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setIsDeleteModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedIngredient(null)
    setIsFormModalOpen(true)
  }

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
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Ingrédients</h1>
              {stats && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {stats.total} ingrédients
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Gérez vos ingrédients et leur stock
              {stats?.lowStockCount ? ` • ${stats.lowStockCount} en stock bas` : ''}
            </p>
          </div>
        </div>

        <Button
          onClick={handleCreate}
          style={{ backgroundColor: primaryColor }}
          className="text-white h-11 rounded-xl"
        >
          <Plus size={16} className="mr-2" />
          Nouvel ingrédient
        </Button>
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
              placeholder="Rechercher un ingrédient..."
              className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          <Select
            value={category || 'all'}
            onValueChange={(value) => {
              setCategory(value === 'all' ? '' : value)
              setPage(1)
            }}
          >
            <SelectTrigger 
              className="w-full sm:w-[180px] h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setLowStockOnly(!lowStockOnly)
              setPage(1)
            }}
            className="h-11 rounded-xl"
            style={lowStockOnly ? { 
              backgroundColor: primaryColor, 
              borderColor: primaryColor,
              color: 'white' 
            } : undefined}
          >
            <AlertTriangle size={16} className="mr-2" />
            Stock bas
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrédient</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Coût unitaire</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Valeur</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse ml-auto" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse ml-auto" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse ml-auto" /></td>
                    <td className="px-5 py-4"><div className="h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500 mb-2">Aucun ingrédient trouvé</p>
                    <Button 
                      variant="link" 
                      onClick={handleCreate}
                      style={{ color: primaryColor }}
                    >
                      Créer un ingrédient
                    </Button>
                  </td>
                </tr>
              ) : (
                ingredients.map((ingredient) => (
                  <tr key={ingredient.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: primaryBgLight }}
                        >
                          <Package className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{ingredient.name}</p>
                          {ingredient.sku && (
                            <p className="text-xs text-gray-500">SKU: {ingredient.sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {ingredient.category ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {ingredient.category}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={ingredient.isLowStock ? 'font-medium text-amber-600' : 'text-gray-900'}>
                          {ingredient.currentStock} {INGREDIENT_UNIT_ABBREVIATIONS[ingredient.unit as IngredientUnit]}
                        </span>
                        {ingredient.isLowStock && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      {ingredient.reorderPoint && (
                        <p className="text-xs text-gray-400">
                          Min: {ingredient.reorderPoint} {INGREDIENT_UNIT_ABBREVIATIONS[ingredient.unit as IngredientUnit]}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right hidden md:table-cell">
                      <span className="text-gray-900">{formatCurrency(ingredient.unitCost)}</span>
                      <span className="text-xs text-gray-400">/{INGREDIENT_UNIT_ABBREVIATIONS[ingredient.unit as IngredientUnit]}</span>
                    </td>
                    <td className="px-5 py-4 text-right hidden lg:table-cell">
                      <span className="text-gray-900">{formatCurrency(ingredient.currentStock * ingredient.unitCost)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${primaryColor}15`
                              e.currentTarget.style.color = primaryColor
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = ''
                              e.currentTarget.style.color = ''
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                          <DropdownMenuItem 
                            onClick={() => handleAdjustStock(ingredient)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <ArrowUpDown size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Ajuster le stock</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEdit(ingredient)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <Pencil size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Modifier</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(ingredient)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                          >
                            <Trash2 size={16} className="mr-3" />
                            <span className="text-[13px]">Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                  </div>
                </div>
                <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            ))
          ) : ingredients.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500 mb-2">Aucun ingrédient trouvé</p>
              <Button 
                variant="link" 
                onClick={handleCreate}
                style={{ color: primaryColor }}
              >
                Créer un ingrédient
              </Button>
            </div>
          ) : (
            ingredients.map((ingredient, index) => (
              <div 
                key={ingredient.id} 
                className={`p-5 ${index !== ingredients.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: primaryBgLight }}
                    >
                      <Package className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ingredient.name}</p>
                      {ingredient.category && (
                        <span className="text-xs text-gray-500">{ingredient.category}</span>
                      )}
                    </div>
                  </div>
                  {ingredient.isLowStock && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Stock bas
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Stock actuel</p>
                    <p className={`text-lg font-bold ${ingredient.isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                      {ingredient.currentStock} {INGREDIENT_UNIT_ABBREVIATIONS[ingredient.unit as IngredientUnit]}
                    </p>
                    {ingredient.reorderPoint && (
                      <p className="text-xs text-gray-400">
                        Min: {ingredient.reorderPoint} {INGREDIENT_UNIT_ABBREVIATIONS[ingredient.unit as IngredientUnit]}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Coût unitaire</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(ingredient.unitCost)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Valeur: {formatCurrency(ingredient.currentStock * ingredient.unitCost)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-10 rounded-xl"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                    onClick={() => handleAdjustStock(ingredient)}
                  >
                    <ArrowUpDown size={14} className="mr-2" />
                    Ajuster
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-10 rounded-xl"
                    onClick={() => handleEdit(ingredient)}
                  >
                    <Pencil size={14} className="mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 w-10 rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(ingredient)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))
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

      {/* Modals */}
      <IngredientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedIngredient(null)
        }}
        ingredient={selectedIngredient}
        primaryColor={primaryColor}
      />

      <AdjustStockModal
        isOpen={isAdjustStockModalOpen}
        onClose={() => {
          setIsAdjustStockModalOpen(false)
          setSelectedIngredient(null)
        }}
        ingredient={selectedIngredient}
        primaryColor={primaryColor}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedIngredient(null)
        }}
        onConfirm={() => {
          if (selectedIngredient) {
            deleteMutation.mutate(selectedIngredient.id)
          }
        }}
        title="Supprimer l'ingrédient"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedIngredient?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        icon="trash"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  )
}
