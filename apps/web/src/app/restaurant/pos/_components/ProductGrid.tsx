'use client'

import { ProductCard } from './ProductCard'
import { Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  image?: string | null
  isActive: boolean
  trackInventory?: boolean
  stockQuantity?: number
}

interface ProductGridProps {
  products: Product[]
  isLoading: boolean
  onProductClick: (product: Product) => void
  formatPrice: (price: number) => string
  primaryColor: string
}

export function ProductGrid({
  products,
  isLoading,
  onProductClick,
  formatPrice,
  primaryColor,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg font-medium">Aucun produit</p>
        <p className="text-sm">Cette catégorie est vide</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
      {products.map((product) => {
        const isAvailable = product.isActive && 
          (!product.trackInventory || (product.stockQuantity ?? 0) > 0)
        
        return (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.image}
            isAvailable={isAvailable}
            onClick={() => onProductClick(product)}
            formatPrice={formatPrice}
            primaryColor={primaryColor}
          />
        )
      })}
    </div>
  )
}
