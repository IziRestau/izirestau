'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { StoreThemeData, StoreRestaurantData } from '../../../_types'

interface ForgotPasswordHeaderSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  subdomain: string
  sectionData?: Record<string, unknown>
}

export function ForgotPasswordHeaderSection({
  restaurant,
  theme,
  subdomain,
  sectionData,
}: ForgotPasswordHeaderSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const title = (s('title', 'Mot de passe oublié') as string)
  const subtitle = (s('subtitle', 'Entrez votre email pour réinitialiser votre mot de passe') as string)
  const showBackLink = s('showBackLink', true) !== false
  const backLinkText = (s('backLinkText', 'Retour à la connexion') as string)

  return (
    <section 
      className="py-12 sm:py-16"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="max-w-md mx-auto px-4 sm:px-6 text-center">
        {showBackLink && (
          <Link
            href={`/store/${subdomain}/login`}
            className="inline-flex items-center gap-2 mb-6 text-sm opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: theme.textColor }}
          >
            <ArrowLeft size={16} />
            {backLinkText}
          </Link>
        )}

        {restaurant.logo && (
          <div className="flex justify-center mb-6">
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="h-16 w-auto object-contain"
            />
          </div>
        )}

        <h1
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ 
            fontFamily: `'${theme.headingFont}', sans-serif`,
            color: theme.textColor 
          }}
        >
          {title}
        </h1>
        <p
          className="text-sm sm:text-base opacity-60"
          style={{ 
            fontFamily: `'${theme.bodyFont}', sans-serif`,
            color: theme.textColor 
          }}
        >
          {subtitle}
        </p>
      </div>
    </section>
  )
}
