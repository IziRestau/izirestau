'use client'

import { Clock, Star, Truck } from 'lucide-react'
import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreRestaurantData, StoreThemeData, StoreOpeningHour, StoreDeliveryData, StoreSettingsData } from '../../../_types'

interface HeroSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  openingHours: StoreOpeningHour[]
  settings: StoreSettingsData | null
  delivery: StoreDeliveryData | null
  menuHref: string
  contactHref: string
  sectionData?: Record<string, unknown>
}

export function HeroSection({
  restaurant,
  theme,
  openingHours,
  settings,
  delivery,
  menuHref,
  contactHref,
  sectionData,
}: HeroSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const today = new Date().getDay()
  const todayHours = openingHours.find(oh => oh.dayOfWeek === today)
  const isOpenNow = todayHours?.isOpen && todayHours.slots.length > 0

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const bgType = (s('bgType', 'image') as string)
  const overlayOpacity = (s('overlayOpacity', theme.heroOverlayOpacity) as number) ?? 50
  const overlayBlur = (s('overlayBlur', 0) as number) || 0
  const minHeight = (s('minHeight', '70vh') as string)
  const titleAlign = (s('titleAlign', 'center') as string)
  const showLogo = s('showLogo', true) !== false
  const showSecondaryBtn = s('showSecondaryBtn', false) === true
  const secondaryBtnText = (s('secondaryBtnText', 'Nous contacter') as string)
  const secondaryBtnLink = (s('secondaryBtnLink', 'contact') as string)
  const CtaIcon = getIconComponent(s('ctaIcon', '') as string)
  const SecondaryBtnIcon = getIconComponent(s('secondaryBtnIcon', '') as string)

  const alignClass = titleAlign === 'left' ? 'items-start text-left' : 'items-center text-center'

  const renderBackground = () => {
    if (bgType === 'video') {
      const videoUrl = s('videoUrl') as string
      if (videoUrl) {
        return (
          <div className="absolute inset-0">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity / 100}), rgba(0,0,0,0.7))`,
                backdropFilter: overlayBlur > 0 ? `blur(${overlayBlur}px)` : undefined,
                WebkitBackdropFilter: overlayBlur > 0 ? `blur(${overlayBlur}px)` : undefined,
              }}
            />
          </div>
        )
      }
    }

    if (bgType === 'gradient') {
      const from = (s('gradientFrom') as string) || theme.primaryColor
      const to = (s('gradientTo') as string) || theme.secondaryColor
      return (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        />
      )
    }

    const bgImage = (s('bgImage') as string) || restaurant.coverImage
    if (bgImage) {
      return (
        <div className="absolute inset-0">
          <img
            src={bgImage}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity / 100}), rgba(0,0,0,0.7))`,
              backdropFilter: overlayBlur > 0 ? `blur(${overlayBlur}px)` : undefined,
              WebkitBackdropFilter: overlayBlur > 0 ? `blur(${overlayBlur}px)` : undefined,
            }}
          />
        </div>
      )
    }

    return (
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
      />
    )
  }

  const secondaryHref = secondaryBtnLink === 'menu' ? menuHref : contactHref

  const isFloatingHeader = theme.headerDesign === 'floating'

  return (
    <section className="relative overflow-hidden" style={{ minHeight }}>
      {renderBackground()}

      <div
        className={`relative z-10 flex flex-col justify-center ${isFloatingHeader ? 'pt-20' : ''}`}
        style={{ minHeight }}
      >
        <div className={`max-w-7xl mx-auto w-full px-4 sm:px-6 flex flex-col ${alignClass}`}>
        {showLogo && restaurant.logo && (
          <img
            src={restaurant.logo}
            alt={restaurant.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover mb-6 shadow-xl"
          />
        )}

        <h1
          className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white max-w-3xl leading-tight"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
        >
          {(s('title') as string) || theme.heroTitle || restaurant.name}
        </h1>

        {((s('subtitle') as string) || theme.heroSubtitle || restaurant.shortDescription) && (
          <p
            className="text-base sm:text-lg text-white/80 mt-4 max-w-xl"
            style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
          >
            {(s('subtitle') as string) || theme.heroSubtitle || restaurant.shortDescription}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
          <Link
            href={menuHref}
            className={`inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 shadow-lg ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            {CtaIcon && <CtaIcon size={16} />}
            {(s('ctaText') as string) || theme.heroCtaText || 'Voir le menu'}
          </Link>

          {showSecondaryBtn && (
            <Link
              href={secondaryHref}
              className={`inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 border border-white/30 backdrop-blur-sm ${btnClass}`}
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              {SecondaryBtnIcon && <SecondaryBtnIcon size={16} />}
              {secondaryBtnText}
            </Link>
          )}

          {isOpenNow && s('showBadge', true) !== false && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Ouvert maintenant
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          {s('showCuisineTypes', true) !== false && theme.showCuisineTypes && restaurant.cuisineTypes.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs">
              <Star size={12} />
              {restaurant.cuisineTypes.slice(0, 3).join(' / ')}
            </span>
          )}
          {s('showDeliveryBadge', true) !== false && delivery?.isEnabled && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs">
              <Truck size={12} />
              Livraison {delivery.avgDeliveryTime} min
            </span>
          )}
          {s('showPrepTimeBadge', true) !== false && settings?.avgPrepTime && theme.showPrepTime && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs">
              <Clock size={12} />
              ~{settings.avgPrepTime} min
            </span>
          )}
        </div>
        </div>
      </div>
    </section>
  )
}
