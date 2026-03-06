'use client'

import type { StoreThemeData } from '../../../_types'

interface TeamMember {
  name: string
  role: string
  photo: string
}

interface CustomTeamSectionProps {
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function CustomTeamSection({
  theme,
  sectionData,
}: CustomTeamSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const title = (s('title', 'Notre équipe') as string)
  const subtitle = (s('subtitle', '') as string)

  const members: TeamMember[] = []
  for (let i = 1; i <= 4; i++) {
    const name = (s(`member${i}Name`, '') as string)
    const role = (s(`member${i}Role`, '') as string)
    const photo = (s(`member${i}Photo`, '') as string)
    if (name) {
      members.push({ name, role, photo })
    }
  }

  if (members.length === 0) return null

  return (
    <section className="py-12 sm:py-16" style={{ backgroundColor: '#0C0C0C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {(title || subtitle) && (
          <div className="text-center mb-10">
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

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${members.length >= 3 ? 'lg:grid-cols-3' : ''} ${members.length >= 4 ? 'lg:grid-cols-4' : ''} gap-6`}>
          {members.map((member, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-2xl border group"
              style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#141414' }}
            >
              {member.photo ? (
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              ) : (
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h3
                className="text-base font-semibold text-white"
                style={{ fontFamily: `'${theme.headingFont}', serif` }}
              >
                {member.name}
              </h3>
              {member.role && (
                <p className="text-sm mt-1" style={{ color: theme.primaryColor }}>
                  {member.role}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
