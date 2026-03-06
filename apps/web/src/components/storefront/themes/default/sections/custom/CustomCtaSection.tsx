'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData } from '../../../_types'

interface CustomCtaSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function CustomCtaSection({ theme, sectionData }: CustomCtaSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', false) === false) return null

  const ctaStyle = s('style', 'banner') as string
  const title = s('title', 'Prêt à commander ?') as string
  const text = s('text') as string | undefined
  const buttonText = s('buttonText', 'Commander maintenant') as string
  const buttonLink = s('buttonLink', '/menu') as string
  const BtnIcon = getIconComponent(s('buttonIcon', '') as string) || ArrowRight

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  if (ctaStyle === 'outlined') {
    return (
      <section className="py-12 sm:py-16">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 text-center rounded-2xl border-2 py-10 sm:py-14"
          style={{ borderColor: theme.primaryColor }}
        >
          <h2
            className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {title}
          </h2>
          {text && (
            <p className="text-sm mt-2 opacity-60" style={{ color: theme.textColor }}>
              {text}
            </p>
          )}
          <Link
            href={buttonLink}
            className={`inline-flex items-center gap-2 mt-6 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            {buttonText}
            <BtnIcon size={14} />
          </Link>
        </div>
      </section>
    )
  }

  if (ctaStyle === 'gradient') {
    const gradFrom = (s('gradientFrom') as string) || theme.primaryColor
    const gradTo = (s('gradientTo') as string) || theme.secondaryColor
    return (
      <section
        className="py-12 sm:py-16 text-center"
        style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2
            className="text-2xl sm:text-3xl font-bold text-white"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
          >
            {title}
          </h2>
          {text && <p className="text-sm text-white/80 mt-2">{text}</p>}
          <Link
            href={buttonLink}
            className={`inline-flex items-center gap-2 mt-6 px-8 py-3.5 text-sm font-semibold transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.backgroundColor, color: theme.primaryColor }}
          >
            {buttonText}
            <BtnIcon size={14} />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section
      className="py-12 sm:py-16 text-center"
      style={{ backgroundColor: theme.primaryColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2
          className="text-2xl sm:text-3xl font-bold text-white"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
        >
          {title}
        </h2>
        {text && <p className="text-sm text-white/80 mt-2">{text}</p>}
        <Link
          href={buttonLink}
          className={`inline-flex items-center gap-2 mt-6 px-8 py-3.5 text-sm font-semibold transition-all hover:opacity-90 ${btnClass}`}
          style={{ backgroundColor: theme.backgroundColor, color: theme.primaryColor }}
        >
          {buttonText}
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  )
}
