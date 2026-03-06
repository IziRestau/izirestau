'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Play,
  Loader2,
  Users,
  Clock,
  Heart,
  ShoppingBag,
  FolderTree,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/shared/ConfirmModal'

interface TagRuleCondition {
  field: string
  operator: string
  value: unknown
}

interface TagRuleConditions {
  operator: 'AND' | 'OR'
  conditions: TagRuleCondition[]
}

interface TagRule {
  id: string
  name: string
  tag: string
  description: string | null
  conditions: TagRuleConditions
  triggerOnOrder: boolean
  isActive: boolean
  customersMatched: number
  lastEvaluatedAt: string | null
  createdAt: string
}

interface TagRulesSettingsProps {
  primaryColor: string
}

const CONDITION_FIELDS = [
  { value: 'loyaltyPoints', label: 'Points de fidélité', icon: Heart },
  { value: 'totalOrders', label: 'Nombre de commandes', icon: ShoppingBag },
  { value: 'totalSpent', label: 'Total dépensé (€)', icon: ShoppingBag },
  { value: 'lastOrderAt', label: 'Dernière commande', icon: Clock },
  { value: 'createdAt', label: "Date d'inscription", icon: UserPlus },
  { value: 'purchasedCategories', label: 'Catégories achetées', icon: FolderTree },
]

const OPERATORS_BY_FIELD: Record<string, Array<{ value: string; label: string }>> = {
  loyaltyPoints: [
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' },
    { value: 'eq', label: '=' },
  ],
  totalOrders: [
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' },
    { value: 'eq', label: '=' },
  ],
  totalSpent: [
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' },
  ],
  lastOrderAt: [
    { value: 'within', label: 'Dans les derniers' },
    { value: 'olderThan', label: 'Plus ancien que' },
  ],
  createdAt: [
    { value: 'within', label: 'Dans les derniers' },
  ],
  purchasedCategories: [
    { value: 'includes', label: 'A acheté dans' },
  ],
}

