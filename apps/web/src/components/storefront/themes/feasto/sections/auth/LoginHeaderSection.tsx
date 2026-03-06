'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { StoreThemeData, StoreRestaurantData } from '../../../_types'

interface LoginHeaderSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  subdomain: string
  sectionData?: Record<string, unknown>
}

export function LoginHeaderSection({
  restaurant,
  theme,
  subdomain,
  sectionData,
}: LoginHeaderSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const bgType = (s('bgType', 'image') as string)
  const overlayOpacity = (s('overlayOpacity', theme.heroOverlayOpacity) as number) ?? 60
  const minHeight = (s('minHeight', '30vh') as string)
  const title = (s('title', 'Connexion') as string)
  const subtitle = (s('subtitle', 'Accédez à votre espace client') as string)
  const showBackLink = s('showBackLink', true) !== false
  const backLinkText = (s('backLinkText', 'Menu') as string)

  const isFloatingHeader = theme.headerDesign === 'floating'

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-2xl'

  const renderBackground = () => {
    if (bgType === 'gradient') {
      const from = (s('gradientFrom') as string) || theme.primaryColor
      const to = (s('gradientTo') as string) || theme.secondaryColor
      return (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
      )
    }

    if (bgType === 'none') return null

    const bgImage = (s('bgImage') as string) || restaurant.coverImage
    if (bgImage) {
      return (
        <div className="absolute inset-0">
          <img src={bgImage} alt={restaurant.name} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity / 100}), rgba(0,0,0,0.75))`,
            }}
          />
        </div>
      )
    }

    return (
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} />
    )
  }

  // Layout sans fond (bgType === 'none')
  if (bgType === 'none') {
    return (
      <section className={`py-10 sm:py-14 ${isFloatingHeader ? 'pt-24 sm:pt-28' : ''}`} style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showBackLink && (
            <Link
              href={`/store/${subdomain}/menu`}
              className={`inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium transition-all hover:opacity-80 ${btnClass}`}
              style={{ backgroundColor: `${theme.textColor}08`, color: theme.textColor }}
            >
              <ArrowLeft size={16} />
              {backLinkText}
            </Link>
          )}

          <div className="text-center">
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              {title}
            </h1>
            <p
              className="text-sm sm:text-base max-w-md mx-auto opacity-70"
              style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: theme.textColor }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Layout avec fond (image ou gradient) - Design héro feasto
  return (
    <section className="relative overflow-hidden" style={{ minHeight }}>
      {renderBackground()}

      <div
        className={`relative z-10 flex flex-col justify-center ${isFloatingHeader ? 'pt-20' : ''}`}
        style={{ minHeight }}
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {showBackLink && (
            <Link
              href={`/store/${subdomain}/menu`}
              className={`inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-medium transition-all ${btnClass}`}
            >
              <ArrowLeft size={16} />
              {backLinkText}
            </Link>
          )}

          <div className="text-center">
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
            >
              {title}
            </h1>
            <p
              className="text-white/80 text-sm sm:text-base max-w-md mx-auto"
              style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
