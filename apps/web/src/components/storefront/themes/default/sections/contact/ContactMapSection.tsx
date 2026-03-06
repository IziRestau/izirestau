'use client'

import type { StoreRestaurantData, StoreThemeData } from '../../../_types'

interface ContactMapSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function ContactMapSection({
  restaurant,
  theme,
  sectionData,
}: ContactMapSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', false) !== true) return null

  const height = parseInt((s('height', '300') as string), 10) || 300

  const address = encodeURIComponent(
    `${restaurant.address}, ${restaurant.postalCode} ${restaurant.city}`
  )

  return (
    <section
      className="w-full overflow-hidden"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <iframe
        title="Localisation du restaurant"
        src={`https://maps.google.com/maps?q=${address}&output=embed&z=15`}
        width="100%"
        height={height}
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </section>
  )
}
