'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { resellerNavigation } from '@/config/reseller-navigation'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Globe,
  ExternalLink,
  Pencil,
  AlertCircle,
  Eye,
  Layout,
  Palette,
  Settings,
} from 'lucide-react'

export default function ShowcasePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: showcaseData, isLoading } = useQuery({
    queryKey: ['reseller-showcase'],
    queryFn: () => api.reseller.getShowcase(),
  })

  const toggleMutation = useMutation({
    mutationFn: (enable: boolean) => api.reseller.toggleShowcase(enable),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reseller-showcase'] })
      toast.success(data.data?.message || 'Statut mis à jour')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    },
  })

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Ma vitrine"
        variant="detail"
      />
    )
  }

  const showcase = showcaseData?.data?.showcase
  const organization = showcaseData?.data?.organization
  const canPublish = showcaseData?.data?.canPublish

  const showcaseUrl = organization?.customDomain 
    ? `https://${organization.customDomain}`
    : `/showcase/${organization?.slug}`

  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
    >
      <PageHeader
        title="Ma vitrine"
        subtitle="Gérez votre page publique pour attirer de nouveaux clients"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.open(showcaseUrl, '_blank')}
              disabled={!showcase?.isEnabled}
            >
              <Eye size={16} className="mr-2" />
              Prévisualiser
            </Button>
            <Button onClick={() => router.push('/reseller/showcase/editor')}>
              <Pencil size={16} className="mr-2" />
              Personnaliser
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Statut */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut de la vitrine</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                showcase?.isEnabled ? 'bg-emerald-100' : 'bg-gray-100'
              )}>
                <Globe className={cn("w-7 h-7", showcase?.isEnabled ? 'text-emerald-600' : 'text-gray-400')} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {showcase?.isEnabled ? 'Vitrine active' : 'Vitrine désactivée'}
                </p>
                <p className="text-sm text-gray-500">
                  {showcase?.isEnabled 
                    ? 'Votre vitrine est visible par les prospects'
                    : 'Activez pour rendre votre vitrine publique'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={showcase?.isEnabled || false}
              onCheckedChange={(checked) => toggleMutation.mutate(checked)}
              disabled={toggleMutation.isPending || (!canPublish && !showcase?.isEnabled)}
            />
          </div>
          {!canPublish && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm">
              <AlertCircle size={16} />
              <span>Configurez Moneroo dans les paramètres pour activer la vitrine</span>
            </div>
          )}
        </div>

        {/* URL */}
        {showcase?.isEnabled && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">URL de la vitrine</h3>
            <div className="flex items-center gap-3">
              <Input 
                value={showcaseUrl} 
                readOnly 
                className="flex-1 bg-gray-50"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(showcaseUrl)
                  toast.success('URL copiée')
                }}
              >
                Copier
              </Button>
              <Button asChild>
                <a href={showcaseUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} className="mr-2" />
                  Ouvrir
                </a>
              </Button>
            </div>
            {organization?.customDomain && (
              <p className="text-xs text-gray-500 mt-3">
                Domaine personnalisé : {organization.customDomain}
                {organization.domainVerified ? (
                  <span className="text-emerald-600 ml-2">Vérifié</span>
                ) : (
                  <span className="text-amber-600 ml-2">En attente de vérification</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/reseller/showcase/editor')}
            className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
              <Layout size={24} className="text-indigo-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Sections</h4>
            <p className="text-sm text-gray-500">Configurez les sections de votre vitrine</p>
          </button>

          <button
            onClick={() => router.push('/reseller/showcase/editor?section=global')}
            className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <Palette size={24} className="text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Styles</h4>
            <p className="text-sm text-gray-500">Personnalisez les couleurs et polices</p>
          </button>

          <button
            onClick={() => router.push('/reseller/plans')}
            className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
              <Settings size={24} className="text-emerald-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Plans tarifaires</h4>
            <p className="text-sm text-gray-500">Gérez vos offres et tarifs</p>
          </button>
        </div>

        {/* Aperçu */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Aperçu de la vitrine</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/reseller/showcase/editor')}
            >
              <Pencil size={14} className="mr-1" />
              Modifier
            </Button>
          </div>
          <div className="aspect-video bg-gray-50 flex items-center justify-center">
            {showcase?.isEnabled ? (
              <iframe
                src={showcaseUrl}
                className="w-full h-full border-0"
                title="Aperçu de la vitrine"
              />
            ) : (
              <div className="text-center text-gray-500">
                <Globe size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Activez la vitrine pour voir l'aperçu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
