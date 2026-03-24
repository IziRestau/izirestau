'use client'

import { Truck, Phone, User, Bike, Car } from 'lucide-react'
import type { StoreThemeData, TrackOrderDelivery } from '../../../_types'

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; description: string }> = {
  PENDING: { label: 'En attente', description: 'En attente d\'un livreur' },
  ASSIGNED: { label: 'Livreur assigne', description: 'Un livreur a ete assigne a votre commande' },
  DRIVER_EN_ROUTE: { label: 'Livreur en route', description: 'Le livreur se dirige vers le restaurant' },
  AT_RESTAURANT: { label: 'Au restaurant', description: 'Le livreur est arrive au restaurant' },
  PICKED_UP: { label: 'Commande recuperee', description: 'Le livreur a recupere votre commande' },
  EN_ROUTE: { label: 'En livraison', description: 'Le livreur est en route vers vous' },
  ARRIVED: { label: 'Livreur arrive', description: 'Le livreur est arrive a votre adresse' },
  DELIVERED: { label: 'Livree', description: 'Votre commande a ete livree' },
  FAILED: { label: 'Echec', description: 'La livraison a echoue' },
  CANCELLED: { label: 'Annulee', description: 'La livraison a ete annulee' },
}

const VEHICLE_TYPE_CONFIG: Record<string, { label: string; icon: typeof Bike }> = {
  BIKE: { label: 'Velo', icon: Bike },
  SCOOTER: { label: 'Scooter', icon: Bike },
  CAR: { label: 'Voiture', icon: Car },
  WALK: { label: 'A pied', icon: User },
}

interface TrackDeliverySectionProps {
  theme: StoreThemeData
  delivery: TrackOrderDelivery | null | undefined
  sectionData?: Record<string, unknown>
}

export function TrackDeliverySection({
  theme,
  delivery,
  sectionData,
}: TrackDeliverySectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null
  if (!delivery) return null

  const statusConfig = DELIVERY_STATUS_CONFIG[delivery.status] || DELIVERY_STATUS_CONFIG.PENDING
  const vehicleConfig = delivery.driver?.vehicleType 
    ? VEHICLE_TYPE_CONFIG[delivery.driver.vehicleType] || VEHICLE_TYPE_CONFIG.BIKE
    : null
  const VehicleIcon = vehicleConfig?.icon || Truck

  const isActiveDelivery = ['ASSIGNED', 'DRIVER_EN_ROUTE', 'AT_RESTAURANT', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED'].includes(delivery.status)

  return (
    <section className="py-4 sm:py-6" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div 
          className="p-4 sm:p-5 rounded-xl"
          style={{ backgroundColor: `${theme.textColor}04` }}
        >
          {/* Statut de livraison */}
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${theme.primaryColor}15` }}
            >
              <Truck size={20} style={{ color: theme.primaryColor }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: theme.textColor }}>
                {statusConfig.label}
              </p>
              <p className="text-xs opacity-60" style={{ color: theme.textColor }}>
                {statusConfig.description}
              </p>
            </div>
          </div>

          {/* Infos livreur */}
          {delivery.driver && isActiveDelivery && (
            <div 
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: `${theme.primaryColor}08` }}
            >
              {/* Avatar */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                {delivery.driver.avatar ? (
                  <img 
                    src={delivery.driver.avatar} 
                    alt={`${delivery.driver.firstName} ${delivery.driver.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User size={20} style={{ color: theme.primaryColor }} />
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: theme.textColor }}>
                  {delivery.driver.firstName} {delivery.driver.lastName}
                </p>
                <div className="flex items-center gap-2 text-xs opacity-60" style={{ color: theme.textColor }}>
                  <VehicleIcon size={12} />
                  <span>{vehicleConfig?.label || 'Livreur'}</span>
                </div>
              </div>

              {/* Bouton appeler */}
              {delivery.driver.phone && (
                <a
                  href={`tel:${delivery.driver.phone}`}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Phone size={18} className="text-white" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
