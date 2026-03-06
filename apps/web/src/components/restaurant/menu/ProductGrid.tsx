'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Package,
  AlertTriangle,
} from 'lucide-react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import type { Category, ProductListItem } from '@/types/menu'

interface ProductGridProps {
  products: ProductListItem[]
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null) => void
  onEditProduct?: (product: ProductListItem) => void
  formatPrice: (value: number) => string
  primaryColor: string
  canManage: boolean
}

export function ProductGrid({
  products,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onEditProduct,
  formatPrice,
  primaryColor,
  canManage,
}: ProductGridProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [deleteConfirm, setDeleteConfirm] = useState<ProductListItem | null>(null)

  const toggleMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.products.toggle(productId)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-products'] })
      toast.success(data.data?.isActive ? 'Produit active' : 'Produit desactive')
    },
    onError: () => {
      toast.error('Erreur lors de la modification')
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.products.duplicate(productId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-products'] })
      toast.success('Produit duplique')
    },
    onError: () => {
      toast.error('Erreur lors de la duplication')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.products.delete(productId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-products'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-categories'] })
      toast.success('Produit supprime')
      setDeleteConfirm(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit</h3>
        <p className="text-sm text-gray-500 mb-4">
          {selectedCategoryId
            ? 'Cette categorie ne contient aucun produit.'
            : 'Commencez par ajouter votre premier produit.'}
        </p>
        {canManage && onEditProduct && (
          <Button
            onClick={() => onEditProduct(null as unknown as ProductListItem)}
            className="text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Ajouter un produit
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="lg:hidden mb-4 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            selectedCategoryId === null
              ? 'text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: selectedCategoryId === null ? primaryColor : undefined,
          }}
        >
          Tous
        </button>
        {categories.filter(c => !c.parentId).map(category => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedCategoryId === category.id
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: selectedCategoryId === category.id ? primaryColor : undefined,
            }}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map(product => (
          <div
            key={product.id}
            className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
              !product.isActive ? 'opacity-60' : ''
            }`}
            style={{ borderColor: product.isFeatured ? primaryColor : '#f3f4f6' }}
          >
            <div className="relative aspect-[4/3] bg-gray-100">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={48} className="text-gray-300" />
                </div>
              )}

              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {product.isFeatured && (
                  <Badge
                    className="text-white text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Star size={10} className="mr-1" />
                    Vedette
                  </Badge>
                )}
                {!product.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    <EyeOff size={10} className="mr-1" />
                    Masque
                  </Badge>
                )}
                {product.trackInventory && product.stockQuantity <= 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle size={10} className="mr-1" />
                    Rupture
                  </Badge>
                )}
              </div>

              {canManage && (
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEditProduct && (
                        <DropdownMenuItem onClick={() => onEditProduct(product)}>
                          <Edit size={14} className="mr-2" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => duplicateMutation.mutate(product.id)}>
                        <Copy size={14} className="mr-2" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleMutation.mutate(product.id)}>
                        {product.isActive ? (
                          <>
                            <EyeOff size={14} className="mr-2" />
                            Masquer
                          </>
                        ) : (
                          <>
                            <Eye size={14} className="mr-2" />
                            Afficher
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirm(product)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                <span className="font-semibold whitespace-nowrap" style={{ color: primaryColor }}>
                  {formatPrice(product.price)}
                </span>
              </div>

              {product.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{product.category.name}</span>
                <div className="flex items-center gap-2">
                  {product.variantsCount > 0 && (
                    <span>{product.variantsCount} variante{product.variantsCount > 1 ? 's' : ''}</span>
                  )}
                  {product.trackInventory && (
                    <span
                      className={product.stockQuantity <= 5 ? 'text-amber-500' : ''}
                    >
                      Stock: {product.stockQuantity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Supprimer le produit"
        message={`Etes-vous sur de vouloir supprimer "${deleteConfirm?.name}" ? Cette action est irreversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
