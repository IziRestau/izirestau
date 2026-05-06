'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Info } from 'lucide-react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  priceMonthly: number
  priceYearly: number | null
  currency: string
  features: string[]
  isCustom: boolean
  isActive: boolean
  isArchived: boolean
  isPopular: boolean
  isPublic: boolean
  sortOrder: number
  subscribersCount: number
  createdAt: string
}

interface PlanFormModalProps {
  isOpen: boolean
  onClose: () => void
  plan?: Plan | null
}

const BILLING_CYCLES = [
  { value: 1, label: 'Mensuel' },
  { value: 3, label: 'Trimestriel' },
  { value: 6, label: 'Semestriel' },
  { value: 12, label: 'Annuel' },
  { value: 24, label: 'Biannuel (2 ans)' },
  { value: 36, label: 'Triannuel (3 ans)' },
]

const PLATFORM_FEATURES = [
  'Site web professionnel personnalisable',
  'Système de commandes en ligne',
  'Caisse (POS) intégrée',
  'Gestion du menu et des produits',
  'Gestion des clients',
  'Gestion des commandes',
  'Statistiques et rapports',
  'Gestion de l\'inventaire',
  'Marketing (promotions, coupons, fidélité)',
  'Support technique',
]

export function PlanFormModal({ isOpen, onClose, plan }: PlanFormModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!plan

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'XOF',
    billingCycle: 1,
    billingCycleLabel: '',
    isCustom: false,
    isPopular: false,
    isPublic: true,
  })

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: Number(plan.priceMonthly),
        currency: plan.currency || 'XOF',
        billingCycle: 1,
        billingCycleLabel: '',
        isCustom: plan.isCustom,
        isPopular: plan.isPopular,
        isPublic: plan.isPublic,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        currency: 'XOF',
        billingCycle: 1,
        billingCycleLabel: '',
        isCustom: false,
        isPopular: false,
        isPublic: true,
      })
    }
  }, [plan, isOpen])

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.reseller.createPlan({
      name: data.name,
      description: data.description || undefined,
      price: data.price,
      currency: data.currency,
      billingCycle: data.billingCycle,
      billingCycleLabel: data.billingCycleLabel || undefined,
      isCustom: data.isCustom,
      isPopular: data.isPopular,
      isPublic: data.isPublic,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-plans'] })
      toast.success('Plan créé')
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => api.reseller.updatePlan(plan!.id, {
      name: data.name,
      description: data.description || undefined,
      price: data.price,
      currency: data.currency,
      billingCycle: data.billingCycle,
      billingCycleLabel: data.billingCycleLabel || undefined,
      isCustom: data.isCustom,
      isPopular: data.isPopular,
      isPublic: data.isPublic,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-plans'] })
      toast.success('Plan modifié')
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la modification')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Le nom est requis')
      return
    }
    if (!formData.isCustom && formData.price <= 0) {
      toast.error('Le prix est requis')
      return
    }

    if (isEditing) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const getBillingLabel = () => {
    if (formData.billingCycleLabel) return formData.billingCycleLabel
    const cycle = BILLING_CYCLES.find(c => c.value === formData.billingCycle)
    return cycle?.label || `${formData.billingCycle} mois`
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Modifier le plan' : 'Nouveau plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Name */}
          <div>
            <Label>Nom du plan *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Mensuel, Annuel, Premium"
              className="mt-1.5"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description courte du plan (optionnel)"
              rows={2}
              className="mt-1.5"
            />
          </div>

          {/* Custom Plan Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900">Plan sur devis</p>
              <p className="text-xs text-gray-500">Le client vous contacte pour discuter du prix</p>
            </div>
            <Switch
              checked={formData.isCustom}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCustom: checked }))}
            />
          </div>

          {/* Pricing */}
          {!formData.isCustom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cycle de facturation *</Label>
                  <Select
                    key={`billing-cycle-${formData.billingCycle}`}
                    value={String(formData.billingCycle)}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, billingCycle: parseInt(value, 10) }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_CYCLES.map((cycle) => (
                        <SelectItem key={cycle.value} value={String(cycle.value)}>
                          {cycle.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prix *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      placeholder="0"
                      min="0"
                      className="pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      {formData.currency}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Label personnalisé (optionnel)</Label>
                <Input
                  value={formData.billingCycleLabel}
                  onChange={(e) => setFormData(prev => ({ ...prev, billingCycleLabel: e.target.value }))}
                  placeholder={getBillingLabel()}
                  className="mt-1.5"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Laissez vide pour utiliser le label par défaut
                </p>
              </div>
            </div>
          )}

          {/* Features Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Fonctionnalités incluses</p>
                <p className="text-xs text-blue-700 mt-1 mb-2">
                  Tous les plans incluent les mêmes fonctionnalités. Elles seront affichées automatiquement sur votre vitrine.
                </p>
                <ul className="text-xs text-blue-600 space-y-1">
                  {PLATFORM_FEATURES.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-blue-400 rounded-full" />
                      {feature}
                    </li>
                  ))}
                  <li className="text-blue-500">+ {PLATFORM_FEATURES.length - 5} autres fonctionnalités</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Visible sur la vitrine</p>
                <p className="text-xs text-gray-500">Les prospects peuvent voir ce plan</p>
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Marquer comme populaire</p>
                <p className="text-xs text-gray-500">Affiche un badge "Populaire"</p>
              </div>
              <Switch
                checked={formData.isPopular}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPopular: checked }))}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Créer le plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
