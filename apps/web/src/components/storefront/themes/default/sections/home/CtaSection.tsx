'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData } from '../../../_types'

interface CtaSectionProps {
  theme: StoreThemeData
  menuHref: string
  contactHref: string
  sectionData?: Record<string, unknown>
}

export function CtaSection({
  theme,
  menuHref,
  contactHref,
  sectionData,
}: CtaSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const ctaStyle = (s('style', 'banner') as string)
  const title = (s('title', 'Prêt à commander ?') as string)
  const subtitle = (s('subtitle', 'Parcourez notre menu et passez votre commande en quelques clics') as string)
  const buttonText = (s('buttonText', 'Commander maintenant') as string)
  const buttonLink = (s('buttonLink', 'menu') as string)
  const BtnIcon = getIconComponent(s('buttonIcon', '') as string) || ArrowRight

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const href = buttonLink === 'contact' ? contactHref : menuHref

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
          <p className="text-sm mt-2 opacity-60" style={{ color: theme.textColor }}>
            {subtitle}
          </p>
          <Link
            href={href}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-2xl sm:text-3xl font-bold text-white"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
          >
            {title}
          </h2>
          <p className="text-sm text-white/80 mt-2">{subtitle}</p>
          <Link
            href={href}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <h2
          className="text-2xl sm:text-3xl font-bold text-white"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}
        >
          {title}
        </h2>
        <p className="text-sm text-white/80 mt-2">{subtitle}</p>
        <Link
          href={href}
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
