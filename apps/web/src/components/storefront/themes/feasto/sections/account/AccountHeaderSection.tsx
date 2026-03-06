'use client'

import { LogOut, User } from 'lucide-react'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'
import type { StoreThemeData, StoreRestaurantData } from '../../../_types'

interface AccountHeaderSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function AccountHeaderSection({
  restaurant,
  theme,
  sectionData,
}: AccountHeaderSectionProps) {
  const { customer, logout } = useStorefrontAuthStore()

  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const title = (s('title', 'Mon compte') as string)
  const showLogoutButton = s('showLogoutButton', true) !== false

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  return (
    <section 
      className="py-8 sm:py-12"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${theme.primaryColor}15` }}
            >
              <User size={28} style={{ color: theme.primaryColor }} />
            </div>
            <div>
              <h1
                className="text-xl sm:text-2xl font-bold"
                style={{ 
                  fontFamily: `'${theme.headingFont}', sans-serif`,
                  color: theme.textColor 
                }}
              >
                {title}
              </h1>
              {customer && (
                <p 
                  className="text-sm opacity-60"
                  style={{ color: theme.textColor }}
                >
                  {customer.firstName} {customer.lastName}
                </p>
              )}
            </div>
          </div>

          {showLogoutButton && (
            <button
              onClick={logout}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:opacity-80 ${btnClass}`}
              style={{ 
                backgroundColor: `${theme.textColor}08`,
                color: theme.textColor 
              }}
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
