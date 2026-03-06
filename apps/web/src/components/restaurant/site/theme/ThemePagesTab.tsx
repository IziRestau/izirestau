'use client'

import { Switch } from '@/components/ui/switch'
import { SaveButton } from './SaveButton'
import type { ThemeTabProps } from './types'

function PageToggle({
  label,
  description,
  checked,
  onChange,
  accentColor,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  accentColor: string
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        accentColor={accentColor}
      />
    </div>
  )
}

export function ThemePagesTab({ formData, onChange, primaryColor, isSaving, onSave }: ThemeTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Pages du site</h3>
        <p className="text-sm text-gray-500 mt-1">Activez ou désactivez les sections de votre site</p>
      </div>

      <div className="space-y-2">
        <PageToggle
          label="Page À propos"
          description="Présentez votre restaurant, votre histoire et votre équipe"
          checked={formData.showAboutPage}
          onChange={(v) => onChange({ showAboutPage: v })}
          accentColor={primaryColor}
        />
        <PageToggle
          label="Page Contact"
          description="Formulaire de contact et informations pratiques"
          checked={formData.showContactPage}
          onChange={(v) => onChange({ showContactPage: v })}
          accentColor={primaryColor}
        />
        <PageToggle
          label="Galerie photos"
          description="Galerie d'images de vos plats et de votre établissement"
          checked={formData.showGallery}
          onChange={(v) => onChange({ showGallery: v })}
          accentColor={primaryColor}
        />
        <PageToggle
          label="Témoignages"
          description="Avis et témoignages de vos clients"
          checked={formData.showTestimonials}
          onChange={(v) => onChange({ showTestimonials: v })}
          accentColor={primaryColor}
        />
        <PageToggle
          label="Carte / Plan"
          description="Carte interactive avec la localisation de votre restaurant"
          checked={formData.showMap}
          onChange={(v) => onChange({ showMap: v })}
          accentColor={primaryColor}
        />
      </div>

      <SaveButton isSaving={isSaving} onSave={onSave} primaryColor={primaryColor} />
    </div>
  )
}
