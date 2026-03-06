'use client'

import type { StoreRestaurantData, StoreThemeData } from '../../../_types'

interface ContactHeaderSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function ContactHeaderSection({
  restaurant,
  theme,
  sectionData,
}: ContactHeaderSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  const bgType = (s('bgType', 'color') as string)
  const title = (s('title', 'Contactez-nous') as string)
  const subtitle = (s('subtitle', 'Une question ? N\'hésitez pas à nous contacter') as string)
  const overlayOpacity = (s('overlayOpacity', 50) as number)
  const overlayBlur = (s('overlayBlur', 0) as number) || 0

  const isFloatingHeader = theme.headerDesign === 'floating'
  const floatPad = isFloatingHeader ? 'pt-24 sm:pt-28' : ''

  const bgImage = (s('bgImage') as string) || restaurant.coverImage
  if (bgType === 'image' && bgImage) {
    return (
      <section className={`relative py-16 sm:py-20 px-4 sm:px-6 text-center overflow-hidden ${floatPad}`}>
        <img
          src={bgImage}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})`,
            backdropFilter: overlayBlur > 0 ? `blur(${overlayBlur}px)` : undefined,
            WebkitBackdropFilter: overlayBlur > 0 ? `blur(${overlayBlur}px)` : undefined,
          }}
        />
        <div className="relative z-10">
          <h1
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
          >
            {title}
          </h1>
          <p className="text-sm sm:text-base mt-2 text-white/70 max-w-lg mx-auto">
            {subtitle}
          </p>
        </div>
      </section>
    )
  }

  if (bgType === 'gradient') {
    return (
      <section
        className={`py-12 sm:py-16 px-4 sm:px-6 text-center ${floatPad}`}
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
      >
        <h1
          className="text-3xl sm:text-4xl font-bold text-white"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
        >
          {title}
        </h1>
        <p className="text-sm sm:text-base mt-2 text-white/70 max-w-lg mx-auto">
          {subtitle}
        </p>
      </section>
    )
  }

  return (
    <section
      className={`py-12 sm:py-16 px-4 sm:px-6 text-center ${floatPad}`}
      style={{ backgroundColor: `${theme.primaryColor}08` }}
    >
      <h1
        className="text-3xl sm:text-4xl font-bold"
        style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
      >
        {title}
      </h1>
      <p className="text-sm sm:text-base mt-2 opacity-60 max-w-lg mx-auto" style={{ color: theme.textColor }}>
        {subtitle}
      </p>
    </section>
  )
}
