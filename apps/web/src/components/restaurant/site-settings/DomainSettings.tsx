'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Globe, Save, Loader2, CheckCircle, Info, Copy, ExternalLink, Server } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DomainSettingsProps {
  subdomain: string | null
  customDomain: string | null
  status: string | null
  onUpdate: () => void
  primaryColor?: string
}

export function DomainSettings({
  subdomain,
  customDomain,
  status,
  onUpdate,
  primaryColor = '#10b981',
}: DomainSettingsProps) {
  const [formData, setFormData] = useState({
    customDomain: customDomain || '',
  })

  useEffect(() => {
    setFormData({ customDomain: customDomain || '' })
  }, [customDomain])

  const updateMutation = useMutation({
    mutationFn: async (data: { customDomain?: string | null }) => {
      return api.restaurant.site.settings.update(data)
    },
    onSuccess: () => {
      toast.success('Configuration du domaine mise à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      customDomain: formData.customDomain || null,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié dans le presse-papiers')
  }

  const siteUrl = subdomain ? `https://${subdomain}.iziresto.com` : null

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Domaine</h3>
        <p className="text-sm text-gray-500">Configurez votre nom de domaine personnalisé</p>
      </div>

      {/* Sous-domaine actuel */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Globe size={16} style={{ color: primaryColor }} />
          <span>Sous-domaine actuel</span>
        </div>
        {subdomain ? (
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                  <CheckCircle size={18} style={{ color: primaryColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {subdomain}.iziresto.com
                  </p>
                  <p className="text-xs font-medium" style={{ color: primaryColor }}>Actif</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`https://${subdomain}.iziresto.com`)}
                >
                  <Copy size={14} />
                </Button>
                {siteUrl && (
                  <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="ghost" size="sm">
                      <ExternalLink size={14} />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-700">Aucun sous-domaine configuré</p>
          </div>
        )}
      </div>

      {/* Domaine personnalisé */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Server size={16} style={{ color: primaryColor }} />
          <span>Domaine personnalisé</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customDomain">Nom de domaine</Label>
          <Input
            id="customDomain"
            value={formData.customDomain}
            onChange={(e) => setFormData({ customDomain: e.target.value })}
            placeholder="www.mon-restaurant.com"
            className="h-11 rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
          <p className="text-xs text-gray-400">
            Entrez votre nom de domaine sans le protocole (sans https://)
          </p>
        </div>

        {/* Instructions DNS */}
        {formData.customDomain && (
          <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Configuration DNS requise</p>
            </div>
            <p className="text-xs text-blue-700">
              Pour que votre domaine personnalisé fonctionne, ajoutez les enregistrements DNS suivants chez votre registrar :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[350px] text-xs">
                <thead>
                  <tr className="border-b border-blue-200">
                    <th className="text-left py-2 pr-4 text-blue-800 font-medium">Type</th>
                    <th className="text-left py-2 pr-4 text-blue-800 font-medium">Nom</th>
                    <th className="text-left py-2 text-blue-800 font-medium">Valeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-blue-700">CNAME</td>
                    <td className="py-2 pr-4 font-mono text-blue-700">
                      {formData.customDomain.startsWith('www.') ? 'www' : '@'}
                    </td>
                    <td className="py-2 font-mono text-blue-700">
                      <div className="flex items-center gap-1">
                        <span>{subdomain}.iziresto.com</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`${subdomain}.iziresto.com`)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-blue-600">
              La propagation DNS peut prendre jusqu&apos;à 48 heures.
            </p>
          </div>
        )}
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
