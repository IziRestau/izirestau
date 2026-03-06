'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import {
  Palette,
  Type,
  LayoutGrid,
  Share2,
  Code,
  Menu,
  ChevronRight,
  Fingerprint,
  ExternalLink,
  Sparkles,
  PanelTop,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  ThemeColorsTab,
  ThemeTypographyTab,
  ThemeMenuTab,
  ThemeAnnouncementTab,
  ThemeAdvancedTab,
  ThemeIdentityTab,
  ThemeHeaderFooterTab,
  ThemeProductsTab,
  ThemeCartTab,
  DEFAULT_PRODUCT_CONFIG,
  DEFAULT_CART_CONFIG,
} from '@/components/restaurant/site/theme'
import type { ThemeFormData } from '@/components/restaurant/site/theme'

type ThemeTab = 'identity' | 'colors' | 'typography' | 'headerFooter' | 'products' | 'cart' | 'menu' | 'announcement' | 'advanced'

const THEME_LABELS: Record<string, string> = {
  default: 'Classique',
  modern: 'Moderne',
  elegant: 'Élégant',
  minimal: 'Minimaliste',
  bold: 'Audacieux',
}

const tabs: { id: ThemeTab; label: string; icon: typeof Palette; description: string }[] = [
  { id: 'identity', label: 'Identité', icon: Fingerprint, description: 'Logo, images, description' },
  { id: 'colors', label: 'Couleurs', icon: Palette, description: 'Palette du site' },
  { id: 'typography', label: 'Typographie', icon: Type, description: 'Polices de caractères' },
  { id: 'headerFooter', label: 'Header & Footer', icon: PanelTop, description: 'En-tête et pied de page' },
  { id: 'products', label: 'Produits', icon: ShoppingBag, description: 'Cartes et grille produits' },
  { id: 'cart', label: 'Panier', icon: ShoppingCart, description: 'Apparence du panier' },
  { id: 'menu', label: 'Menu et layout', icon: LayoutGrid, description: 'Boutons et options' },
  { id: 'announcement', label: 'Réseaux Sociaux', icon: Share2, description: 'Liens vers vos réseaux' },
  { id: 'advanced', label: 'Avancé', icon: Code, description: 'CSS et textes' },
]

const DEFAULT_FORM: ThemeFormData = {
  baseTheme: 'default',
  primaryColor: '#FF6B00',
  secondaryColor: '#1A1A1A',
  accentColor: '#FFB800',
  backgroundColor: '#FFFFFF',
  textColor: '#1A1A1A',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  layoutStyle: 'grid',
  headerStyle: 'standard',
  heroTitle: '',
  heroSubtitle: '',
  heroCtaText: 'Voir le menu',
  aboutTitle: '',
  aboutText: '',
  footerText: '',
  announcementText: '',
  announcementActive: false,
  announcementBgColor: '#FF6B00',
  announcementLink: '',
  logoPosition: 'left',
  showRatings: true,
  showPrepTime: true,
  showAllergens: true,
  showCuisineTypes: true,
  heroStyle: 'banner',
  heroOverlayOpacity: 40,
  heroImageUrl: '',
  heroImages: [],
  heroVideoUrl: '',
  heroCtaLink: '',
  menuStyle: 'grid',
  productCardStyle: 'standard',
  showProductImages: true,
  productConfig: { ...DEFAULT_PRODUCT_CONFIG },
  buttonStyle: 'rounded',
  buttonSize: 'md',
  customCss: '',
  socialLinks: {},
  showAboutPage: true,
  showContactPage: true,
  showGallery: true,
  showTestimonials: false,
  showMap: true,
  legalText: '',
  privacyText: '',
  headerDesign: 'standard',
  headerSticky: true,
  headerTransparent: false,
  headerBgOpacity: 100,
  headerTextColor: '#FFFFFF',
  footerDesign: 'standard',
  navigationConfig: null,
  cartConfig: { ...DEFAULT_CART_CONFIG },
}

