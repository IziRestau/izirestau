'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SaveButton } from './SaveButton'
import type { ThemeTabProps } from './types'

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  accentColor,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  accentColor: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        accentColor={accentColor}
      />
    </div>
  )
}

export function ThemeMenuTab({ formData, onChange, primaryColor, isSaving, onSave }: ThemeTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Boutons et options</h3>
        <p className="text-sm text-gray-500 mt-1">Style des boutons et options d&apos;affichage générales</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Style des boutons</Label>
          <Select value={formData.buttonStyle} onValueChange={(v) => onChange({ buttonStyle: v })}>
            <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="rounded">Arrondi</SelectItem>
              <SelectItem value="pill">Pilule</SelectItem>
              <SelectItem value="square">Carré</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Taille des boutons</Label>
          <Select value={formData.buttonSize} onValueChange={(v) => onChange({ buttonSize: v })}>
            <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="sm">Petit</SelectItem>
              <SelectItem value="md">Moyen</SelectItem>
              <SelectItem value="lg">Grand</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Options d&apos;affichage</p>
        <ToggleRow label="Notes et avis" checked={formData.showRatings} onChange={(v) => onChange({ showRatings: v })} accentColor={primaryColor} />
        <ToggleRow label="Temps de préparation" checked={formData.showPrepTime} onChange={(v) => onChange({ showPrepTime: v })} accentColor={primaryColor} />
        <ToggleRow label="Allergènes" checked={formData.showAllergens} onChange={(v) => onChange({ showAllergens: v })} accentColor={primaryColor} />
        <ToggleRow label="Types de cuisine" checked={formData.showCuisineTypes} onChange={(v) => onChange({ showCuisineTypes: v })} accentColor={primaryColor} />
      </div>

      <SaveButton isSaving={isSaving} onSave={onSave} primaryColor={primaryColor} />
    </div>
  )
}
