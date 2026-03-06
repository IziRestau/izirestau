'use client'

import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Leaf } from 'lucide-react'
import { ALLERGENS, ALLERGEN_LABELS, DIETARY_TAGS, DIETARY_TAG_LABELS } from '@/types/menu'
import type { ProductFormData } from './ProductForm'

interface NutritionSectionProps {
  register: UseFormRegister<ProductFormData>
  errors: FieldErrors<ProductFormData>
  watch: UseFormWatch<ProductFormData>
  setValue: UseFormSetValue<ProductFormData>
  primaryColor: string
}

export function NutritionSection({
  register,
  errors,
  watch,
  setValue,
  primaryColor,
}: NutritionSectionProps) {
  const allergens = watch('allergens') || []
  const dietaryTags = watch('dietaryTags') || []

  const toggleAllergen = (allergen: string) => {
    if (allergens.includes(allergen)) {
      setValue('allergens', allergens.filter(a => a !== allergen))
    } else {
      setValue('allergens', [...allergens, allergen])
    }
  }

  const toggleDietaryTag = (tag: string) => {
    if (dietaryTags.includes(tag)) {
      setValue('dietaryTags', dietaryTags.filter(t => t !== tag))
    } else {
      setValue('dietaryTags', [...dietaryTags, tag])
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Leaf size={20} style={{ color: primaryColor }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Informations nutritionnelles</h2>
          <p className="text-sm text-gray-500">Calories, allergenes et regimes alimentaires</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="max-w-xs">
          <Label htmlFor="calories">Calories (kcal)</Label>
          <Input
            id="calories"
            type="number"
            min="0"
            {...register('calories', { valueAsNumber: true })}
            placeholder="Ex: 450"
            className="mt-1.5 h-10 rounded-xl"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        <div>
          <Label className="mb-3 block">Allergenes</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {ALLERGENS.map((allergen) => (
              <label
                key={allergen}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <Checkbox
                  checked={allergens.includes(allergen)}
                  onCheckedChange={() => toggleAllergen(allergen)}
                  style={{ '--checkbox-checked-bg': primaryColor, borderColor: primaryColor } as React.CSSProperties}
                  className="data-[state=checked]:bg-[--checkbox-checked-bg] data-[state=checked]:border-[--checkbox-checked-bg]"
                />
                <span className="text-sm text-gray-700">{ALLERGEN_LABELS[allergen]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Tags dietetiques</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {DIETARY_TAGS.map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <Checkbox
                  checked={dietaryTags.includes(tag)}
                  onCheckedChange={() => toggleDietaryTag(tag)}
                  style={{ '--checkbox-checked-bg': primaryColor, borderColor: primaryColor } as React.CSSProperties}
                  className="data-[state=checked]:bg-[--checkbox-checked-bg] data-[state=checked]:border-[--checkbox-checked-bg]"
                />
                <span className="text-sm text-gray-700">{DIETARY_TAG_LABELS[tag]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
