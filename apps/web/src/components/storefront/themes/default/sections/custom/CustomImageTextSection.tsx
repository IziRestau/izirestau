'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData } from '../../../_types'

interface CustomImageTextSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

const PADDING_MAP: Record<string, string> = {
  sm: 'py-6 sm:py-8',
  md: 'py-8 sm:py-12',
  lg: 'py-12 sm:py-16',
  xl: 'py-16 sm:py-24',
}

const ROUNDED_MAP: Record<string, string> = {
  none: 'rounded-none',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
}

export function CustomImageTextSection({ theme, sectionData }: CustomImageTextSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', false) === false) return null

  const imagePosition = s('imagePosition', 'left') as string
  const image = s('image') as string | undefined
  const imageRounded = ROUNDED_MAP[s('imageRounded', 'xl') as string] || 'rounded-xl'
  const title = s('title') as string | undefined
  const text = s('text') as string | undefined
  const showButton = s('showButton', false) as boolean
  const buttonText = s('buttonText', 'En savoir plus') as string
  const buttonLink = s('buttonLink', '/menu') as string
  const BtnIcon = getIconComponent(s('buttonIcon', '') as string) || ArrowRight
  const bgColor = s('bgColor') as string | undefined
  const paddingY = PADDING_MAP[s('paddingY', 'lg') as string] || 'py-12 sm:py-16'

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  return (
    <section
      className={paddingY}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`flex flex-col ${imagePosition === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-12 items-center`}>
          {image && (
            <div className="w-full lg:w-1/2">
              <div className={`relative aspect-[4/3] overflow-hidden ${imageRounded}`}>
                <Image
                  src={image}
                  alt={title || ''}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <div className={`w-full ${image ? 'lg:w-1/2' : ''}`}>
            {title && (
              <h2
                className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4"
                style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
              >
                {title}
              </h2>
            )}
            {text && (
              <p className="text-sm sm:text-base leading-relaxed opacity-80" style={{ color: theme.textColor }}>
                {text}
              </p>
            )}
            {showButton && (
              <Link
                href={buttonLink}
                className={`inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 ${btnClass}`}
                style={{ backgroundColor: theme.primaryColor }}
              >
                {buttonText}
                <BtnIcon size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
