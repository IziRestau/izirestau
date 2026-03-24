'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const campaignSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  subject: z.string().min(1, 'Sujet requis'),
  content: z.string().min(1, 'Contenu requis'),
  type: z.enum(['PROMOTIONAL', 'NEWSLETTER', 'ANNOUNCEMENT', 'LOYALTY', 'BIRTHDAY', 'REACTIVATION']),
  targetAll: z.boolean(),
  targetSegment: z.string().optional(),
  targetMinPoints: z.number().optional(),
  targetMaxPoints: z.number().optional(),
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface CampaignFormModalProps {
  open: boolean
  onClose: () => void
  campaign?: {
    id: string
    name: string
    subject: string
    content?: string
    type: string
    targetAll?: boolean
    targetSegment?: string | null
    targetMinPoints?: number | null
    targetMaxPoints?: number | null
  } | null
  primaryColor: string
}

const typeOptions = [
  { value: 'PROMOTIONAL', label: 'Promotionnel' },
  { value: 'NEWSLETTER', label: 'Newsletter' },
  { value: 'ANNOUNCEMENT', label: 'Annonce' },
  { value: 'LOYALTY', label: 'Fidélité' },
  { value: 'BIRTHDAY', label: 'Anniversaire' },
  { value: 'REACTIVATION', label: 'Réactivation' },
]

const segmentOptions = [
  { value: '', label: 'Tous les clients' },
  { value: 'loyal', label: 'Clients fidèles (avec points)' },
  { value: 'inactive', label: 'Clients inactifs (+30 jours)' },
  { value: 'new', label: 'Nouveaux clients (-7 jours)' },
]

export function CampaignFormModal({ open, onClose, campaign, primaryColor }: CampaignFormModalProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const isEditing = !!campaign

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      subject: '',
      content: '',
      type: 'PROMOTIONAL',
      targetAll: true,
      targetSegment: '',
      targetMinPoints: undefined,
      targetMaxPoints: undefined,
    },
  })

  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        subject: campaign.subject,
        content: campaign.content || '',
        type: campaign.type as CampaignFormData['type'],
        targetAll: campaign.targetAll ?? true,
        targetSegment: campaign.targetSegment || '',
        targetMinPoints: campaign.targetMinPoints ?? undefined,
        targetMaxPoints: campaign.targetMaxPoints ?? undefined,
      })
    } else {
      form.reset({
        name: '',
        subject: '',
        content: '',
        type: 'PROMOTIONAL',
        targetAll: true,
        targetSegment: '',
        targetMinPoints: undefined,
        targetMaxPoints: undefined,
      })
    }
  }, [campaign, form])

  const createMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.campaigns.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campagne créée')
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.campaigns.update(campaign!.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campagne mise à jour')
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const onSubmit = (data: CampaignFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const targetAll = form.watch('targetAll')

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la campagne</Label>
              <Input
                id="name"
                placeholder="Ex: Promo été 2024"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(v) => form.setValue('type', v as CampaignFormData['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Sujet de l'email</Label>
            <Input
              id="subject"
              placeholder="Ex: -20% sur votre prochaine commande !"
              {...form.register('subject')}
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-red-500">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenu de l'email</Label>
            <Textarea
              id="content"
              placeholder="Rédigez le contenu de votre email..."
              rows={8}
              {...form.register('content')}
            />
            <p className="text-xs text-gray-500">
              Variables disponibles : {'{{firstName}}'}, {'{{lastName}}'}, {'{{loyaltyPoints}}'}, {'{{restaurantName}}'}
            </p>
            {form.formState.errors.content && (
              <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Ciblage</h4>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label>Envoyer à tous les clients</Label>
                <p className="text-sm text-gray-500">Tous les clients ayant accepté les emails marketing</p>
              </div>
              <Switch
                checked={targetAll}
                onCheckedChange={(v) => form.setValue('targetAll', v)}
              />
            </div>

            {!targetAll && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label>Segment</Label>
                  <Select
                    value={form.watch('targetSegment') || ''}
                    onValueChange={(v) => form.setValue('targetSegment', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {segmentOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Points minimum</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      {...form.register('targetMinPoints', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points maximum</Label>
                    <Input
                      type="number"
                      placeholder="Illimité"
                      {...form.register('targetMaxPoints', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} style={{ backgroundColor: primaryColor }}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Créer la campagne'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
