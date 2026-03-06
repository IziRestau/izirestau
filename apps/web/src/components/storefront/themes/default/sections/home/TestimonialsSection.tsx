'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData } from '../../../_types'

interface Testimonial {
  name: string
  text: string
  rating: number
}

interface TestimonialsSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { name: 'Marie L.', text: 'Une cuisine exceptionnelle et un service impeccable. Je recommande vivement !', rating: 5 },
  { name: 'Thomas D.', text: 'Les plats sont toujours frais et savoureux. Mon restaurant préféré du quartier.', rating: 5 },
  { name: 'Sophie M.', text: 'Livraison rapide et plats encore chauds. La qualité est toujours au rendez-vous.', rating: 4 },
]

function TestimonialCard({
  testimonial,
  theme,
  quoteIcon,
}: {
  testimonial: Testimonial
  theme: StoreThemeData
  quoteIcon?: LucideIcon | null
}) {
  const IconComp = quoteIcon || Quote
  return (
    <div
      className="p-6 sm:p-8 rounded-2xl border flex-shrink-0 flex flex-col"
      style={{ backgroundColor: theme.backgroundColor, borderColor: `${theme.textColor}10` }}
    >
      <IconComp size={24} style={{ color: `${theme.primaryColor}40` }} className="mb-4" />
      <p
        className="text-sm leading-relaxed mb-6 opacity-70 flex-1"
        style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: theme.textColor }}
      >
        {testimonial.text}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: theme.textColor }}>{testimonial.name}</span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < testimonial.rating ? theme.primaryColor : 'transparent'}
              stroke={i < testimonial.rating ? theme.primaryColor : `${theme.textColor}30`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function TestimonialsSection({
  theme,
  sectionData,
}: TestimonialsSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', false) === false) return null

  const title = (s('title', 'Ce que disent nos clients') as string)
  const subtitle = (s('subtitle', '') as string)
  const layout = (s('layout', 'grid') as string)
  const visibleCount = Number(s('carouselVisible', 3))
  const scrollCount = Number(s('carouselScroll', 1))
  const autoplay = s('carouselAutoplay', false) === true
  const autoplayDelay = Number(s('carouselAutoplayDelay', 5)) * 1000

  const quoteIconName = (s('quoteIcon', '') as string)
  const resolvedQuoteIcon = getIconComponent(quoteIconName)

  const rawTestimonials = s('testimonials', null)
  let testimonials: Testimonial[]

  if (Array.isArray(rawTestimonials) && rawTestimonials.length > 0) {
    testimonials = (rawTestimonials as Testimonial[]).filter(
      (t) => t.name && t.text
    )
  } else {
    testimonials = DEFAULT_TESTIMONIALS
  }

  if (testimonials.length === 0) return null

  if (layout === 'carousel') {
    return (
      <section className="py-16 sm:py-20" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{subtitle}</p>
            )}
          </div>
          <TestimonialsCarousel
            testimonials={testimonials}
            theme={theme}
            visibleCount={visibleCount}
            scrollCount={scrollCount}
            autoplay={autoplay}
            autoplayDelay={autoplayDelay}
            quoteIcon={resolvedQuoteIcon}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{subtitle}</p>
          )}
        </div>

        <div className={`grid gap-6 ${
          testimonials.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' :
          testimonials.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {testimonials.map((t, idx) => (
            <TestimonialCard key={idx} testimonial={t} theme={theme} quoteIcon={resolvedQuoteIcon} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsCarousel({
  testimonials,
  theme,
  visibleCount,
  scrollCount,
  autoplay,
  autoplayDelay,
  quoteIcon,
}: {
  testimonials: Testimonial[]
  theme: StoreThemeData
  visibleCount: number
  scrollCount: number
  autoplay: boolean
  autoplayDelay: number
  quoteIcon?: LucideIcon | null
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const effectiveVisible = Math.min(visibleCount, testimonials.length)
  const maxIndex = Math.max(0, testimonials.length - effectiveVisible)

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + scrollCount
      return next > maxIndex ? 0 : next
    })
  }, [scrollCount, maxIndex])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev - scrollCount
      return next < 0 ? maxIndex : next
    })
  }, [scrollCount, maxIndex])

  useEffect(() => {
    if (!autoplay || testimonials.length <= effectiveVisible) return
    intervalRef.current = setInterval(goNext, autoplayDelay)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoplay, autoplayDelay, goNext, testimonials.length, effectiveVisible])

  const showNav = testimonials.length > effectiveVisible

  return (
    <div className="relative">
      {showNav && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            onClick={goPrev}
            className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors hover:bg-gray-50"
            style={{ borderColor: `${theme.textColor}20`, color: theme.textColor }}
            aria-label="Précédent"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goNext}
            className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors hover:bg-gray-50"
            style={{ borderColor: `${theme.textColor}20`, color: theme.textColor }}
            aria-label="Suivant"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / effectiveVisible)}%)`,
            gap: '1.5rem',
          }}
        >
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="flex-shrink-0"
              style={{ width: `calc(${100 / effectiveVisible}% - ${(1.5 * (effectiveVisible - 1)) / effectiveVisible}rem)` }}
            >
              <TestimonialCard testimonial={t} theme={theme} quoteIcon={quoteIcon} />
            </div>
          ))}
        </div>
      </div>

      {showNav && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {Array.from({ length: Math.ceil(testimonials.length / scrollCount) }).map((_, i) => {
            const isActive = currentIndex >= i * scrollCount && currentIndex < (i + 1) * scrollCount
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(Math.min(i * scrollCount, maxIndex))}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: isActive ? theme.primaryColor : `${theme.textColor}20`,
                  width: isActive ? '1.5rem' : '0.5rem',
                }}
                aria-label={`Page ${i + 1}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