export default function SiteThemePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const primaryColor = organization?.primaryColor || '#10b981'

  const tabFromUrl = searchParams.get('tab') as ThemeTab | null
  const [activeTab, setActiveTab] = useState<ThemeTab>(tabFromUrl || 'identity')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState<ThemeFormData>(DEFAULT_FORM)

  useEffect(() => {
    if (tabFromUrl && tabs.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const handleTabChange = (tabId: ThemeTab) => {
    setActiveTab(tabId)
    router.push(`/restaurant/site/theme?tab=${tabId}`, { scroll: false })
    setIsMobileMenuOpen(false)
  }

  const { data: settings, isLoading } = useQuery({
    queryKey: ['restaurant-settings', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.getSettings(currentRestaurantId || undefined)
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (settings?.theme) {
      const t = settings.theme
      setFormData({
        baseTheme: t.baseTheme || 'default',
        primaryColor: t.primaryColor || '#FF6B00',
        secondaryColor: t.secondaryColor || '#1A1A1A',
        accentColor: t.accentColor || '#FFB800',
        backgroundColor: t.backgroundColor || '#FFFFFF',
        textColor: t.textColor || '#1A1A1A',
        headingFont: t.headingFont || 'Inter',
        bodyFont: t.bodyFont || 'Inter',
        layoutStyle: t.layoutStyle || 'grid',
        headerStyle: t.headerStyle || 'standard',
        heroTitle: t.heroTitle || '',
        heroSubtitle: t.heroSubtitle || '',
        heroCtaText: t.heroCtaText || 'Voir le menu',
        aboutTitle: t.aboutTitle || '',
        aboutText: t.aboutText || '',
        footerText: t.footerText || '',
        announcementText: t.announcementText || '',
        announcementActive: t.announcementActive || false,
        announcementBgColor: t.announcementBgColor || '#FF6B00',
        announcementLink: t.announcementLink || '',
        logoPosition: t.logoPosition || 'left',
        showRatings: t.showRatings ?? true,
        showPrepTime: t.showPrepTime ?? true,
        showAllergens: t.showAllergens ?? true,
        showCuisineTypes: t.showCuisineTypes ?? true,
        heroStyle: t.heroStyle || 'banner',
        heroOverlayOpacity: t.heroOverlayOpacity ?? 40,
        heroImageUrl: t.heroImageUrl || '',
        heroImages: (t.heroImages as string[]) || [],
        heroVideoUrl: t.heroVideoUrl || '',
        heroCtaLink: t.heroCtaLink || '',
        menuStyle: t.menuStyle || 'grid',
        productCardStyle: t.productCardStyle || 'standard',
        showProductImages: t.showProductImages ?? true,
        productConfig: { ...DEFAULT_PRODUCT_CONFIG, ...((t as Record<string, unknown>).productConfig as Record<string, unknown> || {}) },
        buttonStyle: t.buttonStyle || 'rounded',
        buttonSize: t.buttonSize || 'md',
        customCss: t.customCss || '',
        socialLinks: (t.socialLinks as Record<string, string>) || {},
        showAboutPage: t.showAboutPage ?? true,
        showContactPage: t.showContactPage ?? true,
        showGallery: t.showGallery ?? true,
        showTestimonials: t.showTestimonials ?? false,
        showMap: t.showMap ?? true,
        legalText: t.legalText || '',
        privacyText: t.privacyText || '',
        headerDesign: t.headerDesign || 'standard',
        headerSticky: t.headerSticky ?? true,
        headerTransparent: t.headerTransparent ?? false,
        headerBgOpacity: t.headerBgOpacity ?? 100,
        headerTextColor: t.headerTextColor || '#FFFFFF',
        footerDesign: (t as Record<string, unknown>).footerDesign as string || 'standard',
        navigationConfig: (t.navigationConfig as Record<string, unknown>) || null,
        cartConfig: { ...DEFAULT_CART_CONFIG, ...((t as Record<string, unknown>).cartConfig as Record<string, unknown> || {}) },
      })
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: async (data: ThemeFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const restaurantId = currentRestaurantId || settings?.restaurant?.id
      return api.restaurant.updateTheme({
        ...data,
        heroTitle: data.heroTitle || null,
        heroSubtitle: data.heroSubtitle || null,
        heroCtaText: data.heroCtaText || null,
        heroImageUrl: data.heroImageUrl || null,
        heroImages: data.heroImages.length > 0 ? data.heroImages : null,
        heroVideoUrl: data.heroVideoUrl || null,
        heroCtaLink: data.heroCtaLink || null,
        aboutTitle: data.aboutTitle || null,
        aboutText: data.aboutText || null,
        footerText: data.footerText || null,
        announcementText: data.announcementText || null,
        announcementBgColor: data.announcementBgColor || null,
        announcementLink: data.announcementLink || null,
        customCss: data.customCss || null,
        legalText: data.legalText || null,
        privacyText: data.privacyText || null,
        productConfig: data.productConfig as unknown as Record<string, unknown>,
        cartConfig: data.cartConfig as unknown as Record<string, unknown>,
        restaurantId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] })
      toast.success('Thème mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const handleChange = (partial: Partial<ThemeFormData>) => {
    setFormData(prev => ({ ...prev, ...partial }))
  }

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  if (isLoading && !settings) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Apparence"
        variant="detail"
      />
    )
  }

  const tabProps = {
    formData,
    onChange: handleChange,
    primaryColor,
    isSaving: updateMutation.isPending,
    onSave: handleSave,
  }

  const activeThemeName = THEME_LABELS[formData.baseTheme] || formData.baseTheme

  const renderTabContent = () => {
    switch (activeTab) {
      case 'identity':
        return settings?.restaurant ? (
          <ThemeIdentityTab
            restaurant={{
              name: settings.restaurant.name,
              description: settings.restaurant.description,
              shortDescription: settings.restaurant.shortDescription,
              logo: settings.restaurant.logo,
              coverImage: settings.restaurant.coverImage,
              images: settings.restaurant.images,
            }}
            primaryColor={primaryColor}
          />
        ) : null
      case 'colors': return <ThemeColorsTab {...tabProps} />
      case 'typography': return <ThemeTypographyTab {...tabProps} />
      case 'headerFooter': return <ThemeHeaderFooterTab {...tabProps} />
      case 'products': return <ThemeProductsTab {...tabProps} />
      case 'cart': return <ThemeCartTab {...tabProps} />
      case 'menu': return <ThemeMenuTab {...tabProps} />
      case 'announcement': return <ThemeAnnouncementTab {...tabProps} />
      case 'advanced': return <ThemeAdvancedTab {...tabProps} />
      default: return null
    }
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
        title="Apparence"
        subtitle="Personnalisez le thème et le design de votre site"
        icon={Palette}
      />

      <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: formData.primaryColor }}
            >
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Thème actif : <span style={{ color: primaryColor }}>{activeThemeName}</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Couleur principale : <span className="font-mono font-medium" style={{ color: formData.primaryColor }}>{formData.primaryColor}</span> &middot; Police : {formData.headingFont}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl gap-2 text-xs border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => router.push('/restaurant/site/themes')}
          >
            <ExternalLink size={14} />
            Catalogue de thèmes
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentTab = tabs.find(t => t.id === activeTab)
                    const Icon = currentTab?.icon || Palette
                    return (
                      <>
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Icon size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{currentTab?.label}</p>
                          <p className="text-xs text-gray-500">{currentTab?.description}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <Menu size={18} className="text-gray-400" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-2xl">
              <SheetHeader className="pb-4">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 pb-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all w-full",
                        isActive ? "text-white" : "text-gray-600 hover:bg-gray-50"
                      )}
                      style={isActive ? { backgroundColor: primaryColor } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{tab.label}</p>
                          <p className={cn("text-xs", isActive ? "opacity-80" : "text-gray-400")}>
                            {tab.description}
                          </p>
                        </div>
                      </div>
                      {isActive && <ChevronRight size={16} />}
                    </button>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden lg:block lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-2 sticky top-24">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full",
                      isActive ? "text-white" : "text-gray-600 hover:bg-gray-50"
                    )}
                    style={isActive ? { backgroundColor: primaryColor } : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{tab.label}</p>
                      <p className={cn("text-xs", isActive ? "opacity-80" : "text-gray-400")}>
                        {tab.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
