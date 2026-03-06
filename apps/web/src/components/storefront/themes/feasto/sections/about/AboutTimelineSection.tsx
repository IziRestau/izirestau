'use client'

import { useEffect, useRef, useState } from 'react'
import type { StoreThemeData } from '../../../_types'
import { getIconComponent } from '@/components/shared/IconPicker'

interface TimelineItem {
  marker: string
  markerType: 'year' | 'text' | 'icon'
  title: string
  description: string
}

interface AboutTimelineSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function AboutTimelineSection({
  theme,
  sectionData,
}: AboutTimelineSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const backgroundColor = (s('backgroundColor', '#0e1416') as string)
  const columnOrder = (s('columnOrder', 'content-timeline') as string)
  const imageRadius = (s('imageRadius', 'lg') as string)

  const titlePart1 = (s('titlePart1', 'Crafting Warm Memories') as string)
  const titlePart2 = (s('titlePart2', 'Through Five Delicious Years') as string)
  const sideImage = (s('sideImage', '') as string)

  const radiusClass = imageRadius === 'none' ? ''
    : imageRadius === 'sm' ? 'rounded-sm'
    : imageRadius === 'md' ? 'rounded-md'
    : imageRadius === 'lg' ? 'rounded-lg'
    : imageRadius === 'xl' ? 'rounded-xl'
    : imageRadius === '2xl' ? 'rounded-2xl'
    : 'rounded-lg'

  const defaultItems: TimelineItem[] = [
    {
      marker: '2021',
      markerType: 'year',
      title: 'The Beginning',
      description: 'We started with a simple dream: to create a cozy place where people could enjoy fresh, honest food. With a small team and big passion, we opened our doors and welcomed our first guests.',
    },
    {
      marker: '2022',
      markerType: 'year',
      title: 'Building Trust',
      description: 'Word spread, and more families, friends, and food lovers began visiting us. We improved our kitchen standards, refined our recipes, and listened closely to customer feedback.',
    },
    {
      marker: '2023',
      markerType: 'year',
      title: 'Growing Stronger',
      description: 'Our menu expanded with new favorites, and our team grew with dedicated members who shared our vision. We upgraded our space, added comfort elements, and focused on delivering even better experiences.',
    },
    {
      marker: '2024',
      markerType: 'year',
      title: 'Becoming a Community Favorite',
      description: 'Our menu expanded with new favorites, and our team grew with dedicated members who shared our vision. We upgraded our space, added comfort elements, and focused on delivering even better experiences.',
    },
  ]

  const items = (s('items', defaultItems) as TimelineItem[])

  const timelineRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const elementHeight = rect.height

      const startOffset = windowHeight * 0.8
      const endOffset = windowHeight * 0.2

      if (rect.top > startOffset) {
        setProgress(0)
      } else if (rect.bottom < endOffset) {
        setProgress(100)
      } else {
        const totalScrollDistance = elementHeight + startOffset - endOffset
        const scrolled = startOffset - rect.top
        const percentage = Math.min(100, Math.max(0, (scrolled / totalScrollDistance) * 100))
        setProgress(percentage)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isReversed = columnOrder === 'timeline-content'

  const ContentColumn = () => (
    <div className="flex flex-col">
      <h2
        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-8"
        style={{ fontFamily: `'${theme.headingFont}', serif` }}
      >
        {titlePart1}{' '}
        <span style={{ color: theme.primaryColor }}>{titlePart2}</span>
      </h2>

      {sideImage && (
        <div className={`flex-1 min-h-[300px] lg:min-h-[400px] overflow-hidden ${radiusClass}`}>
          <img
            src={sideImage}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  )

  const TimelineColumn = () => (
    <div ref={timelineRef} className="relative">
      <div 
        className="absolute left-4 lg:left-6 top-0 bottom-0 w-px"
        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
      >
        <div 
          className="absolute left-0 top-0 w-full transition-all duration-100"
          style={{ 
            height: `${progress}%`,
            backgroundColor: theme.primaryColor,
          }}
        />
        <div 
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all duration-100"
          style={{ 
            top: `${progress}%`,
            transform: `translate(-50%, -50%)`,
            backgroundColor: theme.primaryColor,
            borderColor: theme.primaryColor,
          }}
        />
      </div>

      <div className="space-y-10 lg:space-y-12">
        {items.map((item, idx) => {
          const MarkerIcon = item.markerType === 'icon' ? getIconComponent(item.marker) : null

          return (
            <div key={idx} className="flex gap-6 lg:gap-8 pl-10 lg:pl-14">
              <div className="flex-shrink-0 w-12 lg:w-14 text-right">
                {item.markerType === 'icon' && MarkerIcon ? (
                  <MarkerIcon size={20} style={{ color: theme.primaryColor }} />
                ) : (
                  <span 
                    className="text-sm font-medium"
                    style={{ color: theme.primaryColor }}
                  >
                    {item.marker}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 
                  className="text-base lg:text-lg font-semibold text-white mb-2"
                  style={{ fontFamily: `'${theme.headingFont}', serif` }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <section 
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
          {isReversed ? (
            <>
              <TimelineColumn />
              <ContentColumn />
            </>
          ) : (
            <>
              <ContentColumn />
              <TimelineColumn />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
