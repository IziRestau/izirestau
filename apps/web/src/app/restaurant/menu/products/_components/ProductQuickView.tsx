'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImageViewer } from '@/components/shared/ImageViewer'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  X,
  Edit,
  ExternalLink,
  Package,
  Clock,
  Flame,
  AlertTriangle,
  Leaf,
  Layers,
  Settings2,
  Eye,
  EyeOff,
  Star,
  Loader2,
} from 'lucide-react'
import { ALLERGEN_LABELS, DIETARY_TAG_LABELS, MODIFIER_TYPE_LABELS } from '@/types/menu'
import type { Product } from '@/types/menu'

interface ProductQuickViewProps {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductQuickView({ productId, open, onOpenChange }: ProductQuickViewProps) {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { organization } = useRestaurantStore()
  const { format: formatCurrency } = useRestaurantCurrency()
  const primaryColor = organization?.primaryColor || '#10b981'

  const { data: product, isLoading } = useQuery({
    queryKey: ['restaurant-product', productId],
    queryFn: async () => {
      if (!productId) return null
      if (accessToken) apiClient.setAccessToken(accessToken)
      const response = await api.restaurant.products.get(productId)
      return response.data as Product
    },
    enabled: !!productId && open,
  })

  const handleViewDetails = () => {
    onOpenChange(false)
    router.push(`/restaurant/menu/products/${productId}/view`)
  }

  const handleEdit = () => {
    onOpenChange(false)
    router.push(`/restaurant/menu/products/${productId}`)
  }

  const allImages = product ? [product.image, ...(product.images || [])].filter(Boolean) as string[] : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg p-0 flex flex-col [&>button]:hidden"
      >
        <SheetHeader className="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-500" />
            </button>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-semibold text-gray-900">
                {product ? product.name : 'Apercu du produit'}
              </SheetTitle>
            </div>
            {product && (
              product.isActive ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <Eye size={12} className="mr-1" /> Actif
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <EyeOff size={12} className="mr-1" /> Inactif
                </Badge>
              )
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : !product ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Package className="w-12 h-12 mb-3 text-gray-300" />
              <p>Produit non trouve</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Image */}
              <ImageViewer
                images={allImages}
                alt={product.name}
                aspectRatio="square"
                showThumbnails={true}
                thumbnailSize="md"
                primaryColor={primaryColor}
                renderLightboxInline={true}
              />

              {/* Info rapide */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm">
                  <span className="text-gray-500">Categorie:</span>
                  <span className="text-gray-900 font-medium">{product.category?.name}</span>
                </div>
                {product.isFeatured && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl text-sm">
                    <Star size={14} className="text-amber-500" />
                    <span className="text-amber-700">Mis en avant</span>
                  </div>
                )}
                {product.trackInventory && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl text-sm">
                    <Package size={14} className="text-blue-500" />
                    <span className="text-blue-700">Stock: {product.stockQuantity}</span>
                  </div>
                )}
              </div>

              {/* Prix */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Tarification</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {formatCurrency(product.price)}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-lg text-gray-400 line-through">
                        {formatCurrency(product.compareAtPrice)}
                      </span>
                    )}
                  </div>
                  {product.costPrice && (
                    <p className="text-sm text-gray-500">
                      Prix de revient: {formatCurrency(product.costPrice)}
                    </p>
                  )}
                  {product.taxRate && (
                    <p className="text-xs text-gray-400 mt-2">
                      Taxe: {product.taxRate.name} ({product.taxRate.rate}%)
                      {product.taxIncluded ? ' - Incluse' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Preparation & Calories */}
              {(product.prepTime || product.calories) && (
                <div className="flex gap-4">
                  {product.prepTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-gray-600">{product.prepTime} min</span>
                    </div>
                  )}
                  {product.calories && (
                    <div className="flex items-center gap-2 text-sm">
                      <Flame size={16} className="text-orange-400" />
                      <span className="text-gray-600">{product.calories} kcal</span>
                    </div>
                  )}
                </div>
              )}

              {/* Allergenes */}
              {product.allergens && product.allergens.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" /> Allergenes
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {product.allergens.map((allergen) => (
                      <Badge key={allergen} className="bg-red-50 text-red-700 hover:bg-red-50 text-xs">
                        {ALLERGEN_LABELS[allergen] || allergen}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Regime alimentaire */}
              {product.dietaryTags && product.dietaryTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Leaf size={14} className="text-green-500" /> Regime alimentaire
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {product.dietaryTags.map((tag) => (
                      <Badge key={tag} className="bg-green-50 text-green-700 hover:bg-green-50 text-xs">
                        {DIETARY_TAG_LABELS[tag] || tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Variantes */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Layers size={14} className="text-gray-400" /> Variantes ({product.variants.length})
                  </h3>
                  <div className="space-y-2">
                    {product.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${variant.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-gray-700">{variant.name}</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: primaryColor }}>
                          {formatCurrency(variant.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              {product.modifierGroups && product.modifierGroups.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Settings2 size={14} className="text-gray-400" /> Options ({product.modifierGroups.length})
                  </h3>
                  <div className="space-y-2">
                    {product.modifierGroups.map((group) => (
                      <div key={group.id} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {group.name}
                            {group.isRequired && <span className="text-red-500 ml-1">*</span>}
                          </span>
                          <span className="text-xs text-gray-400">
                            {MODIFIER_TYPE_LABELS[group.type]}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {group.modifiers.slice(0, 3).map((modifier) => (
                            <div key={modifier.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{modifier.name}</span>
                              {modifier.price > 0 && (
                                <span className="text-gray-500">+{formatCurrency(modifier.price)}</span>
                              )}
                            </div>
                          ))}
                          {group.modifiers.length > 3 && (
                            <p className="text-xs text-gray-400">+{group.modifiers.length - 3} autres</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {product && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleViewDetails}
                className="flex-1 h-11 rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900"
              >
                <ExternalLink size={16} className="mr-2" />
                Page complete
              </Button>
              <Button 
                onClick={handleEdit}
                className="flex-1 h-11 rounded-xl text-white hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <Edit size={16} className="mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
