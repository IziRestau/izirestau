'use client'

import { Users, UserPlus, TrendingUp, Activity } from 'lucide-react'
import type { CustomerStats as CustomerStatsType } from '@/types/customer'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface CustomerStatsProps {
  stats: CustomerStatsType | undefined
  isLoading: boolean
  formatCurrency: (value: number) => string
  primaryColor?: string
}

export function CustomerStats({ stats, isLoading, formatCurrency, primaryColor = '#10b981' }: CustomerStatsProps) {
  const primaryBgLight = hexToRgba(primaryColor, 0.1)

  const statCards = [
    {
      label: 'Total clients',
      value: stats?.total ?? 0,
      icon: Users,
      format: 'number' as const,
      usePrimary: true,
    },
    {
      label: 'Nouveaux ce mois',
      value: stats?.newThisMonth ?? 0,
      icon: UserPlus,
      format: 'number' as const,
      change: stats?.growthPercent,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Panier moyen',
      value: stats?.avgOrderValue ?? 0,
      icon: TrendingUp,
      format: 'currency' as const,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500',
    },
    {
      label: 'Clients actifs',
      value: stats?.activeCustomers ?? 0,
      icon: Activity,
      format: 'number' as const,
      subtitle: 'Commande < 30 jours',
      usePrimary: true,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-5 flex items-center gap-4"
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${!stat.usePrimary ? stat.bgColor : ''}`}
              style={stat.usePrimary ? { backgroundColor: primaryBgLight } : undefined}
            >
              <Icon 
                className={`w-6 h-6 ${!stat.usePrimary ? stat.iconColor : ''}`}
                style={stat.usePrimary ? { color: primaryColor } : undefined}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {stat.format === 'currency' ? formatCurrency(stat.value) : stat.value.toLocaleString('fr-FR')}
                </div>
                {stat.change !== undefined && stat.change !== 0 && (
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      stat.change > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {stat.change > 0 ? '+' : ''}{stat.change}%
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              {stat.subtitle && (
                <div className="text-xs text-gray-400">{stat.subtitle}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
