'use client'

import { cn } from '@/lib/utils'
import { UtensilsCrossed, ShoppingBag, Truck } from 'lucide-react'
import type { ServiceType } from '@/stores/pos.store'

interface ServiceTypeSelectorProps {
  value: ServiceType
  onChange: (value: ServiceType) => void
  primaryColor: string
}

const serviceTypes: { value: ServiceType; label: string; icon: typeof UtensilsCrossed }[] = [
  { value: 'DINE_IN', label: 'Sur place', icon: UtensilsCrossed },
  { value: 'PICKUP', label: 'À emporter', icon: ShoppingBag },
  { value: 'DELIVERY', label: 'Livraison', icon: Truck },
]

export function ServiceTypeSelector({
  value,
  onChange,
  primaryColor,
}: ServiceTypeSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg sm:rounded-xl">
      {serviceTypes.map((type) => {
        const Icon = type.icon
        const isSelected = value === type.value
        
        return (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-md sm:rounded-lg text-xs font-medium transition-all',
              isSelected
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Icon size={16} style={isSelected ? { color: primaryColor } : undefined} />
            <span className="text-[10px] sm:text-xs truncate">{type.label}</span>
          </button>
        )
      })}
    </div>
  )
}
