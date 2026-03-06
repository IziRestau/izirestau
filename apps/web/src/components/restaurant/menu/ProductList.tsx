'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Package,
  AlertTriangle,
  ImageIcon,
  ExternalLink,
  Zap,
} from 'lucide-react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { ProductQuickView } from '@/app/restaurant/menu/products/_components/ProductQuickView'
import type { Category, ProductListItem } from '@/types/menu'

interface ProductListProps {
  products: ProductListItem[]
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null) => void
  onEditProduct?: (product: ProductListItem) => void
  formatPrice: (value: number) => string
  primaryColor: string
  canManage: boolean
}

export function ProductList({
  products,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onEditProduct,
  formatPrice,
  primaryColor,
  canManage,
}: ProductListProps) {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [deleteConfirm, setDeleteConfirm] = useState<ProductListItem | null>(null)
  const [toggleConfirm, setToggleConfirm] = useState<ProductListItem | null>(null)
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null)

  const toggleMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.products.toggle(productId)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-products'] })
      toast.success(data.data?.isActive ? 'Produit active' : 'Produit desactive')
      setToggleConfirm(null)
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
      </div>
    )
  }

  return (
    <>
      <div className="lg:hidden mb-4 relative">
        <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide max-w-[calc(100vw-2rem)]">
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
      </div>

      {/* Vue mobile - Cartes */}
      <div className="md:hidden space-y-3">
        {products.map(product => (
          <div
            key={product.id}
            className={`bg-white rounded-xl border border-gray-100 p-4 ${!product.isActive ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => setQuickViewProductId(product.id)}
                className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden"
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={20} className="text-gray-400" />
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <button
                      onClick={() => setQuickViewProductId(product.id)}
                      className="font-medium text-gray-900 text-left truncate block w-full"
                    >
                      {product.name}
                      {product.isFeatured && (
                        <Star size={12} style={{ color: primaryColor }} className="inline ml-1" />
                      )}
                    </button>
                    <p className="text-xs text-gray-500">{product.category.name}</p>
                  </div>
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 flex-shrink-0">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border border-gray-100 shadow-lg">
                        <DropdownMenuItem onClick={() => setQuickViewProductId(product.id)} className="rounded-lg px-3 py-2.5 cursor-pointer">
                          <Zap size={14} className="mr-3 text-gray-400" />
                          <span className="text-[13px]">Apercu rapide</span>
                        </DropdownMenuItem>
                        {onEditProduct && (
                          <DropdownMenuItem onClick={() => onEditProduct(product)} className="rounded-lg px-3 py-2.5 cursor-pointer">
                            <Edit size={14} className="mr-3 text-gray-400" />
                            <span className="text-[13px]">Modifier</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(product.id)} className="rounded-lg px-3 py-2.5 cursor-pointer">
                          <Copy size={14} className="mr-3 text-gray-400" />
                          <span className="text-[13px]">Dupliquer</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setToggleConfirm(product)} className="rounded-lg px-3 py-2.5 cursor-pointer">
                          {product.isActive ? <EyeOff size={14} className="mr-3 text-gray-400" /> : <Eye size={14} className="mr-3 text-gray-400" />}
                          <span className="text-[13px]">{product.isActive ? 'Masquer' : 'Afficher'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem onClick={() => setDeleteConfirm(product)} className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500">
                          <Trash2 size={14} className="mr-3" />
                          <span className="text-[13px]">Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    {formatPrice(product.price)}
                  </span>
                  <div className="flex items-center gap-2">
                    {product.trackInventory && product.stockQuantity <= 0 && (
                      <Badge variant="destructive" className="text-xs">Rupture</Badge>
                    )}
                    {product.isActive ? (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700">Actif</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Masque</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vue desktop - Tableau */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Produit</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Categorie</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Prix</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Stock</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                {canManage && <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${!product.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuickViewProductId(product.id)}
                        className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-offset-1 transition-all"
                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      >
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={16} className="text-gray-400" />
                          </div>
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQuickViewProductId(product.id)}
                            className="font-medium text-gray-900 truncate hover:underline text-left"
                            style={{ textDecorationColor: primaryColor }}
                          >
                            {product.name}
                          </button>
                          {product.isFeatured && <Star size={14} style={{ color: primaryColor }} className="flex-shrink-0" />}
                        </div>
                        {product.variantsCount > 0 && (
                          <span className="text-xs text-gray-500">{product.variantsCount} variante{product.variantsCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{product.category.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium" style={{ color: primaryColor }}>{formatPrice(product.price)}</span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="ml-2 text-xs text-gray-400 line-through">{formatPrice(product.compareAtPrice)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.trackInventory ? (
                      <span className={`text-sm ${product.stockQuantity <= 5 ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                        {product.stockQuantity <= 0 ? (
                          <Badge variant="destructive" className="text-xs"><AlertTriangle size={10} className="mr-1" />Rupture</Badge>
                        ) : product.stockQuantity}
                      </span>
                    ) : <span className="text-xs text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.isActive ? (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><Eye size={10} className="mr-1" />Actif</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs"><EyeOff size={10} className="mr-1" />Masque</Badge>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                          <DropdownMenuItem onClick={() => setQuickViewProductId(product.id)} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                            <Zap size={14} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Apercu rapide</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/restaurant/menu/products/${product.id}/view`)} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                            <ExternalLink size={14} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Voir details</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          {onEditProduct && (
                            <DropdownMenuItem onClick={() => onEditProduct(product)} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                              <Edit size={14} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Modifier</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => duplicateMutation.mutate(product.id)} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                            <Copy size={14} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Dupliquer</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setToggleConfirm(product)} className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                            {product.isActive ? (
                              <><EyeOff size={14} className="mr-3 text-gray-400" /><span className="text-[13px] text-gray-700">Masquer</span></>
                            ) : (
                              <><Eye size={14} className="mr-3 text-gray-400" /><span className="text-[13px] text-gray-700">Afficher</span></>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => setDeleteConfirm(product)} className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50">
                            <Trash2 size={14} className="mr-3" />
                            <span className="text-[13px]">Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      <ConfirmModal
        isOpen={!!toggleConfirm}
        onClose={() => setToggleConfirm(null)}
        onConfirm={() => toggleConfirm && toggleMutation.mutate(toggleConfirm.id)}
        title={toggleConfirm?.isActive ? 'Masquer le produit' : 'Afficher le produit'}
        message={toggleConfirm?.isActive 
          ? `Etes-vous sur de vouloir masquer "${toggleConfirm?.name}" ? Il ne sera plus visible sur le menu client.`
          : `Etes-vous sur de vouloir afficher "${toggleConfirm?.name}" ? Il sera visible sur le menu client.`
        }
        confirmText={toggleConfirm?.isActive ? 'Masquer' : 'Afficher'}
        variant={toggleConfirm?.isActive ? 'warning' : 'info'}
        icon={toggleConfirm?.isActive ? 'pause' : 'play'}
        isLoading={toggleMutation.isPending}
      />

      <ProductQuickView
        productId={quickViewProductId}
        open={!!quickViewProductId}
        onOpenChange={(open) => !open && setQuickViewProductId(null)}
      />
    </>
  )
}
