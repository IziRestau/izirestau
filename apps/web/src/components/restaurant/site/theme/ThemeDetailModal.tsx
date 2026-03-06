'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Star,
  Download,
  Check,
  Loader2,
  ExternalLink,
  Trash2,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface ThemeDetailModalProps {
  slug: string
  isOpen: boolean
  onClose: () => void
}

export function ThemeDetailModal({ slug, isOpen, onClose }: ThemeDetailModalProps) {
  const { accessToken } = useAuthStore()
  const { organization } = useRestaurantStore()
  const primaryColor = organization?.primaryColor || '#10b981'
  const queryClient = useQueryClient()
  const [previewIndex, setPreviewIndex] = useState(0)

  const { data: theme, isLoading: isLoadingTheme } = useQuery({
    queryKey: ['theme-detail', slug],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.site.themes.getBySlug(slug)
      return res.data
    },
    enabled: !!accessToken && !!slug && isOpen,
    staleTime: 2 * 60 * 1000,
  })

  const installMutation = useMutation({
    mutationFn: async (slug: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.themes.install(slug)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['themes-installed'] })
      toast.success('Thème installé')
    },
    onError: () => toast.error('Erreur lors de l\'installation'),
  })

  const activateMutation = useMutation({
    mutationFn: async (slug: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.themes.activate(slug)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['themes-installed'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] })
      toast.success('Thème activé')
      onClose()
    },
    onError: () => toast.error('Erreur lors de l\'activation'),
  })

  const uninstallMutation = useMutation({
    mutationFn: async (slug: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.themes.uninstall(slug)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['themes-installed'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] })
      toast.success('Thème désinstallé')
      onClose()
    },
    onError: () => toast.error('Erreur lors de la désinstallation'),
  })

  const isMutating = installMutation.isPending || activateMutation.isPending || uninstallMutation.isPending
  const images = theme ? (theme.previewImages.length > 0 ? theme.previewImages : (theme.thumbnailUrl ? [theme.thumbnailUrl] : [])) : []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoadingTheme || !theme ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <>
        <DialogHeader>
          <DialogTitle className="text-lg">{theme.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {images.length > 0 && (
            <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
              <img
                src={images[previewIndex]}
                alt={`${theme.name} preview ${previewIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === previewIndex ? 'bg-white' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {theme.isFeatured && (
              <Badge variant="secondary" className="text-xs" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Zap size={12} className="mr-1" /> Recommandé
              </Badge>
            )}
            {theme.isPremium ? (
              <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                Premium {theme.price ? `- ${theme.price.toLocaleString()} F` : ''}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                Gratuit
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">{theme.category}</Badge>
            <span className="text-xs text-gray-400">v{theme.version} par {theme.author}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              {theme.rating.toFixed(1)} ({theme.ratingCount})
            </span>
            <span className="flex items-center gap-1">
              <Download size={14} />
              {theme.installCount} installations
            </span>
          </div>

          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {theme.description}
          </div>

          {theme.features.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fonctionnalités</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {theme.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} style={{ color: primaryColor }} />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {theme.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {theme.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs font-normal">{tag}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            {theme.demoUrl && (
              <Button variant="outline" size="sm" className="rounded-xl gap-2" asChild>
                <a href={theme.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} /> Voir la démo
                </a>
              </Button>
            )}

            <div className="flex-1" />

            {theme.isInstalled && !theme.isActive && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2 text-red-600 border-red-200 hover:bg-red-50"
                disabled={isMutating}
                onClick={() => uninstallMutation.mutate(theme.slug)}
              >
                {uninstallMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Désinstaller
              </Button>
            )}

            {!theme.isInstalled && (
              <Button
                size="sm"
                className="rounded-xl gap-2 text-white"
                style={{ backgroundColor: primaryColor }}
                disabled={isMutating}
                onClick={() => installMutation.mutate(theme.slug)}
              >
                {installMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Installer
              </Button>
            )}

            {theme.isInstalled && !theme.isActive && (
              <Button
                size="sm"
                className="rounded-xl gap-2 text-white"
                style={{ backgroundColor: primaryColor }}
                disabled={isMutating}
                onClick={() => activateMutation.mutate(theme.slug)}
              >
                {activateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                Activer
              </Button>
            )}

            {theme.isInstalled && theme.isActive && (
              <Badge className="text-white px-3 py-1.5" style={{ backgroundColor: primaryColor }}>
                <Check size={14} className="mr-1" /> Thème actif
              </Badge>
            )}
          </div>
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
