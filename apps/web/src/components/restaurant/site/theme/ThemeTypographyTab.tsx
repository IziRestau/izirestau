'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SaveButton } from './SaveButton'
import { FONT_OPTIONS } from './types'
import type { ThemeTabProps } from './types'

export function ThemeTypographyTab({ formData, onChange, primaryColor, isSaving, onSave }: ThemeTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Typographie</h3>
        <p className="text-sm text-gray-500 mt-1">Choisissez les polices de votre site</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Police des titres</Label>
          <Select value={formData.headingFont} onValueChange={(v) => onChange({ headingFont: v })}>
            <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Police du corps</Label>
          <Select value={formData.bodyFont} onValueChange={(v) => onChange({ bodyFont: v })}>
            <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 p-4 space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aperçu</p>
        <div className="space-y-2">
          <p className="text-xl font-bold" style={{ fontFamily: `'${formData.headingFont}', sans-serif`, color: formData.textColor }}>
            Titre de votre restaurant
          </p>
          <p className="text-sm" style={{ fontFamily: `'${formData.bodyFont}', sans-serif`, color: formData.textColor }}>
            Découvrez notre carte et nos plats préparés avec des ingrédients frais et de saison. Commandez en ligne pour la livraison ou le retrait en restaurant.
          </p>
        </div>
      </div>

      <SaveButton isSaving={isSaving} onSave={onSave} primaryColor={primaryColor} />
    </div>
  )
}
