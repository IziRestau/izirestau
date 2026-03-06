'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  ChefHat,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  Package,
  ChevronLeft,
  ChevronRight,
  Calculator,
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
import { RecipeFormModal } from '@/components/restaurant/inventory/RecipeFormModal'
import type { Recipe } from '@/types/inventory'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function RecipesPage() {
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
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['recipes', currentRestaurantId, search, status, page],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.recipes.list({
        search: search || undefined,
        isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
        page,
        limit: 20,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.recipes.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipes-stats'] })
      toast.success('Recette supprimée')
      setIsDeleteModalOpen(false)
      setSelectedRecipe(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  const recalculateMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.recipes.recalculate(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      toast.success('Coût recalculé')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors du recalcul')
    },
  })

  const recipes: Recipe[] = data?.data?.items || []
  const pagination = data?.data?.pagination
  const stats = data?.data?.stats

  const handleEdit = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsFormModalOpen(true)
  }

  const handleDelete = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsDeleteModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedRecipe(null)
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
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-50">
            <ChefHat size={24} className="text-violet-500" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Recettes</h1>
              {stats && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {stats.total} recettes
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Gérez vos recettes et calculez les coûts de production
            </p>
          </div>
        </div>

        <Button
          onClick={handleCreate}
          style={{ backgroundColor: primaryColor }}
          className="text-white h-11 rounded-xl"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle recette
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
              placeholder="Rechercher une recette..."
              className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          <Select
            value={status || 'all'}
            onValueChange={(value) => {
              setStatus(value === 'all' ? '' : value)
              setPage(1)
            }}
          >
            <SelectTrigger 
              className="w-full sm:w-[150px] h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="inactive">Inactives</SelectItem>
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
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recette</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Ingrédients</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Coût</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Temps</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
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
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-12 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse ml-auto" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : recipes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <ChefHat className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500 mb-2">Aucune recette trouvée</p>
                    <Button 
                      variant="link" 
                      onClick={handleCreate}
                      style={{ color: primaryColor }}
                    >
                      Créer une recette
                    </Button>
                  </td>
                </tr>
              ) : (
                recipes.map((recipe) => (
                  <tr key={recipe.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                          <ChefHat className="w-5 h-5 text-violet-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{recipe.name}</p>
                          {recipe.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{recipe.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{recipe.ingredientsCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div>
                        <span className="font-medium text-gray-900">
                          {recipe.costPerUnit ? formatCurrency(recipe.costPerUnit) : '-'}
                        </span>
                        <span className="text-xs text-gray-500">/{recipe.yieldUnit}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {(recipe.prepTime || recipe.cookTime) ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>
                            {recipe.prepTime ? `${recipe.prepTime}min` : ''}
                            {recipe.prepTime && recipe.cookTime ? ' + ' : ''}
                            {recipe.cookTime ? `${recipe.cookTime}min` : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        recipe.isActive 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {recipe.isActive ? 'Active' : 'Inactive'}
                      </span>
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
                            onClick={() => recalculateMutation.mutate(recipe.id)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <Calculator size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Recalculer le coût</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEdit(recipe)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <Pencil size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Modifier</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(recipe)}
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
                    <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
                  </div>
                </div>
                <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            ))
          ) : recipes.length === 0 ? (
            <div className="p-12 text-center">
              <ChefHat className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500 mb-2">Aucune recette trouvée</p>
              <Button 
                variant="link" 
                onClick={handleCreate}
                style={{ color: primaryColor }}
              >
                Créer une recette
              </Button>
            </div>
          ) : (
            recipes.map((recipe, index) => (
              <div 
                key={recipe.id} 
                className={`p-5 ${index !== recipes.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{recipe.name}</p>
                      {recipe.description && (
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{recipe.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    recipe.isActive 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {recipe.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>{recipe.ingredientsCount || 0} ingr.</span>
                    </div>
                    {(recipe.prepTime || recipe.cookTime) && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {recipe.prepTime ? `${recipe.prepTime}min` : ''}
                          {recipe.prepTime && recipe.cookTime ? ' + ' : ''}
                          {recipe.cookTime ? `${recipe.cookTime}min` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {recipe.costPerUnit ? formatCurrency(recipe.costPerUnit) : '-'}
                    </p>
                    <p className="text-xs text-gray-500">/{recipe.yieldUnit}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-10 rounded-xl"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                    onClick={() => handleEdit(recipe)}
                  >
                    <Pencil size={14} className="mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 rounded-xl hover:bg-gray-50"
                    style={{ borderColor: '#e5e7eb', color: '#374151' }}
                    onClick={() => recalculateMutation.mutate(recipe.id)}
                  >
                    <Calculator size={14} className="mr-2" />
                    Coût
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 w-10 rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(recipe)}
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
      <RecipeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedRecipe(null)
        }}
        recipe={selectedRecipe}
        primaryColor={primaryColor}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedRecipe(null)
        }}
        onConfirm={() => {
          if (selectedRecipe) {
            deleteMutation.mutate(selectedRecipe.id)
          }
        }}
        title="Supprimer la recette"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedRecipe?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        icon="trash"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  )
}
