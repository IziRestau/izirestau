'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UtensilsCrossed, Loader2, Info, Package, Settings2, ChefHat } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-media-query'
import { ALLERGENS, ALLERGEN_LABELS, DIETARY_TAGS, DIETARY_TAG_LABELS } from '@/types/menu'
import type { Category, ProductListItem, ModifierGroup } from '@/types/menu'
import type { Recipe } from '@/types/inventory'

const productSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  nameEn: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  descriptionEn: z.string().max(2000).optional(),
  price: z.number().min(0, 'Prix invalide'),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  categoryId: z.string().min(1, 'Categorie requise'),
  image: z.string().url().optional().or(z.literal('')),
  trackInventory: z.boolean().default(false),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockAlert: z.number().int().min(0).optional().nullable(),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  calories: z.number().int().min(0).optional().nullable(),
  allergens: z.array(z.string()).default([]),
  dietaryTags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  prepTime: z.number().int().min(0).optional().nullable(),
  modifierGroupIds: z.array(z.string()).default([]),
  recipeId: z.string().optional().nullable(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  product: ProductListItem | null
  categories: Category[]
  modifierGroups: ModifierGroup[]
  recipes?: Recipe[]
  formatPrice: (value: number) => string
  primaryColor: string
}

export function ProductFormModal({
  isOpen,
  onClose,
  product,
  categories,
  modifierGroups,
  recipes = [],
  formatPrice,
  primaryColor,
}: ProductFormModalProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const isEditing = !!product
  const [activeTab, setActiveTab] = useState('general')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      price: 0,
      compareAtPrice: null,
      costPrice: null,
      categoryId: '',
      image: '',
      trackInventory: false,
      stockQuantity: 0,
      lowStockAlert: null,
      sku: '',
      barcode: '',
      calories: null,
      allergens: [],
      dietaryTags: [],
      isActive: true,
      isVisible: true,
      isFeatured: false,
      prepTime: null,
      modifierGroupIds: [],
      recipeId: null,
    },
  })

  const categoryId = watch('categoryId')
  const isActive = watch('isActive')
  const isVisible = watch('isVisible')
  const isFeatured = watch('isFeatured')
  const trackInventory = watch('trackInventory')
  const allergens = watch('allergens')
  const dietaryTags = watch('dietaryTags')
  const modifierGroupIds = watch('modifierGroupIds')

  useEffect(() => {
    if (isOpen) {
      setActiveTab('general')
      if (product) {
        reset({
          name: product.name,
          nameEn: product.nameEn || '',
          description: product.description || '',
          descriptionEn: '',
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          costPrice: null,
          categoryId: product.categoryId,
          image: product.image || '',
          trackInventory: product.trackInventory,
          stockQuantity: product.stockQuantity,
          lowStockAlert: null,
          sku: '',
          barcode: '',
          calories: null,
          allergens: [],
          dietaryTags: [],
          isActive: product.isActive,
          isVisible: product.isVisible,
          isFeatured: product.isFeatured,
          prepTime: null,
          modifierGroupIds: [],
          recipeId: (product as any).recipeId || null,
        })
      } else {
        reset({
          name: '',
          nameEn: '',
          description: '',
          descriptionEn: '',
          price: 0,
          compareAtPrice: null,
          costPrice: null,
          categoryId: categories[0]?.id || '',
          image: '',
          trackInventory: false,
          stockQuantity: 0,
          lowStockAlert: null,
          sku: '',
          barcode: '',
          calories: null,
          allergens: [],
          dietaryTags: [],
          isActive: true,
          isVisible: true,
          isFeatured: false,
          prepTime: null,
          modifierGroupIds: [],
          recipeId: null,
        })
      }
    }
  }, [isOpen, product, categories, reset])

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.products.create({
        name: data.name,
        nameEn: data.nameEn || undefined,
        description: data.description || undefined,
        descriptionEn: data.descriptionEn || undefined,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        categoryId: data.categoryId,
        image: data.image || null,
        trackInventory: data.trackInventory,
        stockQuantity: data.stockQuantity,
        lowStockAlert: data.lowStockAlert,
        sku: data.sku || null,
        barcode: data.barcode || null,
        calories: data.calories,
        allergens: data.allergens,
        dietaryTags: data.dietaryTags,
        isActive: data.isActive,
        isVisible: data.isVisible,
        isFeatured: data.isFeatured,
        prepTime: data.prepTime,
        modifierGroupIds: data.modifierGroupIds,
        recipeId: data.recipeId || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-products'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-categories'] })
      toast.success('Produit créé')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la creation')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.products.update(product!.id, {
        name: data.name,
        nameEn: data.nameEn || undefined,
        description: data.description || undefined,
        descriptionEn: data.descriptionEn || undefined,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        categoryId: data.categoryId,
        image: data.image || null,
        trackInventory: data.trackInventory,
        stockQuantity: data.stockQuantity,
        lowStockAlert: data.lowStockAlert,
        sku: data.sku || null,
        barcode: data.barcode || null,
        calories: data.calories,
        allergens: data.allergens,
        dietaryTags: data.dietaryTags,
        isActive: data.isActive,
        isVisible: data.isVisible,
        isFeatured: data.isFeatured,
        prepTime: data.prepTime,
        modifierGroupIds: data.modifierGroupIds,
        recipeId: data.recipeId || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-products'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-categories'] })
      toast.success('Produit modifié')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la modification')
    },
  })

  const onSubmit = (data: ProductFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  const toggleAllergen = (allergen: string) => {
    const current = allergens || []
    if (current.includes(allergen)) {
      setValue('allergens', current.filter(a => a !== allergen))
    } else {
      setValue('allergens', [...current, allergen])
    }
  }

  const toggleDietaryTag = (tag: string) => {
    const current = dietaryTags || []
    if (current.includes(tag)) {
      setValue('dietaryTags', current.filter(t => t !== tag))
    } else {
      setValue('dietaryTags', [...current, tag])
    }
  }

  const toggleModifierGroup = (groupId: string) => {
    const current = modifierGroupIds || []
    if (current.includes(groupId)) {
      setValue('modifierGroupIds', current.filter(id => id !== groupId))
    } else {
      setValue('modifierGroupIds', [...current, groupId])
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 border-b border-gray-100">
          <TabsList className="bg-transparent h-auto p-0 gap-4">
            <TabsTrigger
              value="general"
              className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              style={{ color: activeTab === 'general' ? primaryColor : undefined }}
            >
              <Info size={16} className="mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              style={{ color: activeTab === 'inventory' ? primaryColor : undefined }}
            >
              <Package size={16} className="mr-2" />
              Stock
            </TabsTrigger>
            <TabsTrigger
              value="options"
              className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              style={{ color: activeTab === 'options' ? primaryColor : undefined }}
            >
              <Settings2 size={16} className="mr-2" />
              Options
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="general" className="mt-0 space-y-4">
              <div>
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Ex: Pizza Margherita"
                  className={`mt-1.5 h-10 rounded-xl ${errors.name ? 'border-red-300' : ''}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Description du produit..."
                  className="mt-1.5 rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price">Prix *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { valueAsNumber: true })}
                    className={`mt-1.5 h-10 rounded-xl ${errors.price ? 'border-red-300' : ''}`}
                  />
                  {errors.price && (
                    <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="compareAtPrice">Prix barre</Label>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('compareAtPrice', { valueAsNumber: true })}
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label>Categorie *</Label>
                <Select
                  value={categoryId}
                  onValueChange={(value) => setValue('categoryId', value)}
                >
                  <SelectTrigger className={`mt-1.5 h-10 rounded-xl ${errors.categoryId ? 'border-red-300' : ''}`}>
                    <SelectValue placeholder="Selectionnez une categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="image">URL de l'image</Label>
                <Input
                  id="image"
                  {...register('image')}
                  placeholder="https://..."
                  className="mt-1.5 h-10 rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Actif</p>
                    <p className="text-xs text-gray-500">Disponible a la commande</p>
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
                    <p className="text-xs text-gray-500">Affiche sur le menu</p>
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
                    <p className="text-sm font-medium text-gray-900">Produit vedette</p>
                    <p className="text-xs text-gray-500">Mis en avant sur le menu</p>
                  </div>
                  <Switch
                    checked={isFeatured}
                    onCheckedChange={(checked) => setValue('isFeatured', checked)}
                    style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
                    className="data-[state=checked]:bg-[--switch-checked-bg]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="mt-0 space-y-4">
              {/* Liaison avec une recette */}
              <div>
                <Label className="flex items-center gap-2">
                  <ChefHat size={16} style={{ color: primaryColor }} />
                  Recette associée
                </Label>
                <Select
                  value={watch('recipeId') || ''}
                  onValueChange={(value) => setValue('recipeId', value === 'none' ? null : value)}
                >
                  <SelectTrigger className="mt-1.5 h-10 rounded-xl">
                    <SelectValue placeholder="Aucune recette" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune recette</SelectItem>
                    {recipes.map(recipe => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                        {recipe.costPerUnit && (
                          <span className="text-gray-500 ml-2">
                            (coût: {Number(recipe.costPerUnit).toLocaleString('fr-FR')} FCFA)
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

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">Gérer le stock</p>
                  <p className="text-xs text-gray-500">Suivre les quantités disponibles</p>
                </div>
                <Switch
                  checked={trackInventory}
                  onCheckedChange={(checked) => setValue('trackInventory', checked)}
                  style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
                  className="data-[state=checked]:bg-[--switch-checked-bg]"
                />
              </div>

              {trackInventory && (
                <>
                  <div>
                    <Label htmlFor="stockQuantity">Quantite en stock</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      {...register('stockQuantity', { valueAsNumber: true })}
                      className="mt-1.5 h-10 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lowStockAlert">Alerte stock bas</Label>
                    <Input
                      id="lowStockAlert"
                      type="number"
                      min="0"
                      {...register('lowStockAlert', { valueAsNumber: true })}
                      placeholder="Ex: 5"
                      className="mt-1.5 h-10 rounded-xl"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    {...register('sku')}
                    placeholder="Ex: PIZZA-001"
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="barcode">Code-barres</Label>
                  <Input
                    id="barcode"
                    {...register('barcode')}
                    placeholder="Ex: 1234567890"
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label>Allergenes</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ALLERGENS.map(allergen => (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => toggleAllergen(allergen)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        allergens?.includes(allergen)
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: allergens?.includes(allergen) ? primaryColor : undefined,
                      }}
                    >
                      {ALLERGEN_LABELS[allergen]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Regimes alimentaires</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIETARY_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietaryTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        dietaryTags?.includes(tag)
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: dietaryTags?.includes(tag) ? primaryColor : undefined,
                      }}
                    >
                      {DIETARY_TAG_LABELS[tag]}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="options" className="mt-0 space-y-4">
              <div>
                <Label>Groupes d'options</Label>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  Selectionnez les groupes d'options disponibles pour ce produit
                </p>

                {modifierGroups.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <Settings2 size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Aucun groupe d'options disponible</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {modifierGroups.map(group => (
                      <div
                        key={group.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          modifierGroupIds?.includes(group.id)
                            ? 'border-current bg-opacity-5'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                        style={{
                          borderColor: modifierGroupIds?.includes(group.id) ? primaryColor : undefined,
                          backgroundColor: modifierGroupIds?.includes(group.id) ? `${primaryColor}08` : undefined,
                        }}
                        onClick={() => toggleModifierGroup(group.id)}
                      >
                        <Checkbox
                          checked={modifierGroupIds?.includes(group.id)}
                          className="pointer-events-none"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{group.name}</p>
                          <p className="text-xs text-gray-500">
                            {group.modifiers.length} option{group.modifiers.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="prepTime">Temps de preparation (min)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  min="0"
                  {...register('prepTime', { valueAsNumber: true })}
                  placeholder="Ex: 15"
                  className="mt-1.5 h-10 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  min="0"
                  {...register('calories', { valueAsNumber: true })}
                  placeholder="Ex: 450"
                  className="mt-1.5 h-10 rounded-xl"
                />
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

      <div className="flex gap-2 p-4 border-t border-gray-100">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="flex-1 h-10 rounded-xl"
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isLoading || (!isDirty && isEditing)}
          className="flex-1 h-10 rounded-xl text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isEditing ? (
            'Enregistrer'
          ) : (
            'Creer'
          )}
        </Button>
      </div>
    </form>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <UtensilsCrossed size={18} style={{ color: primaryColor }} />
              </div>
              <span>{isEditing ? 'Modifier le produit' : 'Nouveau produit'}</span>
            </DrawerTitle>
            <DrawerDescription>
              {isEditing ? 'Modifiez les informations du produit' : 'Ajoutez un nouveau produit a votre menu'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <UtensilsCrossed size={18} style={{ color: primaryColor }} />
            </div>
            <span>{isEditing ? 'Modifier le produit' : 'Nouveau produit'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifiez les informations du produit' : 'Ajoutez un nouveau produit a votre menu'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  )
}
