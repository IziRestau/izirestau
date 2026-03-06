'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { StoreBannerData, StoreThemeData } from '../../../_types'
import { StripBannerPreview, LargeBannerPreview } from '@/components/shared/BannerPreview'

interface BannerCarouselProps {
  banners: StoreBannerData[]
  theme: StoreThemeData
  position?: string
}

function getDismissedKey(position: string): string {
  return `banner-dismissed-${position}`
}

function loadDismissed(position: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = sessionStorage.getItem(getDismissedKey(position))
    if (stored) return new Set(JSON.parse(stored))
  } catch {}
  return new Set()
}

export function BannerCarousel({ banners, theme, position = 'hero' }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed(position))
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const filtered = banners
    .filter(b => b.position === position)
    .filter(b => !dismissed.has(b.id))

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % filtered.length)
  }, [filtered.length])

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + filtered.length) % filtered.length)
  }, [filtered.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50
    if (diff > threshold) next()
    else if (diff < -threshold) prev()
    touchStartX.current = null
    touchEndX.current = null
  }

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }

  useEffect(() => {
    if (filtered.length <= 1 || isHovered) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [filtered.length, isHovered, next])

  useEffect(() => {
    if (current >= filtered.length && filtered.length > 0) {
      setCurrent(0)
    }
  }, [current, filtered.length])

  if (filtered.length === 0) return null

  const handleDismiss = (id: string) => {
    setDismissed(prev => {
      const next = new Set(prev).add(id)
      try { sessionStorage.setItem(getDismissedKey(position), JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }

  const hasStrips = filtered.some(b => b.displayType !== 'banner')
  const hasLarge = filtered.some(b => b.displayType === 'banner')

  if (hasStrips && !hasLarge) {
    return (
      <div>
        {filtered.length === 1 ? (
          <StripBannerPreview banner={filtered[0]} theme={theme} onDismiss={() => handleDismiss(filtered[0].id)} />
        ) : (
          <div
            className="relative overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...swipeHandlers}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {filtered.map((banner) => (
                <div key={banner.id} className="w-full flex-shrink-0">
                  <StripBannerPreview banner={banner} theme={theme} onDismiss={() => handleDismiss(banner.id)} />
                </div>
              ))}
            </div>
            {filtered.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/10 backdrop-blur-sm hidden sm:flex items-center justify-center hover:bg-black/20 transition-colors z-10"
                  style={{ color: filtered[0]?.styles?.textColor || '#ffffff' }}
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/10 backdrop-blur-sm hidden sm:flex items-center justify-center hover:bg-black/20 transition-colors z-10"
                  style={{ color: filtered[0]?.styles?.textColor || '#ffffff' }}
                >
                  <ChevronRight size={12} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  if (position === 'between') {
    return (
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            className="relative overflow-hidden rounded-2xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...swipeHandlers}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {filtered.map((banner) => (
                <div key={banner.id} className="w-full flex-shrink-0">
                  {banner.displayType === 'banner' ? (
                    <div className="relative aspect-[3/1] sm:aspect-[4/1]">
                      <LargeBannerPreview banner={banner} theme={theme} onDismiss={() => handleDismiss(banner.id)} compact />
                    </div>
                  ) : (
                    <StripBannerPreview banner={banner} theme={theme} onDismiss={() => handleDismiss(banner.id)} />
                  )}
                </div>
              ))}
            </div>

            {filtered.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {filtered.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <div>
      <section
        className="relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...swipeHandlers}
      >
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {filtered.map((banner) => (
            <div key={banner.id} className="w-full flex-shrink-0">
              {banner.displayType === 'banner' ? (
                <LargeBannerPreview banner={banner} theme={theme} onDismiss={() => handleDismiss(banner.id)} compact={position !== 'hero'} />
              ) : (
                <StripBannerPreview banner={banner} theme={theme} onDismiss={() => handleDismiss(banner.id)} />
              )}
            </div>
          ))}
        </div>

        {filtered.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/25 transition-colors z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/25 transition-colors z-10"
            >
              <ChevronRight size={20} />
            </button>
            {hasLarge && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {filtered.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
