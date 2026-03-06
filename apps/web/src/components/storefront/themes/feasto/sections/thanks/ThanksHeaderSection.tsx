'use client'

import { PartyPopper } from 'lucide-react'
import type { StoreRestaurantData, StoreThemeData } from '../../../_types'

interface ThanksHeaderSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function ThanksHeaderSection({
  restaurant,
  theme,
  sectionData,
}: ThanksHeaderSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  const title = (s('title', 'Merci !') as string)
  const subtitle = (s('subtitle', 'Votre commande a bien été enregistrée') as string)

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-3xl'

  return (
    <section 
      className="py-12 sm:py-16 px-4 sm:px-6"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="max-w-lg mx-auto text-center">
        <div 
          className={`w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 flex items-center justify-center ${btnClass}`}
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <PartyPopper size={48} style={{ color: theme.primaryColor }} />
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
        >
          {title}
        </h1>
        <p 
          className="text-base sm:text-lg opacity-60"
          style={{ color: theme.textColor }}
        >
          {subtitle}
        </p>
      </div>
    </section>
  )
}
