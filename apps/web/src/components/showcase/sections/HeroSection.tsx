'use client'

import { ArrowRight, Play } from 'lucide-react'
import { HeroConfig, DEFAULT_HERO_CONFIG } from '@/types/showcase'

interface HeroSectionProps {
  config: HeroConfig | null
  organizationName: string
  primaryColor: string
}

export function HeroSection({ config, organizationName, primaryColor }: HeroSectionProps) {
  const hero = config || { ...DEFAULT_HERO_CONFIG, title: `Digitalisez votre restaurant avec ${organizationName}` }

  const handleCtaClick = () => {
    if (hero.ctaAction === 'pricing') {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
    } else if (hero.ctaAction === 'contact') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    } else if (hero.ctaAction === 'custom' && hero.ctaCustomUrl) {
      window.open(hero.ctaCustomUrl, '_blank')
    }
  }

  return (
    <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {hero.image && (
        <div className="absolute inset-0 z-0">
          <img 
            src={hero.image} 
            alt="" 
            className="w-full h-full object-cover opacity-5"
          />
        </div>
      )}
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {hero.layout === 'centered' && (
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {hero.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              {hero.subtitle}
            </p>
            
            {hero.showStats && hero.stats.length > 0 && (
              <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-10">
                {hero.stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div 
                      className="text-3xl sm:text-4xl font-bold mb-1"
                      style={{ color: primaryColor }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl transition-all hover:opacity-90 hover:scale-105 shadow-lg"
                style={{ backgroundColor: primaryColor, color: 'white' }}
              >
                {hero.ctaText}
                <ArrowRight size={20} />
              </button>
              {hero.video && (
                <button className="inline-flex items-center gap-2 px-6 py-4 text-base font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Play size={18} style={{ color: primaryColor }} />
                  </div>
                  Voir la démo
                </button>
              )}
            </div>
          </div>
        )}

        {hero.layout === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {hero.title}
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {hero.subtitle}
              </p>
              
              {hero.showStats && hero.stats.length > 0 && (
                <div className="flex flex-wrap gap-8 mb-8">
                  {hero.stats.map((stat, idx) => (
                    <div key={idx}>
                      <div 
                        className="text-2xl sm:text-3xl font-bold mb-1"
                        style={{ color: primaryColor }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: primaryColor, color: 'white' }}
              >
                {hero.ctaText}
                <ArrowRight size={20} />
              </button>
            </div>
            
            {hero.image && (
              <div className="relative">
                <img 
                  src={hero.image} 
                  alt="" 
                  className="w-full rounded-2xl shadow-2xl"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
