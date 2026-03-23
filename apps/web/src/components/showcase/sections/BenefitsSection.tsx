'use client'

import { 
  TrendingUp, Clock, Heart, Shield, Headphones, Smartphone, LucideIcon 
} from 'lucide-react'
import { BenefitsConfig, DEFAULT_BENEFITS_CONFIG } from '@/types/showcase'

const ICONS: Record<string, LucideIcon> = {
  TrendingUp, Clock, Heart, Shield, Headphones, Smartphone,
}

interface BenefitsSectionProps {
  config: BenefitsConfig | null
  primaryColor: string
}

export function BenefitsSection({ config, primaryColor }: BenefitsSectionProps) {
  const benefits = config || DEFAULT_BENEFITS_CONFIG
  
  if (!benefits.enabled) return null

  return (
    <section id="benefits" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {benefits.title}
          </h2>
          {benefits.subtitle && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {benefits.subtitle}
            </p>
          )}
        </div>

        {benefits.layout === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.items.map((item) => {
              const IconComponent = ICONS[item.icon] || TrendingUp
              return (
                <div key={item.id} className="text-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <IconComponent size={32} style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        )}

        {benefits.layout === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.items.map((item) => {
              const IconComponent = ICONS[item.icon] || TrendingUp
              return (
                <div 
                  key={item.id} 
                  className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <IconComponent size={24} style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        )}

        {benefits.layout === 'icons' && (
          <div className="flex flex-wrap justify-center gap-12">
            {benefits.items.map((item) => {
              const IconComponent = ICONS[item.icon] || TrendingUp
              return (
                <div key={item.id} className="text-center max-w-[200px]">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <IconComponent size={36} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
