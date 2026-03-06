'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Heart,
  Clock,
  UserPlus,
  Cake,
  Target,
  Plus,
  Trash2,
  Tag,
  ShoppingBag,
  FolderTree,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// Types
export interface TargetingCondition {
  field: string
  operator: string
  value: unknown
}

export interface TargetingGroup {
  operator: 'AND' | 'OR'
  conditions: TargetingCondition[]
}

export interface TargetingRules {
  operator: 'AND' | 'OR'
  groups: TargetingGroup[]
}

interface TargetingBuilderProps {
  value: TargetingRules | null
  onChange: (rules: TargetingRules | null) => void
  primaryColor: string
  restaurantId: string
}

// Segments prédéfinis pour le mode simple
const PRESET_SEGMENTS = [
  { 
    value: 'all', 
    label: 'Tous les clients', 
    description: 'Tous les clients ayant accepté les emails marketing', 
    icon: Users, 
    color: 'bg-blue-100 text-blue-600',
    rules: null,
  },
  { 
    value: 'loyal', 
    label: 'Clients fidèles', 
    description: 'Clients avec des points de fidélité', 
    icon: Heart, 
    color: 'bg-rose-100 text-rose-600',
    rules: {
      operator: 'AND' as const,
      groups: [{
        operator: 'AND' as const,
        conditions: [{ field: 'loyaltyPoints', operator: 'gte', value: 100 }],
      }],
    },
  },
  { 
    value: 'inactive', 
    label: 'Clients inactifs', 
    description: 'Aucune commande depuis 30 jours', 
    icon: Clock, 
    color: 'bg-amber-100 text-amber-600',
    rules: {
      operator: 'AND' as const,
      groups: [{
        operator: 'AND' as const,
        conditions: [{ field: 'lastOrderAt', operator: 'olderThan', value: '30d' }],
      }],
    },
  },
  { 
    value: 'new', 
    label: 'Nouveaux clients', 
    description: 'Inscrits dans les 7 derniers jours', 
    icon: UserPlus, 
    color: 'bg-emerald-100 text-emerald-600',
    rules: {
      operator: 'AND' as const,
      groups: [{
        operator: 'AND' as const,
        conditions: [{ field: 'createdAt', operator: 'within', value: '7d' }],
      }],
    },
  },
  { 
    value: 'birthday', 
    label: 'Anniversaires du mois', 
    description: "Clients dont c'est l'anniversaire ce mois", 
    icon: Cake, 
    color: 'bg-pink-100 text-pink-600',
    rules: null, // Nécessite une logique spéciale
  },
]

// Champs disponibles pour le ciblage avancé
const TARGETING_FIELDS = [
  { value: 'tags', label: 'Tags', icon: Tag, type: 'tags' },
  { value: 'loyaltyPoints', label: 'Points de fidélité', icon: Heart, type: 'number' },
  { value: 'totalOrders', label: 'Nombre de commandes', icon: ShoppingBag, type: 'number' },
  { value: 'totalSpent', label: 'Total dépensé', icon: ShoppingBag, type: 'number' },
  { value: 'lastOrderAt', label: 'Dernière commande', icon: Clock, type: 'date' },
  { value: 'createdAt', label: "Date d'inscription", icon: UserPlus, type: 'date' },
  { value: 'purchasedProducts', label: 'Produits achetés', icon: ShoppingBag, type: 'products' },
  { value: 'purchasedCategories', label: 'Catégories achetées', icon: FolderTree, type: 'categories' },
]

// Opérateurs par type de champ
const OPERATORS_BY_TYPE: Record<string, Array<{ value: string; label: string }>> = {
  number: [
    { value: 'gte', label: 'Supérieur ou égal à' },
    { value: 'lte', label: 'Inférieur ou égal à' },
    { value: 'eq', label: 'Égal à' },
    { value: 'between', label: 'Entre' },
  ],
  date: [
    { value: 'within', label: 'Dans les derniers' },
    { value: 'olderThan', label: 'Plus ancien que' },
  ],
  tags: [
    { value: 'hasAny', label: 'Contient au moins un' },
    { value: 'hasAll', label: 'Contient tous' },
    { value: 'hasNone', label: 'Ne contient aucun' },
  ],
  products: [
    { value: 'includes', label: 'A acheté' },
    { value: 'excludes', label: "N'a pas acheté" },
  ],
  categories: [
    { value: 'includes', label: 'A acheté dans' },
    { value: 'excludes', label: "N'a pas acheté dans" },
  ],
}

