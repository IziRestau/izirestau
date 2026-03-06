'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  bgColor?: string
  iconBgColor?: string
  iconColor?: string
}

export function StatsCard({ 
  icon: Icon, 
  value, 
  label, 
  bgColor = 'bg-white',
  iconBgColor = 'bg-gray-900',
  iconColor = 'text-white'
}: StatsCardProps) {
  return (
    <div className={cn("rounded-2xl p-3 sm:p-5 flex items-center justify-between border border-gray-100 gap-2", bgColor)}>
      <div className="min-w-0">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">{label}</div>
      </div>
      <div className={cn(
        "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center flex-shrink-0",
        iconBgColor
      )}>
        <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6", iconColor)} />
      </div>
    </div>
  )
}
