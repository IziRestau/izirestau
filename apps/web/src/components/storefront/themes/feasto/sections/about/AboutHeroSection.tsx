'use client'

import { ArrowDown } from 'lucide-react'
import type { StoreRestaurantData, StoreThemeData } from '../../../_types'

interface AboutHeroSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function AboutHeroSection({
  restaurant,
  theme,
  sectionData,
}: AboutHeroSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const label = (s('label', 'À propos') as string)
  const title = (s('title') as string) || 'Notre histoire'
  const subtitle = (s('subtitle') as string) || ''
  const overlayOpacity = (s('overlayOpacity', 60) as number)
  const blurAmount = (s('blurAmount', 8) as number)
  const bgImage = (s('backgroundImage') as string) || restaurant.coverImage
  const showScrollDown = s('showScrollDown', true) !== false

  const isFloatingHeader = theme.headerDesign === 'floating'

  const handleScrollDown = () => {
    const el = document.getElementById('page-content-start')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const panelOverlay = `rgba(12,12,12,${overlayOpacity / 100})`
  const panelBlur = `blur(${blurAmount}px)`

  const panelStyle = {
    backgroundColor: panelOverlay,
    backdropFilter: panelBlur,
    WebkitBackdropFilter: panelBlur,
    borderColor: 'rgba(255,255,255,0.12)',
  }

  return (
    <section
      id="page-hero-section"
      className={`relative overflow-hidden ${isFloatingHeader ? 'pt-16' : ''}`}
      style={{ minHeight: '35vh' }}
    >
      {bgImage ? (
        <img src={bgImage} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#0C0C0C' }} />
      )}

      <div className="relative z-10 grid grid-cols-[1fr] sm:grid-cols-[1fr_3fr_1fr] gap-2 sm:gap-3 min-h-[35vh] sm:min-h-[45vh]">
        <div
          className="hidden sm:block border"
          style={panelStyle}
        />

        <div
          className="border flex flex-col items-center justify-center py-8 sm:py-16 lg:py-20 px-4 sm:px-6"
          style={panelStyle}
        >
          {label && (
            <span
              className="text-xs sm:text-sm font-medium tracking-widest uppercase mb-4 sm:mb-5"
              style={{ color: theme.primaryColor }}
            >
              {label}
            </span>
          )}

          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white max-w-4xl leading-tight text-center"
            style={{ fontFamily: `'${theme.headingFont}', serif` }}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm sm:text-base text-white/50 mt-4 max-w-xl text-center">
              {subtitle}
            </p>
          )}

          {showScrollDown && (
            <button
              onClick={handleScrollDown}
              className="mt-8 sm:mt-10 lg:mt-12 w-11 h-11 rounded-full bg-white flex items-center justify-center text-gray-800 hover:bg-white/90 transition-all shadow-lg"
              aria-label="Défiler vers le bas"
            >
              <ArrowDown size={18} />
            </button>
          )}
        </div>

        <div
          className="hidden sm:block border"
          style={panelStyle}
        />
      </div>
    </section>
  )
}
