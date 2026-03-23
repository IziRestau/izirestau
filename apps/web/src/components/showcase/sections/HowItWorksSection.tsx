'use client'

import { 
  CreditCard, Settings, UtensilsCrossed, Rocket, LucideIcon 
} from 'lucide-react'
import { HowItWorksConfig, DEFAULT_HOW_IT_WORKS_CONFIG } from '@/types/showcase'

const ICONS: Record<string, LucideIcon> = {
  CreditCard, Settings, UtensilsCrossed, Rocket,
}

interface HowItWorksSectionProps {
  config: HowItWorksConfig | null
  primaryColor: string
}

export function HowItWorksSection({ config, primaryColor }: HowItWorksSectionProps) {
  const howItWorks = config || DEFAULT_HOW_IT_WORKS_CONFIG
  
  if (!howItWorks.enabled) return null

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {howItWorks.title}
          </h2>
          {howItWorks.subtitle && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {howItWorks.subtitle}
            </p>
          )}
        </div>

        {howItWorks.layout === 'horizontal' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.steps.map((step, idx) => {
              const IconComponent = step.icon ? ICONS[step.icon] : null
              return (
                <div key={step.id} className="relative text-center">
                  {idx < howItWorks.steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gray-200" />
                  )}
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 relative z-10"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {IconComponent ? (
                      <IconComponent size={28} className="text-white" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{step.number || idx + 1}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              )
            })}
          </div>
        )}

        {howItWorks.layout === 'vertical' && (
          <div className="max-w-2xl mx-auto space-y-8">
            {howItWorks.steps.map((step, idx) => {
              const IconComponent = step.icon ? ICONS[step.icon] : null
              return (
                <div key={step.id} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {IconComponent ? (
                        <IconComponent size={24} className="text-white" />
                      ) : (
                        <span className="text-lg font-bold text-white">{step.number || idx + 1}</span>
                      )}
                    </div>
                    {idx < howItWorks.steps.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-4" />
                    )}
                  </div>
                  <div className="pb-8">
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {howItWorks.layout === 'numbered' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {howItWorks.steps.map((step, idx) => (
              <div 
                key={step.id} 
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {step.number || idx + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
