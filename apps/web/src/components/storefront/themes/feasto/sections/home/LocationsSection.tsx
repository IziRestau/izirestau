'use client'

import { Clock, MapPin, Phone, Mail, CornerDownRight, ShoppingBag } from 'lucide-react'
import type { StoreThemeData, StoreRestaurantData, StoreOpeningHour } from '../../../_types'
import { formatOpeningHours } from '@/lib/format-opening-hours'

interface LocationsSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
  restaurant?: StoreRestaurantData
  openingHours?: StoreOpeningHour[]
}

export function LocationsSection({
  theme,
  sectionData,
  restaurant,
  openingHours,
}: LocationsSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', false) === false) return null

  const backgroundColor = s('backgroundColor', '#0a0c10') as string
  const dataSource = s('dataSource', 'manual') as string
  const useDynamic = dataSource === 'dynamic'
  
  // Opening Hours
  const openingHoursTitle = s('openingHoursTitle', 'Horaires') as string
  let hoursLines: string[] = []
  if (useDynamic && openingHours && openingHours.length > 0) {
    hoursLines = formatOpeningHours(openingHours)
  } else {
    const line1 = s('openingHoursLine1', 'Dim–Jeu: 12h – 22h') as string
    const line2 = s('openingHoursLine2', 'Ven: Fermé') as string
    const line3 = s('openingHoursLine3', 'Sam: 13h – 22h') as string
    hoursLines = [line1, line2, line3].filter(Boolean)
  }

  // Location info
  const locationTitle = s('locationTitle', 'Adresse') as string
  let locationLines: string[] = []
  if (useDynamic && restaurant) {
    locationLines = [
      restaurant.address,
      restaurant.addressLine2,
      `${restaurant.postalCode} ${restaurant.city}`.trim(),
    ].filter(Boolean) as string[]
  } else {
    const line1 = s('locationLine1', 'Banani') as string
    const line2 = s('locationLine2', 'Dhanmondi') as string
    const line3 = s('locationLine3', 'Mirpur area') as string
    locationLines = [line1, line2, line3].filter(Boolean)
  }

  // Quick Contact
  const contactTitle = s('contactTitle', 'Contact') as string
  const contactPhone = useDynamic && restaurant ? restaurant.phone : (s('contactPhone', '+880 01234-567890') as string)
  const contactEmail = useDynamic && restaurant ? restaurant.email : (s('contactEmail', 'feasto@gmail.com') as string)

  // Action button
  const showActionButton = s('showActionButton', true) === true
  const actionButtonText = s('actionButtonText', 'Commander') as string
  const actionButtonUrl = s('actionButtonUrl', '#') as string

  // Location cards
  const location1Enabled = s('location1Enabled', true) === true
  const location1Title = s('location1Title', 'Hungerford Street, CA') as string
  const location1MapEmbed = s('location1MapEmbed', '') as string
  const location1MapUrl = s('location1MapUrl', '#') as string

  const location2Enabled = s('location2Enabled', false) === true
  const location2Title = s('location2Title', '2042 High Street, Oakland USA') as string
  const location2MapEmbed = s('location2MapEmbed', '') as string
  const location2MapUrl = s('location2MapUrl', '#') as string

  const viewMapText = s('viewMapText', 'Voir sur la carte') as string

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Info Cards - 4 separate cards in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
          {/* Opening Hours */}
          <div 
            className="border p-6"
            style={{ borderColor: 'rgba(255,255,255,0.15)', backgroundColor: '#0e1416' }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.primaryColor}20` }}
              >
                <Clock size={16} style={{ color: theme.primaryColor }} />
              </div>
              <span 
                className="text-base font-medium"
                style={{ color: theme.primaryColor, fontFamily: `'${theme.headingFont}', serif` }}
              >
                {openingHoursTitle}
              </span>
            </div>
            <ul className="space-y-2 pl-1">
              {hoursLines.map((line, idx) => (
                <li key={idx} className="text-sm text-white/60 flex items-center gap-2">
                  <span className="text-white/40">•</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Location */}
          <div 
            className="border p-6"
            style={{ borderColor: 'rgba(255,255,255,0.15)', backgroundColor: '#0e1416' }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.primaryColor}20` }}
              >
                <MapPin size={16} style={{ color: theme.primaryColor }} />
              </div>
              <span 
                className="text-base font-medium"
                style={{ color: theme.primaryColor, fontFamily: `'${theme.headingFont}', serif` }}
              >
                {locationTitle}
              </span>
            </div>
            <ul className="space-y-2 pl-1">
              {locationLines.map((line, idx) => (
                <li key={idx} className="text-sm text-white/60 flex items-center gap-2">
                  <span className="text-white/40">•</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Contact */}
          <div 
            className="border p-6"
            style={{ borderColor: 'rgba(255,255,255,0.15)', backgroundColor: '#0e1416' }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.primaryColor}20` }}
              >
                <Phone size={16} style={{ color: theme.primaryColor }} />
              </div>
              <span 
                className="text-base font-medium"
                style={{ color: theme.primaryColor, fontFamily: `'${theme.headingFont}', serif` }}
              >
                {contactTitle}
              </span>
            </div>
            <ul className="space-y-2 pl-1">
              {contactPhone && (
                <li className="text-sm text-white/60 flex items-center gap-2">
                  <span className="w-6 h-4 bg-red-600 flex-shrink-0" />
                  <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">
                    {contactPhone}
                  </a>
                </li>
              )}
              {contactEmail && (
                <li className="text-sm text-white/60 flex items-center gap-2">
                  <Mail size={16} className="flex-shrink-0 text-white/40" />
                  <a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors">
                    {contactEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Action Button */}
          <div 
            className="border p-6 flex items-center justify-center"
            style={{ borderColor: 'rgba(255,255,255,0.15)', backgroundColor: '#0e1416' }}
          >
            {showActionButton && (
              <a
                href={actionButtonUrl}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded text-base font-medium transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: theme.primaryColor, 
                  color: '#fff',
                  fontFamily: `'${theme.bodyFont}', sans-serif`
                }}
              >
                {actionButtonText}
                <ShoppingBag size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Map Cards - Separate cards with same gap */}
        <div className={`grid gap-2 ${location1Enabled && location2Enabled ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
          {location1Enabled && (
            <LocationMapCard
              title={location1Title}
              mapEmbedUrl={location1MapEmbed}
              mapUrl={location1MapUrl}
              viewMapText={viewMapText}
              theme={theme}
              backgroundColor={backgroundColor}
            />
          )}
          {location2Enabled && (
            <LocationMapCard
              title={location2Title}
              mapEmbedUrl={location2MapEmbed}
              mapUrl={location2MapUrl}
              viewMapText={viewMapText}
              theme={theme}
              backgroundColor={backgroundColor}
            />
          )}
        </div>
      </div>
    </section>
  )
}

function LocationMapCard({
  title,
  mapEmbedUrl,
  mapUrl,
  viewMapText,
  theme,
  backgroundColor,
}: {
  title: string
  mapEmbedUrl: string
  mapUrl: string
  viewMapText: string
  theme: StoreThemeData
  backgroundColor: string
}) {
  return (
    <div 
      className="border overflow-hidden"
      style={{ borderColor: 'rgba(255,255,255,0.15)' }}
    >
      {/* Map */}
      <div className="w-full h-52">
        {mapEmbedUrl ? (
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={title}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white/40 text-sm">
            Ajoutez une URL Google Maps embed
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5" style={{ backgroundColor }}>
        <h4 
          className="text-lg font-semibold text-white mb-2"
          style={{ fontFamily: `'${theme.headingFont}', serif` }}
        >
          {title}
        </h4>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
          style={{ color: theme.primaryColor }}
        >
          <CornerDownRight size={14} />
          {viewMapText}
        </a>
      </div>
    </div>
  )
}
