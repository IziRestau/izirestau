'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  actions?: ReactNode
  badge?: {
    text: string
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }
}

export function PageHeader({ title, subtitle, icon: Icon, actions, badge }: PageHeaderProps) {
  const getBadgeClasses = (variant: string = 'default') => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-100 text-emerald-700'
      case 'warning':
        return 'bg-amber-100 text-amber-700'
      case 'danger':
        return 'bg-red-100 text-red-700'
      case 'info':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Icon size={24} className="text-gray-600" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{title}</h1>
            {badge && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getBadgeClasses(badge.variant)}`}>
                {badge.text}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
