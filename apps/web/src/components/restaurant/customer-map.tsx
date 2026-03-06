'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CustomerMapProps {
  className?: string
  primaryColor?: string
}

export function CustomerMap({ className, primaryColor = '#f87171' }: CustomerMapProps) {
  const [activeTab, setActiveTab] = useState<'monthly' | 'weekly' | 'today'>('today')

  const tabs = [
    { key: 'monthly', label: 'Mois' },
    { key: 'weekly', label: 'Semaine' },
    { key: 'today', label: 'Jour' },
  ] as const

  return (
    <div className={cn("bg-white rounded-2xl p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Carte des clients</h3>
          <p className="text-xs text-gray-400 mt-0.5">Repartition geographique</p>
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

      <div className="relative h-48 bg-gray-50 rounded-xl overflow-hidden">
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <path
            d="M50,100 Q100,50 150,80 T250,70 T350,90"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <path
            d="M30,120 Q80,150 130,130 T230,140 T330,120"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          
          <circle cx="80" cy="90" r="6" fill={primaryColor} />
          <circle cx="80" cy="90" r="12" fill={primaryColor} fillOpacity="0.2" />
          
          <circle cx="150" cy="75" r="4" fill={primaryColor} />
          <circle cx="150" cy="75" r="8" fill={primaryColor} fillOpacity="0.2" />
          
          <circle cx="220" cy="100" r="8" fill={primaryColor} />
          <circle cx="220" cy="100" r="16" fill={primaryColor} fillOpacity="0.2" />
          
          <circle cx="300" cy="85" r="5" fill={primaryColor} />
          <circle cx="300" cy="85" r="10" fill={primaryColor} fillOpacity="0.2" />
          
          <circle cx="180" cy="140" r="4" fill={primaryColor} />
          <circle cx="180" cy="140" r="8" fill={primaryColor} fillOpacity="0.2" />
          
          <circle cx="280" cy="130" r="6" fill={primaryColor} />
          <circle cx="280" cy="130" r="12" fill={primaryColor} fillOpacity="0.2" />
        </svg>
      </div>
    </div>
  )
}
