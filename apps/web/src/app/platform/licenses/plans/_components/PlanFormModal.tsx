'use client'

import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth.store'

import { apiClient } from '@/lib/api-client'

const CURRENCIES = [
  { code: 'XOF', name: 'Franc CFA', symbol: 'FCFA' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dollar US', symbol: '$' },
]

const planSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  slug: z.string().min(1, 'Slug requis').regex(/^[a-z0-9-]+$/, 'Slug invalide (lettres minuscules, chiffres, tirets)'),
  description: z.string().optional(),
  maxSites: z.number().min(1, 'Minimum 1 site'),
  maxUsersPerSite: z.number().min(1, 'Minimum 1 utilisateur'),
  priceMonthly: z.number().min(0, 'Prix invalide'),
  priceYearly: z.number().min(0, 'Prix invalide'),
  currency: z.string().default('EUR'),
  hasCustomDomain: z.boolean().default(false),
  hasAdvancedAnalytics: z.boolean().default(false),
  hasPrioritySupport: z.boolean().default(false),
  hasWhiteLabel: z.boolean().default(false),
  hasApiAccess: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  sortOrder: z.number().default(0),
})

type PlanFormData = z.infer<typeof planSchema>

interface LicensePlan {
  id: string
  name: string
  slug: string
  description: string | null
  maxSites: number
  maxUsersPerSite: number
  priceMonthly: number
  priceYearly: number
  currency: string
  hasCustomDomain: boolean
  hasAdvancedAnalytics: boolean
  hasPrioritySupport: boolean
  hasWhiteLabel: boolean
  hasApiAccess: boolean
  isActive: boolean
  isPopular: boolean
  sortOrder: number
}

interface PlanFormModalProps {
  isOpen: boolean
  onClose: () => void
  plan: LicensePlan | null
}

export function PlanFormModal({ isOpen, onClose, plan }: PlanFormModalProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const isEditing = !!plan

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      maxSites: 10,
      maxUsersPerSite: 5,
      priceMonthly: 99,
      priceYearly: 990,
      currency: 'EUR',
      hasCustomDomain: false,
      hasAdvancedAnalytics: false,
      hasPrioritySupport: false,
      hasWhiteLabel: false,
      hasApiAccess: false,
      isActive: true,
      isPopular: false,
      sortOrder: 0,
    },
  })

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || '',
        maxSites: plan.maxSites,
        maxUsersPerSite: plan.maxUsersPerSite,
        priceMonthly: Number(plan.priceMonthly),
        priceYearly: Number(plan.priceYearly),
        currency: plan.currency,
        hasCustomDomain: plan.hasCustomDomain,
        hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
        hasPrioritySupport: plan.hasPrioritySupport,
        hasWhiteLabel: plan.hasWhiteLabel,
        hasApiAccess: plan.hasApiAccess,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        sortOrder: plan.sortOrder,
      })
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
        maxSites: 10,
        maxUsersPerSite: 5,
        priceMonthly: 99,
        priceYearly: 990,
        currency: 'EUR',
        hasCustomDomain: false,
        hasAdvancedAnalytics: false,
        hasPrioritySupport: false,
        hasWhiteLabel: false,
        hasApiAccess: false,
        isActive: true,
        isPopular: false,
        sortOrder: 0,
      })
    }
  }, [plan, form])

  const mutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      if (isEditing) {
        return apiClient.put(`/platform/licenses/plans/${plan.id}`, data)
      } else {
        return apiClient.post('/platform/licenses/plans', data)
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Plan mis a jour' : 'Plan cree')
      queryClient.invalidateQueries({ queryKey: ['license-plans-admin'] })
      queryClient.invalidateQueries({ queryKey: ['license-plans'] })
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde')
    },
  })

  const onSubmit = (data: PlanFormData) => {
    mutation.mutate(data)
  }

  const generateSlug = () => {
    const name = form.watch('name')
    if (name) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      form.setValue('slug', slug)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Modifier le plan' : 'Nouveau plan'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  onBlur={generateSlug}
                  placeholder="Pro"
                  className="h-10 rounded-xl"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  {...form.register('slug')}
                  placeholder="pro"
                  className="h-10 rounded-xl"
                />
                {form.formState.errors.slug && (
                  <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...form.register('description')}
                placeholder="Plan pour les revendeurs professionnels"
                className="h-10 rounded-xl"
              />
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxSites">Sites maximum *</Label>
                <Input
                  id="maxSites"
                  type="number"
                  {...form.register('maxSites', { valueAsNumber: true })}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUsersPerSite">Utilisateurs par site *</Label>
                <Input
                  id="maxUsersPerSite"
                  type="number"
                  {...form.register('maxUsersPerSite', { valueAsNumber: true })}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceMonthly">Prix mensuel *</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  step="0.01"
                  {...form.register('priceMonthly', { valueAsNumber: true })}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceYearly">Prix annuel *</Label>
                <Input
                  id="priceYearly"
                  type="number"
                  step="0.01"
                  {...form.register('priceYearly', { valueAsNumber: true })}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={form.watch('currency')}
                  onValueChange={(value) => form.setValue('currency', value)}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Devise" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <Label>Fonctionnalites</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">Domaine personnalise</span>
                  <Switch
                    checked={form.watch('hasCustomDomain')}
                    onCheckedChange={(checked) => form.setValue('hasCustomDomain', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">Analytics avances</span>
                  <Switch
                    checked={form.watch('hasAdvancedAnalytics')}
                    onCheckedChange={(checked) => form.setValue('hasAdvancedAnalytics', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">Support prioritaire</span>
                  <Switch
                    checked={form.watch('hasPrioritySupport')}
                    onCheckedChange={(checked) => form.setValue('hasPrioritySupport', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">White label</span>
                  <Switch
                    checked={form.watch('hasWhiteLabel')}
                    onCheckedChange={(checked) => form.setValue('hasWhiteLabel', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">Acces API</span>
                  <Switch
                    checked={form.watch('hasApiAccess')}
                    onCheckedChange={(checked) => form.setValue('hasApiAccess', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">Actif</span>
                <Switch
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">Populaire</span>
                <Switch
                  checked={form.watch('isPopular')}
                  onCheckedChange={(checked) => form.setValue('isPopular', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordre</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  {...form.register('sortOrder', { valueAsNumber: true })}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1 h-11 rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : isEditing ? (
                'Mettre a jour'
              ) : (
                'Creer le plan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
