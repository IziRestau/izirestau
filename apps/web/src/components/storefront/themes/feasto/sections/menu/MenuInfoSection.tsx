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

  return (
    <section className="py-10 sm:py-14" style={{ backgroundColor: '#141414' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {showAddress && (
            <div
              className="flex items-start gap-4 p-6 rounded-2xl border"
              style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0C0C0C' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <AddressIcon size={18} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Adresse</h3>
                <p className="text-sm mt-1 text-white/50">
                  {restaurant.address}
                  {restaurant.addressLine2 && <><br />{restaurant.addressLine2}</>}
                  <br />{restaurant.postalCode} {restaurant.city}
                </p>
              </div>
            </div>
          )}

          {showOpeningHours && (
            <div
              className="flex items-start gap-4 p-6 rounded-2xl border"
              style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0C0C0C' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <HoursIcon size={18} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Horaires</h3>
                <div className="space-y-1 mt-1">
                  {sortedHours.map(oh => (
                    <div
                      key={oh.dayOfWeek}
                      className={`text-sm ${oh.dayOfWeek === today ? 'font-medium text-white/80' : 'text-white/40'}`}
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
            <div
              className="flex items-start gap-4 p-6 rounded-2xl border"
              style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0C0C0C' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <PhoneIcon size={18} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Téléphone</h3>
                <a
                  href={`tel:${restaurant.phone}`}
                  className="text-sm mt-1 text-white/50 hover:text-white/70 transition-colors block"
                >
                  {restaurant.phone}
                </a>
              </div>
            </div>
          )}

          {showDeliveryInfo && delivery?.isEnabled && (
            <div
              className="flex items-start gap-4 p-6 rounded-2xl border"
              style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0C0C0C' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <DeliveryIcon size={18} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Livraison</h3>
                <p className="text-sm mt-1 text-white/50">
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
