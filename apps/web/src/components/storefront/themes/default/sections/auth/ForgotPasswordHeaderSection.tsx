'use client'

import type { StoreThemeData, StoreRestaurantData } from '../../../_types'

interface ForgotPasswordHeaderSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function ForgotPasswordHeaderSection({
  restaurant,
  theme,
  sectionData,
}: ForgotPasswordHeaderSectionProps) {
  const enabled = sectionData?.enabled !== false
  if (!enabled) return null

  const backgroundImage = sectionData?.backgroundImage as string | undefined
  const overlayOpacity = (sectionData?.overlayOpacity as number) ?? 50
  const blurAmount = (sectionData?.blurAmount as number) ?? 0

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            filter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
            transform: blurAmount > 0 ? 'scale(1.1)' : undefined,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: backgroundImage ? `rgba(0,0,0,${overlayOpacity / 100})` : theme.primaryColor,
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <h1
          className="text-3xl sm:text-4xl font-bold text-white mb-2"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
        >
          {restaurant.name}
        </h1>
        <p className="text-white/80 text-sm sm:text-base">
          Récupération de mot de passe
        </p>
      </div>
    </section>
  )
}
