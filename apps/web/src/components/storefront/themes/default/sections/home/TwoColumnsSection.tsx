'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreRestaurantData, StoreThemeData } from '../../../_types'

interface TwoColumnsSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  menuHref: string
  contactHref: string
  sectionData?: Record<string, unknown>
}

export function TwoColumnsSection({
  restaurant,
  theme,
  menuHref,
  contactHref,
  sectionData,
}: TwoColumnsSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const layout = (s('layout', 'imageLeft') as string)
  const badge = (s('badge', 'Qui sommes-nous') as string)
  const title = (s('title', '') as string) || restaurant.name
  const text = (s('text', '') as string) || restaurant.description || ''
  const image = (s('image', '') as string) || restaurant.coverImage || ''
  const secondImage = (s('secondImage', '') as string)
  const showBadge = s('showBadge', true) !== false
  const showSecondImage = s('showSecondImage', false) === true
  const btnText = (s('btnText', 'En savoir plus') as string)
  const btnLink = (s('btnLink', 'contact') as string)
  const showBtn = s('showBtn', true) !== false
  const showArrowBtn = s('showArrowBtn', true) !== false
  const BtnIcon = getIconComponent(s('btnIcon', '') as string)
  const bgStyle = (s('bgStyle', 'light') as string)
  const imageHeight = (s('imageHeight', 'auto') as string)
  const imageFit = (s('imageFit', 'cover') as string)
  const imageRounded = (s('imageRounded', '3xl') as string)
  const secondImageSize = (s('secondImageSize', 'md') as string)
  const secondImageAnimation = (s('secondImageAnimation', 'none') as string)

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const href = btnLink === 'menu' ? menuHref : contactHref
  const isReversed = layout === 'imageRight'

  const bgColor = bgStyle === 'dark'
    ? theme.textColor
    : bgStyle === 'accent'
    ? `${theme.primaryColor}08`
    : theme.backgroundColor

  const textColor = bgStyle === 'dark' ? theme.backgroundColor : theme.textColor

  const roundedMap: Record<string, string> = {
    none: 'rounded-none',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
  }
  const roundedClass = roundedMap[imageRounded] || 'rounded-3xl'

  const heightMap: Record<string, string | undefined> = {
    sm: '300px',
    md: '400px',
    lg: '500px',
    xl: '600px',
  }

  const sizeMap: Record<string, string> = {
    sm: 'w-20 h-20 sm:w-28 sm:h-28',
    md: 'w-28 h-28 sm:w-36 sm:h-36',
    lg: 'w-36 h-36 sm:w-44 sm:h-44',
  }

  const animMap: Record<string, string> = {
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    float: '',
  }

  return (
    <section className="py-16 sm:py-20" style={{ backgroundColor: bgColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${isReversed ? '' : ''}`}>
          {/* Image Column */}
          <div className={`relative ${isReversed ? 'lg:order-2' : ''}`}>
            <div className="relative">
              {secondImageAnimation === 'float' && (
                <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
              )}
              <div
                className={`${roundedClass} overflow-hidden ${
                  imageHeight === 'auto' ? 'aspect-[4/5] sm:aspect-[3/4]' : ''
                }`}
                style={imageHeight !== 'auto' && imageHeight !== 'full'
                  ? { height: heightMap[imageHeight] }
                  : imageHeight === 'full' ? { minHeight: '500px' } : undefined}
              >
                {image ? (
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full"
                    style={{ objectFit: imageFit as 'cover' | 'contain' | 'fill' }}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}20)` }}
                  />
                )}
              </div>

              {showSecondImage && secondImage && (
                <div
                  className={`absolute -bottom-6 -right-6 rounded-full border-4 overflow-hidden shadow-xl ${sizeMap[secondImageSize] || sizeMap.md} ${animMap[secondImageAnimation] || ''}`}
                  style={{
                    borderColor: theme.backgroundColor,
                    ...(secondImageAnimation === 'float' ? { animation: 'float 3s ease-in-out infinite' } : {}),
                  }}
                >
                  <img
                    src={secondImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Text Column */}
          <div className={`${isReversed ? 'lg:order-1' : ''}`}>
            {showBadge && badge && (
              <span
                className="inline-flex items-center gap-2 text-sm font-medium mb-4"
                style={{ color: theme.primaryColor }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                {badge}
              </span>
            )}

            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: textColor }}
            >
              {title}
            </h2>

            <p
              className="text-sm sm:text-base leading-relaxed opacity-70 whitespace-pre-line mb-8"
              style={{ fontFamily: `'${theme.bodyFont}', sans-serif`, color: textColor }}
            >
              {text}
            </p>

            {(showBtn || showArrowBtn) && (
              <div className="flex items-center gap-3">
                {showBtn && (
                  <Link
                    href={href}
                    className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 ${btnClass}`}
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {BtnIcon && <BtnIcon size={16} />}
                    {btnText}
                  </Link>
                )}
                {showArrowBtn && (
                  <Link
                    href={href}
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <ArrowUpRight size={18} className="text-white" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
