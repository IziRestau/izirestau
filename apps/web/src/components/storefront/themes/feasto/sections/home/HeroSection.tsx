'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star } from 'lucide-react'
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
  menuHref,
  contactHref,
  sectionData,
}: HeroSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-lg'

  const title = (s('title') as string) || theme.heroTitle || restaurant.name
  const subtitle = (s('subtitle') as string) || theme.heroSubtitle || restaurant.shortDescription
  const ctaText = (s('ctaText') as string) || theme.heroCtaText || 'Voir le menu'
  const showSecondaryBtn = s('showSecondaryBtn', true) === true
  const secondaryBtnText = (s('secondaryBtnText', 'Réserver une table') as string)
  const secondaryBtnLink = (s('secondaryBtnLink', 'contact') as string)
  const CtaIcon = getIconComponent(s('ctaIcon', 'Menu') as string)
  const SecondaryBtnIcon = getIconComponent(s('secondaryBtnIcon', 'CalendarDays') as string)

  const showGoogleBadge = s('showGoogleBadge', true) !== false
  const googleRating = (s('googleRating', '4.9') as string)
  const mainImage = (s('mainImage') as string) || restaurant.coverImage || ''
  const floatingImage = (s('floatingImage') as string) || ''

  const sideImages = (s('sideImages') as string[]) || []
  const slideshowAnimation = (s('slideshowAnimation', 'fade') as string)
  const slideshowInterval = (s('slideshowInterval', 5) as number) * 1000

  const hasSlideshow = sideImages.length > 1
  const allImages = hasSlideshow ? sideImages : (mainImage ? [mainImage] : (sideImages.length > 0 ? [sideImages[0]] : []))
  const resolvedFloatingImage = floatingImage || (sideImages.length > 1 ? sideImages[1] : '')

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const nextImage = useCallback(() => {
    if (allImages.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
      setIsTransitioning(false)
    }, 500)
  }, [allImages.length])

  useEffect(() => {
    if (allImages.length <= 1) return
    const interval = setInterval(nextImage, slideshowInterval)
    return () => clearInterval(interval)
  }, [allImages.length, slideshowInterval, nextImage])

  const isFloatingHeader = theme.headerDesign === 'floating'
  const secondaryHref = secondaryBtnLink === 'menu' ? menuHref : contactHref

  const ratingNum = parseFloat(googleRating) || 4.9
  const fullStars = Math.floor(ratingNum)
  const hasHalf = ratingNum - fullStars >= 0.3

  const primaryColor = theme.primaryColor

  const getAnimationClass = () => {
    if (!isTransitioning) return 'opacity-100 scale-100 translate-x-0'
    switch (slideshowAnimation) {
      case 'slide':
        return 'opacity-0 -translate-x-4'
      case 'zoom':
        return 'opacity-0 scale-110'
      case 'fade':
      default:
        return 'opacity-0'
    }
  }

  return (
    <>
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(8px, -12px) rotate(2deg); }
          50% { transform: translate(16px, 0) rotate(0deg); }
          75% { transform: translate(8px, 12px) rotate(-2deg); }
        }
        @keyframes heroFloatInner {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.02) rotate(-3deg); }
          50% { transform: scale(1) rotate(0deg); }
          75% { transform: scale(1.02) rotate(3deg); }
        }
      `}</style>
      <section
        className={`relative overflow-hidden ${isFloatingHeader ? 'pt-16' : ''}`}
        style={{ backgroundColor: '#0C0C0C' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-20 items-center min-h-[50vh] lg:min-h-[75vh]">
            <div className="flex flex-col justify-center py-12 sm:py-16 lg:py-20 relative z-10">
              {showGoogleBadge && (
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/15 mb-8 w-fit" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-sm font-semibold text-white/90">Google:</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        style={{
                          color: primaryColor,
                          fill: i < fullStars ? primaryColor : hasHalf && i === fullStars ? primaryColor : 'transparent',
                          opacity: i < fullStars ? 1 : hasHalf && i === fullStars ? 0.6 : 0.25
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-white/60">({googleRating})</span>
                </div>
              )}

              <h1
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.1]"
                style={{ fontFamily: `'${theme.headingFont}', serif` }}
              >
                {title}
              </h1>

              {subtitle && (
                <p
                  className="text-sm sm:text-base text-white/50 mt-6 max-w-md leading-relaxed"
                  style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
                >
                  {subtitle}
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-start gap-3 mt-10">
                <Link
                  href={menuHref}
                  className={`group inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold transition-all duration-300 border ${btnClass}`}
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: '#0C0C0C',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = primaryColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColor
                    e.currentTarget.style.color = '#0C0C0C'
                  }}
                >
                  {ctaText}
                  {CtaIcon && <CtaIcon size={16} />}
                </Link>

                {showSecondaryBtn && (
                  <Link
                    href={secondaryHref}
                    className={`group inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold transition-all duration-300 border ${btnClass}`}
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = primaryColor
                      e.currentTarget.style.borderColor = primaryColor
                      e.currentTarget.style.color = '#0C0C0C'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                      e.currentTarget.style.color = 'white'
                    }}
                  >
                    {secondaryBtnText}
                    {SecondaryBtnIcon && <SecondaryBtnIcon size={16} />}
                  </Link>
                )}
              </div>
            </div>

            {allImages.length > 0 && (
              <div className="relative">
                <div
                  className="relative w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] overflow-hidden shadow-2xl"
                >
                  <img
                    src={allImages[currentImageIndex]}
                    alt={restaurant.name}
                    className={`w-full h-full object-cover transition-all duration-500 ${getAnimationClass()}`}
                  />
                </div>

                {resolvedFloatingImage && (
                  <div
                    className="absolute z-20"
                    style={{
                      left: '-5rem',
                      top: '25%',
                      animation: 'heroFloat 10s ease-in-out infinite'
                    }}
                  >
                    <div
                      className="w-28 sm:w-32 lg:w-40 overflow-hidden shadow-2xl"
                      style={{
                        aspectRatio: '3/5',
                        borderRadius: '9999px',
                        border: `3px solid ${primaryColor}`
                      }}
                    >
                      <img
                        src={resolvedFloatingImage}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ animation: 'heroFloatInner 10s ease-in-out infinite' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
