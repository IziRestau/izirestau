'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { ImageViewer } from '@/components/shared/ImageViewer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Clock,
  Flame,
  AlertTriangle,
  Leaf,
  Layers,
  Settings2,
  Eye,
  EyeOff,
  Star,
  Copy,
  Tag,
  Barcode,
  DollarSign,
  Info,
  Utensils,
} from 'lucide-react'
import {
  ALLERGEN_LABELS,
  DIETARY_TAG_LABELS,
  MODIFIER_TYPE_LABELS,
} from '@/types/menu'
import type { Product } from '@/types/menu'

const SIDEBAR_SECTIONS = [
  { id: 'general', label: 'General', icon: Info },
  { id: 'pricing', label: 'Tarification', icon: DollarSign },
  { id: 'nutrition', label: 'Nutrition', icon: Utensils },
  { id: 'variants', label: 'Variantes', icon: Layers },
  { id: 'modifiers', label: 'Options', icon: Settings2 },
]

export default function ProductViewPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurant, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const { format: formatCurrency } = useRestaurantCurrency()

  const primaryColor = organization?.primaryColor || '#10b981'
  const logoText = organization?.name || restaurant?.name || 'Restaurant'

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [activeSection, setActiveSection] = useState('general')

  const { data: product, isLoading } = useQuery({
    queryKey: ['restaurant-product', productId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const response = await api.restaurant.products.get(productId)
      return response.data as Product
    },
    enabled: !!productId && !!accessToken,
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.products.delete(productId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-products'] })
      toast.success('Produit supprimé')
      router.push('/restaurant/menu?tab=products')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const handleBack = () => {
    router.push('/restaurant/menu?tab=products')
  }

  const handleEdit = () => {
    router.push(`/restaurant/menu/products/${productId}`)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copie`)
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      const offset = 180
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Details du produit"
        variant="detail"
      />
    )
  }

  if (!product) {
    return (
      <DashboardLayout
        navigation={navigation}
        basePath="/restaurant"
        title="Produit non trouvé"
        logoText={logoText}
        primaryColor={primaryColor}
        restaurants={restaurants}
        currentRestaurantId={currentRestaurantId}
        onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
      >
        <div className="flex flex-col items-center justify-center py-20">
          <Package size={48} className="text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Produit non trouvé</p>
          <p className="text-sm text-gray-500 mb-4">Ce produit n'existe pas ou a été supprimé.</p>
          <Button onClick={handleBack} variant="outline" className="rounded-xl">
            <ArrowLeft size={16} className="mr-2" />
            Retour à la liste
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const allImages = [product.image, ...(product.images || [])].filter(Boolean) as string[]
  const margin = product.costPrice
    ? ((product.price - product.costPrice) / product.price * 100).toFixed(1)
    : null

  const hasVariants = product.variants && product.variants.length > 0
  const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0
  const hasNutrition = (product.allergens && product.allergens.length > 0) || 
                       (product.dietaryTags && product.dietaryTags.length > 0) ||
                       product.calories

  const visibleSections = SIDEBAR_SECTIONS.filter(section => {
    if (section.id === 'variants' && !hasVariants) return false
    if (section.id === 'modifiers' && !hasModifiers) return false
    if (section.id === 'nutrition' && !hasNutrition) return false
    return true
  })

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={logoText}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      {/* Header sticky */}
      <div className="sticky top-[73px] lg:top-[81px] z-10 bg-gray-50 -mx-4 px-4 py-2 sm:py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 sm:h-10 px-2 sm:px-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0"
            >
              <ArrowLeft size={16} className="sm:hidden" />
              <ArrowLeft size={18} className="hidden sm:block mr-2" />
              <span className="text-sm sm:text-base">Retour</span>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-xl font-semibold text-gray-900 truncate">
                  {product.name}
                </h1>
                {product.isFeatured && (
                  <Star size={16} className="text-amber-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                {product.category?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteConfirm(true)}
              className="h-8 sm:h-10 px-2 sm:px-4 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 text-sm sm:text-base"
            >
              <Trash2 size={16} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Supprimer</span>
            </Button>
            <Button
              onClick={handleEdit}
              className="h-8 sm:h-10 px-3 sm:px-4 rounded-xl text-white text-sm sm:text-base hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <Edit size={16} className="mr-1 sm:mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pt-4">
        {/* Sidebar */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-[161px] lg:top-[169px]">
            <nav className="bg-white rounded-2xl border border-gray-100 p-2">
              {visibleSections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={{
                      backgroundColor: isActive ? primaryColor : undefined,
                    }}
                  >
                    <Icon size={16} />
                    {section.label}
                  </button>
                )
              })}
            </nav>

            {/* Statut card */}
            <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Statut</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Visibilite</span>
                  {product.isActive ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                      <Eye size={10} className="mr-1" /> Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <EyeOff size={10} className="mr-1" /> Inactif
                    </Badge>
                  )}
                </div>
                {product.trackInventory && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock</span>
                    <Badge className={`text-xs ${
                      product.lowStockAlert && product.stockQuantity <= product.lowStockAlert
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Package size={10} className="mr-1" />
                      {product.stockQuantity}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Section General */}
          <div id="section-general" className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info size={16} className="text-gray-400" />
              Informations generales
            </h2>

            {/* Image */}
            <div className="mb-6">
              <ImageViewer
                images={allImages}
                alt={product.name}
                aspectRatio="square"
                showThumbnails={true}
                thumbnailSize="md"
                maxWidth="320px"
                primaryColor={primaryColor}
              />
            </div>

            {/* Badges statut mobile */}
            <div className="flex flex-wrap items-center gap-2 mb-4 lg:hidden">
              {product.isActive ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <Eye size={12} className="mr-1" /> Actif
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <EyeOff size={12} className="mr-1" /> Inactif
                </Badge>
              )}
              {product.trackInventory && (
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  <Package size={12} className="mr-1" /> Stock: {product.stockQuantity}
                </Badge>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{product.description}</p>
              </div>
            )}

            {/* Infos rapides */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Categorie</p>
                <p className="text-sm font-medium text-gray-900">{product.category?.name}</p>
              </div>
              {product.prepTime && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Temps de preparation</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Clock size={14} className="text-gray-400" /> {product.prepTime} min
                  </p>
                </div>
              )}
              {product.sku && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">SKU</p>
                  <button
                    onClick={() => copyToClipboard(product.sku!, 'SKU')}
                    className="text-sm text-gray-900 flex items-center gap-1 hover:text-gray-600"
                  >
                    <Tag size={14} className="text-gray-400" />
                    {product.sku}
                    <Copy size={10} className="text-gray-400" />
                  </button>
                </div>
              )}
              {product.barcode && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Code-barres</p>
                  <button
                    onClick={() => copyToClipboard(product.barcode!, 'Code-barres')}
                    className="text-sm text-gray-900 flex items-center gap-1 hover:text-gray-600"
                  >
                    <Barcode size={14} className="text-gray-400" />
                    {product.barcode}
                    <Copy size={10} className="text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section Tarification */}
          <div id="section-pricing" className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-gray-400" />
              Tarification
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Prix de vente</p>
                <p className="text-xl font-bold" style={{ color: primaryColor }}>
                  {formatCurrency(product.price)}
                </p>
              </div>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Prix barre</p>
                  <p className="text-xl font-medium text-gray-400 line-through">
                    {formatCurrency(product.compareAtPrice)}
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    -{((1 - product.price / product.compareAtPrice) * 100).toFixed(0)}%
                  </p>
                </div>
              )}
              {product.costPrice && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Prix de revient</p>
                  <p className="text-xl font-medium text-gray-700">
                    {formatCurrency(product.costPrice)}
                  </p>
                </div>
              )}
              {margin && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Marge</p>
                  <p className="text-xl font-medium text-green-600">{margin}%</p>
                </div>
              )}
            </div>

            {product.taxRate && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm flex justify-between">
                <span className="text-gray-500">Taxe</span>
                <span className="text-gray-900">
                  {product.taxRate.name} ({product.taxRate.rate}%)
                  {product.taxIncluded ? ' - Incluse' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Section Nutrition */}
          {hasNutrition && (
            <div id="section-nutrition" className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Utensils size={16} className="text-gray-400" />
                Nutrition & Allergenes
              </h2>

              <div className="space-y-4">
                {product.calories && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Calories</p>
                    <p className="text-sm text-gray-900 flex items-center gap-1">
                      <Flame size={14} className="text-orange-400" /> {product.calories} kcal
                    </p>
                  </div>
                )}

                {product.allergens && product.allergens.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <AlertTriangle size={12} className="text-red-500" /> Allergenes
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {product.allergens.map((allergen) => (
                        <Badge key={allergen} className="bg-red-50 text-red-700 hover:bg-red-50 text-xs">
                          {ALLERGEN_LABELS[allergen] || allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {product.dietaryTags && product.dietaryTags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Leaf size={12} className="text-green-500" /> Regime alimentaire
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {product.dietaryTags.map((tag) => (
                        <Badge key={tag} className="bg-green-50 text-green-700 hover:bg-green-50 text-xs">
                          {DIETARY_TAG_LABELS[tag] || tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section Variantes */}
          {hasVariants && (
            <div id="section-variants" className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Layers size={16} className="text-gray-400" />
                Variantes ({product.variants!.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Nom</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Prix</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Stock</th>
                      <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants!.map((variant) => (
                      <tr key={variant.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3">
                          <p className="text-sm font-medium text-gray-900">{variant.name}</p>
                          {variant.sku && <p className="text-xs text-gray-400">{variant.sku}</p>}
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-sm font-medium" style={{ color: primaryColor }}>
                            {formatCurrency(variant.price)}
                          </span>
                        </td>
                        <td className="py-3 text-right text-sm text-gray-600">
                          {variant.stockQuantity ?? '-'}
                        </td>
                        <td className="py-3 text-center">
                          {variant.isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Actif</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactif</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section Options/Modificateurs */}
          {hasModifiers && (
            <div id="section-modifiers" className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings2 size={16} className="text-gray-400" />
                Options ({product.modifierGroups!.length})
              </h2>

              <div className="space-y-4">
                {product.modifierGroups!.map((group) => (
                  <div key={group.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {group.name}
                        </span>
                        {group.isRequired && (
                          <Badge className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                            Obligatoire
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-lg">
                        {MODIFIER_TYPE_LABELS[group.type]}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.modifiers.map((modifier) => (
                        <div
                          key={modifier.id}
                          className={`flex items-center justify-between p-2 bg-white rounded-lg text-sm ${
                            !modifier.isActive ? 'opacity-50' : ''
                          }`}
                        >
                          <span className={modifier.isDefault ? 'font-medium text-gray-700' : 'text-gray-500'}>
                            {modifier.name}
                            {modifier.isDefault && <span className="text-xs text-gray-400 ml-1">(defaut)</span>}
                          </span>
                          <span className="text-gray-500">
                            {modifier.price > 0 ? `+${formatCurrency(modifier.price)}` : 'Gratuit'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer le produit"
        message={`Etes-vous sur de vouloir supprimer "${product.name}" ? Cette action est irreversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  )
}
