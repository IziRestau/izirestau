'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  Store, 
  UtensilsCrossed, 
  Clock, 
  MapPin, 
  CreditCard, 
  Banknote,
  Star,
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  Eye,
  Loader2,
  Calendar,
  FileText,
  Phone,
  Mail
} from 'lucide-react'
import type { StoreThemeData, StoreSettingsData } from '../themes/_types'
import { OrderReviewModal, type ReviewData } from './OrderReviewModal'

interface OrderItem {
  id: string
  productId: string
  productName: string
  variantId?: string | null
  variantName?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  specialInstructions?: string | null
}

interface OrderReview {
  rating: number
  foodRating?: number | null
  serviceRating?: number | null
  deliveryRating?: number | null
  comment?: string | null
  createdAt: string
}

interface Order {
  id: string
  orderNumber: string
  displayNumber?: string
  createdAt: string
  updatedAt?: string
  status: string
  paymentStatus?: string
  paymentMethod?: string
  serviceType: string
  subtotal: number
  taxAmount: number
  deliveryFee: number
  tip?: number
  discount?: number
  total: number
  customerNotes?: string | null
  deliveryAddress?: string | null
  estimatedPrepTime?: number | null
  scheduledFor?: string | null
  items?: OrderItem[]
  review?: OrderReview | null
}

interface OrderDetailsViewProps {
  order: Order
  theme: StoreThemeData
  settings: StoreSettingsData
  subdomain: string
  accessToken: string
  onBack: () => void
  onReorder: (items: OrderItem[], serviceType: string) => void
}

