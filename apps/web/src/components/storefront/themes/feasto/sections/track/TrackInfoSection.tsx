'use client'

import { Store, Truck, UtensilsCrossed, Banknote, CreditCard, Smartphone } from 'lucide-react'
import type { StoreThemeData, StoreSettingsData } from '../../../_types'

const SERVICE_TYPE_CONFIG = {
  DELIVERY: { label: 'Livraison', icon: Truck },
  PICKUP: { label: 'À emporter', icon: Store },
  DINE_IN: { label: 'Sur place', icon: UtensilsCrossed },
}

const PAYMENT_STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: '#f59e0b' },
  PAID: { label: 'Payé', color: '#22c55e' },
  FAILED: { label: 'Échoué', color: '#ef4444' },
  REFUNDED: { label: 'Remboursé', color: '#6b7280' },
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

  const showServiceType = s('showServiceType', true) !== false
  const showPaymentStatus = s('showPaymentStatus', true) !== false

  const serviceConfig = SERVICE_TYPE_CONFIG[order.serviceType as keyof typeof SERVICE_TYPE_CONFIG] || SERVICE_TYPE_CONFIG.PICKUP
  const paymentStatusConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus as keyof typeof PAYMENT_STATUS_CONFIG] || PAYMENT_STATUS_CONFIG.PENDING
  const paymentMethodConfig = PAYMENT_METHOD_CONFIG[(order.paymentMethod || 'CASH') as keyof typeof PAYMENT_METHOD_CONFIG] || PAYMENT_METHOD_CONFIG.CASH
  
  const ServiceIcon = serviceConfig.icon
  const PaymentIcon = paymentMethodConfig.icon

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-2xl'

  return (
    <section className="py-4 sm:py-6" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3">
          {/* Service type */}
          {showServiceType && (
            <div 
              className={`p-4 ${btnClass}`}
              style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div 
                className={`w-10 h-10 mb-3 flex items-center justify-center ${btnClass}`}
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <ServiceIcon size={18} style={{ color: theme.primaryColor }} />
              </div>
              <p className="text-xs opacity-50 mb-1" style={{ color: theme.textColor }}>Service</p>
              <p className="font-semibold" style={{ color: theme.textColor }}>{serviceConfig.label}</p>
            </div>
          )}

          {/* Payment status */}
          {showPaymentStatus && (
            <div 
              className={`p-4 ${btnClass}`}
              style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div 
                className={`w-10 h-10 mb-3 flex items-center justify-center ${btnClass}`}
                style={{ backgroundColor: `${paymentStatusConfig.color}15` }}
              >
                <PaymentIcon size={18} style={{ color: paymentStatusConfig.color }} />
              </div>
              <p className="text-xs opacity-50 mb-1" style={{ color: theme.textColor }}>Paiement</p>
              <p className="font-semibold" style={{ color: paymentStatusConfig.color }}>
                {paymentStatusConfig.label}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
