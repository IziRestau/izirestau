'use client'

import { cn } from '@/lib/utils'

const orderStatusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmee',
  PREPARING: 'En preparation',
  READY: 'Prete',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livree',
  PICKED_UP: 'Recuperee',
  COMPLETED: 'Terminee',
  CANCELLED: 'Annulee',
  REFUNDED: 'Remboursee',
}

const orderStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  READY: 'bg-green-100 text-green-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  PICKED_UP: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-orange-100 text-orange-700',
}

interface OrderStatusBadgeProps {
  status: string
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span className={cn(
      'px-2.5 py-1 rounded-full text-xs font-medium',
      orderStatusColors[status] || 'bg-gray-100 text-gray-600',
      className
    )}>
      {orderStatusLabels[status] || status}
    </span>
  )
}

export { orderStatusLabels, orderStatusColors }