export function OrderDetailsView({
  order,
  theme,
  settings,
  subdomain,
  accessToken,
  onBack,
  onReorder,
}: OrderDetailsViewProps) {
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(!!order.review)
  const [payingOrder, setPayingOrder] = useState(false)
  const [switchingToCash, setSwitchingToCash] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: settings?.currency || 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PREPARING: 'En préparation',
      READY: 'Prête',
      OUT_FOR_DELIVERY: 'En livraison',
      DELIVERING: 'En livraison',
      DELIVERED: 'Livrée',
      PICKED_UP: 'Récupérée',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      CONFIRMED: '#3b82f6',
      PREPARING: '#8b5cf6',
      READY: '#10b981',
      OUT_FOR_DELIVERY: '#06b6d4',
      DELIVERING: '#06b6d4',
      DELIVERED: '#22c55e',
      PICKED_UP: '#22c55e',
      COMPLETED: '#22c55e',
      CANCELLED: '#ef4444',
    }
    return colors[status] || theme.textColor
  }

  const getPaymentStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      PAID: 'Payé',
      FAILED: 'Échoué',
      REFUNDED: 'Remboursé',
    }
    return status ? labels[status] || status : ''
  }

  const getPaymentMethodLabel = (method?: string) => {
    const labels: Record<string, string> = {
      CASH: 'Espèces',
      CARD: 'Carte bancaire',
      CARD_ONLINE: 'Carte en ligne',
      MOBILE_MONEY: 'Mobile Money',
      APPLE_PAY: 'Apple Pay',
      GOOGLE_PAY: 'Google Pay',
    }
    return method ? labels[method] || method : ''
  }

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'DELIVERY': return Truck
      case 'PICKUP': return Store
      case 'DINE_IN': return UtensilsCrossed
      default: return Package
    }
  }

  const getServiceTypeLabel = (serviceType: string) => {
    const labels: Record<string, string> = {
      DELIVERY: 'Livraison',
      PICKUP: 'À emporter',
      DINE_IN: 'Sur place',
    }
    return labels[serviceType] || serviceType
  }

  const isOrderTrackable = (status: string) => {
    return !['COMPLETED', 'CANCELLED', 'DELIVERED', 'PICKED_UP'].includes(status)
  }

  const isOrderCompleted = (status: string) => {
    return ['COMPLETED', 'DELIVERED', 'PICKED_UP'].includes(status)
  }

  const isPaymentPending = () => {
    return order.paymentStatus === 'PENDING' && 
           (order.paymentMethod === 'MOBILE_MONEY' || order.paymentMethod === 'CARD_ONLINE')
  }

  const canReview = () => {
    return isOrderCompleted(order.status) && !hasReviewed
  }

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.displayNumber || order.orderNumber)
    setCopiedOrderNumber(true)
    setTimeout(() => setCopiedOrderNumber(false), 2000)
  }

  const handlePayOrder = async () => {
    setPayingOrder(true)
    try {
      const response = await fetch(`${API_URL}/store/${subdomain}/account/orders/${order.id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      
      if (data.success && data.data) {
        if (data.data.alreadyPaid) {
          window.location.reload()
        } else if (data.data.paymentUrl) {
          window.location.href = data.data.paymentUrl
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du lien de paiement:', error)
    } finally {
      setPayingOrder(false)
    }
  }

  const handleSwitchToCash = async () => {
    setSwitchingToCash(true)
    try {
      const response = await fetch(`${API_URL}/store/${subdomain}/account/orders/${order.id}/switch-to-cash`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      
      if (data.success) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Erreur lors du changement de méthode de paiement:', error)
    } finally {
      setSwitchingToCash(false)
    }
  }

  const handleSubmitReview = async (data: ReviewData) => {
    const response = await fetch(`${API_URL}/store/${subdomain}/account/orders/${order.id}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const result = await response.json()

    if (result.success) {
      setHasReviewed(true)
    }
  }

  const ServiceIcon = getServiceTypeIcon(order.serviceType)
  const statusColor = getStatusColor(order.status)

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#fbbf24' : 'transparent'}
            stroke={star <= rating ? '#fbbf24' : `${theme.textColor}40`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header avec bouton retour */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: theme.primaryColor }}
      >
        <ArrowLeft size={18} />
        Retour aux commandes
      </button>

      {/* En-tête de la commande */}
      <div 
        className={`p-4 sm:p-6 ${btnClass}`}
        style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${statusColor}15` }}
            >
              <ServiceIcon size={24} style={{ color: statusColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 
                  className="text-xl font-bold"
                  style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
                >
                  Commande #{order.displayNumber || order.orderNumber}
                </h2>
                <button
                  onClick={copyOrderNumber}
                  className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                  title="Copier le numéro"
                >
                  {copiedOrderNumber ? (
                    <Check size={16} style={{ color: '#22c55e' }} />
                  ) : (
                    <Copy size={16} style={{ color: theme.textColor }} className="opacity-40" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span 
                  className={`px-3 py-1 text-sm font-medium ${btnClass}`}
                  style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                >
                  {getStatusLabel(order.status)}
                </span>
                {isPaymentPending() && (
                  <span 
                    className={`px-3 py-1 text-sm font-medium ${btnClass}`}
                    style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}
                  >
                    Paiement en attente
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p 
              className="text-2xl font-bold"
              style={{ color: theme.primaryColor }}
            >
              {formatPrice(order.total)}
            </p>
            <p className="text-sm opacity-60 mt-1" style={{ color: theme.textColor }}>
              {getServiceTypeLabel(order.serviceType)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions principales */}
      <div className="flex flex-wrap gap-2">
        {isPaymentPending() && (
          <>
            <button
              onClick={handlePayOrder}
              disabled={payingOrder || switchingToCash}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 ${btnClass}`}
              style={{ backgroundColor: '#22c55e' }}
            >
              {payingOrder ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
              Payer en ligne
            </button>
            <button
              onClick={handleSwitchToCash}
              disabled={payingOrder || switchingToCash}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50 ${btnClass}`}
              style={{ backgroundColor: `${theme.textColor}10`, color: theme.textColor }}
            >
              {switchingToCash ? <Loader2 size={18} className="animate-spin" /> : <Banknote size={18} />}
              Payer en espèces
            </button>
          </>
        )}
        {isOrderTrackable(order.status) && !isPaymentPending() && (
          <Link
            href={`/store/${subdomain}/track/${order.id}`}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            <Eye size={18} />
            Suivre la commande
          </Link>
        )}
        {canReview() && (
          <button
            onClick={() => setShowReviewModal(true)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80 ${btnClass}`}
            style={{ backgroundColor: '#fbbf24', color: '#1a1a1a' }}
          >
            <Star size={18} />
            Noter la commande
          </button>
        )}
        {order.items && order.items.length > 0 && (
          <button
            onClick={() => onReorder(order.items!, order.serviceType)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80 ${btnClass}`}
            style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
          >
            <RotateCcw size={18} />
            Recommander
          </button>
        )}
      </div>

      {/* Informations de la commande */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date et heure */}
        <div 
          className={`p-4 ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} style={{ color: theme.textColor }} className="opacity-60" />
            <span className="text-sm font-medium opacity-60" style={{ color: theme.textColor }}>Date de commande</span>
          </div>
          <p className="font-medium" style={{ color: theme.textColor }}>{formatDate(order.createdAt)}</p>
          {order.scheduledFor && (
            <p className="text-sm mt-1 opacity-60" style={{ color: theme.textColor }}>
              Programmée pour : {formatDate(order.scheduledFor)}
            </p>
          )}
        </div>

        {/* Paiement */}
        <div 
          className={`p-4 ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} style={{ color: theme.textColor }} className="opacity-60" />
            <span className="text-sm font-medium opacity-60" style={{ color: theme.textColor }}>Paiement</span>
          </div>
          <p className="font-medium" style={{ color: theme.textColor }}>
            {getPaymentMethodLabel(order.paymentMethod)}
          </p>
          <p 
            className="text-sm mt-1"
            style={{ color: order.paymentStatus === 'PAID' ? '#22c55e' : '#f59e0b' }}
          >
            {getPaymentStatusLabel(order.paymentStatus)}
          </p>
        </div>

        {/* Adresse de livraison */}
        {order.serviceType === 'DELIVERY' && order.deliveryAddress && (
          <div 
            className={`p-4 sm:col-span-2 ${btnClass}`}
            style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} style={{ color: theme.textColor }} className="opacity-60" />
              <span className="text-sm font-medium opacity-60" style={{ color: theme.textColor }}>Adresse de livraison</span>
            </div>
            <p className="font-medium" style={{ color: theme.textColor }}>{order.deliveryAddress}</p>
          </div>
        )}

        {/* Notes client */}
        {order.customerNotes && (
          <div 
            className={`p-4 sm:col-span-2 ${btnClass}`}
            style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} style={{ color: theme.textColor }} className="opacity-60" />
              <span className="text-sm font-medium opacity-60" style={{ color: theme.textColor }}>Notes</span>
            </div>
            <p className="font-medium" style={{ color: theme.textColor }}>{order.customerNotes}</p>
          </div>
        )}
      </div>

      {/* Articles commandés */}
      <div 
        className={`p-4 sm:p-6 ${btnClass}`}
        style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <h3 
          className="text-lg font-bold mb-4"
          style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
        >
          Articles commandés
        </h3>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div 
              key={item.id} 
              className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0"
              style={{ borderColor: `${theme.textColor}10` }}
            >
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <span 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {item.quantity}
                  </span>
                  <div>
                    <p className="font-medium" style={{ color: theme.textColor }}>
                      {item.productName}
                    </p>
                    {item.variantName && (
                      <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
                        {item.variantName}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="text-sm mt-1 italic opacity-60" style={{ color: theme.textColor }}>
                        "{item.specialInstructions}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{ color: theme.textColor }}>
                  {formatPrice(item.totalPrice)}
                </p>
                <p className="text-xs opacity-60" style={{ color: theme.textColor }}>
                  {formatPrice(item.unitPrice)} / unité
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Récapitulatif des prix */}
        <div 
          className="mt-6 pt-4 space-y-2 border-t"
          style={{ borderColor: `${theme.textColor}10` }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: theme.textColor }} className="opacity-60">Sous-total</span>
            <span style={{ color: theme.textColor }}>{formatPrice(order.subtotal)}</span>
          </div>
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: theme.textColor }} className="opacity-60">Taxes</span>
              <span style={{ color: theme.textColor }}>{formatPrice(order.taxAmount)}</span>
            </div>
          )}
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: theme.textColor }} className="opacity-60">Frais de livraison</span>
              <span style={{ color: theme.textColor }}>{formatPrice(order.deliveryFee)}</span>
            </div>
          )}
          {(order.tip ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: theme.textColor }} className="opacity-60">Pourboire</span>
              <span style={{ color: theme.textColor }}>{formatPrice(order.tip!)}</span>
            </div>
          )}
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: theme.textColor }} className="opacity-60">Réduction</span>
              <span style={{ color: '#22c55e' }}>-{formatPrice(order.discount!)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: `${theme.textColor}10` }}>
            <span style={{ color: theme.textColor }}>Total</span>
            <span style={{ color: theme.primaryColor }}>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Avis donné */}
      {(order.review || hasReviewed) && (
        <div 
          className={`p-4 sm:p-6 ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <h3 
            className="text-lg font-bold mb-4"
            style={{ color: theme.textColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
          >
            Votre avis
          </h3>
          {order.review && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm opacity-60" style={{ color: theme.textColor }}>Note globale</span>
                {renderStars(order.review.rating)}
                <span className="font-bold" style={{ color: theme.textColor }}>{order.review.rating}/5</span>
              </div>
              {order.review.foodRating && (
                <div className="flex items-center gap-3">
                  <span className="text-sm opacity-60" style={{ color: theme.textColor }}>Nourriture</span>
                  {renderStars(order.review.foodRating)}
                </div>
              )}
              {order.review.serviceRating && (
                <div className="flex items-center gap-3">
                  <span className="text-sm opacity-60" style={{ color: theme.textColor }}>Service</span>
                  {renderStars(order.review.serviceRating)}
                </div>
              )}
              {order.review.deliveryRating && (
                <div className="flex items-center gap-3">
                  <span className="text-sm opacity-60" style={{ color: theme.textColor }}>Livraison</span>
                  {renderStars(order.review.deliveryRating)}
                </div>
              )}
              {order.review.comment && (
                <div 
                  className="mt-4 p-3 rounded-lg"
                  style={{ backgroundColor: `${theme.textColor}06` }}
                >
                  <p className="text-sm italic" style={{ color: theme.textColor }}>
                    "{order.review.comment}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de notation */}
      {showReviewModal && (
        <OrderReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
          theme={theme}
          orderNumber={order.displayNumber || order.orderNumber}
          serviceType={order.serviceType}
        />
      )}
    </div>
  )
}
