'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OrdersSummaryProps {
  totalAmount: number
  targetAmount: number
  percentage: number
  onDelivery: number
  delivered: number
  cancelled: number
  formatValue?: (value: number) => string
  primaryColor?: string
}

export function OrdersSummary({
  totalAmount = 0,
  targetAmount = 500000,
  percentage = 0,
  onDelivery = 0,
  delivered = 0,
  cancelled = 0,
  formatValue,
  primaryColor = '#f87171',
}: OrdersSummaryProps) {
  const displayAmount = formatValue ? formatValue(totalAmount) : `${totalAmount.toLocaleString()}`
  const displayTarget = formatValue ? formatValue(targetAmount) : `${targetAmount.toLocaleString()}`
  const [activeTab, setActiveTab] = useState<'monthly' | 'weekly' | 'today'>('today')

  const tabs = [
    { key: 'monthly', label: 'Mois' },
    { key: 'weekly', label: 'Semaine' },
    { key: 'today', label: 'Jour' },
  ] as const

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Resume des commandes</h3>
          <p className="text-xs text-gray-400 mt-0.5">Objectif mensuel de ventes</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                activeTab === tab.key
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-700"
              )}
              style={activeTab === tab.key ? { backgroundColor: primaryColor } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="#f3f4f6"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke={primaryColor}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900">
            {displayAmount}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            sur {displayTarget}
          </div>
          <button 
            className="mt-4 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-80"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            Plus de details
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{onDelivery}</div>
          <div className="text-xs text-gray-400 mt-1">En cours</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{delivered}</div>
          <div className="text-xs text-gray-400 mt-1">Livrees</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{cancelled}</div>
          <div className="text-xs text-gray-400 mt-1">Annulees</div>
        </div>
      </div>
    </div>
  )
}
