'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import {
  ShoppingBag,
  Search,
  Package,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { RestaurantDetails, Product, Category } from '../types'

interface MenuTabProps {
  restaurant: RestaurantDetails
}

interface MenuData {
  products: Product[]
  categories: Category[]
}

export function MenuTab({ restaurant }: MenuTabProps) {
  const { accessToken } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['platform-restaurant-products', restaurant.id],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get(`/platform/restaurants/${restaurant.id}/products`)
      return res.data as MenuData
    },
    enabled: !!accessToken,
  })

  const currency = restaurant.settings?.currency || 'XOF'

  const filteredProducts = data?.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.category?.id === selectedCategory
    const matchesActive = showInactive || product.isActive
    return matchesSearch && matchesCategory && matchesActive
  }) || []

  const activeCount = data?.products.filter(p => p.isActive).length || 0
  const inactiveCount = data?.products.filter(p => !p.isActive).length || 0
  const lowStockCount = data?.products.filter(p => p.stockQuantity !== null && p.stockQuantity <= 5).length || 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{data?.products.length || 0}</p>
              <p className="text-xs text-gray-500">Produits</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{data?.categories.length || 0}</p>
              <p className="text-xs text-gray-500">Categories</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Eye size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{lowStockCount}</p>
              <p className="text-xs text-gray-500">Stock bas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-medium text-gray-900">Categories</h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                  !selectedCategory ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <span>Toutes</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{data?.products.length || 0}</span>
              </button>
              {data?.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    selectedCategory === category.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <span className="truncate">{category.name}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{category.productsCount}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <Checkbox
                  checked={showInactive}
                  onCheckedChange={(checked) => setShowInactive(checked === true)}
                />
                Afficher inactifs ({inactiveCount})
              </label>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Chargement...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucun produit trouve</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                          {!product.isActive && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center gap-1">
                              <EyeOff size={12} />
                              Inactif
                            </span>
                          )}
                          {!product.isVisible && product.isActive && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                              Masque
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{product.category?.name || 'Sans categorie'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(product.price))}
                        </p>
                        {product.stockQuantity !== null && (
                          <p className={cn(
                            'text-xs',
                            product.stockQuantity <= 5 ? 'text-orange-600' : 'text-gray-500'
                          )}>
                            Stock: {product.stockQuantity}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
