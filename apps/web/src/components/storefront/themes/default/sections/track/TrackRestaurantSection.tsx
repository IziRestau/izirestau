'use client'

import { Phone, MapPin } from 'lucide-react'
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

  const layout = (s('layout', 'card') as string)
  const showPhone = s('showPhone', true) !== false
  const showAddress = s('showAddress', true) !== false
  const showCallButton = s('showCallButton', true) !== false

  if (!showPhone && !showAddress) return null

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  // Layout inline
  if (layout === 'inline') {
    return (
      <section className="py-4 sm:py-6" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <h3 
              className="font-semibold"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              {restaurant.name}
            </h3>
            {showPhone && restaurant.phone && (
              <a 
                href={`tel:${restaurant.phone}`}
                className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: theme.textColor }}
              >
                <Phone size={14} style={{ color: theme.primaryColor }} />
                {restaurant.phone}
              </a>
            )}
            {showAddress && restaurant.address && (
              <span className="flex items-center gap-2 text-sm opacity-70" style={{ color: theme.textColor }}>
                <MapPin size={14} style={{ color: theme.primaryColor }} />
                {restaurant.address}
              </span>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Layout card (défaut)
  return (
    <section className="py-4 sm:py-6" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div 
          className={`p-5 sm:p-6 ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}04` }}
        >
          <h3 
            className="font-semibold mb-4"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {restaurant.name}
          </h3>
          <div className="space-y-3">
            {showPhone && restaurant.phone && (
              showCallButton ? (
                <a 
                  href={`tel:${restaurant.phone}`}
                  className={`flex items-center gap-3 p-3 ${btnClass} hover:opacity-80 transition-opacity`}
                  style={{ backgroundColor: `${theme.textColor}04` }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${theme.primaryColor}15` }}
                  >
                    <Phone size={18} style={{ color: theme.primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs opacity-50" style={{ color: theme.textColor }}>Appeler le restaurant</p>
                    <p className="font-medium" style={{ color: theme.textColor }}>{restaurant.phone}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3">
                  <Phone size={16} style={{ color: theme.primaryColor }} />
                  <span style={{ color: theme.textColor }}>{restaurant.phone}</span>
                </div>
              )
            )}
            {showAddress && restaurant.address && (
              <div 
                className={`flex items-center gap-3 p-3 ${btnClass}`}
                style={{ backgroundColor: `${theme.textColor}04` }}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.primaryColor}15` }}
                >
                  <MapPin size={18} style={{ color: theme.primaryColor }} />
                </div>
                <div>
                  <p className="text-xs opacity-50" style={{ color: theme.textColor }}>Adresse</p>
                  <p className="font-medium" style={{ color: theme.textColor }}>{restaurant.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
