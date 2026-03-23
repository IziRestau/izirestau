'use client'

import { 
  Globe, ShoppingBag, Monitor, UtensilsCrossed, Users, 
  BarChart3, Package, Megaphone, LucideIcon 
} from 'lucide-react'
import { ProductConfig, DEFAULT_PRODUCT_CONFIG } from '@/types/showcase'

const ICONS: Record<string, LucideIcon> = {
  Globe, ShoppingBag, Monitor, UtensilsCrossed, Users, 
  BarChart3, Package, Megaphone,
}

interface ProductSectionProps {
  config: ProductConfig | null
  primaryColor: string
}

export function ProductSection({ config, primaryColor }: ProductSectionProps) {
  const product = config || DEFAULT_PRODUCT_CONFIG
  
  if (!product.enabled) return null

  const enabledModules = product.modules.filter(m => m.enabled)

  return (
    <section id="product" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {product.title}
          </h2>
          {product.subtitle && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {product.subtitle}
            </p>
          )}
        </div>

        {product.layout === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {enabledModules.map((module) => {
              const IconComponent = ICONS[module.icon] || Globe
              return (
                <div 
                  key={module.id} 
                  className="group bg-gray-50 hover:bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-gray-100"
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <IconComponent size={28} style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{module.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{module.description}</p>
                </div>
              )
            })}
          </div>
        )}

        {product.layout === 'list' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {enabledModules.map((module) => {
              const IconComponent = ICONS[module.icon] || Globe
              return (
                <div 
                  key={module.id} 
                  className="flex gap-6 bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100"
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <IconComponent size={28} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">{module.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{module.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
