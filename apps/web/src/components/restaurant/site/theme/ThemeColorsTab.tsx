'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SaveButton } from './SaveButton'
import type { ThemeTabProps } from './types'

function ColorField({
  label,
  value,
  onChange,
  accentColor,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  accentColor: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 rounded-xl text-sm font-mono font-medium focus:ring-2 flex-1"
          style={{ '--tw-ring-color': accentColor, color: value } as React.CSSProperties}
          maxLength={7}
        />
      </div>
    </div>
  )
}

export function ThemeColorsTab({ formData, onChange, primaryColor, isSaving, onSave }: ThemeTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Couleurs</h3>
        <p className="text-sm text-gray-500 mt-1">Définissez la palette de couleurs de votre site</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <ColorField label="Principale" value={formData.primaryColor} onChange={(v) => onChange({ primaryColor: v })} accentColor={primaryColor} />
        <ColorField label="Secondaire" value={formData.secondaryColor} onChange={(v) => onChange({ secondaryColor: v })} accentColor={primaryColor} />
        <ColorField label="Accent" value={formData.accentColor} onChange={(v) => onChange({ accentColor: v })} accentColor={primaryColor} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ColorField label="Arrière-plan" value={formData.backgroundColor} onChange={(v) => onChange({ backgroundColor: v })} accentColor={primaryColor} />
        <ColorField label="Texte" value={formData.textColor} onChange={(v) => onChange({ textColor: v })} accentColor={primaryColor} />
      </div>

      <div className="rounded-xl border border-gray-100 p-4 space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aperçu</p>
        <div className="flex items-center gap-3">
          {[
            { label: 'Principale', color: formData.primaryColor },
            { label: 'Secondaire', color: formData.secondaryColor },
            { label: 'Accent', color: formData.accentColor },
            { label: 'Fond', color: formData.backgroundColor },
            { label: 'Texte', color: formData.textColor },
          ].map((c) => (
            <div key={c.label} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-lg border border-gray-200"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-[10px] text-gray-400">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <SaveButton isSaving={isSaving} onSave={onSave} primaryColor={primaryColor} />
    </div>
  )
}
