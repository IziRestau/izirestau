'use client'

import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, MediaItem } from '@/lib/api-client'
import { toast } from 'sonner'
import { Plus, X, Loader2, GripVertical, ImageIcon, Star, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaSelectorModal } from '@/components/shared/MediaSelectorModal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ImageGalleryProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages: number
  primaryColor: string
  restaurantId?: string
  onSetAsPrimary?: (imageUrl: string) => void
}

interface SortableImageProps {
  id: string
  url: string
  onRemove: () => void
  onSetAsPrimary?: () => void
}

function SortableImage({ id, url, onRemove, onSetAsPrimary }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
    >
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 text-gray-600 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/90 text-gray-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </div>
      {onSetAsPrimary && (
        <button
          type="button"
          onClick={onSetAsPrimary}
          className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 text-amber-500 hover:text-amber-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Definir comme image principale"
        >
          <Star size={14} />
        </button>
      )}
    </div>
  )
}

export function ImageGallery({
  images,
  onChange,
  maxImages,
  primaryColor,
  restaurantId,
  onSetAsPrimary,
}: ImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showMediaSelector, setShowMediaSelector] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (restaurantId) {
        return api.media.upload(file, 'products', restaurantId)
      }
      return api.upload.uploadImage(file, 'products')
    },
    onSuccess: (result) => {
      const url = result.data?.url
      if (url) {
        onChange([...images, url])
        toast.success('Image ajoutée')
      }
    },
    onError: () => {
      toast.error('Erreur lors de l\'upload')
    },
    onSettled: () => {
      setUploading(false)
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - images.length
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      toast.error(`Maximum ${maxImages} images`)
      return
    }

    setUploading(true)

    for (const file of filesToUpload) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Image trop volumineuse (max 5MB)`)
        continue
      }
      await uploadMutation.mutateAsync(file)
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleRemove = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    onChange(newImages)
  }

  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    const mediaArray = Array.isArray(media) ? media : [media]
    const remainingSlots = maxImages - images.length
    const newUrls = mediaArray.slice(0, remainingSlots).map(m => m.url)
    onChange([...images, ...newUrls])
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string)
      const newIndex = images.indexOf(over.id as string)
      onChange(arrayMove(images, oldIndex, newIndex))
    }
  }

  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((url, index) => (
              <SortableImage
                key={url}
                id={url}
                url={url}
                onRemove={() => handleRemove(index)}
                onSetAsPrimary={onSetAsPrimary ? () => onSetAsPrimary(url) : undefined}
              />
            ))}

            {canAddMore && (
              <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 p-2">
                {uploading ? (
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Plus size={14} />
                      Uploader
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMediaSelector(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <FolderOpen size={14} />
                      Médiathèque
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {images.length === 0 && !canAddMore && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <ImageIcon size={32} className="mb-2" />
          <p className="text-sm">Aucune image</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-xs text-gray-500">
        {images.length}/{maxImages} images - Glissez pour réordonner
      </p>

      <MediaSelectorModal
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleMediaSelect}
        multiple={true}
        folder="products"
        primaryColor={primaryColor}
        title="Sélectionner des images"
        restaurantId={restaurantId}
      />
    </div>
  )
}
