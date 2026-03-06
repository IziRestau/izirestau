'use client'

import { useState } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { CustomerFilters as CustomerFiltersType } from '@/types/customer'

interface CustomerFiltersProps {
  filters: CustomerFiltersType
  onFiltersChange: (filters: CustomerFiltersType) => void
  availableTags: string[]
  primaryColor?: string
}

export function CustomerFilters({
  filters,
  onFiltersChange,
  availableTags,
  primaryColor = '#10b981',
}: CustomerFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search, page: 1 })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? undefined : status as 'active' | 'inactive',
      page: 1,
    })
  }

  const handleTagsChange = (tag: string) => {
    const currentTags = filters.tags?.split(',').filter(Boolean) || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags.join(',') : undefined,
      page: 1,
    })
  }

  const handleAdvancedFilterChange = (key: keyof CustomerFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined, page: 1 })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: undefined,
      status: undefined,
      tags: undefined,
      minOrders: undefined,
      maxOrders: undefined,
      minSpent: undefined,
      maxSpent: undefined,
      lastOrderAfter: undefined,
      lastOrderBefore: undefined,
      createdAfter: undefined,
      createdBefore: undefined,
      marketingOptIn: undefined,
      page: 1,
    })
  }

  const hasActiveFilters = !!(
    filters.status ||
    filters.tags ||
    filters.minOrders ||
    filters.maxOrders ||
    filters.minSpent ||
    filters.maxSpent ||
    filters.lastOrderAfter ||
    filters.lastOrderBefore ||
    filters.createdAfter ||
    filters.createdBefore ||
    filters.marketingOptIn !== undefined
  )

  const selectedTags = filters.tags?.split(',').filter(Boolean) || []

  return (
    <div className="space-y-4 mb-6">
      {/* Barre principale */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ zIndex: 1 }} />
          <Input
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        {/* Statut */}
        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger 
            className="w-full sm:w-[150px] h-11 rounded-xl text-sm focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          >
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent accentColor={primaryColor}>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>

        {/* Tags */}
        {availableTags.length > 0 && (
          <Select
            value={selectedTags.length === 1 ? selectedTags[0] : selectedTags.length > 1 ? 'multiple' : 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                onFiltersChange({ ...filters, tags: undefined, page: 1 })
              } else if (value !== 'multiple') {
                onFiltersChange({ ...filters, tags: value, page: 1 })
              }
            }}
          >
            <SelectTrigger 
              className="w-full sm:w-[150px] h-11 rounded-xl text-sm focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <SelectValue placeholder="Tags">
                {selectedTags.length > 1 ? `${selectedTags.length} tags` : selectedTags.length === 1 ? selectedTags[0] : 'Tous les tags'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="all">Tous les tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filtres avancés */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto h-11 rounded-xl border-gray-200 transition-colors"
              style={hasActiveFilters ? { borderColor: primaryColor, color: primaryColor } : undefined}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${primaryColor}15`
                if (!hasActiveFilters) {
                  e.currentTarget.style.borderColor = primaryColor
                  e.currentTarget.style.color = primaryColor
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ''
                if (!hasActiveFilters) {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.color = ''
                }
              }}
            >
              <Filter size={14} className="mr-2" />
              Filtres
              {hasActiveFilters && (
                <span 
                  className="ml-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  !
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-4 rounded-xl" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Filtres avancés</h4>

              {/* Nombre de commandes */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Nombre de commandes</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minOrders || ''}
                    onChange={(e) => handleAdvancedFilterChange('minOrders', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxOrders || ''}
                    onChange={(e) => handleAdvancedFilterChange('maxOrders', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Montant dépensé */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Montant dépensé (€)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minSpent || ''}
                    onChange={(e) => handleAdvancedFilterChange('minSpent', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxSpent || ''}
                    onChange={(e) => handleAdvancedFilterChange('maxSpent', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Dernière commande */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Dernière commande</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={filters.lastOrderAfter || ''}
                    onChange={(e) => handleAdvancedFilterChange('lastOrderAfter', e.target.value)}
                    className="h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="date"
                    value={filters.lastOrderBefore || ''}
                    onChange={(e) => handleAdvancedFilterChange('lastOrderBefore', e.target.value)}
                    className="h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Date d'inscription */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Date d'inscription</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={filters.createdAfter || ''}
                    onChange={(e) => handleAdvancedFilterChange('createdAfter', e.target.value)}
                    className="h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="date"
                    value={filters.createdBefore || ''}
                    onChange={(e) => handleAdvancedFilterChange('createdBefore', e.target.value)}
                    className="h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Marketing */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Consentement marketing</Label>
                <Select
                  value={filters.marketingOptIn === undefined ? 'all' : filters.marketingOptIn ? 'true' : 'false'}
                  onValueChange={(v) => handleAdvancedFilterChange('marketingOptIn', v === 'all' ? undefined : v === 'true')}
                >
                  <SelectTrigger 
                    className="h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="true">Accepté</SelectItem>
                    <SelectItem value="false">Refusé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="transition-colors"
                  onMouseEnter={(e) => {
                    if (hasActiveFilters) {
                      e.currentTarget.style.backgroundColor = `${primaryColor}15`
                      e.currentTarget.style.color = primaryColor
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ''
                    e.currentTarget.style.color = ''
                  }}
                >
                  Réinitialiser
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsAdvancedOpen(false)}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white"
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Tags sélectionnés */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Tags :</span>
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              {tag}
              <button
                onClick={() => handleTagsChange(tag)}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={() => onFiltersChange({ ...filters, tags: undefined, page: 1 })}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Effacer tout
          </button>
        </div>
      )}
    </div>
  )
}
