'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, ChefHat, Plus, Trash2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
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
  INGREDIENT_UNIT_ABBREVIATIONS,
  type Recipe,
  type Ingredient,
  type IngredientUnit,
} from '@/types/inventory'

const recipeSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  yieldQuantity: z.coerce.number().min(0.01, 'La quantité doit être positive'),
  yieldUnit: z.string().min(1, 'L\'unité est requise'),
  prepTime: z.coerce.number().min(0).optional().nullable(),
  cookTime: z.coerce.number().min(0).optional().nullable(),
  instructions: z.string().optional(),
  isActive: z.boolean(),
})

type RecipeFormData = z.infer<typeof recipeSchema>

interface RecipeIngredientInput {
  ingredientId: string
  quantity: number
  unit: string
}

interface RecipeFormModalProps {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe | null
  primaryColor?: string
}

export function RecipeFormModal({
  isOpen,
  onClose,
  recipe,
  primaryColor = '#10b981',
}: RecipeFormModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const isMobile = useIsMobile()

  const isEditing = !!recipe

  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientInput[]>([])

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients-list', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.ingredients.list({ 
        limit: 200,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    enabled: !!accessToken && !!currentRestaurantId && isOpen,
  })

  const ingredients: Ingredient[] = ingredientsData?.data?.items || []

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: '',
      description: '',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: null,
      cookTime: null,
      instructions: '',
      isActive: true,
    },
  })

  useEffect(() => {
    if (recipe) {
      form.reset({
        name: recipe.name,
        description: recipe.description || '',
        yieldQuantity: recipe.yieldQuantity,
        yieldUnit: recipe.yieldUnit,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        instructions: recipe.instructions || '',
        isActive: recipe.isActive,
      })
      setRecipeIngredients(
        recipe.ingredients?.map((ri: any) => ({
          ingredientId: ri.ingredientId,
          quantity: ri.quantity,
          unit: ri.unit,
        })) || []
      )
    } else {
      form.reset({
        name: '',
        description: '',
        yieldQuantity: 1,
        yieldUnit: 'portion',
        prepTime: null,
        cookTime: null,
        instructions: '',
        isActive: true,
      })
      setRecipeIngredients([])
    }
  }, [recipe, form, isOpen])

  const createMutation = useMutation({
    mutationFn: async (data: RecipeFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.recipes.create({
        ...data,
        ingredients: recipeIngredients,
        restaurantId: currentRestaurantId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipes-stats'] })
      toast.success('Recette créée')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: RecipeFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.recipes.update(recipe!.id, {
        ...data,
        ingredients: recipeIngredients,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipes-stats'] })
      toast.success('Recette modifiée')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la modification')
    },
  })

  const onSubmit = (data: RecipeFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { ingredientId: '', quantity: 0, unit: 'UNIT' }])
  }

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: keyof RecipeIngredientInput, value: string | number) => {
    const updated = [...recipeIngredients]
    updated[index] = { ...updated[index], [field]: value }
    
    if (field === 'ingredientId') {
      const selectedIngredient = ingredients.find(i => i.id === value)
      if (selectedIngredient) {
        updated[index].unit = selectedIngredient.unit
      }
    }
    
    setRecipeIngredients(updated)
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
          placeholder="Ex: Sauce tomate maison"
          className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Description de la recette..."
          className="rounded-xl resize-none border-gray-200 focus:ring-2 focus:ring-offset-0"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          rows={2}
        />
      </div>

      {/* Rendement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="yieldQuantity">Quantité produite *</Label>
          <Input
            id="yieldQuantity"
            type="number"
            step="0.01"
            {...form.register('yieldQuantity')}
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yieldUnit">Unité *</Label>
          <Input
            id="yieldUnit"
            {...form.register('yieldUnit')}
            placeholder="Ex: portion, litre..."
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Temps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prepTime">Temps de préparation (min)</Label>
          <Input
            id="prepTime"
            type="number"
            {...form.register('prepTime')}
            placeholder="0"
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cookTime">Temps de cuisson (min)</Label>
          <Input
            id="cookTime"
            type="number"
            {...form.register('cookTime')}
            placeholder="0"
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Ingrédients */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Ingrédients</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addIngredient}
            className="h-8 rounded-lg text-xs hover:!bg-gray-100 hover:!text-gray-900"
          >
            <Plus size={14} className="mr-1" />
            Ajouter
          </Button>
        </div>
        
        {recipeIngredients.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl">
            Aucun ingrédient ajouté
          </p>
        ) : (
          <div className="space-y-2">
            {recipeIngredients.map((ri, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <Select
                  value={ri.ingredientId}
                  onValueChange={(value) => updateIngredient(index, 'ingredientId', value)}
                >
                  <SelectTrigger className="flex-1 h-9 rounded-lg text-sm">
                    <SelectValue placeholder="Ingrédient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.001"
                  value={ri.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                  placeholder="Qté"
                  className="w-20 h-9 rounded-lg text-sm"
                />
                <span className="text-sm text-gray-500 w-10">
                  {INGREDIENT_UNIT_ABBREVIATIONS[ri.unit as IngredientUnit] || ri.unit}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(index)}
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          {...form.register('instructions')}
          placeholder="Étapes de préparation..."
          className="rounded-xl resize-none border-gray-200 focus:ring-2 focus:ring-offset-0"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          rows={3}
        />
      </div>

      {/* Statut */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="font-medium text-gray-900">Recette active</p>
          <p className="text-sm text-gray-500">Désactiver pour masquer cette recette</p>
        </div>
        <Switch
          checked={form.watch('isActive')}
          onCheckedChange={(checked) => form.setValue('isActive', checked)}
          style={{ 
            backgroundColor: form.watch('isActive') ? primaryColor : undefined,
          } as React.CSSProperties}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="h-11 rounded-xl"
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
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-50">
                  <ChefHat size={18} className="text-violet-500" />
                </div>
                <span>{isEditing ? 'Modifier la recette' : 'Nouvelle recette'}</span>
              </DrawerTitle>
              <DrawerDescription>
                {isEditing ? 'Modifiez les informations de la recette' : 'Créez une nouvelle recette'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl max-h-[90vh]">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-50">
                  <ChefHat size={18} className="text-violet-500" />
                </div>
                <span>{isEditing ? 'Modifier la recette' : 'Nouvelle recette'}</span>
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifiez les informations de la recette' : 'Créez une nouvelle recette'}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
              {formContent}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
