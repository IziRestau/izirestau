'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Palette,
  Search,
  Star,
  Download,
  Crown,
  ArrowLeft,
  Check,
  Sparkles,
  Layers,
  Eye,
} from 'lucide-react'
import { ThemeDetailPanel } from '@/components/restaurant/site/theme'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface CatalogTheme {
  id: string
  slug: string
  name: string
  shortDescription: string | null
  thumbnailUrl: string | null
  category: string
  tags: string[]
  isPremium: boolean
  price: number | null
  isFeatured: boolean
  installCount: number
  rating: number
  ratingCount: number
  features: string[]
}

const CATEGORIES = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'FAST_FOOD', label: 'Fast-food' },
  { value: 'CAFE', label: 'Café' },
  { value: 'BAKERY', label: 'Boulangerie' },
  { value: 'FINE_DINING', label: 'Gastronomie' },
  { value: 'FOOD_TRUCK', label: 'Food truck' },
  { value: 'UNIVERSAL', label: 'Universel' },
]

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

export default function ThemeCatalogPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const primaryColor = organization?.primaryColor || '#10b981'
  const primaryBgLight = hexToRgba(primaryColor, 0.1)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [premiumFilter, setPremiumFilter] = useState('all')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const { data: themes, isLoading } = useQuery({
    queryKey: ['theme-catalog', category, premiumFilter, search],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const params: Record<string, string> = {}
      if (category !== 'all') params.category = category
      if (premiumFilter !== 'all') params.isPremium = premiumFilter
      if (search.trim()) params.search = search.trim()
      const res = await api.restaurant.site.themes.catalog(params)
      return res.data as CatalogTheme[]
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  const { data: installedThemes } = useQuery({
    queryKey: ['installed-themes'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.site.themes.installed()
      return res.data
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  const installedSlugs = new Set(installedThemes?.map((t) => t.theme.slug) || [])
  const activeSlugs = new Set(
    installedThemes?.filter((t) => t.isActive).map((t) => t.theme.slug) || []
  )

  const activeTheme = installedThemes?.find((t) => t.isActive)
  const totalInstalled = installedThemes?.length || 0
  const totalAvailable = themes?.length || 0

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Catalogue de thèmes"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: primaryBgLight }}
          >
            <Palette size={24} style={{ color: primaryColor }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Catalogue de thèmes</h1>
              {totalAvailable > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {totalAvailable} {totalAvailable > 1 ? 'thèmes' : 'thème'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">Parcourez et installez des thèmes pour personnaliser votre site</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-11 rounded-xl transition-colors gap-2"
          onClick={() => router.push('/restaurant/site/theme')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = primaryBgLight
            e.currentTarget.style.borderColor = primaryColor
            e.currentTarget.style.color = primaryColor
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ''
            e.currentTarget.style.borderColor = ''
            e.currentTarget.style.color = ''
          }}
        >
          <ArrowLeft size={16} />
          Retour à l&apos;apparence
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: primaryBgLight }}
          >
            <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{activeTheme?.theme.name || 'Aucun'}</div>
            <div className="text-sm text-gray-500">Thème actif</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50">
            <Download className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalInstalled}</div>
            <div className="text-sm text-gray-500">{totalInstalled > 1 ? 'Thèmes installés' : 'Thème installé'}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-violet-50">
            <Layers className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalAvailable}</div>
            <div className="text-sm text-gray-500">{totalAvailable > 1 ? 'Thèmes disponibles' : 'Thème disponible'}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un thème..."
              className="pl-9 h-10 rounded-xl text-sm border-gray-200 focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-10 rounded-xl text-sm w-full sm:w-48 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={premiumFilter} onValueChange={setPremiumFilter}>
            <SelectTrigger className="h-10 rounded-xl text-sm w-full sm:w-40 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="false">Gratuits</SelectItem>
              <SelectItem value="true">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Theme Grid */}
      <div>
        {!themes || themes.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: primaryBgLight }}
            >
              <Palette size={28} style={{ color: primaryColor }} />
            </div>
            <p className="text-sm font-semibold text-gray-900">Aucun thème trouvé</p>
            <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto">
              Essayez de modifier vos filtres de recherche pour trouver le thème idéal
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {themes.map((theme) => {
              const isInstalled = installedSlugs.has(theme.slug)
              const isActive = activeSlugs.has(theme.slug)
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedSlug(theme.slug)}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden text-left hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video bg-gray-100">
                    {theme.thumbnailUrl ? (
                      <img
                        src={theme.thumbnailUrl}
                        alt={theme.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-gray-50 to-gray-100">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: primaryBgLight }}
                        >
                          <Eye size={18} style={{ color: primaryColor }} />
                        </div>
                        <span className="text-[10px] text-gray-400">Aperçu non disponible</span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

                    {isActive && (
                      <div
                        className="absolute top-2 left-2 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Check size={10} />
                        Actif
                      </div>
                    )}
                    {isInstalled && !isActive && (
                      <div className="absolute top-2 left-2 bg-white text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <Download size={10} />
                        Installé
                      </div>
                    )}
                    {theme.isPremium && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Crown size={10} />
                        Premium
                      </div>
                    )}
                    {theme.isFeatured && !theme.isPremium && (
                      <div
                        className="absolute top-2 right-2 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Recommandé
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{theme.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {theme.shortDescription || 'Aucune description'}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                      <div className="flex items-center gap-2.5">
                        {theme.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            {theme.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                          <Download size={11} />
                          {theme.installCount}
                        </span>
                      </div>
                      {!theme.isPremium ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">
                          Gratuit
                        </span>
                      ) : theme.price !== null ? (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ color: primaryColor, backgroundColor: primaryBgLight }}
                        >
                          {theme.price === 0 ? 'Gratuit' : `${theme.price} €`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <ThemeDetailPanel
        slug={selectedSlug}
        isOpen={!!selectedSlug}
        onClose={() => setSelectedSlug(null)}
      />
    </DashboardLayout>
  )
}
