'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { FaqConfig, DEFAULT_FAQ_CONFIG } from '@/types/showcase'

interface FaqSectionProps {
  config: FaqConfig | null
  primaryColor: string
}

export function FaqSection({ config, primaryColor }: FaqSectionProps) {
  const faq = config || DEFAULT_FAQ_CONFIG
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  if (!faq.enabled || faq.items.length === 0) return null

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {faq.title}
          </h2>
          {faq.subtitle && (
            <p className="text-lg text-gray-600">
              {faq.subtitle}
            </p>
          )}
        </div>

        {faq.layout === 'accordion' && (
          <div className="space-y-4">
            {faq.items.map((item) => (
              <div 
                key={item.id} 
                className="bg-gray-50 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                  {expandedId === item.id ? (
                    <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedId === item.id && (
                  <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {faq.layout === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faq.items.map((item) => (
              <div 
                key={item.id} 
                className="bg-gray-50 rounded-xl p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-3">{item.question}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
