'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SaveButton } from './SaveButton'
import type { ThemeTabProps } from './types'

export function ThemeAdvancedTab({ formData, onChange, primaryColor, isSaving, onSave }: ThemeTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Paramètres avancés</h3>
        <p className="text-sm text-gray-500 mt-1">Mentions légales et CSS personnalisé</p>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Textes légaux</p>

        <div className="space-y-1.5">
          <Label className="text-xs">Texte légal</Label>
          <Textarea
            value={formData.legalText}
            onChange={(e) => onChange({ legalText: e.target.value })}
            placeholder="Texte légal affiché dans le footer du thème..."
            className="min-h-[80px] rounded-xl text-sm focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Texte de confidentialité</Label>
          <Textarea
            value={formData.privacyText}
            onChange={(e) => onChange({ privacyText: e.target.value })}
            placeholder="Politique de confidentialité affichée dans le thème..."
            className="min-h-[80px] rounded-xl text-sm focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">CSS personnalisé</p>
        <div className="space-y-1.5">
          <Label className="text-xs">Code CSS</Label>
          <Textarea
            value={formData.customCss}
            onChange={(e) => onChange({ customCss: e.target.value })}
            placeholder=".hero-section { background: linear-gradient(...); }"
            className="min-h-[120px] rounded-xl text-sm font-mono focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
          <p className="text-xs text-gray-400">
            CSS injecté dans votre site. Utilisez avec précaution.
          </p>
        </div>
      </div>

      <SaveButton isSaving={isSaving} onSave={onSave} primaryColor={primaryColor} />
    </div>
  )
}
