'use client'

import { ChefHat, UtensilsCrossed, Clock, ConciergeBell, ArrowRight, MoveRight, ChevronRight } from 'lucide-react'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData } from '../../../_types'

interface QualityFoodSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function QualityFoodSection({
  theme,
  sectionData,
}: QualityFoodSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const backgroundColor = (s('backgroundColor', '#0e1416') as string)
  const titleLine1 = (s('titleLine1', 'Quality Food,') as string)
  const titleLine2 = (s('titleLine2', 'Comfort Every Time') as string)
  const subtitle = (s('subtitle', 'Enjoy fresh, flavorful dishes in a warm atmosphere that feels just right for family dinners, friendly hangouts, and small celebrations.') as string)

  const iconShape = (s('iconShape', 'circle') as string)
  const separatorIcon = (s('separatorIcon', 'MoveRight') as string)

  const feature1Icon = (s('feature1Icon', 'ChefHat') as string)
  const feature1Label = (s('feature1Label', 'Talented chefs') as string)
  const feature2Icon = (s('feature2Icon', 'UtensilsCrossed') as string)
  const feature2Label = (s('feature2Label', 'Superb dishes') as string)
  const feature3Icon = (s('feature3Icon', 'Clock') as string)
  const feature3Label = (s('feature3Label', 'Amazing service') as string)
  const feature4Icon = (s('feature4Icon', 'ConciergeBell') as string)
  const feature4Label = (s('feature4Label', 'Array of Meals') as string)

  const features = [
    { icon: feature1Icon, label: feature1Label },
    { icon: feature2Icon, label: feature2Label },
    { icon: feature3Icon, label: feature3Label },
    { icon: feature4Icon, label: feature4Label },
  ]

  const SeparatorIcon = getIconComponent(separatorIcon) || MoveRight

  const getIconShapeClass = () => {
    switch (iconShape) {
      case 'rounded':
        return 'rounded-2xl'
      case 'hexagon':
        return 'rounded-xl'
      default:
        return 'rounded-full'
    }
  }

  const getIconShapeStyle = () => {
    if (iconShape === 'hexagon') {
      return { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }
    }
    return {}
  }

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 sm:mb-20">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: `'${theme.headingFont}', serif` }}
          >
            {titleLine1}
          </h2>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold italic mt-1"
            style={{ fontFamily: `'${theme.headingFont}', serif`, color: theme.primaryColor }}
          >
            {titleLine2}
          </h2>
          {subtitle && (
            <p
              className="text-sm sm:text-base text-white/50 mt-6 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-center w-full gap-8 sm:gap-0">
          {features.map((feature, i) => {
            const FeatureIcon = getIconComponent(feature.icon) || ChefHat
            return (
              <div key={i} className="flex items-center justify-center sm:justify-start">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center border ${getIconShapeClass()}`}
                    style={{
                      borderColor: 'rgba(255,255,255,0.15)',
                      ...getIconShapeStyle()
                    }}
                  >
                    <FeatureIcon
                      size={28}
                      className="sm:w-8 sm:h-8 lg:w-10 lg:h-10"
                      style={{ color: theme.primaryColor }}
                    />
                  </div>
                  <span
                    className="text-xs sm:text-sm text-white/70 text-center whitespace-nowrap"
                    style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
                  >
                    {feature.label}
                  </span>
                </div>

                {i < features.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center text-white/30 w-34 lg:w-48 -mt-6">
                    <SeparatorIcon size={24} className="lg:w-7 lg:h-7" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
