'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import type { StoreThemeData, StoreProduct, StoreCategory } from '../../../_types'

interface Testimonial {
  name: string
  text: string
  rating: number
  productId?: string
  productImage?: string
}

interface TestimonialsSectionProps {
  theme: StoreThemeData
  categories: StoreCategory[]
  sectionData?: Record<string, unknown>
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { 
    name: 'Rafi K.', 
    text: 'Their set menus are worth every penny. Perfect for family treats.', 
    rating: 5,
    productImage: ''
  },
  { 
    name: 'Nabila R.', 
    text: 'Great food and a very cozy place. Perfect for weekend dinners!', 
    rating: 5,
    productImage: ''
  },
]

export function TestimonialsSection({
  theme,
  categories,
  sectionData,
}: TestimonialsSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', false) === false) return null

  const backgroundColor = (s('backgroundColor', '#0e1416') as string)
  const titleLine1 = (s('titleLine1', 'Loved by') as string)
  const titleLine2 = (s('titleLine2', 'Food Lovers & Regular Guests') as string)
  const highlightWords = (s('highlightWords', 'Lovers,Regular') as string).split(',').map(w => w.trim())
  
  const autoplay = s('autoplay', true) === true
  const autoplayDelay = Number(s('autoplayDelay', 5)) * 1000
  const visibleCount = Number(s('visibleCount', 2))
  const equalHeight = s('equalHeight', true) === true

  const rawTestimonials = s('testimonials', null)
  let testimonials: Testimonial[]

  if (Array.isArray(rawTestimonials) && rawTestimonials.length > 0) {
    testimonials = (rawTestimonials as Testimonial[]).map(t => {
      if (t.productId && categories) {
        const allProducts = categories.flatMap(c => c.products || [])
        const product = allProducts.find(p => p.id === t.productId)
        if (product) {
          return { ...t, productImage: product.image || '' }
        }
      }
      return t
    }).filter(t => t.name && t.text)
  } else {
    testimonials = DEFAULT_TESTIMONIALS
  }

  if (testimonials.length === 0) return null

  const renderHighlightedText = (text: string) => {
    const words = text.split(' ')
    return words.map((word, i) => {
      const cleanWord = word.replace(/[^a-zA-ZÀ-ÿ]/g, '')
      const isHighlighted = highlightWords.some(hw => 
        cleanWord.toLowerCase() === hw.toLowerCase()
      )
      if (isHighlighted) {
        return (
          <span key={i}>
            <span 
              className="italic"
              style={{ color: theme.primaryColor }}
            >
              {word}
            </span>
            {' '}
          </span>
        )
      }
      return <span key={i}>{word} </span>
    })
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
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-1"
            style={{ fontFamily: `'${theme.headingFont}', serif`, color: 'white' }}
          >
            {renderHighlightedText(titleLine2)}
          </h2>
        </div>

        <TestimonialsCarousel
          testimonials={testimonials}
          theme={theme}
          visibleCount={visibleCount}
          autoplay={autoplay}
          autoplayDelay={autoplayDelay}
          equalHeight={equalHeight}
        />
      </div>
    </section>
  )
}

function TestimonialsCarousel({
  testimonials,
  theme,
  visibleCount,
  autoplay,
  autoplayDelay,
  equalHeight,
}: {
  testimonials: Testimonial[]
  theme: StoreThemeData
  visibleCount: number
  autoplay: boolean
  autoplayDelay: number
  equalHeight: boolean
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const effectiveVisible = isMobile ? 1 : Math.min(visibleCount, testimonials.length)
  const maxIndex = Math.max(0, testimonials.length - effectiveVisible)

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }, [maxIndex])

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
      <div className="overflow-hidden">
        <div
          className={`flex transition-transform duration-500 ease-in-out ${equalHeight ? 'items-stretch' : 'items-start'}`}
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
              <TestimonialCard testimonial={t} theme={theme} equalHeight={equalHeight} />
            </div>
          ))}
        </div>
      </div>

      {showNav && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={goPrev}
            className="w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:border-white/40"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
            aria-label="Précédent"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            className="w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:border-white/40"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
            aria-label="Suivant"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

function TestimonialCard({
  testimonial,
  theme,
  equalHeight,
}: {
  testimonial: Testimonial
  theme: StoreThemeData
  equalHeight: boolean
}) {
  return (
    <div
      className={`p-4 sm:p-5 border flex flex-col ${equalHeight ? 'h-full' : ''}`}
      style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {testimonial.productImage && (
        <div className="w-full aspect-[4/3] overflow-hidden mb-4">
          <img
            src={testimonial.productImage}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            style={{
              color: theme.primaryColor,
              fill: i < testimonial.rating ? theme.primaryColor : 'transparent',
            }}
          />
        ))}
      </div>

      <p
        className="text-sm leading-relaxed text-white/70 mb-4 flex-1"
        style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
      >
        "{testimonial.text}"
      </p>

      <span 
        className="text-sm text-white/50"
        style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
      >
        — {testimonial.name}
      </span>
    </div>
  )
}
