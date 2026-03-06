'use client'

import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  id: string
  name: string
  price: number
  image?: string | null
  isAvailable?: boolean
  onClick: () => void
  formatPrice: (price: number) => string
  primaryColor: string
}

export function ProductCard({
  id,
  name,
  price,
  image,
  isAvailable = true,
  onClick,
  formatPrice,
  primaryColor,
}: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      className={cn(
        'relative bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden transition-all text-left',
        isAvailable 
          ? 'hover:shadow-lg hover:border-gray-200 active:scale-[0.98]' 
          : 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="aspect-square relative bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon size={24} className="text-gray-300 sm:hidden" />
            <ImageIcon size={32} className="text-gray-300 hidden sm:block" />
          </div>
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-500 rounded-full">
              Indisponible
            </span>
          </div>
        )}
      </div>
      
      <div className="p-2 sm:p-3">
        <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2 mb-0.5 sm:mb-1">
          {name}
        </h3>
        <p 
          className="text-xs sm:text-sm font-bold"
          style={{ color: primaryColor }}
        >
          {formatPrice(price)}
        </p>
      </div>
    </button>
  )
}
