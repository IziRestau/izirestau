'use client'

import type { StoreThemeData } from '../../../_types'

interface CustomContentSectionProps {
  pageContent: string
  theme: StoreThemeData
  sectionData?: Record<string, unknown>
}

const MAX_WIDTH_MAP: Record<string, string> = {
  sm: 'max-w-xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  full: 'max-w-7xl',
}

const PADDING_MAP: Record<string, string> = {
  sm: 'py-6 sm:py-8',
  md: 'py-8 sm:py-12',
  lg: 'py-12 sm:py-16',
  xl: 'py-16 sm:py-24',
}

const FONT_SIZE_MAP: Record<string, string> = {
  sm: 'prose-sm',
  base: 'prose-base',
  lg: 'prose-lg',
}

export function CustomContentSection({ pageContent, theme, sectionData }: CustomContentSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const maxWidth = MAX_WIDTH_MAP[s('maxWidth', 'lg') as string] || 'max-w-5xl'
  const showTitle = s('showTitle', false) as boolean
  const title = s('title') as string | undefined
  const textAlign = s('textAlign', 'left') as string
  const fontSize = FONT_SIZE_MAP[s('fontSize', 'base') as string] || 'prose-base'
  const textColor = s('textColor') as string | undefined
  const bgColor = s('bgColor') as string | undefined
  const paddingY = PADDING_MAP[s('paddingY', 'md') as string] || 'py-8 sm:py-12'
  const showDivider = s('showDivider', false) as boolean

  const contentSource = s('contentSource', 'page') as string
  const customContent = s('customContent', '') as string
  const displayContent = contentSource === 'custom' && customContent ? customContent : pageContent

  const resolvedTextColor = textColor || theme.textColor

  return (
    <section
      className={paddingY}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      <div className={`${maxWidth} mx-auto px-4 sm:px-6`}>
        {showTitle && title && (
          <h2
            className={`text-xl sm:text-2xl font-bold mb-4 ${textAlign === 'center' ? 'text-center' : 'text-left'}`}
            style={{ color: resolvedTextColor, fontFamily: `'${theme.headingFont}', sans-serif` }}
          >
            {title}
          </h2>
        )}
        <div
          className={`prose ${fontSize} max-w-none ${textAlign === 'center' ? 'text-center' : 'text-left'}`}
          style={{ color: resolvedTextColor }}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
        {showDivider && (
          <div
            className="mt-8 border-b"
            style={{ borderColor: `${resolvedTextColor}15` }}
          />
        )}
      </div>
    </section>
  )
}
