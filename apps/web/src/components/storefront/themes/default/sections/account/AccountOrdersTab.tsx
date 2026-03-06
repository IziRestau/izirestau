'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ShoppingBag, Package, Loader2, Truck, Store, UtensilsCrossed, ChevronRight, Star } from 'lucide-react'
import { OrderDetailsView } from '@/components/storefront/shared/OrderDetailsView'
import type { StoreThemeData, StoreSettingsData } from '../../../_types'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'
import { useStorefrontCartStore } from '@/stores/storefront-cart.store'

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
  itemCount?: number
  items?: OrderItem[]
  review?: OrderReview | null
}

interface AccountOrdersTabProps {
  theme: StoreThemeData
  settings: StoreSettingsData
  subdomain: string
  ordersPerPage?: number
  showOrderDetails?: boolean
}

export function AccountOrdersTab({ 
  theme, 
  settings, 
  subdomain,
}: AccountOrdersTabProps) {
  const { accessToken, customer } = useStorefrontAuthStore()
  const { reorderItems } = useStorefrontCartStore()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

  const { data, isLoading } = useQuery({
    queryKey: ['customer-orders', subdomain, customer?.id],
    queryFn: async () => {
      if (!accessToken) return { orders: [], pagination: { total: 0 } }
      const response = await fetch(`${API_URL}/store/${subdomain}/account/orders?page=1&limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      const data = await response.json()
      return data.success ? { orders: data.data || [], pagination: data.pagination } : { orders: [], pagination: { total: 0 } }
    },
    enabled: !!accessToken && !!customer?.id,
    staleTime: 2 * 60 * 1000,
  })

  const orders = data?.orders || []

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: settings.currency || 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
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

  const isPaymentPending = (order: Order) => {
    return order.paymentStatus === 'PENDING' && 
           (order.paymentMethod === 'MOBILE_MONEY' || order.paymentMethod === 'CARD_ONLINE')
  }

  const handleReorder = (items: OrderItem[], serviceType: string) => {
    reorderItems(
      items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      serviceType as 'PICKUP' | 'DELIVERY' | 'DINE_IN'
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.primaryColor }} />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div 
        className="rounded-2xl border p-8 text-center"
        style={{ borderColor: `${theme.textColor}10` }}
      >
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <ShoppingBag size={28} style={{ color: theme.primaryColor }} />
        </div>
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
        >
          Aucune commande
        </h3>
        <p className="text-sm opacity-60 mb-6" style={{ color: theme.textColor }}>
          Vous n'avez pas encore passé de commande
        </p>
        <Link
          href={`/store/${subdomain}/menu`}
          className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 ${btnClass}`}
          style={{ backgroundColor: theme.primaryColor }}
        >
          Voir le menu
        </Link>
      </div>
    )
  }

  // Si une commande est sélectionnée, afficher les détails
  if (selectedOrder) {
    return (
      <OrderDetailsView
        order={selectedOrder}
        theme={theme}
        settings={settings}
        subdomain={subdomain}
        accessToken={accessToken || ''}
        onBack={() => setSelectedOrder(null)}
        onReorder={handleReorder}
      />
    )
  }

  // Sinon, afficher la liste des commandes
  return (
    <div className="space-y-3">
      {orders.map((order: Order) => {
        const ServiceIcon = getServiceTypeIcon(order.serviceType)
        const statusColor = getStatusColor(order.status)
        const itemCount = order.items?.length || 0

        return (
          <button
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className={`w-full p-4 text-left rounded-xl transition-all hover:opacity-90`}
            style={{ backgroundColor: `${theme.textColor}04` }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${statusColor}15` }}
              >
                <ServiceIcon size={22} style={{ color: statusColor }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span 
                    className="font-bold"
                    style={{ color: theme.textColor }}
                  >
                    #{order.displayNumber || order.orderNumber}
                  </span>
                  <span 
                    className={`px-2 py-0.5 text-xs font-medium ${btnClass}`}
                    style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                  {isPaymentPending(order) && (
                    <span 
                      className={`px-2 py-0.5 text-xs font-medium ${btnClass}`}
                      style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}
                    >
                      Paiement en attente
                    </span>
                  )}
                  {order.review && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#fbbf24' }}>
                      <Star size={12} fill="#fbbf24" />
                      {order.review.rating}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm opacity-60" style={{ color: theme.textColor }}>
                  <span>{formatDate(order.createdAt)}</span>
                  <span>•</span>
                  <span>{getServiceTypeLabel(order.serviceType)}</span>
                  <span>•</span>
                  <span>{itemCount} article{itemCount > 1 ? 's' : ''}</span>
                </div>

                {order.items && order.items.length > 0 && (
                  <p className="text-sm mt-2 truncate opacity-60" style={{ color: theme.textColor }}>
                    {order.items.slice(0, 3).map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    {order.items.length > 3 && ` +${order.items.length - 3}`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span 
                  className="text-lg font-bold"
                  style={{ color: theme.primaryColor }}
                >
                  {formatPrice(order.total)}
                </span>
                <ChevronRight size={20} style={{ color: theme.textColor }} className="opacity-40" />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
