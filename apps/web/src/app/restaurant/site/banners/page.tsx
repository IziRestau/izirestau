'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import type { BannerData } from '@/components/restaurant/site'
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Layout,
  MoreHorizontal,
  Search,
  ArrowUpDown,
  Copy,
  Minus,
} from 'lucide-react'

const PAGE_LABELS: Record<string, string> = {
  home: 'Accueil',
  menu: 'Menu',
  contact: 'Contact',
  all: 'Toutes',
}

const POSITION_LABELS: Record<string, string> = {
  top: 'Bandeau haut',
  hero: 'Hero',
  between: 'Entre sections',
  bottom: 'Bas de page',
}

const DISPLAY_TYPE_LABELS: Record<string, string> = {
  strip: 'Bande',
  banner: 'Large',
}

type SortKey = 'title' | 'position' | 'pages' | 'status'
type SortDir = 'asc' | 'desc'

export default function BannersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const primaryColor = organization?.primaryColor || '#10b981'

  const [deleteTarget, setDeleteTarget] = useState<BannerData | null>(null)
  const [toggleActiveTarget, setToggleActiveTarget] = useState<BannerData | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<BannerData | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [positionFilter, setPositionFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: banners, isLoading } = useQuery<BannerData[]>({
    queryKey: ['restaurant-site-banners', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.site.banners.list()
      return res.data as BannerData[]
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const filteredBanners = useMemo(() => {
    if (!banners) return []
    let result = [...banners]

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (b) => (b.title || '').toLowerCase().includes(q) || (b.subtitle || '').toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((b) =>
        statusFilter === 'active' ? b.isActive : !b.isActive
      )
    }

    if (positionFilter !== 'all') {
      result = result.filter((b) => b.position === positionFilter)
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = (a.title || '').localeCompare(b.title || '')
          break
        case 'position':
          cmp = a.position.localeCompare(b.position)
          break
        case 'pages':
          cmp = a.pages.length - b.pages.length
          break
        case 'status':
          cmp = (a.isActive ? 0 : 1) - (b.isActive ? 0 : 1)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [banners, debouncedSearch, statusFilter, positionFilter, sortKey, sortDir])

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.banners.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-banners'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-overview'] })
      toast.success('Bannière supprimée')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.banners.update(id, { isActive })
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-banners'] })
      toast.success(vars.isActive ? 'Bannière activée' : 'Bannière désactivée')
      setToggleActiveTarget(null)
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
      setToggleActiveTarget(null)
    },
  })

  const openCreate = () => router.push('/restaurant/site/banners/new')
  const openEdit = (banner: BannerData) => router.push(`/restaurant/site/banners/${banner.id}`)

  const duplicateMutation = useMutation({
    mutationFn: async (banner: BannerData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.banners.create({
        displayType: banner.displayType,
        contentMode: banner.contentMode,
        title: banner.title ? `${banner.title} (copie)` : 'Sans titre (copie)',
        subtitle: banner.subtitle ?? undefined,
        image: banner.image ?? undefined,
        ctaText: banner.ctaText ?? undefined,
        ctaLink: banner.ctaLink ?? undefined,
        couponId: banner.couponId ?? undefined,
        isActive: false,
        pages: banner.pages,
        position: banner.position,
        dismissable: banner.dismissable,
        sticky: banner.sticky,
        styles: (banner.styles as Record<string, unknown>) ?? undefined,
        startDate: banner.startDate ?? undefined,
        endDate: banner.endDate ?? undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-banners'] })
      toast.success('Bannière dupliquée')
      setDuplicateTarget(null)
    },
    onError: () => {
      toast.error('Erreur lors de la duplication')
      setDuplicateTarget(null)
    },
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (isLoading && !banners) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Bannières"
        variant="list"
      />
    )
  }

  const activeCount = banners?.filter(b => b.isActive).length || 0

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <PageHeader
        title="Bannières"
        subtitle="Gérez les bannières du carrousel de votre site"
        icon={ImageIcon}
        badge={{ text: `${banners?.length || 0} bannières`, variant: 'default' }}
        actions={
          <Button
            size="sm"
            className="text-white h-9 rounded-xl gap-1.5 text-xs"
            style={{ backgroundColor: primaryColor }}
            onClick={openCreate}
          >
            <Plus size={14} />
            Nouvelle bannière
          </Button>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden max-w-full">
        {banners && banners.length > 0 && (
          <div className="p-4 sm:p-5 border-b border-gray-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-3 overflow-hidden">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher une bannière..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    className="w-full sm:w-36 h-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0 min-w-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  >
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="inactive">Inactives</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger
                    className="w-full sm:w-36 h-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0 min-w-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  >
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    <SelectItem value="all">Toutes positions</SelectItem>
                    <SelectItem value="top">Bandeau haut</SelectItem>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="between">Entre sections</SelectItem>
                    <SelectItem value="bottom">Bas de page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {activeCount > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {activeCount}/10 bannières actives
              </p>
            )}
          </div>
        )}

        {!banners || banners.length === 0 ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ImageIcon size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune bannière</h3>
            <p className="text-sm text-gray-500 max-w-md mb-4">
              Ajoutez des bannières pour personnaliser le carrousel de votre site.
            </p>
            <Button
              size="sm"
              className="text-white rounded-xl gap-1.5"
              style={{ backgroundColor: primaryColor }}
              onClick={openCreate}
            >
              <Plus size={14} />
              Créer une bannière
            </Button>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Aucun résultat</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Aucune bannière ne correspond à vos critères de recherche.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_120px_140px_90px_44px] gap-3 items-center px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <button
                onClick={() => handleSort('title')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                Bannière
                <ArrowUpDown size={12} className={sortKey === 'title' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <button
                onClick={() => handleSort('position')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                Position
                <ArrowUpDown size={12} className={sortKey === 'position' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <button
                onClick={() => handleSort('pages')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                Pages
                <ArrowUpDown size={12} className={sortKey === 'pages' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <button
                onClick={() => handleSort('status')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                Statut
                <ArrowUpDown size={12} className={sortKey === 'status' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <span />
            </div>

            {/* List */}
            <div className="divide-y divide-gray-50">
              {filteredBanners.map((banner) => (
                <div key={banner.id}>
                  {/* Desktop row */}
                  <div className="hidden lg:grid lg:grid-cols-[1fr_120px_140px_90px_44px] gap-3 items-center px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                      {banner.image ? (
                        <div className="w-16 h-11 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={banner.image}
                            alt={banner.title || 'Bannière'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-11 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                          <Minus size={14} style={{ color: primaryColor }} />
                        </div>
                      )}
                      <div className="min-w-0 flex items-center gap-2 overflow-hidden">
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900 truncate">{banner.title || 'Sans titre'}</p>
                            <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-500 flex-shrink-0">
                              {DISPLAY_TYPE_LABELS[banner.displayType] || banner.displayType}
                            </span>
                          </div>
                          {banner.subtitle && (
                            <p className="text-[11px] text-gray-400 truncate">{banner.subtitle}</p>
                          )}
                        </div>
                        <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => openEdit(banner)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors hover:bg-gray-100"
                            style={{ color: primaryColor }}
                          >
                            <Pencil size={9} />
                            Modifier
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500 font-medium">
                        <Layout size={9} />
                        {POSITION_LABELS[banner.position] || banner.position}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {banner.pages.map((page) => (
                        <span
                          key={page}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                        >
                          {PAGE_LABELS[page] || page}
                        </span>
                      ))}
                    </div>
                    <div>
                      {banner.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium">
                          <Eye size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-medium">
                          <EyeOff size={12} />
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${primaryColor}15`
                              e.currentTarget.style.color = primaryColor
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = ''
                              e.currentTarget.style.color = ''
                            }}
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                          <DropdownMenuItem
                            onClick={() => openEdit(banner)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <Pencil size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Modifier</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDuplicateTarget(banner)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <Copy size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Dupliquer</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            onClick={() => setToggleActiveTarget(banner)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            {banner.isActive ? (
                              <>
                                <EyeOff size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Désactiver</span>
                              </>
                            ) : (
                              <>
                                <Eye size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Activer</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(banner)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                          >
                            <Trash2 size={16} className="mr-3" />
                            <span className="text-[13px]">Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Mobile/Tablet card */}
                  <div className="lg:hidden p-3 sm:p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {banner.image ? (
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={banner.image}
                            alt={banner.title || 'Bannière'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                          <Minus size={12} style={{ color: primaryColor }} />
                        </div>
                      )}
                      <div className="flex-1 w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{banner.title || 'Sans titre'}</p>
                          {banner.isActive ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 font-medium">
                            <Layout size={8} />
                            {POSITION_LABELS[banner.position] || banner.position}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {banner.pages.map((page) => (
                            <span
                              key={page}
                              className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium"
                              style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                            >
                              {PAGE_LABELS[page] || page}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => openEdit(banner)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                      >
                        <Pencil size={14} />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg transition-colors flex-shrink-0"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${primaryColor}15`
                              e.currentTarget.style.color = primaryColor
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = ''
                              e.currentTarget.style.color = ''
                            }}
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
                          <DropdownMenuItem
                            onClick={() => openEdit(banner)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <Pencil size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Modifier</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDuplicateTarget(banner)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            <Copy size={16} className="mr-3 text-gray-400" />
                            <span className="text-[13px] text-gray-700">Dupliquer</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            onClick={() => setToggleActiveTarget(banner)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                          >
                            {banner.isActive ? (
                              <>
                                <EyeOff size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Désactiver</span>
                              </>
                            ) : (
                              <>
                                <Eye size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Activer</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(banner)}
                            className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                          >
                            <Trash2 size={16} className="mr-3" />
                            <span className="text-[13px]">Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Supprimer la bannière"
        message={`Êtes-vous sûr de vouloir supprimer la bannière "${deleteTarget?.title || 'Sans titre'}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        icon="trash"
      />

      <ConfirmModal
        isOpen={!!duplicateTarget}
        onClose={() => setDuplicateTarget(null)}
        onConfirm={() => duplicateTarget && duplicateMutation.mutate(duplicateTarget)}
        title="Dupliquer la bannière"
        message={`Êtes-vous sûr de vouloir dupliquer la bannière "${duplicateTarget?.title || 'Sans titre'}" ? La copie sera créée en tant qu'inactive.`}
        confirmText="Dupliquer"
        cancelText="Annuler"
        variant="info"
        icon="alert"
        isLoading={duplicateMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!toggleActiveTarget}
        onClose={() => setToggleActiveTarget(null)}
        onConfirm={() => {
          if (toggleActiveTarget) {
            toggleActiveMutation.mutate({ id: toggleActiveTarget.id, isActive: !toggleActiveTarget.isActive })
          }
        }}
        title={toggleActiveTarget?.isActive ? 'Désactiver la bannière' : 'Activer la bannière'}
        message={
          toggleActiveTarget?.isActive
            ? `Êtes-vous sûr de vouloir désactiver la bannière "${toggleActiveTarget?.title || 'Sans titre'}" ? Elle ne sera plus visible sur le site.`
            : `Êtes-vous sûr de vouloir activer la bannière "${toggleActiveTarget?.title || 'Sans titre'}" ? Elle sera visible sur le site.`
        }
        confirmText={toggleActiveTarget?.isActive ? 'Désactiver' : 'Activer'}
        cancelText="Annuler"
        variant={toggleActiveTarget?.isActive ? 'warning' : 'success'}
        icon={toggleActiveTarget?.isActive ? 'pause' : 'play'}
        isLoading={toggleActiveMutation.isPending}
      />
    </DashboardLayout>
  )
}
