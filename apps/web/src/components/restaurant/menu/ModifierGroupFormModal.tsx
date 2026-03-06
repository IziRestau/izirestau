'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Settings2, Loader2, Plus, Trash2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-media-query'
import { MODIFIER_TYPE_LABELS } from '@/types/menu'
import type { ModifierGroup, ModifierType } from '@/types/menu'

const modifierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nom requis').max(100),
  price: z.number().min(0).default(0),
})

const groupSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  type: z.enum(['SINGLE', 'MULTIPLE', 'OPTIONAL']).default('SINGLE'),
  minSelections: z.number().min(0).default(0),
  maxSelections: z.number().min(1).optional().nullable(),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
  modifiers: z.array(modifierSchema).default([]),
})

type GroupFormData = z.infer<typeof groupSchema>

interface ModifierGroupFormModalProps {
  isOpen: boolean
  onClose: () => void
  modifierGroup?: ModifierGroup | null
  primaryColor: string
}

export function ModifierGroupFormModal({
  isOpen,
  onClose,
  modifierGroup,
  primaryColor,
}: ModifierGroupFormModalProps) {
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const isEditing = !!modifierGroup

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      type: 'SINGLE',
      minSelections: 0,
      maxSelections: null,
      isRequired: false,
      isActive: true,
      modifiers: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'modifiers',
  })

  const type = watch('type')
  const isRequired = watch('isRequired')
  const isActive = watch('isActive')

  useEffect(() => {
    if (isOpen) {
      if (modifierGroup) {
        reset({
          name: modifierGroup.name,
          type: modifierGroup.type,
          minSelections: modifierGroup.minSelections,
          maxSelections: modifierGroup.maxSelections,
          isRequired: modifierGroup.isRequired,
          isActive: modifierGroup.isActive,
          modifiers: modifierGroup.modifiers.map(m => ({
            id: m.id,
            name: m.name,
            price: m.price,
          })),
        })
      } else {
        reset({
          name: '',
          type: 'SINGLE',
          minSelections: 0,
          maxSelections: null,
          isRequired: false,
          isActive: true,
          modifiers: [],
        })
      }
    }
  }, [isOpen, modifierGroup, reset])

  const createMutation = useMutation({
    mutationFn: async (data: GroupFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.modifiers.create({
        name: data.name,
        type: data.type as ModifierType,
        minSelections: data.minSelections,
        maxSelections: data.maxSelections || undefined,
        isRequired: data.isRequired,
        isActive: data.isActive,
        modifiers: data.modifiers.map((m, i) => ({
          name: m.name,
          price: m.price,
          sortOrder: i,
          isActive: true,
        })),
        restaurantId: currentRestaurantId || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-modifiers'] })
      toast.success('Groupe créé')
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: GroupFormData) => {
      if (!modifierGroup) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      
      await api.restaurant.modifiers.update(modifierGroup.id, {
        name: data.name,
        type: data.type as ModifierType,
        minSelections: data.minSelections,
        maxSelections: data.maxSelections || undefined,
        isRequired: data.isRequired,
        isActive: data.isActive,
        restaurantId: currentRestaurantId || undefined,
      })

      const existingIds = modifierGroup.modifiers.map(m => m.id)
      const newIds = data.modifiers.filter(m => m.id).map(m => m.id!)

      for (const existingId of existingIds) {
        if (!newIds.includes(existingId)) {
          await api.restaurant.modifiers.deleteItem(modifierGroup.id, existingId)
        }
      }

      for (const modifier of data.modifiers) {
        if (modifier.id) {
          await api.restaurant.modifiers.updateItem(modifierGroup.id, modifier.id, {
            name: modifier.name,
            price: modifier.price,
          })
        } else {
          await api.restaurant.modifiers.addItem(modifierGroup.id, {
            name: modifier.name,
            price: modifier.price,
            isActive: true,
          })
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-modifiers'] })
      toast.success('Groupe mis a jour')
      onClose()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const onSubmit = (data: GroupFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  const addModifier = () => {
    append({ name: '', price: 0 })
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
      <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du groupe *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Supplements"
                className={`mt-1.5 h-10 rounded-xl ${errors.name ? 'border-red-300' : ''}`}
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label>Type de selection</Label>
              <Select
                value={type}
                onValueChange={(value) => setValue('type', value as ModifierType)}
              >
                <SelectTrigger 
                  className="mt-1.5 h-10 rounded-xl"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent accentColor={primaryColor}>
                  {(Object.keys(MODIFIER_TYPE_LABELS) as ModifierType[]).map(t => (
                    <SelectItem key={t} value={t}>
                      {MODIFIER_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="minSelections">Min.</Label>
                <Input
                  id="minSelections"
                  type="number"
                  min="0"
                  {...register('minSelections', { valueAsNumber: true })}
                  className="mt-1.5 h-10 rounded-xl"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
              <div>
                <Label htmlFor="maxSelections">Max.</Label>
                <Input
                  id="maxSelections"
                  type="number"
                  min="1"
                  {...register('maxSelections', { valueAsNumber: true })}
                  placeholder="Illimite"
                  className="mt-1.5 h-10 rounded-xl"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Obligatoire</p>
                <p className="text-xs text-gray-500">Le client doit choisir</p>
              </div>
              <Switch
                checked={isRequired}
                onCheckedChange={(checked) => setValue('isRequired', checked)}
                style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
                className="data-[state=checked]:bg-[--switch-checked-bg]"
              />
            </div>

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
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <Label>Options</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addModifier}
              className="h-8 rounded-lg"
            >
              <Plus size={14} className="mr-1" />
              Ajouter
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-sm text-gray-500">Aucune option</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl"
                >
                  <Input
                    {...register(`modifiers.${index}.name`)}
                    placeholder="Nom"
                    className="h-9 rounded-lg text-sm flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`modifiers.${index}.price`, { valueAsNumber: true })}
                    placeholder="Prix"
                    className="h-9 rounded-lg text-sm w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 p-4 border-t border-gray-100">
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

  const headerContent = (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${primaryColor}15` }}
      >
        <Settings2 size={18} style={{ color: primaryColor }} />
      </div>
      <span>{isEditing ? 'Modifier le groupe' : 'Nouveau groupe'}</span>
    </div>
  )

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>{headerContent}</DrawerTitle>
              <DrawerDescription>
                {isEditing ? 'Modifiez les informations du groupe' : 'Ajoutez un nouveau groupe d\'options'}
              </DrawerDescription>
            </DrawerHeader>
            {formContent}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>{headerContent}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifiez les informations du groupe' : 'Ajoutez un nouveau groupe d\'options'}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
