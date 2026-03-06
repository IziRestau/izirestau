'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Star,
  Download,
  Check,
  Loader2,
  ExternalLink,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Crown,
  FileText,
  Tag,
  Info,
} from 'lucide-react'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const CATEGORY_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  FAST_FOOD: 'Fast-food',
  CAFE: 'Café',
  BAKERY: 'Boulangerie',
  FINE_DINING: 'Gastronomie',
  FOOD_TRUCK: 'Food truck',
  UNIVERSAL: 'Universel',
  BAR: 'Bar',
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Accueil',
  menu: 'Menu',
  contact: 'Contact',
  about: 'À propos',
  gallery: 'Galerie',
  custom: 'Personnalisée',
}

interface ThemeDetailPanelProps {
  slug: string | null
  isOpen: boolean
  onClose: () => void
}

export function ThemeDetailPanel({ slug, isOpen, onClose }: ThemeDetailPanelProps) {
  const { accessToken } = useAuthStore()
  const { organization } = useRestaurantStore()
  const primaryColor = organization?.primaryColor || '#10b981'
  const primaryBgLight = hexToRgba(primaryColor, 0.1)
  const queryClient = useQueryClient()
  const [previewIndex, setPreviewIndex] = useState(0)

  const { data: theme, isLoading: isLoadingTheme } = useQuery({
    queryKey: ['theme-detail', slug],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.site.themes.getBySlug(slug!)
      return res.data
    },
    enabled: !!accessToken && !!slug && isOpen,
    staleTime: 2 * 60 * 1000,
  })

  const installMutation = useMutation({
    mutationFn: async (s: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.themes.install(s)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['installed-themes'] })
      queryClient.invalidateQueries({ queryKey: ['theme-detail', slug] })
      toast.success('Thème installé avec succès')
    },
    onError: () => toast.error('Erreur lors de l\'installation'),
  })

  const activateMutation = useMutation({
    mutationFn: async (s: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.themes.activate(s)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['installed-themes'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] })
      queryClient.invalidateQueries({ queryKey: ['theme-detail', slug] })
      toast.success('Thème activé avec succès')
    },
    onError: () => toast.error('Erreur lors de l\'activation'),
  })

  const uninstallMutation = useMutation({
    mutationFn: async (s: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.themes.uninstall(s)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['installed-themes'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] })
      queryClient.invalidateQueries({ queryKey: ['theme-detail', slug] })
      toast.success('Thème désinstallé')
      onClose()
    },
    onError: () => toast.error('Erreur lors de la désinstallation'),
  })

  const isMutating = installMutation.isPending || activateMutation.isPending || uninstallMutation.isPending
  const images = theme ? (theme.previewImages.length > 0 ? theme.previewImages : (theme.thumbnailUrl ? [theme.thumbnailUrl] : [])) : []

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col [&>button]:hidden"
      >
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-500" />
            </button>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold text-gray-900 truncate">
                {theme?.name || 'Détails du thème'}
              </SheetTitle>
              {theme && (
                <p className="text-xs text-gray-500 mt-0.5">v{theme.version} par {theme.author}</p>
              )}
            </div>
            {theme && !theme.isInstalled && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 flex-shrink-0">
                Non installé
              </span>
            )}
            {theme?.isInstalled && theme?.isActive && (
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white flex items-center gap-1.5 flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Check size={11} />
                Actif
              </span>
            )}
            {theme?.isInstalled && !theme?.isActive && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                Installé
              </span>
            )}
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingTheme ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
              <p className="text-sm text-gray-400">Chargement du thème...</p>
            </div>
          ) : !theme ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: primaryBgLight }}
              >
                <Eye size={28} style={{ color: primaryColor }} />
              </div>
              <p className="text-sm font-medium text-gray-900">Thème non trouvé</p>
              <p className="text-xs text-gray-500 mt-1">Ce thème n&apos;est plus disponible</p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Image preview */}
              {images.length > 0 ? (
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={images[previewIndex]}
                    alt={`${theme.name} apercu ${previewIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewIndex((i) => (i - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewIndex((i) => (i + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setPreviewIndex(i)}
                            className="w-2 h-2 rounded-full transition-colors"
                            style={{ backgroundColor: i === previewIndex ? '#fff' : 'rgba(255,255,255,0.4)' }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center gap-2">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: primaryBgLight }}
                  >
                    <Eye size={24} style={{ color: primaryColor }} />
                  </div>
                  <span className="text-xs text-gray-400">Aperçu non disponible</span>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-1 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-600">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  {theme.rating.toFixed(1)} ({theme.ratingCount})
                </div>
                <div className="w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-600">
                  <Download size={13} className="text-gray-400" />
                  {theme.installCount} {theme.installCount > 1 ? 'installations' : 'installation'}
                </div>
                <div className="w-px h-4 bg-gray-200" />
                <div className="px-2.5 py-1.5 text-xs text-gray-500">
                  v{theme.version}
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100">
                {theme.isFeatured && (
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                    style={{ backgroundColor: primaryBgLight, color: primaryColor }}
                  >
                    <Sparkles size={12} />
                    Recommandé
                  </span>
                )}
                {theme.isPremium ? (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 flex items-center gap-1.5">
                    <Crown size={12} />
                    Premium {theme.price ? `- ${Number(theme.price).toLocaleString()} €` : ''}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600">
                    Gratuit
                  </span>
                )}
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                  {CATEGORY_LABELS[theme.category] || theme.category}
                </span>
              </div>

              {/* Description */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2.5">
                  <Info size={14} style={{ color: primaryColor }} />
                  <h3 className="text-sm font-semibold text-gray-900">Description</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {theme.description}
                </p>
              </div>

              {/* Fonctionnalités */}
              {theme.features.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Check size={14} style={{ color: primaryColor }} />
                    <h3 className="text-sm font-semibold text-gray-900">Fonctionnalités</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {theme.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: primaryBgLight }}
                        >
                          <Check size={11} style={{ color: primaryColor }} />
                        </div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pages supportées */}
              {theme.supportedPages.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={14} style={{ color: primaryColor }} />
                    <h3 className="text-sm font-semibold text-gray-900">Pages supportées</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {theme.supportedPages.map((page) => (
                      <span
                        key={page}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 capitalize"
                      >
                        {PAGE_LABELS[page] || page}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {theme.tags.length > 0 && (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={14} style={{ color: primaryColor }} />
                    <h3 className="text-sm font-semibold text-gray-900">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {theme.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-normal px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {theme && (
          <div className="px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0 space-y-2.5">
            {theme.demoUrl && (
              <Button
                variant="outline"
                className="w-full h-10 rounded-xl gap-2 border-gray-200 text-gray-700 hover:bg-gray-50"
                asChild
              >
                <a href={theme.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                  Voir la démo
                </a>
              </Button>
            )}

            <div className="flex gap-2">
              {!theme.isInstalled && (
                <Button
                  className="flex-1 h-11 rounded-xl gap-2 text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                  disabled={isMutating}
                  onClick={() => installMutation.mutate(theme.slug)}
                >
                  {installMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Installer
                </Button>
              )}

              {theme.isInstalled && !theme.isActive && (
                <>
                  <Button
                    className="flex-1 h-11 rounded-xl gap-2 text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                    disabled={isMutating}
                    onClick={() => activateMutation.mutate(theme.slug)}
                  >
                    {activateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Activer ce thème
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    disabled={isMutating}
                    onClick={() => uninstallMutation.mutate(theme.slug)}
                  >
                    {uninstallMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </Button>
                </>
              )}

              {theme.isInstalled && theme.isActive && (
                <div
                  className="flex-1 flex items-center justify-center h-11 rounded-xl text-white text-sm font-medium gap-2 shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Check size={16} />
                  Thème actif
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
