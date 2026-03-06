'use client'

import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form'
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
import { Package, ChefHat } from 'lucide-react'
import type { ProductFormData } from './ProductForm'

interface Recipe {
  id: string
  name: string
  costPerUnit?: number | null
}

interface InventorySectionProps {
  register: UseFormRegister<ProductFormData>
  errors: FieldErrors<ProductFormData>
  watch: UseFormWatch<ProductFormData>
  setValue: UseFormSetValue<ProductFormData>
  primaryColor: string
  recipes?: Recipe[]
}

export function InventorySection({
  register,
  errors,
  watch,
  setValue,
  primaryColor,
  recipes = [],
}: InventorySectionProps) {
  const trackInventory = watch('trackInventory')
  const recipeId = watch('recipeId')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Package size={20} style={{ color: primaryColor }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Inventaire</h2>
          <p className="text-sm text-gray-500">Gestion du stock et references</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Sélecteur de recette */}
        {recipes.length > 0 && (
          <div>
            <Label className="flex items-center gap-2 mb-1.5">
              <ChefHat size={16} style={{ color: primaryColor }} />
              Recette associée
            </Label>
            <Select
              value={recipeId || ''}
              onValueChange={(value) => setValue('recipeId', value === 'none' ? null : value)}
            >
              <SelectTrigger 
                className="h-10 rounded-xl"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              >
                <SelectValue placeholder="Aucune recette" />
              </SelectTrigger>
              <SelectContent className="rounded-xl" accentColor={primaryColor}>
                <SelectItem value="none" className="rounded-lg">Aucune recette</SelectItem>
                {recipes.map(recipe => (
                  <SelectItem key={recipe.id} value={recipe.id} className="rounded-lg">
                    {recipe.name}
                    {recipe.costPerUnit && (
                      <span className="text-gray-500 ml-2">
                        (coût: {Number(recipe.costPerUnit).toLocaleString('fr-FR')})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Lier ce produit à une recette pour déduire automatiquement le stock lors des ventes
            </p>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Suivre le stock</p>
            <p className="text-xs text-gray-500">Activer la gestion des quantités</p>
          </div>
          <Switch
            checked={trackInventory}
            onCheckedChange={(checked) => setValue('trackInventory', checked)}
            style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
            className="data-[state=checked]:bg-[--switch-checked-bg]"
          />
        </div>

        {trackInventory && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Label htmlFor="stockQuantity">Quantite en stock</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                {...register('stockQuantity', { valueAsNumber: true })}
                placeholder="0"
                className="mt-1.5 h-10 rounded-xl"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div>
              <Label htmlFor="lowStockAlert">Alerte stock bas</Label>
              <Input
                id="lowStockAlert"
                type="number"
                min="0"
                {...register('lowStockAlert', { valueAsNumber: true })}
                placeholder="Seuil d'alerte"
                className="mt-1.5 h-10 rounded-xl"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <p className="text-xs text-gray-500 mt-1">Notification si stock inferieur</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <Label htmlFor="sku">SKU (Reference)</Label>
            <Input
              id="sku"
              {...register('sku')}
              placeholder="REF-001"
              className="mt-1.5 h-10 rounded-xl"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          <div>
            <Label htmlFor="barcode">Code-barres</Label>
            <Input
              id="barcode"
              {...register('barcode')}
              placeholder="1234567890123"
              className="mt-1.5 h-10 rounded-xl"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
