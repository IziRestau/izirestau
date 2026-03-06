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

  const title = (s('title', 'Prêt à commander ?') as string)
  const subtitle = (s('subtitle', 'Parcourez notre menu et passez votre commande en quelques clics') as string)
  const buttonText = (s('buttonText', 'Commander maintenant') as string)
  const buttonLink = (s('buttonLink', 'menu') as string)
  const externalUrl = (s('externalUrl', '') as string)
  const bgImage = (s('backgroundImage', '') as string)
  const backgroundColor = (s('backgroundColor', '#0a0c10') as string)
  const BtnIcon = getIconComponent(s('buttonIcon', '') as string) || ArrowRight

  const href = buttonLink === 'external' && externalUrl
    ? externalUrl
    : buttonLink === 'contact'
    ? contactHref
    : menuHref

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="relative overflow-hidden border"
          style={{ borderColor: 'rgba(255,255,255,0.15)' }}
        >
          {bgImage ? (
            <>
              <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60" />
            </>
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: '#0e1416' }} />
          )}

          <div className="relative z-10 py-16 sm:py-20 px-6 sm:px-12 text-center">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white"
              style={{ fontFamily: `'${theme.headingFont}', serif` }}
            >
              {title}
            </h2>
            <p
              className="text-base sm:text-lg mt-4 max-w-xl mx-auto text-white/60"
              style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
            >
              {subtitle}
            </p>
            <Link
              href={href}
              className="inline-flex items-center gap-2.5 mt-8 px-8 py-3.5 text-base font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: theme.primaryColor, color: '#fff' }}
            >
              {buttonText}
              <BtnIcon size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
