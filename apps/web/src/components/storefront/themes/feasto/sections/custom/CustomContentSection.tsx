'use client'

import type { StoreThemeData } from '../../../_types'

interface CustomContentSectionProps {
  pageContent: string
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

export function CustomContentSection({
  pageContent,
  theme,
  sectionData,
}: CustomContentSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const contentSource = (s('contentSource', 'page') as string)
  const customContent = (s('customContent', '') as string)
  const content = contentSource === 'custom' && customContent ? customContent : pageContent
  const maxWidth = (s('maxWidth', '4xl') as string)

  if (!content) return null

  const widthMap: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full',
  }

  return (
    <section className="py-12 sm:py-16" style={{ backgroundColor: '#0C0C0C' }}>
      <div className={`${widthMap[maxWidth] || 'max-w-4xl'} mx-auto px-4 sm:px-6`}>
        <div
          className="prose prose-invert prose-sm sm:prose-base max-w-none"
          style={{
            fontFamily: `'${theme.bodyFont}', sans-serif`,
            color: 'rgba(255,255,255,0.7)',
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  )
}
