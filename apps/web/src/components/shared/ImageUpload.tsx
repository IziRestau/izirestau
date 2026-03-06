'use client'

import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, MediaItem } from '@/lib/api-client'
import { toast } from 'sonner'
import { Camera, Loader2, X, ImageIcon, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MediaSelectorModal } from './MediaSelectorModal'

interface ImageUploadBaseProps {
  folder: string
  label?: string
  placeholder?: string
  aspectRatio?: 'square' | 'landscape' | 'portrait'
  maxSizeMB?: number
  primaryColor?: string
  disabled?: boolean
  showMediaLibrary?: boolean
  restaurantId?: string
}

interface SingleModeProps extends ImageUploadBaseProps {
  mode?: 'single'
  value: string | null
  onChange: (url: string | null) => void
  values?: never
  onChangeMultiple?: never
}

interface GalleryModeProps extends ImageUploadBaseProps {
  mode: 'gallery'
  values: string[]
  onChangeMultiple: (urls: string[]) => void
  value?: never
  onChange?: never
  galleryDescription?: string
}

type ImageUploadProps = SingleModeProps | GalleryModeProps

export function ImageUpload(props: ImageUploadProps) {
  if (props.mode === 'gallery') {
    return <GalleryUpload {...props} />
  }
  return <SingleUpload {...props} />
}

function SingleUpload({
  value,
  onChange,
  folder,
  label,
  placeholder = 'Cliquez pour ajouter une image',
  aspectRatio = 'square',
  maxSizeMB = 5,
  primaryColor = '#10b981',
  disabled = false,
  showMediaLibrary = false,
  restaurantId,
}: SingleModeProps) {
  const [preview, setPreview] = useState<string | null>(value)
  const [showMediaSelector, setShowMediaSelector] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(value)
  }, [value])

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (restaurantId) {
        return api.media.upload(file, folder, restaurantId)
      }
      return api.upload.uploadImage(file, folder)
    },
    onSuccess: (result) => {
      const url = result.data?.url
      if (url) {
        setPreview(url)
        onChange(url)
        toast.success('Image uploadée')
      }
    },
    onError: () => {
      toast.error('Erreur lors de l\'upload')
      setPreview(value)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image trop volumineuse (max ${maxSizeMB}MB)`)
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image')
      return
    }

    setPreview(URL.createObjectURL(file))
    uploadMutation.mutate(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    const item = Array.isArray(media) ? media[0] : media
    if (item) {
      setPreview(item.url)
      onChange(item.url)
    }
  }

  const aspectClasses = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div
        className={`relative w-full ${aspectClasses[aspectRatio]} max-w-[200px] rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${preview ? 'border-transparent' : 'border-gray-200 bg-gray-50'}`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!disabled && !uploadMutation.isPending && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    inputRef.current?.click()
                  }}
                >
                  <Camera size={16} />
                </button>
                {showMediaLibrary && (
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMediaSelector(true)
                    }}
                  >
                    <FolderOpen size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-red-600 transition-colors"
                  onClick={handleRemove}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={24} className="text-white animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
            {uploadMutation.isPending ? (
              <Loader2 size={24} className="text-gray-400 animate-spin" />
            ) : showMediaLibrary ? (
              <>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Camera size={14} />
                  Uploader
                </button>
                <button
                  type="button"
                  onClick={() => setShowMediaSelector(true)}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <FolderOpen size={14} />
                  Médiathèque
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="flex flex-col items-center gap-2"
              >
                <ImageIcon size={24} className="text-gray-400" />
                <span className="text-xs text-gray-500 text-center">{placeholder}</span>
              </button>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploadMutation.isPending}
        />
      </div>

      {showMediaLibrary && (
        <MediaSelectorModal
          isOpen={showMediaSelector}
          onClose={() => setShowMediaSelector(false)}
          onSelect={handleMediaSelect}
          multiple={false}
          folder={folder}
          primaryColor={primaryColor}
          title="Sélectionner une image"
          restaurantId={restaurantId}
        />
      )}
    </div>
  )
}

function GalleryUpload({
  values,
  onChangeMultiple,
  folder,
  label,
  placeholder = 'Ajouter des images',
  maxSizeMB = 5,
  primaryColor = '#10b981',
  disabled = false,
  showMediaLibrary = false,
  restaurantId,
  galleryDescription,
}: GalleryModeProps) {
  const [showMediaSelector, setShowMediaSelector] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleRemoveImage = (idx: number) => {
    onChangeMultiple(values.filter((_, i) => i !== idx))
  }

  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    const items = Array.isArray(media) ? media : [media]
    const newUrls = items.map((m) => m.url)
    onChangeMultiple([...values, ...newUrls])
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max ${maxSizeMB}MB)`)
        continue
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image`)
        continue
      }
      try {
        const result = restaurantId
          ? await api.media.upload(file, folder, restaurantId)
          : await api.upload.uploadImage(file, folder)
        if (result.data?.url) {
          newUrls.push(result.data.url)
        }
      } catch {
        toast.error(`Erreur lors de l'upload de ${file.name}`)
      }
    }

    if (newUrls.length > 0) {
      onChangeMultiple([...values, ...newUrls])
      toast.success(`${newUrls.length} image${newUrls.length > 1 ? 's' : ''} ajoutée${newUrls.length > 1 ? 's' : ''}`)
    }

    setIsUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-gray-700">{label}</Label>
          <span className="text-[11px] text-gray-400">
            {values.length} image{values.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {galleryDescription && (
        <p className="text-[11px] text-gray-400">{galleryDescription}</p>
      )}

      {values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {values.map((img, idx) => (
            <div
              key={idx}
              className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200"
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            {isUploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {isUploading ? 'Upload en cours...' : 'Uploader'}
          </button>
          {showMediaLibrary && (
            <button
              type="button"
              onClick={() => setShowMediaSelector(true)}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <FolderOpen size={14} />
              Médiathèque
            </button>
          )}
        </div>
      )}

      {values.length === 0 && !isUploading && (
        <div className="flex flex-col items-center justify-center py-6 border border-dashed border-gray-200 rounded-xl">
          <ImageIcon size={24} className="text-gray-300 mb-2" />
          <p className="text-xs text-gray-400">{placeholder}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {showMediaLibrary && (
        <MediaSelectorModal
          isOpen={showMediaSelector}
          onClose={() => setShowMediaSelector(false)}
          onSelect={handleMediaSelect}
          multiple
          folder={folder}
          primaryColor={primaryColor}
          title="Sélectionner des images"
          restaurantId={restaurantId}
        />
      )}
    </div>
  )
}
