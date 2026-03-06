'use client'

import { useState, useRef, useEffect } from 'react'
import { Instagram, ChevronLeft, ChevronRight } from 'lucide-react'
import type { StoreThemeData } from '../../../_types'

interface TeamMember {
  id: string
  name: string
  position: string
  role?: string
  avatar: string | null
  socialLink?: string
}

interface AboutTeamSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
  dynamicTeam?: TeamMember[]
}

export function AboutTeamSection({
  theme,
  sectionData,
  dynamicTeam = [],
}: AboutTeamSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const backgroundColor = (s('backgroundColor', '#0a0c10') as string)
  const cardColor = (s('cardColor', '#12161a') as string)
  const cardRadius = (s('cardRadius', 'none') as string)
  
  const titlePart1 = (s('titlePart1', 'The Dedicated Team') as string)
  const titlePart2 = (s('titlePart2', 'Behind Your Favorite Meals') as string)
  
  const dataSource = (s('dataSource', 'manual') as string)
  const displayMode = (s('displayMode', 'grid') as string)
  const columnsCount = (s('columnsCount', 3) as number)
  const autoPlaySpeed = (s('autoPlaySpeed', 5) as number)
  const showSocialIcon = (s('showSocialIcon', true) as boolean)
  const visibleRoles = (s('visibleRoles', ['OWNER', 'MANAGER', 'STAFF', 'CASHIER', 'KITCHEN']) as string[])

  const defaultMembers: TeamMember[] = [
    { id: '1', name: 'Brooklyn Simmons', position: 'Fish Chef', avatar: null, socialLink: '#' },
    { id: '2', name: 'Guy Hawkins', position: 'Grill Chef', avatar: null, socialLink: '#' },
    { id: '3', name: 'Jenny Wilson', position: 'Burger Chef', avatar: null, socialLink: '#' },
  ]

  const manualMembers = (s('members', defaultMembers) as TeamMember[])
  
  const filteredDynamicTeam = dynamicTeam.filter(member => 
    !member.role || visibleRoles.includes(member.role)
  )
  
  const members = dataSource === 'dynamic' ? filteredDynamicTeam : manualMembers

  const radiusClass = cardRadius === 'none' ? ''
    : cardRadius === 'sm' ? 'rounded-sm'
    : cardRadius === 'md' ? 'rounded-md'
    : cardRadius === 'lg' ? 'rounded-lg'
    : cardRadius === 'xl' ? 'rounded-xl'
    : cardRadius === '2xl' ? 'rounded-2xl'
    : ''

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const maxSlide = members.length - 1

  useEffect(() => {
    if (displayMode !== 'carousel' || autoPlaySpeed <= 0) return

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % members.length)
    }, autoPlaySpeed * 1000)

    return () => clearInterval(interval)
  }, [displayMode, autoPlaySpeed, members.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, maxSlide)))
  }

  const TeamCard = ({ member, index }: { member: TeamMember; index: number }) => {
    const isHovered = hoveredId === member.id

    return (
      <div
        className="card-container"
        style={{ height: '400px' }}
        onMouseEnter={() => setHoveredId(member.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <style jsx>{`
          .card-container {
            perspective: 1000px;
          }
          .card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.6s;
            transform-style: preserve-3d;
          }
          .card-inner.flipped {
            transform: rotateY(180deg);
          }
          .card-front, .card-back {
            position: absolute;
            width: 100%;
            height: 100%;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }
          .card-back {
            transform: rotateY(180deg);
          }
        `}</style>
        <div className={`card-inner ${isHovered ? 'flipped' : ''} ${radiusClass}`}>
          <div 
            className={`card-front ${radiusClass} overflow-hidden`}
            style={{ backgroundColor: cardColor }}
          >
            <div className="relative h-full">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primaryColor}10` }}
                >
                  <span className="text-6xl text-white/20">
                    {member.name.charAt(0)}
                  </span>
                </div>
              )}
              <div 
                className="absolute inset-0"
                style={{ background: `linear-gradient(to top, ${cardColor} 0%, transparent 50%)` }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="text-xs text-white/40 mb-2 block">/{String(index + 1).padStart(3, '0')}</span>
                <h3 
                  className="text-lg font-semibold text-white"
                  style={{ fontFamily: `'${theme.headingFont}', serif` }}
                >
                  {member.name}
                </h3>
                <p className="text-sm" style={{ color: theme.primaryColor }}>
                  {member.position}
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`card-back ${radiusClass} overflow-hidden`}
            style={{ backgroundColor: cardColor }}
          >
            <div className="h-full flex flex-col p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-white/40">/{String(index + 1).padStart(3, '0')}</span>
                {showSocialIcon && member.socialLink && (
                  <a
                    href={member.socialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Instagram size={18} color="#0C0C0C" />
                  </a>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 mb-4 overflow-hidden rounded-full">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${theme.primaryColor}15` }}
                    >
                      <span className="text-2xl text-white/30">{member.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <h3 
                  className="text-xl font-semibold text-white mb-1"
                  style={{ fontFamily: `'${theme.headingFont}', serif` }}
                >
                  {member.name}
                </h3>
                <p className="text-sm mb-4" style={{ color: theme.primaryColor }}>
                  {member.position}
                </p>
                {dataSource === 'manual' && (
                  <p className="text-xs text-white/50 leading-relaxed">
                    Membre passionné de notre équipe, dédié à offrir la meilleure expérience culinaire.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const gridColsClass = columnsCount === 2 ? 'lg:grid-cols-2'
    : columnsCount === 3 ? 'lg:grid-cols-3'
    : columnsCount === 4 ? 'lg:grid-cols-4'
    : 'lg:grid-cols-3'

  return (
    <section 
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight"
            style={{ fontFamily: `'${theme.headingFont}', serif` }}
          >
            {titlePart1}
          </h2>
          <p 
            className="text-lg sm:text-xl mt-2"
            style={{ 
              color: theme.primaryColor,
              fontFamily: `'${theme.headingFont}', serif`,
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
            }}
          >
            {titlePart2}
          </p>
        </div>

        {displayMode === 'grid' ? (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-4 lg:gap-6`}>
            {members.map((member, idx) => (
              <TeamCard key={member.id} member={member} index={idx} />
            ))}
          </div>
        ) : (
          <div className="relative">
            {/* Mobile: 1 carte */}
            <div className="block sm:hidden">
              <div ref={carouselRef} className="overflow-hidden">
                <div 
                  className="flex gap-4 transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(calc(-${currentSlide} * (100% + 16px)))` }}
                >
                  {members.map((member, idx) => (
                    <div key={member.id} className="flex-shrink-0 w-full">
                      <TeamCard member={member} index={idx} />
                    </div>
                  ))}
                </div>
              </div>

              {members.length > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => goToSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <ChevronLeft size={16} color="#0C0C0C" />
                  </button>
                  
                  <div className="flex gap-2">
                    {members.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToSlide(idx)}
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          backgroundColor: idx === currentSlide ? theme.primaryColor : 'rgba(255,255,255,0.2)',
                          width: idx === currentSlide ? '24px' : '8px',
                        }}
                      />
                    ))}
                  </div>
                  
                  <button
                    onClick={() => goToSlide(Math.min(members.length - 1, currentSlide + 1))}
                    disabled={currentSlide >= members.length - 1}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <ChevronRight size={16} color="#0C0C0C" />
                  </button>
                </div>
              )}
            </div>

            {/* Desktop: columnsCount cartes */}
            <div className="hidden sm:block px-12">
              <div className="overflow-hidden">
                <div 
                  className="flex gap-6 transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(calc(-${currentSlide} * (100% / ${columnsCount} + 24px / ${columnsCount})))` }}
                >
                  {members.map((member, idx) => (
                    <div 
                      key={member.id} 
                      className="flex-shrink-0"
                      style={{ width: `calc((100% - ${(columnsCount - 1) * 24}px) / ${columnsCount})` }}
                    >
                      <TeamCard member={member} index={idx} />
                    </div>
                  ))}
                </div>
              </div>

              {members.length > columnsCount && (
                <>
                  <button
                    onClick={() => goToSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 z-10"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <ChevronLeft size={20} color="#0C0C0C" />
                  </button>
                  <button
                    onClick={() => goToSlide(Math.min(members.length - columnsCount, currentSlide + 1))}
                    disabled={currentSlide >= members.length - columnsCount}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 z-10"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <ChevronRight size={20} color="#0C0C0C" />
                  </button>

                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: Math.max(0, members.length - columnsCount + 1) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToSlide(idx)}
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          backgroundColor: idx === currentSlide ? theme.primaryColor : 'rgba(255,255,255,0.2)',
                          width: idx === currentSlide ? '24px' : '8px',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
