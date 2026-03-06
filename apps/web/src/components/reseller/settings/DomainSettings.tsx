'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { Globe, CheckCircle, AlertCircle, Copy, Loader2, Trash2, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/shared/IconInput'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { cn } from '@/lib/utils'

interface DomainSettingsProps {
  onUpdate: () => void
}

export function DomainSettings({ onUpdate }: DomainSettingsProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [newDomain, setNewDomain] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: domainData, isLoading } = useQuery({
    queryKey: ['domain-settings'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.domain.get()
    },
    enabled: !!accessToken,
  })

  const setDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.domain.set(domain)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-settings'] })
      setNewDomain('')
      toast.success('Domaine configure')
      onUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la configuration du domaine')
    },
  })

  const verifyDomainMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.domain.verify()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-settings'] })
      toast.success('Domaine verifie avec succes')
      onUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Verification echouee')
    },
  })

  const removeDomainMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.domain.remove()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-settings'] })
      setShowDeleteConfirm(false)
      toast.success('Domaine supprime')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newDomain.trim()) {
      setDomainMutation.mutate(newDomain.trim())
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copie dans le presse-papier')
  }

  const domain = domainData?.data

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Domaine personnalise</h3>
        <p className="text-sm text-gray-500">Connectez votre propre domaine pour vos restaurants</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : domain?.customDomain ? (
        <div className="space-y-6">
          {/* Current Domain Status */}
          <div className={cn(
            "p-5 rounded-xl border",
            domain.domainVerified 
              ? "bg-emerald-50 border-emerald-200" 
              : "bg-amber-50 border-amber-200"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  domain.domainVerified ? "bg-emerald-100" : "bg-amber-100"
                )}>
                  {domain.domainVerified ? (
                    <CheckCircle size={24} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={24} className="text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    {domain.customDomain}
                    <a 
                      href={`https://${domain.customDomain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </p>
                  <p className={cn(
                    "text-sm",
                    domain.domainVerified ? "text-emerald-700" : "text-amber-700"
                  )}>
                    {domain.domainVerified 
                      ? `Verifie le ${new Date(domain.domainVerifiedAt!).toLocaleDateString('fr-FR')}`
                      : 'En attente de verification'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!domain.domainVerified && (
                  <Button
                    onClick={() => verifyDomainMutation.mutate()}
                    disabled={verifyDomainMutation.isPending}
                    size="sm"
                  >
                    {verifyDomainMutation.isPending ? (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    ) : (
                      <RefreshCw size={14} className="mr-2" />
                    )}
                    Verifier
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} className="mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>

          {/* DNS Configuration (if not verified) */}
          {!domain.domainVerified && domain.domainTxtRecord && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Configuration DNS requise</h4>
              <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                <p className="text-sm text-gray-600">
                  Ajoutez cet enregistrement TXT a votre configuration DNS pour verifier la propriete du domaine.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 font-mono text-sm">
                      TXT
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nom / Host</p>
                    <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 font-mono text-sm flex items-center justify-between">
                      <span>@</span>
                      <button 
                        onClick={() => copyToClipboard('@')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Valeur</p>
                  <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 font-mono text-xs flex items-center justify-between gap-2">
                    <span className="break-all">{domain.domainTxtRecord}</span>
                    <button 
                      onClick={() => copyToClipboard(domain.domainTxtRecord!)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  La propagation DNS peut prendre jusqu'a 48 heures. Vous pouvez verifier a tout moment.
                </p>
              </div>
            </div>
          )}

          {/* Restaurant subdomains info */}
          {domain.domainVerified && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm font-medium text-blue-900 mb-1">Sous-domaines restaurants</p>
              <p className="text-xs text-blue-700">
                Vos restaurants auront automatiquement des adresses du type <strong>nom-restaurant.{domain.customDomain}</strong>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add Domain Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre domaine
              </label>
              <IconInput
                icon={Globe}
                type="text"
                value={newDomain}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDomain(e.target.value)}
                placeholder="exemple.com"
              />
              <p className="text-xs text-gray-500 mt-2">
                Entrez votre domaine sans http:// ou www.
              </p>
            </div>
            <Button 
              type="submit" 
              disabled={!newDomain.trim() || setDomainMutation.isPending}
            >
              {setDomainMutation.isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
              Configurer le domaine
            </Button>
          </form>

          {/* How it works */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Comment ca fonctionne</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-gray-100 rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-emerald-600 font-semibold text-sm">1</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Ajoutez votre domaine</p>
                <p className="text-xs text-gray-500">Entrez le domaine que vous possedez</p>
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-emerald-600 font-semibold text-sm">2</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Configurez le DNS</p>
                <p className="text-xs text-gray-500">Ajoutez l'enregistrement TXT fourni</p>
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-emerald-600 font-semibold text-sm">3</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Verifiez</p>
                <p className="text-xs text-gray-500">Validez la propriete du domaine</p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-medium text-blue-900 mb-1">Marque blanche</p>
              <p className="text-xs text-blue-700">Vos restaurants utilisent votre domaine</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-sm font-medium text-emerald-900 mb-1">Professionnalisme</p>
              <p className="text-xs text-emerald-700">Renforcez votre image de marque</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => removeDomainMutation.mutate()}
        title="Supprimer le domaine"
        message="Etes-vous sur de vouloir supprimer ce domaine ? Les restaurants utilisant ce domaine seront affectes."
        confirmText="Supprimer"
        variant="danger"
        isLoading={removeDomainMutation.isPending}
      />
    </div>
  )
}
