'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Scale, Save, Loader2, Link2, FileText } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface LegalSettingsProps {
  termsUrl: string | null
  privacyUrl: string | null
  legalNotice: string | null
  onUpdate: () => void
  primaryColor?: string
}

export function LegalSettings({
  termsUrl,
  privacyUrl,
  legalNotice,
  onUpdate,
  primaryColor = '#10b981',
}: LegalSettingsProps) {
  const [formData, setFormData] = useState({
    termsUrl: termsUrl || '',
    privacyUrl: privacyUrl || '',
    legalNotice: legalNotice || '',
  })

  useEffect(() => {
    setFormData({
      termsUrl: termsUrl || '',
      privacyUrl: privacyUrl || '',
      legalNotice: legalNotice || '',
    })
  }, [termsUrl, privacyUrl, legalNotice])

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.restaurant.site.settings.update({
        termsUrl: data.termsUrl || null,
        privacyUrl: data.privacyUrl || null,
        legalNotice: data.legalNotice || null,
      })
    },
    onSuccess: () => {
      toast.success('Mentions légales mises à jour')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Mentions légales</h3>
        <p className="text-sm text-gray-500">
          Configurez vos pages légales et conditions d&apos;utilisation
        </p>
      </div>

      {/* URLs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Link2 size={16} style={{ color: primaryColor }} />
          <span>Liens légaux</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="termsUrl">URL des Conditions Générales de Vente (CGV)</Label>
          <Input
            id="termsUrl"
            type="url"
            value={formData.termsUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, termsUrl: e.target.value }))}
            placeholder="https://mon-restaurant.com/cgv"
            className="h-11 rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
          <p className="text-xs text-gray-400">
            Lien vers vos conditions générales de vente. Affiché dans le footer du site.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="privacyUrl">URL de la Politique de confidentialité</Label>
          <Input
            id="privacyUrl"
            type="url"
            value={formData.privacyUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, privacyUrl: e.target.value }))}
            placeholder="https://mon-restaurant.com/confidentialite"
            className="h-11 rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
          <p className="text-xs text-gray-400">
            Lien vers votre politique de confidentialité. Obligatoire pour la conformité RGPD.
          </p>
        </div>
      </div>

      {/* Texte mentions légales */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText size={16} style={{ color: primaryColor }} />
          <span>Texte des mentions légales</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="legalNotice">Mentions légales</Label>
          <Textarea
            id="legalNotice"
            value={formData.legalNotice}
            onChange={(e) => setFormData(prev => ({ ...prev, legalNotice: e.target.value }))}
            placeholder="Raison sociale, adresse du siège social, numéro SIRET, capital social, directeur de publication..."
            rows={8}
            className="rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
          <p className="text-xs text-gray-400">
            Ce texte sera affiché sur la page des mentions légales de votre site.
            Incluez les informations obligatoires : raison sociale, adresse, SIRET, etc.
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
