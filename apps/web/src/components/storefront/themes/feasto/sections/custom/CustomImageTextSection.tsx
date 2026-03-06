'use client'

import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData } from '../../../_types'

interface CustomImageTextSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function CustomImageTextSection({
  theme,
  sectionData,
}: CustomImageTextSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const title = (s('title', '') as string)
  const text = (s('text', '') as string)
  const image = (s('image', '') as string)
  const imagePosition = (s('imagePosition', 'left') as string)
  const showButton = s('showButton', false) === true
  const buttonText = (s('buttonText', 'En savoir plus') as string)
  const buttonLink = (s('buttonLink', '/menu') as string)
  const BtnIcon = getIconComponent(s('buttonIcon', '') as string)

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const isReversed = imagePosition === 'right'

  return (
    <section className="py-12 sm:py-16" style={{ backgroundColor: '#0C0C0C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className={`relative ${isReversed ? 'lg:order-2' : ''}`}>
            {image ? (
              <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="rounded-2xl aspect-[4/3]"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}15, ${theme.primaryColor}05)` }}
              />
            )}
          </div>

          <div className={isReversed ? 'lg:order-1' : ''}>
            {title && (
              <h2
                className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-5"
                style={{ fontFamily: `'${theme.headingFont}', serif` }}
              >
                {title}
              </h2>
            )}

            {text && (
              <p className="text-sm sm:text-base text-white/50 leading-relaxed whitespace-pre-line mb-6">
                {text}
              </p>
            )}

            {showButton && (
              <Link
                href={buttonLink}
                className={`inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold transition-all hover:opacity-90 ${btnClass}`}
                style={{ backgroundColor: theme.primaryColor, color: '#0C0C0C' }}
              >
                {BtnIcon && <BtnIcon size={16} />}
                {buttonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
