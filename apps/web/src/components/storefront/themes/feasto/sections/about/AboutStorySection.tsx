'use client'

import { Calendar, Users, Star, Trophy } from 'lucide-react'
import type { StoreThemeData } from '../../../_types'
import { getIconComponent } from '@/components/shared/IconPicker'

interface AboutStorySectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function AboutStorySection({
  theme,
  sectionData,
}: AboutStorySectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const backgroundColor = (s('backgroundColor', '#0a0c10') as string)
  const cardColor = (s('cardColor', '#0e1416') as string)
  const cardRadius = (s('cardRadius', 'none') as string)

  const titlePart1 = (s('titlePart1', 'A Cozy Place Built for') as string)
  const titlePart2 = (s('titlePart2', 'Good Food & Good Moments') as string)
  const description = (s('description', 'We started this restaurant with a simple belief — good food doesn\'t need to be complicated, and a warm, friendly atmosphere always makes a meal taste better.') as string)

  const showButton = s('showButton', true) !== false
  const buttonText = (s('buttonText', 'Réserver une table') as string)
  const buttonLink = (s('buttonLink', '#') as string)
  const ButtonIcon = getIconComponent(s('buttonIcon', 'Calendar') as string) || Calendar

  const showBadges = s('showBadges', true) !== false
  const badge1Text = (s('badge1Text', 'Top Restaurant 23') as string)
  const badge2Text = (s('badge2Text', 'Top Restaurant 24') as string)

  const mainImage = (s('mainImage', '') as string)

  const stat1Number = (s('stat1Number', '25,000+') as string)
  const stat1Label = (s('stat1Label', 'Clients satisfaits chaque jour') as string)
  const Stat1Icon = getIconComponent(s('stat1Icon', 'Users') as string) || Users

  const stat2Number = (s('stat2Number', '4.8') as string)
  const stat2Label = (s('stat2Label', 'Où chaque repas est spécial') as string)
  const Stat2Icon = getIconComponent(s('stat2Icon', 'Star') as string) || Star
  const stat2HasStar = s('stat2HasStar', true) !== false

  const radiusClass = cardRadius === 'none' ? ''
    : cardRadius === 'sm' ? 'rounded-sm'
    : cardRadius === 'md' ? 'rounded-md'
    : cardRadius === 'lg' ? 'rounded-lg'
    : cardRadius === 'xl' ? 'rounded-xl'
    : cardRadius === '2xl' ? 'rounded-2xl'
    : ''

  const BadgeItem = ({ text }: { text: string }) => (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5">
        <Trophy size={12} className="text-white/50" />
        <span className="text-[10px] sm:text-xs text-white/50">{text}</span>
        <Trophy size={12} className="text-white/50 scale-x-[-1]" />
      </div>
      <div className="flex items-center gap-0.5 ml-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={10} 
            fill={theme.primaryColor} 
            color={theme.primaryColor}
          />
        ))}
      </div>
    </div>
  )

  return (
    <section 
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr] gap-4 items-stretch">
          
          <div className="flex flex-col justify-between py-4 text-center lg:text-left">
            <div className="space-y-5">
              <h2
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight"
                style={{ fontFamily: `'${theme.headingFont}', serif` }}
              >
                {titlePart1}{' '}
                <span style={{ color: theme.primaryColor }}>{titlePart2}</span>
              </h2>

              {description && (
                <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto lg:mx-0">
                  {description}
                </p>
              )}

              {showButton && (
                <a
                  href={buttonLink}
                  className={`inline-flex items-center gap-2.5 px-6 py-3 border text-sm font-medium transition-all ${radiusClass}`}
                  style={{ 
                    backgroundColor: theme.primaryColor, 
                    borderColor: theme.primaryColor,
                    color: '#0C0C0C',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.primaryColor}15`
                    e.currentTarget.style.color = theme.primaryColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.primaryColor
                    e.currentTarget.style.color = '#0C0C0C'
                  }}
                >
                  {buttonText}
                  {ButtonIcon && <ButtonIcon size={16} />}
                </a>
              )}
            </div>

            {showBadges && (
              <div className="flex items-start justify-center lg:justify-start gap-4 mt-6">
                {badge1Text && <BadgeItem text={badge1Text} />}
                {badge2Text && <BadgeItem text={badge2Text} />}
              </div>
            )}
          </div>

          <div className="flex justify-center items-stretch">
            {mainImage ? (
              <div className={`relative w-full overflow-hidden ${radiusClass}`}>
                <img
                  src={mainImage}
                  alt="Restaurant"
                  className="w-full h-full object-cover"
                  style={{ aspectRatio: '4/5' }}
                />
              </div>
            ) : (
              <div 
                className={`w-full flex items-center justify-center ${radiusClass}`}
                style={{ 
                  aspectRatio: '4/5',
                  backgroundColor: cardColor,
                }}
              >
                <span className="text-white/30 text-sm">Image principale</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div 
              className={`p-5 sm:p-6 border flex-1 flex flex-col ${radiusClass}`}
              style={{ backgroundColor: cardColor, borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-auto">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primaryColor}20` }}
                >
                  {Stat1Icon && <Stat1Icon size={20} style={{ color: theme.primaryColor }} />}
                </div>
                <span className="text-xs text-white/40">/001</span>
              </div>
              <div className="mt-auto">
                <p 
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ fontFamily: `'${theme.headingFont}', serif`, color: theme.primaryColor }}
                >
                  {stat1Number}
                </p>
                <p className="text-xs sm:text-sm text-white/50">{stat1Label}</p>
              </div>
            </div>

            <div 
              className={`p-5 sm:p-6 border flex-1 flex flex-col ${radiusClass}`}
              style={{ backgroundColor: cardColor, borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-auto">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primaryColor}20` }}
                >
                  {Stat2Icon && <Stat2Icon size={20} style={{ color: theme.primaryColor }} />}
                </div>
                <span className="text-xs text-white/40">/002</span>
              </div>
              <div className="mt-auto">
                <p 
                  className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-1"
                  style={{ fontFamily: `'${theme.headingFont}', serif`, color: theme.primaryColor }}
                >
                  {stat2Number}
                  {stat2HasStar && (
                    <Star size={24} fill={theme.primaryColor} color={theme.primaryColor} />
                  )}
                </p>
                <p className="text-xs sm:text-sm text-white/50">{stat2Label}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
