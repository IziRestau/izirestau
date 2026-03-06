'use client'

import Link from 'next/link'
import { LucideIcon, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  iconBgColor?: string
  iconColor?: string
  iconBgStyle?: React.CSSProperties
  iconStyle?: React.CSSProperties
  href?: string
  primaryColor?: string
}

export function StatsCard({ 
  icon: Icon, 
  value, 
  label, 
  iconBgColor = 'bg-rose-50',
  iconColor = 'text-rose-400',
  iconBgStyle,
  iconStyle,
  href,
  primaryColor = '#10b981',
}: StatsCardProps) {
  return (
    <div className="group bg-white rounded-2xl p-5 flex items-center gap-4">
      <div 
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0",
          !iconBgStyle && iconBgColor
        )}
        style={iconBgStyle}
      >
        <Icon className={cn("w-6 h-6", !iconStyle && iconColor)} style={iconStyle} />
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
      {href && (
        <Link 
          href={href}
          className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:!opacity-100"
          style={{ backgroundColor: `${primaryColor}10` }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}25`}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
        >
          <ArrowUpRight size={16} style={{ color: primaryColor }} />
        </Link>
      )}
    </div>
  )
}
