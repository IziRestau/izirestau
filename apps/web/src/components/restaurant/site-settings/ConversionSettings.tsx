'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { BarChart3, Save, Loader2, AlertTriangle, Code, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ConversionSettingsProps {
  facebookPixelId: string | null
  googleAnalyticsId: string | null
  googleTagManagerId: string | null
  tiktokPixelId: string | null
  snapPixelId: string | null
  customHeadScript: string | null
  onUpdate: () => void
  primaryColor?: string
}

const pixelFields = [
  {
    key: 'facebookPixelId' as const,
    label: 'Facebook Pixel ID',
    placeholder: '123456789012345',
    help: 'Identifiant numérique de votre pixel Facebook/Meta.',
    icon: '📘',
  },
  {
    key: 'googleAnalyticsId' as const,
    label: 'Google Analytics ID',
    placeholder: 'G-XXXXXXXXXX',
    help: 'Identifiant de mesure Google Analytics 4 (format G-XXXXXXX).',
    icon: '📊',
  },
  {
    key: 'googleTagManagerId' as const,
    label: 'Google Tag Manager ID',
    placeholder: 'GTM-XXXXXXX',
    help: 'Identifiant de votre conteneur GTM (format GTM-XXXXXXX).',
    icon: '🏷️',
  },
  {
    key: 'tiktokPixelId' as const,
    label: 'TikTok Pixel ID',
    placeholder: 'CXXXXXXXXXXXXXXXXX',
    help: 'Identifiant de votre pixel TikTok.',
    icon: '🎵',
  },
  {
    key: 'snapPixelId' as const,
    label: 'Snap Pixel ID',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    help: 'Identifiant de votre pixel Snapchat.',
    icon: '👻',
  },
]

export function ConversionSettings({
  facebookPixelId,
  googleAnalyticsId,
  googleTagManagerId,
  tiktokPixelId,
  snapPixelId,
  customHeadScript,
  onUpdate,
  primaryColor = '#10b981',
}: ConversionSettingsProps) {
  const [formData, setFormData] = useState({
    facebookPixelId: facebookPixelId || '',
    googleAnalyticsId: googleAnalyticsId || '',
    googleTagManagerId: googleTagManagerId || '',
    tiktokPixelId: tiktokPixelId || '',
    snapPixelId: snapPixelId || '',
    customHeadScript: customHeadScript || '',
  })

  useEffect(() => {
    setFormData({
      facebookPixelId: facebookPixelId || '',
      googleAnalyticsId: googleAnalyticsId || '',
      googleTagManagerId: googleTagManagerId || '',
      tiktokPixelId: tiktokPixelId || '',
      snapPixelId: snapPixelId || '',
      customHeadScript: customHeadScript || '',
    })
  }, [facebookPixelId, googleAnalyticsId, googleTagManagerId, tiktokPixelId, snapPixelId, customHeadScript])

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.restaurant.site.settings.update({
        facebookPixelId: data.facebookPixelId || null,
        googleAnalyticsId: data.googleAnalyticsId || null,
        googleTagManagerId: data.googleTagManagerId || null,
        tiktokPixelId: data.tiktokPixelId || null,
        snapPixelId: data.snapPixelId || null,
        customHeadScript: data.customHeadScript || null,
      })
    },
    onSuccess: () => {
      toast.success('Paramètres de conversion mis à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const activePixelsCount = pixelFields.filter(f => formData[f.key]).length + (formData.customHeadScript ? 1 : 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Conversion</h3>
        <p className="text-sm text-gray-500">
          Configurez vos pixels et tags de suivi pour mesurer les performances
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `${primaryColor}10` }}>
        <BarChart3 size={18} style={{ color: primaryColor }} />
        <span className="text-sm text-gray-700">
          {activePixelsCount > 0
            ? `${activePixelsCount} pixel${activePixelsCount > 1 ? 's' : ''} / tag${activePixelsCount > 1 ? 's' : ''} actif${activePixelsCount > 1 ? 's' : ''}`
            : 'Aucun pixel configuré'}
        </span>
      </div>

      {/* Pixel fields */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <BarChart3 size={16} style={{ color: primaryColor }} />
          <span>Pixels de suivi</span>
        </div>
        {pixelFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              value={formData[field.key]}
              onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="h-11 rounded-xl focus:ring-2"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
            />
            <p className="text-xs text-gray-400">{field.help}</p>
          </div>
        ))}
      </div>

      {/* Custom head script */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Code size={16} style={{ color: primaryColor }} />
          <span>Script personnalisé</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customHeadScript">
            Code à injecter dans le {'<head>'} de votre site
          </Label>
          <Textarea
            id="customHeadScript"
            value={formData.customHeadScript}
            onChange={(e) => setFormData(prev => ({ ...prev, customHeadScript: e.target.value }))}
            placeholder={'<script>\n  // Votre code personnalisé\n</script>'}
            rows={6}
            className="font-mono text-xs rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
        </div>
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700">
            <p className="font-medium mb-1">Attention</p>
            <p>
              Les scripts personnalisés seront injectés dans le {'<head>'} de votre site.
              Un code incorrect peut affecter le fonctionnement de votre site.
              Utilisez cette fonctionnalité uniquement si vous savez ce que vous faites.
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700">
          <p className="font-medium mb-1">Comment ça fonctionne ?</p>
          <p>
            Les pixels et tags configurés ici seront automatiquement injectés sur toutes les pages
            de votre site vitrine. Ils permettent de suivre les visites, les conversions et
            d&apos;optimiser vos campagnes publicitaires.
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          style={{ backgroundColor: primaryColor }}
          className="text-white"
        >
          {updateMutation.isPending ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