export function TargetingBuilder({ value, onChange, primaryColor, restaurantId }: TargetingBuilderProps) {
  const { accessToken } = useAuthStore()
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('all')
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  // Récupérer les tags existants
  const { data: customerStats } = useQuery({
    queryKey: ['customer-stats', restaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.customers.getStats()
      return res.data
    },
    enabled: !!accessToken,
  })

  // Récupérer les catégories
  const { data: categories } = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.categories.list()
      return res.data
    },
    enabled: !!accessToken && isAdvancedMode,
  })

  // Récupérer les produits
  const { data: products } = useQuery({
    queryKey: ['products', restaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.products.list({ limit: 100 })
      return res.data
    },
    enabled: !!accessToken && isAdvancedMode,
  })

  const availableTags = customerStats?.uniqueTags || []

  // Prévisualiser le ciblage
  const previewTargeting = async (rules: TargetingRules | null) => {
    if (!accessToken) return
    setIsLoadingPreview(true)
    try {
      apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.marketing.previewTargeting(rules)
      setPreviewCount(res.data?.count ?? null)
    } catch {
      setPreviewCount(null)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  // Mettre à jour la prévisualisation quand les règles changent
  useEffect(() => {
    const timer = setTimeout(() => {
      previewTargeting(value)
    }, 500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, accessToken])

  // Synchroniser le mode et le preset avec les règles chargées
  useEffect(() => {
    if (value === null) {
      setSelectedPreset('all')
      setIsAdvancedMode(false)
      return
    }

    // Vérifier si les règles correspondent à un preset
    const matchingPreset = PRESET_SEGMENTS.find(preset => {
      if (!preset.rules) return false
      return JSON.stringify(preset.rules) === JSON.stringify(value)
    })

    if (matchingPreset) {
      setSelectedPreset(matchingPreset.value)
      setIsAdvancedMode(false)
    } else {
      // C'est du ciblage avancé personnalisé
      setIsAdvancedMode(true)
    }
  }, [value])

  // Gérer le changement de segment prédéfini
  const handlePresetChange = (presetValue: string) => {
    setSelectedPreset(presetValue)
    const preset = PRESET_SEGMENTS.find(p => p.value === presetValue)
    onChange(preset?.rules || null)
  }

  // Ajouter un groupe de conditions
  const addGroup = () => {
    const newRules: TargetingRules = value || {
      operator: 'AND',
      groups: [],
    }
    onChange({
      ...newRules,
      groups: [
        ...newRules.groups,
        { operator: 'AND', conditions: [{ field: 'loyaltyPoints', operator: 'gte', value: 0 }] },
      ],
    })
  }

  // Supprimer un groupe
  const removeGroup = (groupIndex: number) => {
    if (!value) return
    const newGroups = value.groups.filter((_, i) => i !== groupIndex)
    if (newGroups.length === 0) {
      onChange(null)
    } else {
      onChange({ ...value, groups: newGroups })
    }
  }

  // Ajouter une condition à un groupe
  const addCondition = (groupIndex: number) => {
    if (!value) return
    const newGroups = [...value.groups]
    newGroups[groupIndex] = {
      ...newGroups[groupIndex],
      conditions: [
        ...newGroups[groupIndex].conditions,
        { field: 'loyaltyPoints', operator: 'gte', value: 0 },
      ],
    }
    onChange({ ...value, groups: newGroups })
  }

  // Supprimer une condition
  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    if (!value) return
    const newGroups = [...value.groups]
    newGroups[groupIndex] = {
      ...newGroups[groupIndex],
      conditions: newGroups[groupIndex].conditions.filter((_, i) => i !== conditionIndex),
    }
    // Supprimer le groupe si vide
    if (newGroups[groupIndex].conditions.length === 0) {
      removeGroup(groupIndex)
    } else {
      onChange({ ...value, groups: newGroups })
    }
  }

  // Mettre à jour une condition
  const updateCondition = (groupIndex: number, conditionIndex: number, updates: Partial<TargetingCondition>) => {
    if (!value) return
    const newGroups = [...value.groups]
    newGroups[groupIndex] = {
      ...newGroups[groupIndex],
      conditions: newGroups[groupIndex].conditions.map((c, i) =>
        i === conditionIndex ? { ...c, ...updates } : c
      ),
    }
    onChange({ ...value, groups: newGroups })
  }

  // Mettre à jour l'opérateur d'un groupe
  const updateGroupOperator = (groupIndex: number, operator: 'AND' | 'OR') => {
    if (!value) return
    const newGroups = [...value.groups]
    newGroups[groupIndex] = { ...newGroups[groupIndex], operator }
    onChange({ ...value, groups: newGroups })
  }

  // Mettre à jour l'opérateur global
  const updateGlobalOperator = (operator: 'AND' | 'OR') => {
    if (!value) return
    onChange({ ...value, operator })
  }

  return (
    <div className="space-y-6">
      {/* Toggle Mode Simple/Avancé */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Target className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Ciblage</h3>
            <p className="text-sm text-gray-500">Sélectionnez les destinataires</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="advanced-mode" className="text-sm text-gray-600">
            Mode avancé
          </Label>
          <Switch
            id="advanced-mode"
            checked={isAdvancedMode}
            onCheckedChange={(checked) => {
              setIsAdvancedMode(checked)
              if (!checked) {
                // Revenir au mode simple : réinitialiser à "tous les clients"
                setSelectedPreset('all')
                onChange(null)
              } else {
                // Passer au mode avancé : initialiser avec un groupe vide si pas de règles
                if (!value || value.groups.length === 0) {
                  onChange({
                    operator: 'AND',
                    groups: [{ operator: 'AND', conditions: [{ field: 'loyaltyPoints', operator: 'gte', value: 0 }] }],
                  })
                }
              }
            }}
            accentColor={primaryColor}
          />
        </div>
      </div>

      {/* Mode Simple - Segments prédéfinis */}
      {!isAdvancedMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_SEGMENTS.map((segment) => {
            const Icon = segment.icon
            const isSelected = selectedPreset === segment.value
            return (
              <button
                key={segment.value}
                type="button"
                onClick={() => handlePresetChange(segment.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-current'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : {}}
              >
                <div className={`w-10 h-10 rounded-lg ${segment.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-medium text-gray-900 text-sm">{segment.label}</p>
                <p className="text-xs text-gray-500 mt-1">{segment.description}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Mode Avancé - Query Builder */}
      {isAdvancedMode && (
        <div className="space-y-4">
          {/* Groupes de conditions */}
          {value && value.groups.length > 0 ? (
            <div className="space-y-4">
              {value.groups.map((group, groupIndex) => (
                <div key={groupIndex} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  {/* En-tête du groupe */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Groupe {groupIndex + 1}</span>
                      {group.conditions.length > 1 && (
                        <Select
                          value={group.operator}
                          onValueChange={(v) => updateGroupOperator(groupIndex, v as 'AND' | 'OR')}
                        >
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGroup(groupIndex)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  {/* Conditions du groupe */}
                  <div className="space-y-2">
                    {group.conditions.map((condition, conditionIndex) => (
                      <ConditionRow
                        key={conditionIndex}
                        condition={condition}
                        onChange={(updates) => updateCondition(groupIndex, conditionIndex, updates)}
                        onRemove={() => removeCondition(groupIndex, conditionIndex)}
                        availableTags={availableTags}
                        categories={categories || []}
                        products={products || []}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>

                  {/* Ajouter une condition */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCondition(groupIndex)}
                    className="border-dashed"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <Plus size={16} className="mr-1" />
                    Ajouter une condition
                  </Button>
                </div>
              ))}

              {/* Opérateur entre groupes */}
              {value.groups.length > 1 && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="text-sm text-gray-500">Les groupes sont liés par</span>
                  <Select
                    value={value.operator}
                    onValueChange={(v) => updateGlobalOperator(v as 'AND' | 'OR')}
                  >
                    <SelectTrigger 
                      className="w-24 h-8 text-xs rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">ET</SelectItem>
                      <SelectItem value="OR">OU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Aucune condition définie</p>
              <p className="text-xs text-gray-400 mt-1">Tous les clients seront ciblés</p>
            </div>
          )}

          {/* Ajouter un groupe */}
          <Button
            variant="outline"
            onClick={addGroup}
            className="w-full h-10 rounded-xl border-dashed"
            style={{ borderColor: primaryColor, color: primaryColor }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${primaryColor}15` }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Plus size={16} className="mr-2" />
            Ajouter un groupe de conditions
          </Button>
        </div>
      )}

      {/* Prévisualisation */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">Estimation des destinataires</p>
            <p className="text-xs text-gray-500">Clients ayant accepté les emails marketing</p>
          </div>
        </div>
        <div className="text-right">
          {isLoadingPreview ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : (
            <span className="text-2xl font-bold" style={{ color: primaryColor }}>
              ~{previewCount ?? '?'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant pour une ligne de condition
interface ConditionRowProps {
  condition: TargetingCondition
  onChange: (updates: Partial<TargetingCondition>) => void
  onRemove: () => void
  availableTags: string[]
  categories: Array<{ id: string; name: string }>
  products: Array<{ id: string; name: string }>
  primaryColor: string
}

function ConditionRow({
  condition,
  onChange,
  onRemove,
  availableTags,
  categories,
  products,
  primaryColor,
}: ConditionRowProps) {
  const field = TARGETING_FIELDS.find(f => f.value === condition.field)
  const fieldType = field?.type || 'number'
  const operators = OPERATORS_BY_TYPE[fieldType] || []

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Champ */}
      <Select
        value={condition.field}
        onValueChange={(v) => {
          const newField = TARGETING_FIELDS.find(f => f.value === v)
          const newType = newField?.type || 'number'
          const newOperators = OPERATORS_BY_TYPE[newType] || []
          onChange({
            field: v,
            operator: newOperators[0]?.value || 'gte',
            value: newType === 'tags' || newType === 'products' || newType === 'categories' ? [] : 0,
          })
        }}
      >
        <SelectTrigger 
          className="w-40 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent accentColor={primaryColor}>
          {TARGETING_FIELDS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              <div className="flex items-center gap-2">
                <f.icon size={14} />
                {f.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Opérateur */}
      <Select
        value={condition.operator}
        onValueChange={(v) => onChange({ operator: v })}
      >
        <SelectTrigger 
          className="w-44 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
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

      {/* Valeur */}
      {fieldType === 'number' && (
        <Input
          type="number"
          value={condition.value as number}
          onChange={(e) => onChange({ value: Number(e.target.value) })}
          className="w-24 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
        />
      )}

      {fieldType === 'date' && (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={parseInt(String(condition.value).replace(/\D/g, '')) || 30}
            onChange={(e) => onChange({ value: `${e.target.value}d` })}
            className="w-16 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
          <span className="text-sm text-gray-500">jours</span>
        </div>
      )}

      {fieldType === 'tags' && (
        <Select
          value={Array.isArray(condition.value) && condition.value.length > 0 ? condition.value[0] : ''}
          onValueChange={(v) => onChange({ value: [v] })}
        >
          <SelectTrigger 
            className="w-40 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          >
            <SelectValue placeholder="Sélectionner un tag" />
          </SelectTrigger>
          <SelectContent accentColor={primaryColor}>
            {availableTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                <Badge variant="outline" className="text-xs">{tag}</Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {fieldType === 'products' && (
        <Select
          value={Array.isArray(condition.value) && condition.value.length > 0 ? String(condition.value[0]) : ''}
          onValueChange={(v) => onChange({ value: [v] })}
        >
          <SelectTrigger 
            className="w-48 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          >
            <SelectValue placeholder="Sélectionner un produit" />
          </SelectTrigger>
          <SelectContent accentColor={primaryColor}>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {fieldType === 'categories' && (
        <Select
          value={Array.isArray(condition.value) && condition.value.length > 0 ? String(condition.value[0]) : ''}
          onValueChange={(v) => onChange({ value: [v] })}
        >
          <SelectTrigger 
            className="w-48 h-9 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          >
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent accentColor={primaryColor}>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Supprimer */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-9 w-9 p-0"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}

export default TargetingBuilder