export function TagRulesSettings({ primaryColor }: TagRulesSettingsProps) {
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const queryClient = useQueryClient()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<TagRule | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<TagRule | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formTag, setFormTag] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTriggerOnOrder, setFormTriggerOnOrder] = useState(true)
  const [formConditions, setFormConditions] = useState<TagRuleCondition[]>([
    { field: 'totalOrders', operator: 'gte', value: 3 },
  ])
  const [formOperator, setFormOperator] = useState<'AND' | 'OR'>('AND')

  // Fetch rules
  const { data: rules, isLoading } = useQuery({
    queryKey: ['tag-rules', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.tagRules.list()
      return res.data as TagRule[]
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.categories.list()
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId && isFormOpen,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; tag: string; description?: string; conditions: TagRuleConditions; triggerOnOrder: boolean }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.tagRules.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-rules'] })
      toast.success('Règle créée')
      closeForm()
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; tag?: string; description?: string; conditions?: TagRuleConditions; triggerOnOrder?: boolean; isActive?: boolean } }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.tagRules.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-rules'] })
      toast.success('Règle mise à jour')
      closeForm()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.tagRules.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-rules'] })
      toast.success('Règle supprimée')
      setDeleteConfirm(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  // Evaluate mutation
  const evaluateMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.marketing.tagRules.evaluate(id)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tag-rules'] })
      toast.success(`${res.data?.matched ?? 0} clients correspondent à cette règle`)
    },
    onError: () => {
      toast.error("Erreur lors de l'évaluation")
    },
  })

  const openCreateForm = () => {
    setEditingRule(null)
    setFormName('')
    setFormTag('')
    setFormDescription('')
    setFormTriggerOnOrder(true)
    setFormConditions([{ field: 'totalOrders', operator: 'gte', value: 3 }])
    setFormOperator('AND')
    setIsFormOpen(true)
  }

  const openEditForm = (rule: TagRule) => {
    setEditingRule(rule)
    setFormName(rule.name)
    setFormTag(rule.tag)
    setFormDescription(rule.description || '')
    setFormTriggerOnOrder(rule.triggerOnOrder)
    setFormConditions(rule.conditions.conditions)
    setFormOperator(rule.conditions.operator)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingRule(null)
  }

  const handleSubmit = () => {
    if (!formName.trim() || !formTag.trim()) {
      toast.error('Veuillez remplir le nom et le tag')
      return
    }

    const conditions: TagRuleConditions = {
      operator: formOperator,
      conditions: formConditions,
    }

    if (editingRule) {
      updateMutation.mutate({
        id: editingRule.id,
        data: {
          name: formName,
          tag: formTag,
          description: formDescription || undefined,
          conditions,
          triggerOnOrder: formTriggerOnOrder,
        },
      })
    } else {
      createMutation.mutate({
        name: formName,
        tag: formTag,
        description: formDescription || undefined,
        conditions,
        triggerOnOrder: formTriggerOnOrder,
      })
    }
  }

  const addCondition = () => {
    setFormConditions([...formConditions, { field: 'totalOrders', operator: 'gte', value: 1 }])
  }

  const removeCondition = (index: number) => {
    if (formConditions.length > 1) {
      setFormConditions(formConditions.filter((_, i) => i !== index))
    }
  }

  const updateCondition = (index: number, updates: Partial<TagRuleCondition>) => {
    setFormConditions(formConditions.map((c, i) => {
      if (i !== index) return c
      const updated = { ...c, ...updates }
      // Reset operator and value when field changes
      if (updates.field && updates.field !== c.field) {
        const operators = OPERATORS_BY_FIELD[updates.field] || []
        updated.operator = operators[0]?.value || 'gte'
        updated.value = updates.field.includes('At') ? '30d' : 0
      }
      return updated
    }))
  }

  const toggleRuleActive = (rule: TagRule) => {
    updateMutation.mutate({
      id: rule.id,
      data: { isActive: !rule.isActive },
    })
  }

  const getFieldType = (field: string): 'number' | 'date' | 'category' => {
    if (field.includes('At')) return 'date'
    if (field === 'purchasedCategories') return 'category'
    return 'number'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Règles de tags</h3>
          <p className="text-sm text-gray-500">
            Attribuez automatiquement des tags à vos clients selon leurs comportements
          </p>
        </div>
        <Button
          onClick={openCreateForm}
          className="h-10 px-4 rounded-xl text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus size={18} className="mr-2" />
          Nouvelle règle
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : rules && rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Tag className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{rule.name}</span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      {rule.tag}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {rule.customersMatched} clients
                    </span>
                    {rule.triggerOnOrder && (
                      <span>Auto à chaque commande</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => evaluateMutation.mutate(rule.id)}
                  disabled={evaluateMutation.isPending}
                  className="h-9 px-3 rounded-lg"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {evaluateMutation.isPending ? (
                    <Loader2 size={14} className="mr-1 animate-spin" />
                  ) : (
                    <Play size={14} className="mr-1" />
                  )}
                  Évaluer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditForm(rule)}
                  className="h-9 px-3 rounded-lg"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <Edit size={14} className="mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirm(rule)}
                  className="h-9 px-3 rounded-lg"
                >
                  <Trash2 size={14} />
                </Button>
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={() => toggleRuleActive(rule)}
                  accentColor={primaryColor}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h4 className="font-medium text-gray-900 mb-2">Aucune règle de tags</h4>
          <p className="text-sm text-gray-500 mb-4">
            Créez des règles pour attribuer automatiquement des tags
          </p>
          <Button
            onClick={openCreateForm}
            className="h-10 px-4 rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={18} className="mr-2" />
            Créer une règle
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Modifier la règle' : 'Nouvelle règle de tag'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la règle *</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Client fidèle"
                  className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag">Tag à attribuer *</Label>
                <Input
                  id="tag"
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value)}
                  placeholder="Ex: vip"
                  className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description de la règle"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                {formConditions.length > 1 && (
                  <Select value={formOperator} onValueChange={(v) => setFormOperator(v as 'AND' | 'OR')}>
                    <SelectTrigger 
                      className="w-24 h-8 text-xs rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent accentColor={primaryColor}>
                      <SelectItem value="AND">ET</SelectItem>
                      <SelectItem value="OR">OU</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {formConditions.map((condition, index) => {
                const fieldType = getFieldType(condition.field)
                const operators = OPERATORS_BY_FIELD[condition.field] || []

                return (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <Select
                      value={condition.field}
                      onValueChange={(v) => updateCondition(index, { field: v })}
                    >
                      <SelectTrigger 
                        className="w-40 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent accentColor={primaryColor}>
                        {CONDITION_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(v) => updateCondition(index, { operator: v })}
                    >
                      <SelectTrigger 
                        className="w-32 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent accentColor={primaryColor}>
                        {operators.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {fieldType === 'number' && (
                      <Input
                        type="number"
                        value={condition.value as number}
                        onChange={(e) => updateCondition(index, { value: Number(e.target.value) })}
                        className="w-20 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      />
                    )}

                    {fieldType === 'date' && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={parseInt(String(condition.value).replace(/\D/g, '')) || 30}
                          onChange={(e) => updateCondition(index, { value: `${e.target.value}d` })}
                          className="w-16 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                        />
                        <span className="text-sm text-gray-500">jours</span>
                      </div>
                    )}

                    {fieldType === 'category' && (
                      <Select
                        value={Array.isArray(condition.value) ? String(condition.value[0]) : ''}
                        onValueChange={(v) => updateCondition(index, { value: [v] })}
                      >
                        <SelectTrigger 
                          className="w-32 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                        >
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent accentColor={primaryColor}>
                          {categories?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {formConditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(index)}
                        className="h-9 w-9 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                )
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                className="w-full h-9 rounded-xl border-dashed"
                style={{ borderColor: primaryColor, color: primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <Plus size={14} className="mr-1" />
                Ajouter une condition
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Évaluer automatiquement</p>
                <p className="text-xs text-gray-500">Appliquer après chaque commande</p>
              </div>
              <Switch
                checked={formTriggerOnOrder}
                onCheckedChange={setFormTriggerOnOrder}
                accentColor={primaryColor}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={closeForm}
                className="flex-1 h-10 rounded-xl transition-colors"
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
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 h-10 rounded-xl text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                )}
                {editingRule ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Supprimer la règle"
        message={`Êtes-vous sûr de vouloir supprimer la règle "${deleteConfirm?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
