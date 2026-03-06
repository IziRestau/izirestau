'use client'

import { Store, Truck, UtensilsCrossed, Banknote, CreditCard, Smartphone } from 'lucide-react'
import type { StoreThemeData, StoreSettingsData } from '../../../_types'

const SERVICE_TYPE_CONFIG = {
  DELIVERY: { label: 'Livraison', icon: Truck },
  PICKUP: { label: 'À emporter', icon: Store },
  DINE_IN: { label: 'Sur place', icon: UtensilsCrossed },
}

const PAYMENT_STATUS_CONFIG = {
  PENDING: { label: 'En attente', colorClass: 'text-amber-600', bgClass: 'bg-amber-100' },
  PAID: { label: 'Payé', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100' },
  FAILED: { label: 'Échoué', colorClass: 'text-red-600', bgClass: 'bg-red-100' },
  REFUNDED: { label: 'Remboursé', colorClass: 'text-gray-600', bgClass: 'bg-gray-100' },
}

const PAYMENT_METHOD_CONFIG = {
  CASH: { label: 'Espèces', icon: Banknote },
  CARD: { label: 'Carte', icon: CreditCard },
  MOBILE_MONEY: { label: 'Mobile Money', icon: Smartphone },
  CARD_ONLINE: { label: 'Carte en ligne', icon: CreditCard },
}

interface TrackInfoSectionProps {
  theme: StoreThemeData
  settings: StoreSettingsData
  order: {
    serviceType: string
    paymentStatus: string
    paymentMethod?: string
  }
  sectionData?: Record<string, unknown>
}

export function TrackInfoSection({
  theme,
  order,
  sectionData,
}: TrackInfoSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const layout = (s('layout', 'grid') as string)
  const showServiceType = s('showServiceType', true) !== false
  const showPaymentStatus = s('showPaymentStatus', true) !== false
  const showPaymentMethod = s('showPaymentMethod', false) === true

  const serviceConfig = SERVICE_TYPE_CONFIG[order.serviceType as keyof typeof SERVICE_TYPE_CONFIG] || SERVICE_TYPE_CONFIG.PICKUP
  const paymentStatusConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus as keyof typeof PAYMENT_STATUS_CONFIG] || PAYMENT_STATUS_CONFIG.PENDING
  const paymentMethodConfig = PAYMENT_METHOD_CONFIG[(order.paymentMethod || 'CASH') as keyof typeof PAYMENT_METHOD_CONFIG] || PAYMENT_METHOD_CONFIG.CASH
  
  const ServiceIcon = serviceConfig.icon
  const PaymentIcon = paymentMethodConfig.icon

  const cardClass = layout === 'inline' 
    ? 'flex items-center gap-3' 
    : 'flex items-center gap-3 p-4 rounded-xl'

  return (
    <section className="py-4 sm:py-6" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={layout === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-wrap items-center gap-4'}>
          {/* Type de service */}
          {showServiceType && (
            <div 
              className={cardClass}
              style={{ backgroundColor: layout === 'grid' ? `${theme.textColor}04` : undefined }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <ServiceIcon size={20} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <p className="text-xs opacity-50" style={{ color: theme.textColor }}>Service</p>
                <p className="font-semibold" style={{ color: theme.textColor }}>{serviceConfig.label}</p>
              </div>
            </div>
          )}

          {/* Statut paiement */}
          {showPaymentStatus && (
            <div 
              className={cardClass}
              style={{ backgroundColor: layout === 'grid' ? `${theme.textColor}04` : undefined }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${paymentStatusConfig.bgClass}`}>
                <PaymentIcon size={20} className={paymentStatusConfig.colorClass} />
              </div>
              <div>
                <p className="text-xs opacity-50" style={{ color: theme.textColor }}>Paiement</p>
                <p className={`font-semibold ${paymentStatusConfig.colorClass}`}>
                  {paymentStatusConfig.label}
                </p>
              </div>
            </div>
          )}

          {/* Mode de paiement */}
          {showPaymentMethod && (
            <div 
              className={cardClass}
              style={{ backgroundColor: layout === 'grid' ? `${theme.textColor}04` : undefined }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <PaymentIcon size={20} style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <p className="text-xs opacity-50" style={{ color: theme.textColor }}>Mode</p>
                <p className="font-semibold" style={{ color: theme.textColor }}>{paymentMethodConfig.label}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
