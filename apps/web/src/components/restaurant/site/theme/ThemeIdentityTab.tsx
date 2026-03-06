'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { X } from 'lucide-react'
import { SaveButton } from './SaveButton'

interface ThemeIdentityTabProps {
  restaurant: {
    name: string
    description: string | null
    shortDescription: string | null
    logo: string | null
    coverImage: string | null
    images: string[]
  }
  primaryColor: string
}

export function ThemeIdentityTab({ restaurant, primaryColor }: ThemeIdentityTabProps) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    shortDescription: restaurant.shortDescription || '',
    logo: restaurant.logo || '',
    coverImage: restaurant.coverImage || '',
    images: restaurant.images || [],
  })

  const mutation = useMutation({
    mutationFn: (data: {
      shortDescription?: string
      logo?: string
      coverImage?: string
      images?: string[]
    }) => api.restaurant.updateRestaurantInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] })
      toast.success('Identité visuelle mise à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSave = () => {
    mutation.mutate({
      shortDescription: form.shortDescription || undefined,
      logo: form.logo || undefined,
      coverImage: form.coverImage || undefined,
      images: form.images,
    })
  }

  const handleAddGalleryImage = (url: string | null) => {
    if (!url) return
    setForm((prev) => ({ ...prev, images: [...prev.images, url] }))
  }

  const handleRemoveGalleryImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Identité visuelle</h3>
        <p className="text-sm text-gray-500 mt-1">Logo, images et description affichés sur votre site</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Logo du restaurant</Label>
        <ImageUpload
          value={form.logo || null}
          onChange={(url) => setForm((prev) => ({ ...prev, logo: url || '' }))}
          folder="logos"
          placeholder="Ajoutez le logo de votre restaurant"
          aspectRatio="square"
          primaryColor={primaryColor}
          showMediaLibrary
        />
        <p className="text-xs text-gray-400">Recommandé : image carrée, minimum 200x200px</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Image de couverture</Label>
        <ImageUpload
          value={form.coverImage || null}
          onChange={(url) => setForm((prev) => ({ ...prev, coverImage: url || '' }))}
          folder="covers"
          placeholder="Image principale affichée sur votre site"
          aspectRatio="landscape"
          primaryColor={primaryColor}
          showMediaLibrary
        />
        <p className="text-xs text-gray-400">Recommandé : 1920x600px minimum pour un rendu optimal</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description courte</Label>
        <Textarea
          value={form.shortDescription}
          onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
          placeholder="Une phrase qui décrit votre restaurant"
          className="rounded-xl text-sm focus:ring-2 min-h-[80px]"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          maxLength={160}
        />
        <p className="text-xs text-gray-400 text-right">{form.shortDescription.length}/160</p>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Galerie d&apos;images</p>
            <p className="text-xs text-gray-400 mt-0.5">Photos affichées dans la section galerie de votre site</p>
          </div>
          <span className="text-xs text-gray-400">{form.images.length} image{form.images.length !== 1 ? 's' : ''}</span>
        </div>

        {form.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {form.images.map((img, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden aspect-video">
                <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <ImageUpload
          value={null}
          onChange={handleAddGalleryImage}
          folder="gallery"
          placeholder="Ajouter une photo à la galerie"
          aspectRatio="landscape"
          primaryColor={primaryColor}
          showMediaLibrary
        />
      </div>

      <SaveButton isSaving={mutation.isPending} onSave={handleSave} primaryColor={primaryColor} />
    </div>
  )
}
