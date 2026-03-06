'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SaveButton } from './SaveButton'
import type { ThemeTabProps } from './types'

export function ThemeAnnouncementTab({ formData, onChange, primaryColor, isSaving, onSave }: ThemeTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Réseaux sociaux</h3>
        <p className="text-sm text-gray-500 mt-1">Ajoutez les liens vers vos réseaux sociaux. Ils seront affichés dans le footer de votre site.</p>
      </div>

      <div className="space-y-4">
        {[
          { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/monrestaurant' },
          { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/monrestaurant' },
          { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/monrestaurant' },
          { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@monrestaurant' },
          { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@monrestaurant' },
          { key: 'tripadvisor', label: 'TripAdvisor', placeholder: 'https://tripadvisor.com/monrestaurant' },
          { key: 'ubereats', label: 'Uber Eats', placeholder: 'https://ubereats.com/monrestaurant' },
        ].map((social) => (
          <div key={social.key} className="space-y-1.5">
            <Label className="text-xs">{social.label}</Label>
            <Input
              value={formData.socialLinks?.[social.key] || ''}
              onChange={(e) => onChange({ socialLinks: { ...formData.socialLinks, [social.key]: e.target.value } })}
              placeholder={social.placeholder}
              className="h-10 rounded-xl text-sm focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        ))}
      </div>

      <SaveButton isSaving={isSaving} onSave={onSave} primaryColor={primaryColor} />
    </div>
  )
}
