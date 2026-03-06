'use client'

import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreRestaurantData, StoreThemeData, StoreCategory } from '../../../_types'
import type { LucideIcon } from 'lucide-react'

interface StatItem {
  value: string
  label: string
  enabled: boolean
  icon: LucideIcon | null
}

interface StatsSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  categories: StoreCategory[]
  sectionData?: Record<string, unknown>
}

const DYNAMIC_SOURCES: Record<string, { label: string; getValue: (r: StoreRestaurantData, cats: StoreCategory[]) => string }> = {
  totalProducts: {
    label: 'Plats au menu',
    getValue: (_r, cats) => {
      const total = cats.reduce((sum, c) => sum + (c.products?.length || 0), 0)
      return String(total)
    },
  },
  totalCategories: {
    label: 'Catégories',
    getValue: (_r, cats) => String(cats.length),
  },
  cuisineTypes: {
    label: 'Types de cuisine',
    getValue: (r) => String(r.cuisineTypes.length),
  },
}

const DEFAULT_STATS = [
  { value: '10+', label: 'Années d\'expérience', mode: 'custom' as const },
  { value: '50+', label: 'Plats au menu', mode: 'dynamic' as const, source: 'totalProducts' },
  { value: '15+', label: 'Services / jour', mode: 'custom' as const },
  { value: '1000+', label: 'Clients satisfaits', mode: 'custom' as const },
]

export function StatsSection({
  restaurant,
  theme,
  categories,
  sectionData,
}: StatsSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const bgStyle = (s('bgStyle', 'accent') as string)
  const showSeparators = s('showSeparators', true) !== false
  const iconLayout = (s('iconLayout', 'top') as string)

  const stats: StatItem[] = []
  for (let i = 0; i < 4; i++) {
    const def = DEFAULT_STATS[i]
    const enabled = s(`stat${i}Enabled`, true) !== false
    const mode = (s(`stat${i}Mode`, def.mode) as string)
    const source = (s(`stat${i}Source`, def.source || '') as string)
    const label = (s(`stat${i}Label`, def.label) as string)

    let value: string
    if (mode === 'dynamic' && source && DYNAMIC_SOURCES[source]) {
      const dynamicVal = DYNAMIC_SOURCES[source].getValue(restaurant, categories)
      const suffix = (s(`stat${i}Suffix`, '') as string)
      value = dynamicVal + suffix
    } else {
      value = (s(`stat${i}Value`, def.value) as string)
    }

    const iconName = (s(`stat${i}Icon`, '') as string)
    const icon = getIconComponent(iconName)
    stats.push({ value, label, enabled, icon })
  }

  const activeStats = stats.filter(st => st.enabled)
  if (activeStats.length === 0) return null

  const bgColor = bgStyle === 'dark'
    ? theme.textColor
    : bgStyle === 'primary'
    ? theme.primaryColor
    : bgStyle === 'accent'
    ? `${theme.primaryColor}08`
    : theme.backgroundColor

  const valueColor = bgStyle === 'dark' || bgStyle === 'primary'
    ? theme.backgroundColor
    : theme.textColor

  const labelColor = bgStyle === 'dark' || bgStyle === 'primary'
    ? `${theme.backgroundColor}B0`
    : `${theme.textColor}90`

  const separatorColor = bgStyle === 'dark' || bgStyle === 'primary'
    ? `${theme.backgroundColor}20`
    : `${theme.primaryColor}30`

  const isDarkBg = bgStyle === 'dark' || bgStyle === 'primary'
  const iconBg = isDarkBg ? `${theme.backgroundColor}15` : `${theme.primaryColor}12`
  const iconColor = isDarkBg ? theme.backgroundColor : theme.primaryColor
  const hasAnyIcon = activeStats.some((st) => st.icon !== null)

  return (
    <section className="py-14 sm:py-20" style={{ backgroundColor: bgColor }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`flex flex-col sm:flex-row items-center justify-center ${
          activeStats.length <= 2 ? 'sm:gap-16 gap-10' : 'sm:gap-0 gap-10'
        }`}>
          {activeStats.map((stat, idx) => {
            const StatIcon = stat.icon
            return (
              <div key={idx} className="relative flex-1 px-4 sm:px-6">
                {iconLayout === 'left' && hasAnyIcon ? (
                  <div className="flex items-center gap-4 justify-center">
                    {StatIcon ? (
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: iconBg }}
                      >
                        <StatIcon size={22} style={{ color: iconColor }} />
                      </div>
                    ) : (
                      <div className="w-12 h-12 flex-shrink-0" />
                    )}
                    <div className="text-center sm:text-left">
                      <span
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-none block"
                        style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: valueColor }}
                      >
                        {stat.value}
                      </span>
                      <span
                        className="text-xs sm:text-sm mt-1.5 font-medium tracking-wide uppercase block"
                        style={{ color: labelColor }}
                      >
                        {stat.label}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    {StatIcon && (
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: iconBg }}
                      >
                        <StatIcon size={22} style={{ color: iconColor }} />
                      </div>
                    )}
                    {!StatIcon && hasAnyIcon && <div className="h-12 mb-4" />}
                    <span
                      className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-none"
                      style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: valueColor }}
                    >
                      {stat.value}
                    </span>
                    <span
                      className="text-xs sm:text-sm mt-2.5 font-medium tracking-wide uppercase"
                      style={{ color: labelColor }}
                    >
                      {stat.label}
                    </span>
                  </div>
                )}

                {showSeparators && idx < activeStats.length - 1 && (
                  <div
                    className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12"
                    style={{ backgroundColor: separatorColor }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
