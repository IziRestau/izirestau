'use client'

import { Megaphone } from 'lucide-react'
import type { AnnouncementBarProps } from '../_types'

export function AnnouncementBar({ theme }: AnnouncementBarProps) {
  if (!theme.announcementActive || !theme.announcementText) return null

  return (
    <div
      className="w-full py-2.5 px-4 text-center text-sm font-medium"
      style={{
        backgroundColor: theme.announcementBgColor || theme.primaryColor,
        color: '#FFFFFF',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <Megaphone size={14} className="flex-shrink-0" />
        <span>{theme.announcementText}</span>
      </div>
    </div>
  )
}
