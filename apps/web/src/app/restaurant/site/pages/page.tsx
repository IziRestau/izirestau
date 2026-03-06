'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import { loadThemeComponents } from '@/components/storefront/themes/_registry'
import type { ThemeComponents } from '@/components/storefront/themes/_types'
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
import { PageFormModal, QuickEditPanel, type StorePageData } from '@/components/restaurant/site'
import {
  FileText,
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Navigation,
  NavigationOff,
  Lock,
  Home,
  UtensilsCrossed,
  Phone,
  MoreHorizontal,
  Search,
  ArrowUpDown,
  ExternalLink,
  Settings2,
  SlidersHorizontal,
  Check,
  AlertCircle,
  BarChart3,
  ShoppingCart,
  CheckCircle,
  LogIn,
  UserPlus,
  User,
  MapPin,
} from 'lucide-react'

type SortKey = 'title' | 'slug' | 'type' | 'seo' | 'views' | 'status' | 'nav'
type SortDir = 'asc' | 'desc'

function getPageIcon(pageType: string | null): typeof Home {
  if (pageType === 'home') return Home
  if (pageType === 'menu') return UtensilsCrossed
  if (pageType === 'contact') return Phone
  if (pageType === 'checkout') return ShoppingCart
  if (pageType === 'thanks') return CheckCircle
  if (pageType === 'track') return MapPin
  if (pageType === 'login') return LogIn
  if (pageType === 'register') return UserPlus
  if (pageType === 'account') return User
  return FileText
}

