'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FolderTree, Loader2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-media-query'
import { ImageUpload } from '@/components/shared/ImageUpload'
import type { Category } from '@/types/menu'

const categorySchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  nameEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  image: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  categories: Category[]
  primaryColor: string
}

export function CategoryFormModal({
  isOpen,
  onClose,
  category,
  categories,
  primaryColor,
}: CategoryFormModalProps) {
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const isEditing = !!category

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      nameEn: '',
      description: '',
      image: '',
      parentId: null,
      isActive: true,
      isVisible: true,
    },
  })

  const parentId = watch('parentId')
  const isActive = watch('isActive')
  const isVisible = watch('isVisible')

  useEffect(() => {
    if (isOpen) {
      if (category) {
        reset({
          name: category.name,
          nameEn: category.nameEn || '',
          description: category.description || '',
          image: category.image || '',
          parentId: category.parentId,
          isActive: category.isActive,
          isVisible: category.isVisible,
        })
      } else {
        reset({
          name: '',
          nameEn: '',
          description: '',
          image: '',
          parentId: null,
          isActive: true,
          isVisible: true,
        })
      }
    }
  }, [isOpen, category, reset])

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.categories.create({
        name: data.name,
        nameEn: data.nameEn || undefined,
        description: data.description || undefined,
        image: data.image || null,
        parentId: data.parentId || null,
        isActive: data.isActive,
        isVisible: data.isVisible,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-categories'] })
      toast.success('Catégorie créée')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.categories.update(category!.id, {
        name: data.name,
        nameEn: data.nameEn || undefined,
        description: data.description || undefined,
        image: data.image || null,
        parentId: data.parentId || null,
        isActive: data.isActive,
        isVisible: data.isVisible,
        restaurantId: currentRestaurantId || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-categories'] })
      toast.success('Catégorie modifiée')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la modification')
    },
  })

  const onSubmit = (data: CategoryFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  const availableParents = categories.filter(c => {
    if (!category) return !c.parentId
    return c.id !== category.id && !c.parentId
  })

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Colonne gauche */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Pizzas"
              className={`mt-1.5 h-10 rounded-xl ${errors.name ? 'border-red-300' : ''}`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nameEn">Nom (anglais)</Label>
            <Input
              id="nameEn"
              {...register('nameEn')}
              placeholder="Ex: Pizzas"
              className="mt-1.5 h-10 rounded-xl"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          <div>
            <Label>Categorie parente</Label>
            <Select
              value={parentId || 'none'}
              onValueChange={(value) => setValue('parentId', value === 'none' ? null : value)}
            >
              <SelectTrigger 
                className="mt-1.5 h-10 rounded-xl"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              >
                <SelectValue placeholder="Aucune (categorie principale)" />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                <SelectItem value="none">Aucune (categorie principale)</SelectItem>
                {availableParents.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Description de la categorie..."
              className="mt-1.5 rounded-xl resize-none"
              rows={3}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          <ImageUpload
            value={watch('image') || null}
            onChange={(url) => setValue('image', url)}
            folder="category-images"
            label="Image de la categorie"
            placeholder="Ajouter une image"
            aspectRatio="square"
            primaryColor={primaryColor}
          />

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">La categorie est disponible</p>
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
              <p className="text-xs text-gray-500">Affichee sur le menu client</p>
            </div>
            <Switch
              checked={isVisible}
              onCheckedChange={(checked) => setValue('isVisible', checked)}
              style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
              className="data-[state=checked]:bg-[--switch-checked-bg]"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="flex-1 h-10 rounded-xl hover:bg-gray-100 hover:text-gray-900"
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

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <FolderTree size={18} style={{ color: primaryColor }} />
                </div>
                <span>{isEditing ? 'Modifier la categorie' : 'Nouvelle categorie'}</span>
              </DrawerTitle>
              <DrawerDescription>
                {isEditing ? 'Modifiez les informations de la categorie' : 'Ajoutez une nouvelle categorie a votre menu'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <FolderTree size={18} style={{ color: primaryColor }} />
                </div>
                <span>{isEditing ? 'Modifier la categorie' : 'Nouvelle categorie'}</span>
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifiez les informations de la categorie' : 'Ajoutez une nouvelle categorie a votre menu'}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
