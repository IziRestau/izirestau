'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Mail,
  ArrowLeft,
  Save,
  FileText,
  Loader2,
  Info,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { TargetingBuilder, TargetingRules } from '@/components/restaurant/marketing/campaigns/TargetingBuilder'

const typeOptions = [
  { value: 'PROMOTIONAL', label: 'Promotionnel', description: 'Offres et réductions' },
  { value: 'NEWSLETTER', label: 'Newsletter', description: 'Actualités et nouveautés' },
  { value: 'ANNOUNCEMENT', label: 'Annonce', description: 'Informations importantes' },
  { value: 'LOYALTY', label: 'Fidélité', description: 'Programme de points' },
  { value: 'BIRTHDAY', label: 'Anniversaire', description: 'Souhaits d\'anniversaire' },
  { value: 'REACTIVATION', label: 'Réactivation', description: 'Clients inactifs' },
]


const availableVariables = [
  { key: '{{firstName}}', label: 'Prénom' },
  { key: '{{lastName}}', label: 'Nom' },
  { key: '{{loyaltyPoints}}', label: 'Points fidélité' },
  { key: '{{restaurantName}}', label: 'Nom du restaurant' },
  { key: '{{orderCount}}', label: 'Nombre de commandes' },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('id')
  const isEditing = !!campaignId

  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const queryClient = useQueryClient()
  const primaryColor = organization?.primaryColor || '#10b981'

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('PROMOTIONAL')
  const [targetingRules, setTargetingRules] = useState<TargetingRules | null>(null)
  const [scheduledAt, setScheduledAt] = useState<string>('')

  // Charger les données de la campagne si on est en mode édition
  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.campaigns.get(campaignId!)
      return res.data
    },
    enabled: !!accessToken && !!campaignId,
  })

  // Pré-remplir le formulaire avec les données de la campagne
  useEffect(() => {
    if (campaign) {
      setName(campaign.name)
      setSubject(campaign.subject)
      setContent(campaign.content)
      setType(campaign.type)
      setTargetingRules(campaign.targetingRules as TargetingRules | null)
      if (campaign.scheduledAt) {
        const date = new Date(campaign.scheduledAt)
        setScheduledAt(date.toISOString().slice(0, 16))
      }
    }
  }, [campaign])

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; subject: string; content: string; type: string; targetAll: boolean; targetingRules?: TargetingRules | null }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.campaigns.create(data as Parameters<typeof api.restaurant.marketing.campaigns.create>[0])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campagne créée')
      router.push('/restaurant/marketing/campaigns')
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; subject: string; content: string; type: string; targetAll: boolean; targetingRules?: TargetingRules | null }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.campaigns.update(campaignId!, data as Parameters<typeof api.restaurant.marketing.campaigns.update>[1])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      toast.success('Campagne mise à jour')
      router.push('/restaurant/marketing/campaigns')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSave = () => {
    if (!name.trim() || !subject.trim() || !content.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const data = {
      name,
      subject,
      content,
      type,
      targetAll: targetingRules === null,
      targetingRules,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    }

    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const insertVariable = (variable: string) => {
    setContent((prev) => prev + ' ' + variable)
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  if (isEditing && isLoadingCampaign) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Modifier la campagne"
        variant="detail"
      />
    )
  }

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <div className="mb-6">
        <Link
          href="/restaurant/marketing/campaigns"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux campagnes
        </Link>
        <PageHeader
          title={isEditing ? 'Modifier la campagne' : 'Nouvelle campagne'}
          subtitle={isEditing ? 'Modifiez les détails de votre campagne' : 'Créez une campagne email pour communiquer avec vos clients'}
          icon={Mail}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <FileText className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informations</h3>
                <p className="text-sm text-gray-500">Détails de la campagne</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la campagne *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Promo été 2024"
                    className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type de campagne</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger
                      className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent accentColor={primaryColor}>
                      {typeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-gray-500 ml-2 text-xs">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet de l'email *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: -20% sur votre prochaine commande !"
                  className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenu de l'email *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Rédigez le contenu de votre email..."
                  rows={10}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-gray-500">Variables :</span>
                  {availableVariables.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Planification */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Clock className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Planification</h3>
                <p className="text-sm text-gray-500">Programmer l'envoi</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Date et heure d'envoi (optionnel)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <p className="text-xs text-gray-500">
                Laissez vide pour enregistrer comme brouillon
              </p>
            </div>
          </div>

          {/* Ciblage */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <TargetingBuilder
              value={targetingRules}
              onChange={setTargetingRules}
              primaryColor={primaryColor}
              restaurantId={currentRestaurantId || ''}
            />
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Aperçu */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Aperçu</h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Sujet</p>
                <p className="font-medium text-gray-900 text-sm">
                  {subject || 'Votre sujet ici...'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Ciblage</p>
                <p className="font-medium text-gray-900 text-sm">
                  {targetingRules ? 'Ciblage personnalisé' : 'Tous les clients'}
                </p>
              </div>

              {scheduledAt && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Envoi programmé</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {new Date(scheduledAt).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Seuls les clients ayant accepté les emails marketing recevront cette campagne.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={handleSave}
                disabled={isLoading || !name || !subject || !content}
                className="w-full h-10 px-4 rounded-xl text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {isLoading ? (
                  <Loader2 size={18} className="mr-2 animate-spin" />
                ) : (
                  <Save size={18} className="mr-2" />
                )}
                {isEditing ? 'Enregistrer les modifications' : 'Enregistrer le brouillon'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/restaurant/marketing/campaigns')}
                className="w-full h-10 px-4 rounded-xl transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}15`
                  e.currentTarget.style.borderColor = primaryColor
                  e.currentTarget.style.color = primaryColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.color = ''
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