export default function SitePagesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const primaryColor = organization?.primaryColor || '#10b981'

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<StorePageData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StorePageData | null>(null)
  const [quickEditPage, setQuickEditPage] = useState<StorePageData | null>(null)
  const [toggleActiveTarget, setToggleActiveTarget] = useState<StorePageData | null>(null)
  const [toggleNavTarget, setToggleNavTarget] = useState<StorePageData | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [themeComponents, setThemeComponents] = useState<ThemeComponents | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: settingsData } = useQuery({
    queryKey: ['restaurant-settings', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getSettings(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  const themeId = settingsData?.theme?.baseTheme || 'default'

  useEffect(() => {
    loadThemeComponents(themeId).then(setThemeComponents)
  }, [themeId])

  const supportedPages = themeComponents?.supportedPages || ['home', 'menu', 'contact', 'custom']

  const { data: pages, isLoading } = useQuery({
    queryKey: ['restaurant-site-pages', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.site.pages.list()
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
  })

  const filteredPages = useMemo(() => {
    if (!pages) return []
    // Filtrer les pages non supportées par le thème actif
    let result = pages.filter(p => supportedPages.includes(p.pageType || 'custom'))

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) =>
        statusFilter === 'active' ? p.isActive : !p.isActive
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter((p) =>
        typeFilter === 'default' ? p.isDefault : !p.isDefault
      )
    }

    result.sort((a, b) => {
      let cmp = 0
      const hasSeoA = !!(a.metaTitle || a.metaDescription)
      const hasSeoB = !!(b.metaTitle || b.metaDescription)
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'slug':
          cmp = a.slug.localeCompare(b.slug)
          break
        case 'type':
          cmp = (a.isDefault ? 0 : 1) - (b.isDefault ? 0 : 1)
          break
        case 'seo':
          cmp = (hasSeoA ? 0 : 1) - (hasSeoB ? 0 : 1)
          break
        case 'views':
          cmp = (a.views ?? 0) - (b.views ?? 0)
          break
        case 'status':
          cmp = (a.isActive ? 0 : 1) - (b.isActive ? 0 : 1)
          break
        case 'nav':
          cmp = (a.showInNav ? 0 : 1) - (b.showInNav ? 0 : 1)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [pages, debouncedSearch, statusFilter, typeFilter, sortKey, sortDir, supportedPages])

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.pages.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-pages'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-overview'] })
      toast.success('Page supprimée')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.pages.update(id, { isActive })
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-pages'] })
      toast.success(vars.isActive ? 'Page publiée' : 'Page mise en brouillon')
      setToggleActiveTarget(null)
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
      setToggleActiveTarget(null)
    },
  })

  const toggleNavMutation = useMutation({
    mutationFn: async ({ id, showInNav }: { id: string; showInNav: boolean }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.pages.update(id, { showInNav })
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-pages'] })
      toast.success(vars.showInNav ? 'Ajoutée à la navigation' : 'Retirée de la navigation')
      setToggleNavTarget(null)
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
      setToggleNavTarget(null)
    },
  })

  const canDeactivate = (page: StorePageData) => {
    return !(page.isDefault && (page.pageType === 'home' || page.pageType === 'menu'))
  }

  const openCreate = () => {
    setEditingPage(null)
    setIsFormOpen(true)
  }

  const openEdit = (page: StorePageData) => {
    if (page.isDefault) {
      router.push(`/restaurant/site/pages/${page.id}`)
    } else {
      setEditingPage(page)
      setIsFormOpen(true)
    }
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingPage(null)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (isLoading && !pages) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Pages"
        variant="list"
      />
    )
  }

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
        title="Pages"
        subtitle="Créez et gérez les pages de votre site"
        icon={FileText}
        badge={{ text: `${pages?.length || 0} pages`, variant: 'default' }}
        actions={
          <Button
            size="sm"
            className="text-white h-9 rounded-xl gap-1.5 text-xs"
            style={{ backgroundColor: primaryColor }}
            onClick={openCreate}
          >
            <Plus size={14} />
            Nouvelle page
          </Button>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Barre de recherche et filtres */}
        {pages && pages.length > 0 && (
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher une page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    className="w-full sm:w-36 h-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  >
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Publiées</SelectItem>
                    <SelectItem value="draft">Brouillons</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger
                    className="w-full sm:w-36 h-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  >
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="default">Par défaut</SelectItem>
                    <SelectItem value="custom">Personnalisées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {!pages || pages.length === 0 ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune page</h3>
            <p className="text-sm text-gray-500 max-w-md mb-4">
              Créez des pages personnalisées pour votre site (À propos, Mentions légales, etc.).
            </p>
            <Button
              size="sm"
              className="text-white rounded-xl gap-1.5"
              style={{ backgroundColor: primaryColor }}
              onClick={openCreate}
            >
              <Plus size={14} />
              Créer une page
            </Button>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Aucun résultat</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Aucune page ne correspond à vos critères de recherche.
            </p>
          </div>
        ) : (
          <>
            {/* En-tête du tableau - Desktop */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_140px_100px_70px_70px_90px_70px_44px] gap-3 items-center px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <button
                onClick={() => handleSort('title')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                Nom
                <ArrowUpDown size={12} className={sortKey === 'title' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <button
                onClick={() => handleSort('slug')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                Slug
                <ArrowUpDown size={12} className={sortKey === 'slug' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <button
                onClick={() => handleSort('type')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                Type
                <ArrowUpDown size={12} className={sortKey === 'type' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <button
                onClick={() => handleSort('seo')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                SEO
                <ArrowUpDown size={12} className={sortKey === 'seo' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <button
                onClick={() => handleSort('views')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                Vues
                <ArrowUpDown size={12} className={sortKey === 'views' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <button
                onClick={() => handleSort('status')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                Statut
                <ArrowUpDown size={12} className={sortKey === 'status' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <button
                onClick={() => handleSort('nav')}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                Nav
                <ArrowUpDown size={12} className={sortKey === 'nav' ? 'text-gray-700' : 'text-gray-300'} />
              </button>
              <span />
            </div>

            {/* Liste */}
            <div className="divide-y divide-gray-50">
              {filteredPages.map((page) => {
                const PageIcon = getPageIcon(page.pageType)
                const pageCanDeactivate = canDeactivate(page)
                return (
                  <div key={page.id}>
                    {/* Desktop row */}
                    <div
                      className="hidden lg:grid lg:grid-cols-[1fr_140px_100px_70px_70px_90px_70px_44px] gap-3 items-center px-5 py-3.5 hover:bg-gray-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: page.isDefault ? `${primaryColor}10` : '#f3f4f6' }}
                        >
                          <PageIcon size={16} style={{ color: page.isDefault ? primaryColor : '#9ca3af' }} />
                        </div>
                        <div className="min-w-0 flex items-center gap-2 overflow-hidden">
                          <p className="text-sm font-medium text-gray-900 truncate">{page.title}</p>
                          <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => openEdit(page)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors hover:bg-gray-100"
                              style={{ color: primaryColor }}
                            >
                              <Pencil size={9} />
                              Modifier
                            </button>
                            <span className="text-gray-200">|</span>
                            <button
                              onClick={() => setQuickEditPage(page)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 transition-colors hover:bg-gray-100"
                            >
                              Modification rapide
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 font-mono truncate">/{page.slug}</p>
                      </div>
                      <div>
                        {page.isDefault ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                            <Lock size={9} />
                            Par défaut
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Personnalisée</span>
                        )}
                      </div>
                      <div>
                        {(page.metaTitle || page.metaDescription) ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-medium">
                            <Check size={9} />
                            Oui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium">
                            <AlertCircle size={9} />
                            Non
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <BarChart3 size={11} className="text-gray-400" />
                          {page.views ?? 0}
                        </span>
                      </div>
                      <div>
                        {page.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium">
                            <Eye size={12} />
                            Publiée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-medium">
                            <EyeOff size={12} />
                            Brouillon
                          </span>
                        )}
                      </div>
                      <div>
                        {page.showInNav ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium">
                            <Navigation size={9} />
                            Oui
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">Non</span>
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
                              onClick={() => router.push(`/restaurant/site/pages/${page.id}`)}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Settings2 size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Personnaliser les sections</span>
                            </DropdownMenuItem>
                            {!page.isDefault && (
                              <DropdownMenuItem
                                onClick={() => router.push(`/restaurant/site/pages/${page.id}`)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Pencil size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Modifier</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setQuickEditPage(page)}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <SlidersHorizontal size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Modification rapide</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const url = `${window.location.origin}/store/${page.slug}`
                                window.open(url, '_blank')
                              }}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <ExternalLink size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Voir sur le site</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            {pageCanDeactivate && (
                              <DropdownMenuItem
                                onClick={() => setToggleActiveTarget(page)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                {page.isActive ? (
                                  <>
                                    <EyeOff size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Mettre en brouillon</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Publier</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setToggleNavTarget(page)}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              {page.showInNav ? (
                                <>
                                  <NavigationOff size={16} className="mr-3 text-gray-400" />
                                  <span className="text-[13px] text-gray-700">Retirer de la navigation</span>
                                </>
                              ) : (
                                <>
                                  <Navigation size={16} className="mr-3 text-gray-400" />
                                  <span className="text-[13px] text-gray-700">Ajouter à la navigation</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            {!page.isDefault && (
                              <>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(page)}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                                >
                                  <Trash2 size={16} className="mr-3" />
                                  <span className="text-[13px]">Supprimer</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Mobile/Tablet card */}
                    <div className="lg:hidden p-3 sm:p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: page.isDefault ? `${primaryColor}10` : '#f3f4f6' }}
                        >
                          <PageIcon size={16} style={{ color: page.isDefault ? primaryColor : '#9ca3af' }} />
                        </div>
                        <div className="flex-1 w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900 truncate">{page.title}</p>
                            {page.isActive ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-gray-400 font-mono truncate">/{page.slug}</p>
                            {page.isDefault && (
                              <span className="text-[10px] font-medium" style={{ color: primaryColor }}>Par défaut</span>
                            )}
                            {page.showInNav && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 font-medium">
                                <Navigation size={8} />
                                Nav
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {(page.metaTitle || page.metaDescription) ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                                <Check size={8} />
                                SEO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
                                <AlertCircle size={8} />
                                SEO
                              </span>
                            )}
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                              <BarChart3 size={8} />
                              {page.views ?? 0} vues
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => openEdit(page)}
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
                              onClick={() => router.push(`/restaurant/site/pages/${page.id}`)}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <Settings2 size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Personnaliser les sections</span>
                            </DropdownMenuItem>
                            {!page.isDefault && (
                              <DropdownMenuItem
                                onClick={() => router.push(`/restaurant/site/pages/${page.id}`)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                <Pencil size={16} className="mr-3 text-gray-400" />
                                <span className="text-[13px] text-gray-700">Modifier</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setQuickEditPage(page)}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              <SlidersHorizontal size={16} className="mr-3 text-gray-400" />
                              <span className="text-[13px] text-gray-700">Modification rapide</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            {pageCanDeactivate && (
                              <DropdownMenuItem
                                onClick={() => setToggleActiveTarget(page)}
                                className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                              >
                                {page.isActive ? (
                                  <>
                                    <EyeOff size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Mettre en brouillon</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye size={16} className="mr-3 text-gray-400" />
                                    <span className="text-[13px] text-gray-700">Publier</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setToggleNavTarget(page)}
                              className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50"
                            >
                              {page.showInNav ? (
                                <>
                                  <NavigationOff size={16} className="mr-3 text-gray-400" />
                                  <span className="text-[13px] text-gray-700">Retirer de la navigation</span>
                                </>
                              ) : (
                                <>
                                  <Navigation size={16} className="mr-3 text-gray-400" />
                                  <span className="text-[13px] text-gray-700">Ajouter à la navigation</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            {!page.isDefault && (
                              <>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(page)}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                                >
                                  <Trash2 size={16} className="mr-3" />
                                  <span className="text-[13px]">Supprimer</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <PageFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        page={editingPage}
        primaryColor={primaryColor}
      />

      <QuickEditPanel
        isOpen={!!quickEditPage}
        onClose={() => setQuickEditPage(null)}
        page={quickEditPage}
        primaryColor={primaryColor}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Supprimer la page"
        message={`Êtes-vous sûr de vouloir supprimer la page "${deleteTarget?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        icon="trash"
      />

      <ConfirmModal
        isOpen={!!toggleActiveTarget}
        onClose={() => setToggleActiveTarget(null)}
        onConfirm={() => {
          if (toggleActiveTarget) {
            toggleActiveMutation.mutate({ id: toggleActiveTarget.id, isActive: !toggleActiveTarget.isActive })
          }
        }}
        title={toggleActiveTarget?.isActive ? 'Mettre en brouillon' : 'Publier la page'}
        message={
          toggleActiveTarget?.isActive
            ? `Êtes-vous sûr de vouloir mettre la page "${toggleActiveTarget?.title}" en brouillon ? Elle ne sera plus visible sur le site.`
            : `Êtes-vous sûr de vouloir publier la page "${toggleActiveTarget?.title}" ? Elle sera visible sur le site.`
        }
        confirmText={toggleActiveTarget?.isActive ? 'Mettre en brouillon' : 'Publier'}
        cancelText="Annuler"
        variant={toggleActiveTarget?.isActive ? 'warning' : 'success'}
        icon={toggleActiveTarget?.isActive ? 'pause' : 'play'}
        isLoading={toggleActiveMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!toggleNavTarget}
        onClose={() => setToggleNavTarget(null)}
        onConfirm={() => {
          if (toggleNavTarget) {
            toggleNavMutation.mutate({ id: toggleNavTarget.id, showInNav: !toggleNavTarget.showInNav })
          }
        }}
        title={toggleNavTarget?.showInNav ? 'Retirer de la navigation' : 'Ajouter à la navigation'}
        message={
          toggleNavTarget?.showInNav
            ? `Êtes-vous sûr de vouloir retirer "${toggleNavTarget?.title}" de la navigation du site ?`
            : `Êtes-vous sûr de vouloir ajouter "${toggleNavTarget?.title}" à la navigation du site ?`
        }
        confirmText={toggleNavTarget?.showInNav ? 'Retirer' : 'Ajouter'}
        cancelText="Annuler"
        variant={toggleNavTarget?.showInNav ? 'warning' : 'info'}
        icon="alert"
        isLoading={toggleNavMutation.isPending}
      />
    </DashboardLayout>
  )
}
