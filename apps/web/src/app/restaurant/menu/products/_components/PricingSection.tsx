'use client'

import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DollarSign } from 'lucide-react'
import type { ProductFormData } from './ProductForm'

interface PricingSectionProps {
  register: UseFormRegister<ProductFormData>
  errors: FieldErrors<ProductFormData>
  watch: UseFormWatch<ProductFormData>
  setValue: UseFormSetValue<ProductFormData>
  primaryColor: string
}

export function PricingSection({
  register,
  errors,
  watch,
  setValue,
  primaryColor,
}: PricingSectionProps) {
  const taxIncluded = watch('taxIncluded')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <DollarSign size={20} style={{ color: primaryColor }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tarification</h2>
          <p className="text-sm text-gray-500">Prix de vente et informations fiscales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">Prix de vente *</Label>
          <div className="relative mt-1.5">
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register('price', { valueAsNumber: true })}
              placeholder="0.00"
              className={`h-10 rounded-xl pr-12 ${errors.price ? 'border-red-300' : ''}`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              EUR
            </span>
          </div>
          {errors.price && (
            <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="compareAtPrice">Prix barre</Label>
          <div className="relative mt-1.5">
            <Input
              id="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              {...register('compareAtPrice', { valueAsNumber: true })}
              placeholder="Ancien prix"
              className="h-10 rounded-xl pr-12"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              EUR
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Affiche comme prix barre</p>
        </div>

        <div>
          <Label htmlFor="costPrice">Prix de revient</Label>
          <div className="relative mt-1.5">
            <Input
              id="costPrice"
              type="number"
              step="0.01"
              min="0"
              {...register('costPrice', { valueAsNumber: true })}
              placeholder="Cout"
              className="h-10 rounded-xl pr-12"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              EUR
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Pour calculer la marge</p>
        </div>

        <div>
          <Label htmlFor="taxRate">Taux de taxe</Label>
          <Input
            id="taxRate"
            {...register('taxRate')}
            placeholder="Ex: 20%, TVA 10%"
            className="mt-1.5 h-10 rounded-xl"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mt-6">
            <div>
              <p className="text-sm font-medium text-gray-900">Taxe incluse</p>
              <p className="text-xs text-gray-500">Le prix affiche inclut la taxe</p>
            </div>
            <Switch
              checked={taxIncluded}
              onCheckedChange={(checked) => setValue('taxIncluded', checked)}
              style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
              className="data-[state=checked]:bg-[--switch-checked-bg]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
