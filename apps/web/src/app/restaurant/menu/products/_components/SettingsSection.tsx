'use client'

import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings } from 'lucide-react'
import type { ProductFormData } from './ProductForm'

interface SettingsSectionProps {
  register: UseFormRegister<ProductFormData>
  watch: UseFormWatch<ProductFormData>
  setValue: UseFormSetValue<ProductFormData>
  primaryColor: string
}

export function SettingsSection({
  register,
  watch,
  setValue,
  primaryColor,
}: SettingsSectionProps) {
  const isActive = watch('isActive')
  const isVisible = watch('isVisible')
  const isFeatured = watch('isFeatured')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Settings size={20} style={{ color: primaryColor }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Parametres</h2>
          <p className="text-sm text-gray-500">Visibilite et options avancees</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Actif</p>
            <p className="text-xs text-gray-500">Le produit est disponible a la vente</p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => setValue('isActive', checked)}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Visible</p>
            <p className="text-xs text-gray-500">Affiche sur le menu public</p>
          </div>
          <Switch
            checked={isVisible}
            onCheckedChange={(checked) => setValue('isVisible', checked)}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Mis en avant</p>
            <p className="text-xs text-gray-500">Affiche dans les produits vedettes</p>
          </div>
          <Switch
            checked={isFeatured}
            onCheckedChange={(checked) => setValue('isFeatured', checked)}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        <div className="pt-4 border-t border-gray-100">
          <Label htmlFor="prepTime">Temps de preparation (minutes)</Label>
          <Input
            id="prepTime"
            type="number"
            min="0"
            {...register('prepTime', { valueAsNumber: true })}
            placeholder="Ex: 15"
            className="mt-1.5 h-10 rounded-xl max-w-xs"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
          <p className="text-xs text-gray-500 mt-1">Temps estime pour preparer ce produit</p>
        </div>
      </div>
    </div>
  )
}
