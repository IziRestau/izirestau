'use client'

import { Star } from 'lucide-react'
import { TestimonialsConfig, DEFAULT_TESTIMONIALS_CONFIG } from '@/types/showcase'

interface TestimonialsSectionProps {
  config: TestimonialsConfig | null
  primaryColor: string
}

export function TestimonialsSection({ config, primaryColor }: TestimonialsSectionProps) {
  const testimonials = config || DEFAULT_TESTIMONIALS_CONFIG
  
  if (!testimonials.enabled || testimonials.items.length === 0) return null

  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {testimonials.title}
          </h2>
          {testimonials.subtitle && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {testimonials.subtitle}
            </p>
          )}
        </div>

        {testimonials.layout === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.items.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl p-6 border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  {item.avatar ? (
                    <img 
                      src={item.avatar} 
                      alt={item.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {item.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    {(item.role || item.company) && (
                      <p className="text-sm text-gray-500">
                        {item.role}{item.role && item.company && ' - '}{item.company}
                      </p>
                    )}
                  </div>
                </div>
                {item.rating && (
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < item.rating! ? 'text-yellow-400' : 'text-gray-200'}
                        fill={i < item.rating! ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                )}
                <p className="text-gray-600 italic">"{item.quote}"</p>
              </div>
            ))}
          </div>
        )}

        {testimonials.layout === 'large' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {testimonials.items.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl p-8 border border-gray-100 text-center"
              >
                <p className="text-xl lg:text-2xl text-gray-700 italic mb-6">"{item.quote}"</p>
                <div className="flex items-center justify-center gap-4">
                  {item.avatar ? (
                    <img 
                      src={item.avatar} 
                      alt={item.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {item.name[0]}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    {(item.role || item.company) && (
                      <p className="text-sm text-gray-500">
                        {item.role}{item.role && item.company && ' - '}{item.company}
                      </p>
                    )}
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
