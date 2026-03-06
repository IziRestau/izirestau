'use client'

import type { StoreThemeData } from '../../../_types'

interface TimelineEvent {
  year: string
  title: string
  description: string
  image?: string
}

interface CustomTimelineSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function CustomTimelineSection({
  theme,
  sectionData,
}: CustomTimelineSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const title = (s('title', 'Notre histoire') as string)
  const subtitle = (s('subtitle', '') as string)

  const events: TimelineEvent[] = []
  for (let i = 1; i <= 6; i++) {
    const year = (s(`event${i}Year`, '') as string)
    const evTitle = (s(`event${i}Title`, '') as string)
    const desc = (s(`event${i}Description`, '') as string)
    const img = (s(`event${i}Image`, '') as string)
    if (year || evTitle) {
      events.push({ year, title: evTitle, description: desc, image: img })
    }
  }

  if (events.length === 0) return null

  return (
    <section className="py-12 sm:py-16" style={{ backgroundColor: '#0C0C0C' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2
                className="text-2xl sm:text-3xl font-bold text-white"
                style={{ fontFamily: `'${theme.headingFont}', serif` }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-white/50 mt-2 max-w-lg mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        <div className="relative">
          <div
            className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px"
            style={{ backgroundColor: `${theme.primaryColor}30` }}
          />

          <div className="space-y-12">
            {events.map((event, i) => {
              const isLeft = i % 2 === 0
              return (
                <div key={i} className="relative">
                  <div
                    className="absolute left-4 sm:left-1/2 w-3 h-3 rounded-full -translate-x-1/2 mt-1.5 z-10 border-2"
                    style={{ backgroundColor: theme.primaryColor, borderColor: '#0C0C0C' }}
                  />

                  <div className={`ml-10 sm:ml-0 sm:w-[calc(50%-2rem)] ${isLeft ? 'sm:mr-auto sm:pr-8' : 'sm:ml-auto sm:pl-8'}`}>
                    <div
                      className="p-5 rounded-xl border"
                      style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#141414' }}
                    >
                      {event.year && (
                        <span
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: theme.primaryColor }}
                        >
                          {event.year}
                        </span>
                      )}
                      {event.title && (
                        <h3
                          className="text-base font-semibold text-white mt-1"
                          style={{ fontFamily: `'${theme.headingFont}', serif` }}
                        >
                          {event.title}
                        </h3>
                      )}
                      {event.description && (
                        <p className="text-sm text-white/50 mt-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                      {event.image && (
                        <div className="mt-3 rounded-lg overflow-hidden">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
