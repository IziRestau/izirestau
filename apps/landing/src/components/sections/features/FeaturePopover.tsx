'use client'

import { ChevronRight } from 'lucide-react'
import { featureDetails } from './feature-details'
import type { LucideIcon } from 'lucide-react'

/**
 * Contenu du Popover pour une fonctionnalité.
 * Utilisé à l'intérieur du <PopoverContent> de shadcn.
 */
export function FeaturePopoverContent({
  title,
  icon: Icon,
  onClose,
}: {
  title: string
  icon: LucideIcon
  onClose: () => void
}) {
  const data = featureDetails[title]

  if (!data) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0">
          <Icon className="w-[16px] h-[16px] text-primary" />
        </div>
        <h4 className="text-[14px] font-bold text-foreground leading-snug truncate">{title}</h4>
      </div>

      {/* Body */}
      <div className="-mx-4 px-4 pb-1">
        {/* Caption */}
        <p className="text-[12.5px] leading-relaxed text-muted-foreground mb-3">
          {data.caption}
        </p>

        {/* Highlights */}
        {data.highlights.length > 0 && (
          <div className="grid grid-cols-2 gap-px rounded-lg overflow-hidden border border-border/30 dark:border-white/[0.06] mb-3">
            {data.highlights.map((h) => (
              <div key={h.label} className="bg-muted/30 dark:bg-white/[0.02] px-3 py-2">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-0.5 font-medium">
                  {h.label}
                </div>
                <div className="text-[12px] font-semibold text-foreground leading-tight">{h.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Detail sections */}
        <div className="space-y-3">
          {data.sections.map((section) => (
            <div key={section.title}>
              <h5 className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1.5">
                {section.title}
              </h5>
              <ul className="space-y-1">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11.5px] text-muted-foreground leading-snug">
                    <ChevronRight className="w-2.5 h-2.5 text-primary/40 shrink-0 mt-[3px]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
