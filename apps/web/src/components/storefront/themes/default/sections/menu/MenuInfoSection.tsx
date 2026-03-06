'use client'

import { MapPin, Clock, Truck, Phone } from 'lucide-react'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreRestaurantData, StoreThemeData, StoreOpeningHour, StoreDeliveryData } from '../../../_types'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

interface MenuInfoSectionProps {
  restaurant: StoreRestaurantData
  theme: StoreThemeData
  openingHours: StoreOpeningHour[]
  delivery: StoreDeliveryData | null
  sectionData?: Record<string, unknown>
}

export function MenuInfoSection({
  restaurant,
  theme,
  openingHours,
  delivery,
  sectionData,
}: MenuInfoSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const layout = (s('layout', 'horizontal') as string)
  const showOpeningHours = s('showOpeningHours', true) !== false
  const showAddress = s('showAddress', true) !== false
  const showPhone = s('showPhone', true) !== false
  const showDeliveryInfo = s('showDeliveryInfo', true) !== false

  const AddressIcon = getIconComponent(s('addressIcon', '') as string) || MapPin
  const HoursIcon = getIconComponent(s('hoursIcon', '') as string) || Clock
  const DeliveryIcon = getIconComponent(s('deliveryIcon', '') as string) || Truck
  const PhoneIcon = getIconComponent(s('phoneIcon', '') as string) || Phone

  const today = new Date().getDay()
  const sortedHours = [...openingHours].sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0]
    return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek)
  })

  if (layout === 'vertical') {
    return (
      <section className="py-10 sm:py-14" style={{ backgroundColor: `${theme.textColor}04` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          {showAddress && (
            <div className="flex items-start gap-4">
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

          {showPhone && restaurant.phone && (
            <div className="flex items-start gap-4">
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

          {showDeliveryInfo && delivery?.isEnabled && (
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <DeliveryIcon size={18} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: theme.textColor }}>Livraison</h3>
                <p className="text-sm mt-1 opacity-60" style={{ color: theme.textColor }}>
                  Temps moyen : ~{delivery.avgDeliveryTime} min
                </p>
              </div>
            </div>
          )}

          {showOpeningHours && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.primaryColor}15` }}
                >
                  <HoursIcon size={18} style={{ color: theme.primaryColor }} />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: theme.textColor }}>
                  Horaires d&apos;ouverture
                </h3>
              </div>
              <div className="space-y-1.5 ml-[52px]">
                {sortedHours.map(oh => (
                  <div
                    key={oh.dayOfWeek}
                    className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-lg ${
                      oh.dayOfWeek === today ? 'font-medium' : 'opacity-60'
                    }`}
                    style={{
                      color: theme.textColor,
                      backgroundColor: oh.dayOfWeek === today ? `${theme.primaryColor}08` : 'transparent',
                    }}
                  >
                    <span>{DAY_NAMES[oh.dayOfWeek]}</span>
                    <span>
                      {oh.isOpen && oh.slots.length > 0
                        ? oh.slots.map(sl => `${sl.openTime} - ${sl.closeTime}`).join(', ')
                        : 'Fermé'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="py-10 sm:py-14" style={{ backgroundColor: `${theme.textColor}04` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
                <div className="space-y-1 mt-1">
                  {sortedHours.map(oh => (
                    <div
                      key={oh.dayOfWeek}
                      className={`text-sm ${oh.dayOfWeek === today ? 'font-medium' : 'opacity-60'}`}
                      style={{ color: theme.textColor }}
                    >
                      <span>{DAY_NAMES[oh.dayOfWeek]} : </span>
                      <span>
                        {oh.isOpen && oh.slots.length > 0
                          ? oh.slots.map(sl => `${sl.openTime} - ${sl.closeTime}`).join(', ')
                          : 'Fermé'}
                      </span>
                    </div>
                  ))}
                </div>
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
                  Temps moyen : ~{delivery.avgDeliveryTime} min
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
