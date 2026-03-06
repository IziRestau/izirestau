'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Package } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api, apiClient } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-media-query'
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
import { Switch } from '@/components/ui/switch'
import { 
  INGREDIENT_UNIT_LABELS,
  type Ingredient,
  type IngredientUnit,
} from '@/types/inventory'

const ingredientSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  sku: z.string().optional(),
  category: z.string().optional(),
  unit: z.enum(['UNIT', 'GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'PORTION']),
  unitCost: z.coerce.number().min(0, 'Le coût doit être positif'),
  currentStock: z.coerce.number().min(0, 'Le stock doit être positif'),
  minStock: z.coerce.number().min(0).optional().nullable(),
  reorderPoint: z.coerce.number().min(0).optional().nullable(),
  supplierId: z.string().optional().nullable(),
  isTracked: z.boolean(),
  expirationDays: z.coerce.number().min(0).optional().nullable(),
})

type IngredientFormData = z.infer<typeof ingredientSchema>

interface IngredientFormModalProps {
  isOpen: boolean
  onClose: () => void
  ingredient: Ingredient | null
  primaryColor?: string
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function IngredientFormModal({
  isOpen,
  onClose,
  ingredient,
  primaryColor = '#10b981',
}: IngredientFormModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const isMobile = useIsMobile()

  const isEditing = !!ingredient
  const primaryBgLight = hexToRgba(primaryColor, 0.1)

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.suppliers.list({ 
        isActive: true, 
        limit: 100,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    enabled: !!accessToken && !!currentRestaurantId && isOpen,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['ingredient-categories', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.ingredients.getCategories(currentRestaurantId || undefined)
    },
    enabled: !!accessToken && !!currentRestaurantId && isOpen,
  })

  const suppliers = suppliersData?.data?.items || []
  const categories: string[] = categoriesData?.data || []

  const form = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      unit: 'UNIT',
      unitCost: 0,
      currentStock: 0,
      minStock: null,
      reorderPoint: null,
      supplierId: null,
      isTracked: true,
      expirationDays: null,
    },
  })

  useEffect(() => {
    if (ingredient) {
      form.reset({
        name: ingredient.name,
        sku: ingredient.sku || '',
        category: ingredient.category || '',
        unit: ingredient.unit,
        unitCost: ingredient.unitCost,
        currentStock: ingredient.currentStock,
        minStock: ingredient.minStock,
        reorderPoint: ingredient.reorderPoint,
        supplierId: ingredient.supplierId,
        isTracked: ingredient.isTracked,
        expirationDays: ingredient.expirationDays,
      })
    } else {
      form.reset({
        name: '',
        sku: '',
        category: '',
        unit: 'UNIT',
        unitCost: 0,
        currentStock: 0,
        minStock: null,
        reorderPoint: null,
        supplierId: null,
        isTracked: true,
        expirationDays: null,
      })
    }
  }, [ingredient, form])

  const createMutation = useMutation({
    mutationFn: async (data: IngredientFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.ingredients.create({
        ...data,
        restaurantId: currentRestaurantId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['ingredient-categories'] })
      toast.success('Ingrédient créé')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: IngredientFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.ingredients.update(ingredient!.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['ingredient-categories'] })
      toast.success('Ingrédient modifié')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la modification')
    },
  })

  const onSubmit = (data: IngredientFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Ex: Tomates"
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* SKU et Catégorie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...form.register('sku')}
                placeholder="Ex: TOM-001"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                {...form.register('category')}
                placeholder="Ex: Légumes"
                list="categories"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Unité et Coût */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select
                value={form.watch('unit')}
                onValueChange={(value) => form.setValue('unit', value as IngredientUnit)}
              >
                <SelectTrigger 
                  className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INGREDIENT_UNIT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitCost">Coût unitaire (FCFA)</Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                {...form.register('unitCost')}
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Stock actuel et Seuil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Stock actuel</Label>
              <Input
                id="currentStock"
                type="number"
                step="0.001"
                {...form.register('currentStock')}
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Seuil d'alerte</Label>
              <Input
                id="reorderPoint"
                type="number"
                step="0.001"
                {...form.register('reorderPoint')}
                placeholder="Stock minimum"
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="supplierId">Fournisseur principal</Label>
            <Select
              value={form.watch('supplierId') || 'none'}
              onValueChange={(value) => form.setValue('supplierId', value === 'none' ? null : value)}
            >
              <SelectTrigger 
                className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              >
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {suppliers.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Suivi du stock</p>
              <p className="text-sm text-gray-500">Activer le suivi automatique du stock</p>
            </div>
            <Switch
              checked={form.watch('isTracked')}
              onCheckedChange={(checked) => form.setValue('isTracked', checked)}
              style={{ 
                backgroundColor: form.watch('isTracked') ? primaryColor : undefined,
              } as React.CSSProperties}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 rounded-xl hover:!bg-gray-100 hover:!text-gray-900"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: primaryColor }}
              className="h-11 rounded-xl text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
  )

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: primaryBgLight }}
                >
                  <Package size={18} style={{ color: primaryColor }} />
                </div>
                <span>{isEditing ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}</span>
              </DrawerTitle>
              <DrawerDescription>
                {isEditing ? 'Modifiez les informations de l\'ingrédient' : 'Ajoutez un nouvel ingrédient'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: primaryBgLight }}
                >
                  <Package size={18} style={{ color: primaryColor }} />
                </div>
                <span>{isEditing ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}</span>
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifiez les informations de l\'ingrédient' : 'Ajoutez un nouvel ingrédient'}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
