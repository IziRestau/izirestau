'use client'

import { cn } from '@/lib/utils'

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusBadgeProps {
  status: StatusType
  label: string
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-medium",
      statusStyles[status]
    )}>
      {label}
    </span>
  )
}

export function getSiteStatusBadge(status: string): { status: StatusType; label: string } {
  const map: Record<string, { status: StatusType; label: string }> = {
    ACTIVE: { status: 'success', label: 'Actif' },
    DRAFT: { status: 'neutral', label: 'Brouillon' },
    SUSPENDED: { status: 'error', label: 'Suspendu' },
    EXPIRED: { status: 'warning', label: 'Expire' },
  }
  return map[status] || { status: 'neutral', label: status }
}

export function getClientStatusBadge(status: string): { status: StatusType; label: string } {
  const map: Record<string, { status: StatusType; label: string }> = {
    ACTIVE: { status: 'success', label: 'Actif' },
    LEAD: { status: 'info', label: 'Prospect' },
    CHURNED: { status: 'error', label: 'Perdu' },
    PAUSED: { status: 'warning', label: 'En pause' },
  }
  return map[status] || { status: 'neutral', label: status }
}

export function getLicenseStatusBadge(status: string): { status: StatusType; label: string } {
  const map: Record<string, { status: StatusType; label: string }> = {
    ACTIVE: { status: 'success', label: 'Active' },
    TRIALING: { status: 'info', label: 'Essai' },
    PAST_DUE: { status: 'warning', label: 'Retard' },
    CANCELLED: { status: 'error', label: 'Annulee' },
    UNPAID: { status: 'error', label: 'Impayee' },
    PAUSED: { status: 'neutral', label: 'En pause' },
  }
  return map[status] || { status: 'neutral', label: status }
}
