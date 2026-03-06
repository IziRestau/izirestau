'use client'

import { MapPin, Clock, Truck, Phone } from 'lucide-react'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreRestaurantData, StoreThemeData, StoreOpeningHour, StoreDeliveryData, StoreSettingsData } from '../../../_types'

interface AboutSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  openingHours: StoreOpeningHour[]
  delivery: StoreDeliveryData | null
  settings: StoreSettingsData | null
  sectionData?: Record<string, unknown>
}

export function AboutSection({
  restaurant,
  theme,
  openingHours,
  delivery,
  settings,
  sectionData,
}: AboutSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const currency = settings?.currency || 'XOF'
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)

  const layout = (s('layout', 'cards') as string)
  const title = (s('title') as string)
  const text = (s('text') as string)
  const aboutImage = (s('image') as string)
  const showAddress = s('showAddress', true) !== false
  const showOpeningHours = s('showOpeningHours', true) !== false
  const showDeliveryInfo = s('showDeliveryInfo', true) !== false
  const showPhone = s('showPhone', false) === true

  const AddressIcon = getIconComponent(s('addressIcon', '') as string) || MapPin
  const HoursIcon = getIconComponent(s('hoursIcon', '') as string) || Clock
  const DeliveryIcon = getIconComponent(s('deliveryIcon', '') as string) || Truck
  const PhoneIcon = getIconComponent(s('phoneIcon', '') as string) || Phone

  const today = new Date().getDay()
  const todayHours = openingHours.find(oh => oh.dayOfWeek === today)

  if (layout === 'split') {
    return (
      <section className="py-12 sm:py-16" style={{ backgroundColor: `${theme.textColor}04` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {title && (
            <h2
              className="text-2xl sm:text-3xl font-bold mb-8"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              {title}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {aboutImage && (
              <div className="rounded-2xl overflow-hidden">
                <img src={aboutImage} alt={title || restaurant.name} className="w-full h-64 sm:h-80 object-cover" />
              </div>
            )}
            <div>
              {text && (
                <p className="text-sm sm:text-base leading-relaxed opacity-70 whitespace-pre-line" style={{ color: theme.textColor }}>
                  {text}
                </p>
              )}
              <div className="mt-6 space-y-3">
                {showAddress && (
                  <div className="flex items-center gap-3 text-sm opacity-60" style={{ color: theme.textColor }}>
                    <AddressIcon size={16} style={{ color: theme.primaryColor }} className="flex-shrink-0" />
                    <span>{restaurant.address}, {restaurant.postalCode} {restaurant.city}</span>
                  </div>
                )}
                {showPhone && restaurant.phone && (
                  <div className="flex items-center gap-3 text-sm opacity-60" style={{ color: theme.textColor }}>
                    <PhoneIcon size={16} style={{ color: theme.primaryColor }} className="flex-shrink-0" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
                {showOpeningHours && todayHours && (
                  <div className="flex items-center gap-3 text-sm opacity-60" style={{ color: theme.textColor }}>
                    <HoursIcon size={16} style={{ color: theme.primaryColor }} className="flex-shrink-0" />
                    <span>
                      {todayHours.isOpen && todayHours.slots.length > 0
                        ? todayHours.slots.map(sl => `${sl.openTime} - ${sl.closeTime}`).join(', ')
                        : 'Fermé aujourd\'hui'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (layout === 'centered') {
    return (
      <section className="py-12 sm:py-16 text-center" style={{ backgroundColor: `${theme.textColor}04` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {title && (
            <h2
              className="text-2xl sm:text-3xl font-bold mb-4"
              style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
            >
              {title}
            </h2>
          )}
          {text && (
            <p className="text-sm sm:text-base leading-relaxed opacity-70 whitespace-pre-line" style={{ color: theme.textColor }}>
              {text}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {showAddress && (
              <div className="flex items-center gap-2 text-sm opacity-60" style={{ color: theme.textColor }}>
                <AddressIcon size={16} style={{ color: theme.primaryColor }} />
                <span>{restaurant.city}</span>
              </div>
            )}
            {showPhone && restaurant.phone && (
              <div className="flex items-center gap-2 text-sm opacity-60" style={{ color: theme.textColor }}>
                <PhoneIcon size={16} style={{ color: theme.primaryColor }} />
                <span>{restaurant.phone}</span>
              </div>
            )}
            {showOpeningHours && todayHours && (
              <div className="flex items-center gap-2 text-sm opacity-60" style={{ color: theme.textColor }}>
                <HoursIcon size={16} style={{ color: theme.primaryColor }} />
                <span>
                  {todayHours.isOpen && todayHours.slots.length > 0
                    ? todayHours.slots.map(sl => `${sl.openTime} - ${sl.closeTime}`).join(', ')
                    : 'Fermé aujourd\'hui'}
                </span>
              </div>
            )}
            {showDeliveryInfo && delivery?.isEnabled && (
              <div className="flex items-center gap-2 text-sm opacity-60" style={{ color: theme.textColor }}>
                <DeliveryIcon size={16} style={{ color: theme.primaryColor }} />
                <span>Livraison ~{delivery.avgDeliveryTime} min</span>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 sm:py-16" style={{ backgroundColor: `${theme.textColor}04` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {title && (
          <h2
            className="text-2xl sm:text-3xl font-bold mb-8"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {title}
          </h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {showAddress && (
            <div className="flex items-start gap-4 p-6 rounded-2xl" style={{ backgroundColor: theme.backgroundColor }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <AddressIcon size={18} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: theme.textColor }}>Adresse</h3>
                <p className="text-sm mt-1 opacity-60" style={{ color: theme.textColor }}>
                  {restaurant.address}
                  {restaurant.addressLine2 && <><br />{restaurant.addressLine2}</>}
                  <br />{restaurant.postalCode} {restaurant.city}
                </p>
              </div>
            </div>
          )}

          {showOpeningHours && (
            <div className="flex items-start gap-4 p-6 rounded-2xl" style={{ backgroundColor: theme.backgroundColor }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <HoursIcon size={18} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: theme.textColor }}>Horaires</h3>
                {todayHours && (
                  <p className="text-sm mt-1 opacity-60" style={{ color: theme.textColor }}>
                    {todayHours.isOpen && todayHours.slots.length > 0
                      ? todayHours.slots.map(sl => `${sl.openTime} - ${sl.closeTime}`).join(', ')
                      : 'Fermé aujourd\'hui'}
                  </p>
                )}
              </div>
            </div>
          )}

          {showDeliveryInfo && delivery?.isEnabled && (
            <div className="flex items-start gap-4 p-6 rounded-2xl" style={{ backgroundColor: theme.backgroundColor }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <DeliveryIcon size={18} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: theme.textColor }}>Livraison</h3>
                <p className="text-sm mt-1 opacity-60" style={{ color: theme.textColor }}>
                  ~{delivery.avgDeliveryTime} min
                  {delivery.baseFee != null && <><br />Frais : {formatPrice(delivery.baseFee)}</>}
                  {delivery.freeDeliveryMin != null && (
                    <><br />Gratuit dès {formatPrice(delivery.freeDeliveryMin)}</>
                  )}
                </p>
              </div>
            </div>
          )}

          {showPhone && restaurant.phone && (
            <div className="flex items-start gap-4 p-6 rounded-2xl" style={{ backgroundColor: theme.backgroundColor }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <PhoneIcon size={18} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: theme.textColor }}>Téléphone</h3>
                <a
                  href={`tel:${restaurant.phone}`}
                  className="text-sm mt-1 opacity-60 hover:opacity-80 transition-opacity block"
                  style={{ color: theme.textColor }}
                >
                  {restaurant.phone}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
