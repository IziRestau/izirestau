'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiClient, MediaItem } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { 
  X, 
  Search, 
  Upload, 
  Check, 
  Loader2, 
  Image as ImageIcon,
  FolderOpen,
  Grid3X3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

interface MediaSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: MediaItem | MediaItem[]) => void
  multiple?: boolean
  folder?: string
  allowUpload?: boolean
  primaryColor?: string
  title?: string
  restaurantId?: string
}

export function MediaSelectorModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  folder: defaultFolder,
  allowUpload = true,
  primaryColor = '#10b981',
  title = 'Sélectionner une image',
  restaurantId,
}: MediaSelectorModalProps) {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([])
  const [activeFolder, setActiveFolder] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch media list
  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media-library', activeFolder, searchQuery, restaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.media.getList({
        folder: activeFolder === 'all' ? undefined : activeFolder,
        search: searchQuery || undefined,
        limit: 50,
        restaurantId,
      })
      return res.data
    },
    enabled: isOpen && !!accessToken,
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return api.media.upload(file, defaultFolder || 'general', restaurantId)
    },
    onSuccess: (result) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: ['media-library'] })
        toast.success('Image uploadée')
        if (!multiple) {
          onSelect(result.data)
          onClose()
        }
      }
    },
    onError: () => {
      toast.error('Erreur lors de l\'upload')
    },
    onSettled: () => {
      setIsUploading(false)
    },
  })

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 5MB)`)
        return
      }
      uploadMutation.mutate(file)
    })

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [uploadMutation])

  const handleSelect = useCallback((item: MediaItem) => {
    if (multiple) {
      setSelectedItems(prev => {
        const exists = prev.find(i => i.id === item.id)
        if (exists) {
          return prev.filter(i => i.id !== item.id)
        }
        return [...prev, item]
      })
    } else {
      onSelect(item)
      onClose()
    }
  }, [multiple, onSelect, onClose])

  const handleConfirmSelection = useCallback(() => {
    if (selectedItems.length > 0) {
      onSelect(selectedItems)
      onClose()
    }
  }, [selectedItems, onSelect, onClose])

  const isSelected = useCallback((item: MediaItem) => {
    return selectedItems.some(i => i.id === item.id)
  }, [selectedItems])

  const folders = [
    { id: 'all', name: 'Tous', count: mediaData?.pagination?.total || 0 },
    ...(mediaData?.folders || []).map(f => ({ id: f.name, name: f.name, count: f.count })),
  ]

  const content = (
    <div className="flex flex-col h-full">
      {/* Search & Upload */}
      <div className="flex gap-2 p-4 border-b border-gray-100">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        {allowUpload && (
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="h-10 px-4 rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {isUploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Uploader
              </>
            )}
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Folders tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-gray-100 scrollbar-hide">
        {folders.map((f) => {
          const isActive = activeFolder === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFolder(f.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              style={isActive ? { backgroundColor: primaryColor } : undefined}
            >
              {f.id === 'all' ? <Grid3X3 size={14} /> : <FolderOpen size={14} />}
              {f.name}
              <span className="text-xs opacity-70">({f.count})</span>
            </button>
          )
        })}
      </div>

      {/* Media grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : mediaData?.items && mediaData.items.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {mediaData.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={cn(
                  'relative aspect-square rounded-xl overflow-hidden border-2 transition-all group',
                  isSelected(item)
                    ? 'ring-2 ring-offset-2'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                style={isSelected(item) ? { 
                  borderColor: primaryColor,
                  '--tw-ring-color': primaryColor,
                } as React.CSSProperties : undefined}
              >
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.alt || item.originalName}
                  className="w-full h-full object-cover"
                />
                {isSelected(item) && (
                  <div 
                    className="absolute inset-0 bg-black/30 flex items-center justify-center"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Check size={18} />
                    </div>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">
                    {item.title || item.originalName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <ImageIcon size={32} className="mb-2" />
            <p className="text-sm">Aucune image</p>
            {allowUpload && (
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="mt-3 rounded-xl"
              >
                <Upload size={16} className="mr-2" />
                Uploader une image
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer with selection count */}
      {multiple && selectedItems.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedItems.length} image{selectedItems.length > 1 ? 's' : ''} sélectionnée{selectedItems.length > 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedItems([])}
              className="h-9 rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSelection}
              className="h-9 rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Confirmer
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  // Mobile: Drawer (from bottom)
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <DrawerTitle>{title}</DrawerTitle>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Dialog (modal)
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 flex flex-col [&>button]:hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
