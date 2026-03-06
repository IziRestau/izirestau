'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { useRestaurantPermissions } from '@/hooks/use-restaurant-permissions'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { api, apiClient } from '@/lib/api-client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared/dashboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  UtensilsCrossed,
  FolderTree,
  Settings2,
  Loader2,
} from 'lucide-react'
import { CategorySidebar } from '@/components/restaurant/menu/CategorySidebar'
import { ProductList } from '@/components/restaurant/menu/ProductList'
import { CategoryList } from '@/components/restaurant/menu/CategoryList'
import { ModifierGroupList } from '@/components/restaurant/menu/ModifierGroupList'
import { CategoryFormModal } from '@/components/restaurant/menu/CategoryFormModal'
import { ModifierGroupFormModal } from '@/components/restaurant/menu/ModifierGroupFormModal'
import type { Category, ProductListItem, ModifierGroup } from '@/types/menu'

export default function MenuPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()
  const { canManageMenu } = useRestaurantPermissions()
  const { format } = useRestaurantCurrency()

  const primaryColor = organization?.primaryColor || '#10b981'

  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'products'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  useEffect(() => {
    setSearchQuery('')
  }, [activeTab])

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [modifierModalOpen, setModifierModalOpen] = useState(false)
  const [editingModifierGroup, setEditingModifierGroup] = useState<ModifierGroup | null>(null)

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['restaurant-categories', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.categories.list(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  const productSearchQuery = activeTab === 'products' ? searchQuery : ''
  
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['restaurant-products', currentRestaurantId, selectedCategoryId, productSearchQuery],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.products.list({
        restaurantId: currentRestaurantId || undefined,
        categoryId: selectedCategoryId || undefined,
        search: productSearchQuery || undefined,
        limit: 50,
      })
      return res.data || []
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 2 * 60 * 1000,
  })

  const { data: modifiersData, isLoading: modifiersLoading } = useQuery({
    queryKey: ['restaurant-modifiers', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.modifiers.list(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId && canManageMenu,
    staleTime: 5 * 60 * 1000,
  })

  const categories = categoriesData || []
  const products = (Array.isArray(productsData) ? productsData : []) as ProductListItem[]
  const modifierGroups = modifiersData || []

  const handleAddCategory = () => {
    setEditingCategory(null)
    setCategoryModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }

  const handleAddProduct = () => {
    router.push('/restaurant/menu/products/new')
  }

  const handleEditProduct = (product: ProductListItem) => {
    router.push(`/restaurant/menu/products/${product.id}`)
  }

  const handleAddModifierGroup = () => {
    setEditingModifierGroup(null)
    setModifierModalOpen(true)
  }

  const handleEditModifierGroup = (group: ModifierGroup) => {
    setEditingModifierGroup(group)
    setModifierModalOpen(true)
  }

  const renderAddButton = () => {
    if (!canManageMenu) return null

    switch (activeTab) {
      case 'products':
        return (
          <Button
            onClick={handleAddProduct}
            className="h-10 px-4 rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={18} className="mr-2" />
            <span className="hidden sm:inline">Ajouter un produit</span>
            <span className="sm:hidden">Produit</span>
          </Button>
        )
      case 'categories':
        return (
          <Button
            onClick={handleAddCategory}
            className="h-10 px-4 rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={18} className="mr-2" />
            <span className="hidden sm:inline">Ajouter une categorie</span>
            <span className="sm:hidden">Categorie</span>
          </Button>
        )
      case 'modifiers':
        return (
          <Button
            onClick={handleAddModifierGroup}
            className="h-10 px-4 rounded-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={18} className="mr-2" />
            <span className="hidden sm:inline">Ajouter un groupe</span>
            <span className="sm:hidden">Groupe</span>
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      title="Menu"
      subtitle="Gérez vos catégories, produits et options"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <Tabs value={activeTab} className="space-y-6">
        <div className="sticky top-20 z-10 bg-gray-50 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-gray-100">
          <div className="flex flex-col gap-3">
            {/* Mobile: Tabs sur une ligne + Recherche/Bouton en dessous */}
            {/* Desktop: Tabs + Recherche/Bouton sur la meme ligne */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <TabsList className="bg-gray-100 p-1 rounded-xl h-auto w-full sm:w-auto flex">
                <TabsTrigger
                  value="products"
                  className="flex-1 sm:flex-initial rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  asChild
                >
                  <Link href="/restaurant/menu?tab=products">
                    <UtensilsCrossed size={16} className="mr-1.5 sm:mr-2" />
                    Produits
                    <span className="ml-1.5 sm:ml-2 text-xs bg-gray-200 px-1.5 sm:px-2 py-0.5 rounded-full">
                      {products.length}
                    </span>
                  </Link>
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="flex-1 sm:flex-initial rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  asChild
                >
                  <Link href="/restaurant/menu?tab=categories">
                    <FolderTree size={16} className="mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Categories</span>
                    <span className="sm:hidden">Cat.</span>
                    <span className="ml-1.5 sm:ml-2 text-xs bg-gray-200 px-1.5 sm:px-2 py-0.5 rounded-full">
                      {categories.length}
                    </span>
                  </Link>
                </TabsTrigger>
                {canManageMenu && (
                  <TabsTrigger
                    value="modifiers"
                    className="flex-1 sm:flex-initial rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    asChild
                  >
                    <Link href="/restaurant/menu?tab=modifiers">
                      <Settings2 size={16} className="mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Options</span>
                      <span className="sm:hidden">Opt.</span>
                      <span className="ml-1.5 sm:ml-2 text-xs bg-gray-200 px-1.5 sm:px-2 py-0.5 rounded-full">
                        {modifierGroups.length}
                      </span>
                    </Link>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Recherche + Bouton */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={
                      activeTab === 'products' ? 'Rechercher un produit...' :
                      activeTab === 'categories' ? 'Rechercher une categorie...' :
                      'Rechercher une option...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 rounded-xl focus-visible:ring-1"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
                {renderAddButton()}
              </div>
            </div>
          </div>
        </div>

        <TabsContent value="products" className="mt-0">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-40">
                <CategorySidebar
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={setSelectedCategoryId}
                  onAddCategory={canManageMenu ? handleAddCategory : undefined}
                  primaryColor={primaryColor}
                  isLoading={categoriesLoading}
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {productsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                </div>
              ) : (
                <ProductList
                  products={products}
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={setSelectedCategoryId}
                  onEditProduct={canManageMenu ? handleEditProduct : undefined}
                  formatPrice={format}
                  primaryColor={primaryColor}
                  canManage={canManageMenu}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            </div>
          ) : (
            <CategoryList
              categories={categories}
              onEditCategory={canManageMenu ? handleEditCategory : undefined}
              primaryColor={primaryColor}
              canManage={canManageMenu}
              searchQuery={activeTab === 'categories' ? searchQuery : ''}
            />
          )}
        </TabsContent>

        {canManageMenu && (
          <TabsContent value="modifiers" className="mt-0">
            {modifiersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
              </div>
            ) : (
              <ModifierGroupList
                modifierGroups={modifierGroups}
                onEditGroup={handleEditModifierGroup}
                formatPrice={format}
                primaryColor={primaryColor}
                searchQuery={activeTab === 'modifiers' ? searchQuery : ''}
              />
            )}
          </TabsContent>
        )}
      </Tabs>

      {canManageMenu && (
        <>
          <CategoryFormModal
            isOpen={categoryModalOpen}
            onClose={() => {
              setCategoryModalOpen(false)
              setEditingCategory(null)
            }}
            category={editingCategory}
            categories={categories}
            primaryColor={primaryColor}
          />

          <ModifierGroupFormModal
            isOpen={modifierModalOpen}
            onClose={() => {
              setModifierModalOpen(false)
              setEditingModifierGroup(null)
            }}
            modifierGroup={editingModifierGroup}
            primaryColor={primaryColor}
          />
        </>
      )}
    </DashboardLayout>
  )
}
