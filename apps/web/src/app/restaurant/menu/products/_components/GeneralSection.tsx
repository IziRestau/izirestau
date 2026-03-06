'use client'

import { useState } from 'react'
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form'
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
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { ImageGallery } from './ImageGallery'
import { FileText } from 'lucide-react'
import type { ProductFormData } from './ProductForm'
import type { Category } from '@/types/menu'

interface GeneralSectionProps {
  register: UseFormRegister<ProductFormData>
  errors: FieldErrors<ProductFormData>
  watch: UseFormWatch<ProductFormData>
  setValue: UseFormSetValue<ProductFormData>
  categories: Category[]
  primaryColor: string
  restaurantId?: string
}

export function GeneralSection({
  register,
  errors,
  watch,
  setValue,
  categories,
  primaryColor,
  restaurantId,
}: GeneralSectionProps) {
  const image = watch('image')
  const images = watch('images') || []
  const categoryId = watch('categoryId')

  const [swapConfirmOpen, setSwapConfirmOpen] = useState(false)
  const [imageToSwap, setImageToSwap] = useState<string | null>(null)

  const handleSwapRequest = (galleryImageUrl: string) => {
    setImageToSwap(galleryImageUrl)
    setSwapConfirmOpen(true)
  }

  const handleConfirmSwap = () => {
    if (!imageToSwap) return

    const currentMainImage = image
    const galleryIndex = images.indexOf(imageToSwap)

    if (galleryIndex === -1) return

    // Permuter les images
    const newGalleryImages = [...images]
    if (currentMainImage) {
      // L'ancienne image principale prend la place dans la galerie
      newGalleryImages[galleryIndex] = currentMainImage
    } else {
      // Pas d'image principale, on retire juste de la galerie
      newGalleryImages.splice(galleryIndex, 1)
    }

    // La nouvelle image principale
    setValue('image', imageToSwap)
    setValue('images', newGalleryImages)

    setSwapConfirmOpen(false)
    setImageToSwap(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <FileText size={20} style={{ color: primaryColor }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Informations generales</h2>
          <p className="text-sm text-gray-500">Nom, description et categorie du produit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du produit *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Pizza Margherita"
              className={`mt-1.5 h-10 rounded-xl ${errors.name ? 'border-red-300' : ''}`}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
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
              placeholder="Decrivez votre produit..."
              className="mt-1.5 rounded-xl min-h-[100px] resize-none"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>

          <div>
            <Label>Categorie *</Label>
            <Select
              key={categoryId || 'empty'}
              value={categoryId || ''}
              onValueChange={(value) => setValue('categoryId', value)}
            >
              <SelectTrigger 
                className="mt-1.5 h-10 rounded-xl"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              >
                <SelectValue placeholder="Selectionnez une categorie" />
              </SelectTrigger>
              <SelectContent className="rounded-xl" accentColor={primaryColor}>
                {categories.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id} 
                    className="rounded-lg"
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Image principale</Label>
            <div className="mt-1.5">
              <ImageUpload
                value={image || null}
                onChange={(url) => setValue('image', url)}
                folder="products"
                aspectRatio="landscape"
                primaryColor={primaryColor}
                showMediaLibrary
                restaurantId={restaurantId}
              />
            </div>
          </div>

          <div>
            <Label>Galerie d'images (max 10)</Label>
            <div className="mt-1.5">
              <ImageGallery
                images={images}
                onChange={(newImages: string[]) => setValue('images', newImages)}
                maxImages={10}
                primaryColor={primaryColor}
                restaurantId={restaurantId}
                onSetAsPrimary={handleSwapRequest}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={swapConfirmOpen}
        onClose={() => {
          setSwapConfirmOpen(false)
          setImageToSwap(null)
        }}
        onConfirm={handleConfirmSwap}
        title="Definir comme image principale ?"
        message={image 
          ? "L'image selectionnee deviendra l'image principale et l'actuelle image principale prendra sa place dans la galerie."
          : "L'image selectionnee deviendra l'image principale du produit."
        }
        confirmText="Confirmer"
        cancelText="Annuler"
        variant="info"
      />
    </div>
  )
}
