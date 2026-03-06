'use client'

import { MapPin, Phone, Clock } from 'lucide-react'
import type { StoreThemeData, StoreRestaurantData } from '../../../_types'

interface TrackRestaurantSectionProps {
  theme: StoreThemeData
  restaurant: StoreRestaurantData
  sectionData?: Record<string, unknown>
}

export function TrackRestaurantSection({
  theme,
  restaurant,
  sectionData,
}: TrackRestaurantSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const showAddress = s('showAddress', true) !== false
  const showPhone = s('showPhone', true) !== false

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-2xl'

  return (
    <section className="py-4 sm:py-6" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div 
          className={`p-4 sm:p-5 ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}04` }}
        >
          <div className="flex items-center gap-4">
            {restaurant.logo && (
              <img 
                src={restaurant.logo} 
                alt={restaurant.name}
                className={`w-14 h-14 object-cover flex-shrink-0 ${btnClass}`}
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 
                className="font-bold truncate"
                style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
              >
                {restaurant.name}
              </h3>
              {showAddress && restaurant.address && (
                <p className="text-sm opacity-60 truncate flex items-center gap-1" style={{ color: theme.textColor }}>
                  <MapPin size={12} />
                  {restaurant.address}
                </p>
              )}
            </div>
          </div>

          {showPhone && restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className={`flex items-center justify-center gap-2 w-full mt-4 py-3 font-medium transition-all hover:opacity-80 ${btnClass}`}
              style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
            >
              <Phone size={16} />
              Appeler le restaurant
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
