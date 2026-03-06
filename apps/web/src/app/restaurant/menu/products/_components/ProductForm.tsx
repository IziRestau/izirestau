'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Trash2, Save } from 'lucide-react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { ProductFormSidebar } from './ProductFormSidebar'
import { UnsavedChangesCard } from './UnsavedChangesCard'
import { GeneralSection } from './GeneralSection'
import { PricingSection } from './PricingSection'
import { InventorySection } from './InventorySection'
import { NutritionSection } from './NutritionSection'
import { VariantsSection } from './VariantsSection'
import { ModifiersSection } from './ModifiersSection'
import { SettingsSection } from './SettingsSection'
import { UnsavedChangesModal } from './UnsavedChangesModal'
import type { Product, Category, ModifierGroup } from '@/types/menu'

const productSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0, 'Prix invalide'),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  categoryId: z.string().min(1, 'Categorie requise'),
  taxRate: z.string().max(50).optional().nullable(),
  taxIncluded: z.boolean().default(true),
  image: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  trackInventory: z.boolean().default(false),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockAlert: z.number().int().min(0).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
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

export type ProductFormData = z.infer<typeof productSchema>

export interface ProductVariantLocal {
  id?: string
  name: string
  price: number
  sku?: string | null
  stockQuantity: number
  isActive: boolean
  isNew?: boolean
}

interface ProductFormProps {
  productId?: string
  primaryColor: string
}

