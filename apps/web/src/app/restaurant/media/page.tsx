'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient, MediaItem } from '@/lib/api-client'
import { toast } from 'sonner'
import { 
  Search, 
  Upload, 
  Loader2, 
  Image as ImageIcon,
  FolderOpen,
  Grid3X3,
  Trash2,
  X,
  HardDrive,
  FileImage,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { cn } from '@/lib/utils'

export default function MediaLibraryPage() {
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const primaryColor = organization?.primaryColor || '#10b981'
  const logoText = organization?.name || 'Restaurant'

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const primaryBgLight = hexToRgba(primaryColor, 0.1)

  const [activeFolder, setActiveFolder] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media-library', activeFolder, searchQuery, currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.media.getList({
        folder: activeFolder === 'all' ? undefined : activeFolder,
        search: searchQuery || undefined,
        limit: 100,
        restaurantId: currentRestaurantId || undefined,
      })
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return api.media.upload(file, 'general', currentRestaurantId || undefined)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] })
      toast.success('Image uploadée')
    },
    onError: () => {
      toast.error('Erreur lors de l\'upload')
    },
    onSettled: () => {
      setIsUploading(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.media.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] })
      toast.success('Image supprimée')
      setDetailItem(null)
      setItemToDelete(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
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

  const handleDeleteClick = (item: MediaItem) => {
    setItemToDelete(item)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id)
    }
    setDeleteConfirmOpen(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const folders = [
    { id: 'all', name: 'Tous', count: mediaData?.pagination?.total || 0 },
    ...(mediaData?.folders || []).map(f => ({ id: f.name, name: f.name, count: f.count })),
  ]

  const totalSize = mediaData?.folders?.reduce((acc, f) => acc + f.size, 0) || 0

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: primaryBgLight }}
          >
            <ImageIcon size={24} style={{ color: primaryColor }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Médiathèque</h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {mediaData?.pagination?.total || 0} fichiers
              </span>
            </div>
            <p className="text-sm text-gray-500">Gérez vos images et médias</p>
          </div>
        </div>
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="self-start sm:self-auto text-white h-11 rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Upload size={16} className="mr-2" />
          )}
          Uploader
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryBgLight }}>
            <FileImage className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{mediaData?.pagination?.total || 0}</div>
            <div className="text-sm text-gray-500">Total fichiers</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50">
            <HardDrive className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{formatFileSize(totalSize)}</div>
            <div className="text-sm text-gray-500">Espace utilisé</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-purple-50">
            <FolderOpen className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{mediaData?.folders?.length || 0}</div>
            <div className="text-sm text-gray-500">Dossiers</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-green-50">
            <Grid3X3 className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{activeFolder === 'all' ? 'Tous' : activeFolder}</div>
            <div className="text-sm text-gray-500">Dossier actif</div>
          </div>
        </div>
      </div>

      {/* Filters & Grid */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ zIndex: 1 }} />
              <Input
                type="text"
                placeholder="Rechercher par nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap overflow-x-auto pb-2 sm:pb-0">
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFolder(f.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                    activeFolder === f.id
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                  style={activeFolder === f.id ? { backgroundColor: primaryColor } : undefined}
                >
                  {f.id === 'all' ? <Grid3X3 size={14} /> : <FolderOpen size={14} />}
                  {f.id === 'all' ? 'Tous' : f.name}
                  <span className="text-xs opacity-70">({f.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : mediaData?.items && mediaData.items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {mediaData.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDetailItem(item)}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group"
                >
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.alt || item.originalName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">
                      {item.originalName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: primaryBgLight }}>
                <ImageIcon size={28} style={{ color: primaryColor }} />
              </div>
              <p className="text-gray-900 font-medium mb-1">Aucune image</p>
              <p className="text-sm text-gray-500 mb-4">Uploadez vos premières images</p>
              <Button
                onClick={() => inputRef.current?.click()}
                className="rounded-xl text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Upload size={16} className="mr-2" />
                Uploader une image
              </Button>
            </div>
          )}
        </div>
      </div>

      {isMobile ? (
        <Drawer open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <DrawerTitle>Détails</DrawerTitle>
                <button
                  onClick={() => setDetailItem(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <X size={16} />
                </button>
              </div>
            </DrawerHeader>
            {detailItem && (
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={detailItem.url}
                    alt={detailItem.alt || detailItem.originalName}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Nom du fichier</label>
                    <p className="text-sm text-gray-900 mt-1">{detailItem.originalName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Taille</label>
                      <p className="text-sm text-gray-900 mt-1">{formatFileSize(detailItem.size)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Type</label>
                      <p className="text-sm text-gray-900 mt-1">{detailItem.mimeType}</p>
                    </div>
                  </div>

                  {detailItem.width && detailItem.height && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Dimensions</label>
                      <p className="text-sm text-gray-900 mt-1">{detailItem.width} x {detailItem.height}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-500">Dossier</label>
                    <p className="text-sm text-gray-900 mt-1">{detailItem.folder || 'Aucun'}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500">URL</label>
                    <Input
                      value={detailItem.url}
                      readOnly
                      className="mt-1 text-xs"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).select()
                        navigator.clipboard.writeText(detailItem.url)
                        toast.success('URL copiée')
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    onClick={() => handleDeleteClick(detailItem)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            )}
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
          <SheetContent className="w-full sm:max-w-md p-0 [&>button]:hidden">
            <SheetHeader className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <SheetTitle>Détails</SheetTitle>
                <button
                  onClick={() => setDetailItem(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <X size={16} />
                </button>
              </div>
            </SheetHeader>
            {detailItem && (
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={detailItem.url}
                    alt={detailItem.alt || detailItem.originalName}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Nom du fichier</label>
                    <p className="text-sm text-gray-900 mt-1">{detailItem.originalName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Taille</label>
                      <p className="text-sm text-gray-900 mt-1">{formatFileSize(detailItem.size)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Type</label>
                      <p className="text-sm text-gray-900 mt-1">{detailItem.mimeType}</p>
                    </div>
                  </div>

                  {detailItem.width && detailItem.height && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Dimensions</label>
                      <p className="text-sm text-gray-900 mt-1">{detailItem.width} x {detailItem.height}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-500">Dossier</label>
                    <p className="text-sm text-gray-900 mt-1">{detailItem.folder || 'Aucun'}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500">URL</label>
                    <Input
                      value={detailItem.url}
                      readOnly
                      className="mt-1 text-xs"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).select()
                        navigator.clipboard.writeText(detailItem.url)
                        toast.success('URL copiée')
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    onClick={() => handleDeleteClick(detailItem)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setItemToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'image ?"
        message="Cette action est irréversible. L'image sera définitivement supprimée."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </DashboardLayout>
  )
}
