'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData } from '../../../_types'

interface CustomCtaSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function CustomCtaSection({
  theme,
  sectionData,
}: CustomCtaSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const title = (s('title', 'Prêt à commander ?') as string)
  const subtitle = (s('subtitle', '') as string)
  const buttonText = (s('buttonText', 'Commander maintenant') as string)
  const buttonLink = (s('buttonLink', '/menu') as string)
  const bgImage = (s('bgImage', '') as string)
  const BtnIcon = getIconComponent(s('buttonIcon', '') as string) || ArrowRight

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      {bgImage ? (
        <>
          <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/70" />
        </>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: theme.primaryColor }} />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <h2
          className="text-3xl sm:text-4xl font-bold"
          style={{
            fontFamily: `'${theme.headingFont}', serif`,
            color: bgImage ? '#FFFFFF' : '#0C0C0C',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-sm sm:text-base mt-3 max-w-lg mx-auto"
            style={{ color: bgImage ? 'rgba(255,255,255,0.7)' : 'rgba(12,12,12,0.6)' }}
          >
            {subtitle}
          </p>
        )}
        <Link
          href={buttonLink}
          className={`inline-flex items-center gap-2 mt-8 px-8 py-3.5 text-sm font-semibold transition-all hover:opacity-90 ${btnClass}`}
          style={
            bgImage
              ? { backgroundColor: theme.primaryColor, color: '#0C0C0C' }
              : { backgroundColor: '#0C0C0C', color: '#FFFFFF' }
          }
        >
          {buttonText}
          <BtnIcon size={14} />
        </Link>
      </div>
    </section>
  )
}