export function ProductForm({ productId, primaryColor }: ProductFormProps) {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const isEditing = !!productId

  const [activeSection, setActiveSection] = useState('general')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [variants, setVariants] = useState<ProductVariantLocal[]>([])
  const [originalVariants, setOriginalVariants] = useState<ProductVariantLocal[]>([])
  const [originalValues, setOriginalValues] = useState<ProductFormData | null>(null)
  const sectionsRef = useRef<HTMLDivElement>(null)

  const sectionIds = ['general', 'pricing', 'inventory', 'nutrition', 'modifiers', 'variants', 'settings']

  const handleScroll = useCallback(() => {
    const headerOffset = 180
    for (const sectionId of sectionIds) {
      const element = document.getElementById(`section-${sectionId}`)
      if (element) {
        const rect = element.getBoundingClientRect()
        if (rect.top <= headerOffset && rect.bottom > headerOffset) {
          setActiveSection(sectionId)
          break
        }
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

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
      description: '',
      price: 0,
      compareAtPrice: null,
      costPrice: null,
      categoryId: '',
      taxRate: '',
      taxIncluded: true,
      image: null,
      images: [],
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

  const { currentRestaurantId } = useRestaurantStore()

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['restaurant-product', productId],
    queryFn: async () => {
      if (!productId) return null
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.products.get(productId)
      return res.data
    },
    enabled: !!productId && !!accessToken,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['restaurant-categories', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.categories.list(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const { data: modifiersData } = useQuery({
    queryKey: ['restaurant-modifiers', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.modifiers.list(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const { data: recipesData } = useQuery({
    queryKey: ['restaurant-recipes', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.recipes.list({ restaurantId: currentRestaurantId || undefined, isActive: true })
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const categories = categoriesData || []
  const modifierGroups = modifiersData || []
  const recipes = recipesData?.items || []

  useEffect(() => {
    if (product) {
      const catId = product.categoryId || product.category?.id || ''
      const formData: ProductFormData = {
        name: product.name,
        description: product.description || '',
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        costPrice: product.costPrice,
        categoryId: catId,
        taxRate: product.taxRate?.name || '',
        taxIncluded: product.taxIncluded,
        image: product.image,
        images: product.images || [],
        trackInventory: product.trackInventory,
        stockQuantity: product.stockQuantity,
        lowStockAlert: product.lowStockAlert,
        sku: product.sku || '',
        barcode: product.barcode || '',
        calories: product.calories,
        allergens: product.allergens || [],
        dietaryTags: product.dietaryTags || [],
        isActive: product.isActive,
        isVisible: product.isVisible,
        isFeatured: product.isFeatured,
        prepTime: product.prepTime,
        modifierGroupIds: product.modifierGroups?.map(g => g.id) || [],
        recipeId: (product as any).recipeId || null,
      }
      reset(formData)
      setOriginalValues(formData)
      const variantsData = product.variants?.map(v => ({
        id: v.id,
        name: v.name,
        price: v.price,
        sku: v.sku,
        stockQuantity: v.stockQuantity,
        isActive: v.isActive,
      })) || []
      setVariants(variantsData)
      setOriginalVariants(variantsData)
    }
  }, [product, reset])

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.products.create({
        ...data,
        description: data.description || undefined,
        taxRateId: undefined,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    onSuccess: async (result) => {
      if (variants.length > 0 && result.data?.id) {
        for (const variant of variants) {
          await api.restaurant.variants.create(result.data.id, {
            name: variant.name,
            price: variant.price,
            sku: variant.sku,
            stockQuantity: variant.stockQuantity,
            isActive: variant.isActive,
          })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['restaurant-products'] })
      toast.success('Produit créé')
      router.push('/restaurant/menu?tab=products')
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!productId) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      
      await api.restaurant.products.update(productId, {
        ...data,
        description: data.description || undefined,
        taxRateId: undefined,
        restaurantId: currentRestaurantId || undefined,
      })

      const existingVariantIds = product?.variants?.map(v => v.id) || []
      const currentVariantIds = variants.filter(v => v.id && !v.id.startsWith('temp-')).map(v => v.id!)

      for (const variant of variants) {
        if (variant.id?.startsWith('temp-')) {
          await api.restaurant.variants.create(productId, {
            name: variant.name,
            price: variant.price,
            sku: variant.sku,
            stockQuantity: variant.stockQuantity,
            isActive: variant.isActive,
          })
        } else if (variant.id) {
          await api.restaurant.variants.update(productId, variant.id, {
            name: variant.name,
            price: variant.price,
            sku: variant.sku,
            stockQuantity: variant.stockQuantity,
            isActive: variant.isActive,
          })
        }
      }

      for (const existingId of existingVariantIds) {
        if (!currentVariantIds.includes(existingId)) {
          await api.restaurant.variants.delete(productId, existingId)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-products'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-product', productId] })
      toast.success('Produit mis a jour')
      setOriginalValues(watch())
      setOriginalVariants([...variants].map(v => ({ ...v, id: v.id?.startsWith('temp-') ? undefined : v.id })))
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!productId) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.products.delete(productId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-products'] })
      toast.success('Produit supprime')
      router.push('/restaurant/menu?tab=products')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const onSubmit = (data: ProductFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const handleBack = () => {
    if (isDirty) {
      setPendingNavigation('/restaurant/menu?tab=products')
      setShowUnsavedModal(true)
    } else {
      router.push('/restaurant/menu?tab=products')
    }
  }

  const handleConfirmLeave = () => {
    setShowUnsavedModal(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
  }

  const handleDiscardChanges = () => {
    if (originalValues) {
      reset(originalValues)
    }
    setVariants(originalVariants)
    setShowDiscardModal(false)
  }

  const fieldLabels: Record<string, string> = {
    name: 'Nom',
    description: 'Description',
    price: 'Prix',
    compareAtPrice: 'Prix compare',
    costPrice: 'Prix de revient',
    categoryId: 'Categorie',
    taxRate: 'Taux de taxe',
    taxIncluded: 'Taxe incluse',
    image: 'Image',
    images: 'Galerie',
    trackInventory: 'Suivi stock',
    stockQuantity: 'Quantite',
    lowStockAlert: 'Alerte stock bas',
    sku: 'SKU',
    barcode: 'Code-barres',
    calories: 'Calories',
    allergens: 'Allergenes',
    dietaryTags: 'Tags dietetiques',
    isActive: 'Actif',
    isVisible: 'Visible',
    isFeatured: 'Mis en avant',
    prepTime: 'Temps de preparation',
    modifierGroupIds: 'Options',
  }

  const getChangedFields = () => {
    if (!originalValues || !isEditing) return []
    const currentValues = watch()
    const changes: { label: string; from?: string; to?: string }[] = []
    
    for (const key of Object.keys(fieldLabels) as (keyof ProductFormData)[]) {
      const original = originalValues[key]
      const current = currentValues[key]
      
      if (JSON.stringify(original) !== JSON.stringify(current)) {
        const formatValue = (val: unknown): string => {
          if (val === null || val === undefined || val === '') return '(vide)'
          if (typeof val === 'boolean') return val ? 'Oui' : 'Non'
          if (Array.isArray(val)) return val.length > 0 ? `${val.length} element(s)` : '(vide)'
          if (typeof val === 'number') return String(val)
          return String(val)
        }
        changes.push({
          label: fieldLabels[key] || key,
          from: formatValue(original),
          to: formatValue(current),
        })
      }
    }

    const variantsChanged = JSON.stringify(variants) !== JSON.stringify(originalVariants)
    if (variantsChanged) {
      const addedVariants = variants.filter(v => v.id?.startsWith('temp-') || !originalVariants.find(ov => ov.id === v.id))
      const removedVariants = originalVariants.filter(ov => !variants.find(v => v.id === ov.id))
      const modifiedVariants = variants.filter(v => {
        const original = originalVariants.find(ov => ov.id === v.id)
        return original && JSON.stringify(original) !== JSON.stringify(v)
      })

      if (addedVariants.length > 0) {
        changes.push({
          label: 'Variantes ajoutees',
          from: '',
          to: addedVariants.map(v => v.name).join(', '),
        })
      }
      if (removedVariants.length > 0) {
        changes.push({
          label: 'Variantes supprimees',
          from: removedVariants.map(v => v.name).join(', '),
          to: '',
        })
      }
      if (modifiedVariants.length > 0) {
        changes.push({
          label: 'Variantes modifiees',
          from: '',
          to: modifiedVariants.map(v => v.name).join(', '),
        })
      }
    }

    return changes
  }

  const changedFields = getChangedFields()

  const isLoading = createMutation.isPending || updateMutation.isPending

  if (isEditing && productLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    )
  }

  const formValues = watch()

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="sticky top-[73px] lg:top-[81px] z-10 bg-gray-50 -mx-4 px-4 py-2 sm:py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8 sm:h-10 px-2 sm:px-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeft size={16} className="sm:hidden" />
                <ArrowLeft size={18} className="hidden sm:block mr-2" />
                <span className="text-sm sm:text-base">Retour</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl font-semibold text-gray-900 truncate">
                  {isEditing ? `Modifier ${product?.name || 'le produit'}` : 'Nouveau produit'}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {isEditing ? 'Modifiez les informations du produit' : 'Remplissez les informations du produit'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDeleteConfirm(true)}
                  className="h-8 sm:h-10 px-2 sm:px-4 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 text-sm sm:text-base"
                >
                  <Trash2 size={16} className="mr-1 sm:mr-2" />
                  Supprimer
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="hidden md:flex h-10 px-4 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="h-8 sm:h-10 px-3 sm:px-4 rounded-xl text-white text-sm sm:text-base"
                style={{ backgroundColor: primaryColor }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={16} className="mr-1 sm:mr-2 animate-spin" />
                ) : (
                  <Save size={16} className="mr-1 sm:mr-2" />
                )}
                {isEditing ? 'Enregistrer' : 'Creer'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 pt-4">
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-[161px] lg:top-[169px]">
              <ProductFormSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                primaryColor={primaryColor}
                hasVariants={variants.length > 0}
                hasModifiers={(formValues.modifierGroupIds?.length || 0) > 0}
              />
              {isEditing && (
                <UnsavedChangesCard
                  changedFields={changedFields}
                  onDiscard={() => setShowDiscardModal(true)}
                  primaryColor={primaryColor}
                />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-6">
            <div id="section-general">
              <GeneralSection
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                categories={categories}
                primaryColor={primaryColor}
                restaurantId={currentRestaurantId || undefined}
              />
            </div>

            <div id="section-pricing">
              <PricingSection
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                primaryColor={primaryColor}
              />
            </div>

            <div id="section-inventory">
              <InventorySection
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                primaryColor={primaryColor}
                recipes={recipes}
              />
            </div>

            <div id="section-nutrition">
              <NutritionSection
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                primaryColor={primaryColor}
              />
            </div>

            <div id="section-modifiers">
              <ModifiersSection
                watch={watch}
                setValue={setValue}
                modifierGroups={modifierGroups}
                primaryColor={primaryColor}
              />
            </div>

            <div id="section-variants">
              <VariantsSection
                variants={variants}
                setVariants={setVariants}
                trackInventory={formValues.trackInventory}
                primaryColor={primaryColor}
              />
            </div>

            <div id="section-settings">
              <SettingsSection
                register={register}
                watch={watch}
                setValue={setValue}
                primaryColor={primaryColor}
              />
            </div>
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer le produit"
        message={`Etes-vous sur de vouloir supprimer "${product?.name}" ? Cette action est irreversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onConfirm={handleConfirmLeave}
      />

      <ConfirmationModal
        open={showDiscardModal}
        onOpenChange={setShowDiscardModal}
        title="Annuler les modifications"
        description="Voulez-vous vraiment annuler toutes les modifications non sauvegardees ?"
        variant="warning"
        confirmLabel="Annuler les modifications"
        cancelLabel="Continuer l'edition"
        onConfirm={handleDiscardChanges}
        primaryColor={primaryColor}
      >
        {changedFields.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-3 mt-2">
            <p className="text-xs font-medium text-amber-800 mb-2">
              {changedFields.length} modification{changedFields.length > 1 ? 's' : ''} sera{changedFields.length > 1 ? 'ont' : ''} perdue{changedFields.length > 1 ? 's' : ''} :
            </p>
            <ul className="text-xs text-amber-700 space-y-1">
              {changedFields.slice(0, 5).map((field, i) => (
                <li key={i}>• {field.label}</li>
              ))}
              {changedFields.length > 5 && (
                <li>• +{changedFields.length - 5} autre{changedFields.length - 5 > 1 ? 's' : ''}</li>
              )}
            </ul>
          </div>
        )}
      </ConfirmationModal>
    </>
  )
}
