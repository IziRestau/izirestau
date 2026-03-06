'use client'

import { UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Settings2 } from 'lucide-react'
import { MODIFIER_TYPE_LABELS } from '@/types/menu'
import type { ProductFormData } from './ProductForm'
import type { ModifierGroup } from '@/types/menu'

interface ModifiersSectionProps {
  watch: UseFormWatch<ProductFormData>
  setValue: UseFormSetValue<ProductFormData>
  modifierGroups: ModifierGroup[]
  primaryColor: string
}

export function ModifiersSection({
  watch,
  setValue,
  modifierGroups,
  primaryColor,
}: ModifiersSectionProps) {
  const selectedIds = watch('modifierGroupIds') || []

  const toggleModifierGroup = (groupId: string) => {
    if (selectedIds.includes(groupId)) {
      setValue('modifierGroupIds', selectedIds.filter(id => id !== groupId))
    } else {
      setValue('modifierGroupIds', [...selectedIds, groupId])
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Settings2 size={20} style={{ color: primaryColor }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Options et supplements</h2>
          <p className="text-sm text-gray-500">Groupes de modificateurs associes au produit</p>
        </div>
      </div>

      {modifierGroups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Settings2 size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Aucun groupe d'options disponible</p>
          <p className="text-xs text-gray-400 mt-1">
            Creez des groupes depuis l'onglet Options du menu
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {modifierGroups.map((group) => {
            const isSelected = selectedIds.includes(group.id)

            return (
              <label
                key={group.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-2 bg-gray-50'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
                style={isSelected ? { borderColor: primaryColor } : undefined}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleModifierGroup(group.id)}
                  className="mt-0.5 data-[state=checked]:bg-[--checkbox-checked-bg] data-[state=checked]:border-[--checkbox-checked-bg]"
                  style={{ '--checkbox-checked-bg': primaryColor, borderColor: primaryColor } as React.CSSProperties}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{group.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {MODIFIER_TYPE_LABELS[group.type]}
                    </Badge>
                    {group.isRequired && (
                      <Badge className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Obligatoire
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {group.modifiers.length} option{group.modifiers.length > 1 ? 's' : ''}
                    {group.modifiers.length > 0 && (
                      <span className="text-gray-400">
                        {' '}
                        ({group.modifiers.slice(0, 3).map(m => m.name).join(', ')}
                        {group.modifiers.length > 3 && '...'})
                      </span>
                    )}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      )}

      {selectedIds.length > 0 && (
        <p className="text-sm text-gray-500 mt-4">
          {selectedIds.length} groupe{selectedIds.length > 1 ? 's' : ''} selectionne{selectedIds.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
