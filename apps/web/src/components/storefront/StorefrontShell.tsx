'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { StoreThemeProvider, useStoreTheme } from '@/components/storefront/providers/ThemeProvider'
import { TrackingPixels } from '@/components/storefront/TrackingPixels'
import { useStorefrontCartStore } from '@/stores/storefront-cart.store'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'
import { loadThemeComponents } from '@/components/storefront/themes/_registry'
import { BannerCarousel } from '@/components/storefront/themes/default/sections/home/BannerCarousel'
import type {
  StoreData,
  StoreCategory,
  StoreProduct,
  CartItemInput,
  ThemeComponents,
  StorePageLink,
  PageSectionsData,
  StoreBannerData,
} from '@/components/storefront/themes/_types'

interface StorefrontShellProps {
  page: 'home' | 'menu' | 'contact' | 'about' | 'custom'
  slug?: string
}

interface TeamMember {
  id: string
  name: string
  position: string
  avatar: string | null
  socialLink?: string
}

function AboutPageWrapper({
  AboutPage,
  subdomain,
  storeData,
  theme,
  basePath,
  getBannersForPage,
  getPageSections,
}: {
  AboutPage: React.ComponentType<any>
  subdomain: string
  storeData: StoreData
  theme: StoreData['theme']
  basePath: string
  getBannersForPage: (pageId: string) => StoreBannerData[]
  getPageSections: (pageType: string) => PageSectionsData | undefined
}) {
  const { data: teamResponse } = useQuery({
    queryKey: ['store-team', subdomain],
    queryFn: () => api.store.getTeam(subdomain),
    staleTime: 5 * 60 * 1000,
  })

  const dynamicTeam = (teamResponse?.data || []) as TeamMember[]

  return (
    <AboutPage
      restaurant={storeData.restaurant}
      theme={theme}
      openingHours={storeData.openingHours}
      delivery={storeData.delivery}
      banners={getBannersForPage('about')}
      menuHref={`${basePath}/menu`}
      contactHref={`${basePath}/contact`}
      sections={getPageSections('about')}
      dynamicTeam={dynamicTeam}
    />
  )
}

function ShellContent({
  page,
  slug,
  storeData,
  categories,
}: {
  page: 'home' | 'menu' | 'contact' | 'about' | 'custom'
  slug?: string
  storeData: StoreData
  categories: StoreCategory[]
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const { theme } = useStoreTheme()
  const cartStore = useStorefrontCartStore()
  const authStore = useStorefrontAuthStore()
  const [components, setComponents] = useState<ThemeComponents | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const isCartOpen = cartStore.isCartOpen
  const setIsCartOpen = (open: boolean) => open ? cartStore.openCart() : cartStore.closeCart()

  const themeId = storeData.theme?.baseTheme || 'default'
  const basePath = `/store/${subdomain}`

  useEffect(() => {
    loadThemeComponents(themeId).then(setComponents)
  }, [themeId])

  const { data: pagesResponse } = useQuery({
    queryKey: ['store-pages', subdomain],
    queryFn: () => api.store.getPages(subdomain),
    staleTime: 5 * 60 * 1000,
  })

  const rawPages = useMemo(() => {
    return (pagesResponse?.data || []) as Array<{ id: string; slug: string; title: string; pageType: string | null; sections: Record<string, Record<string, unknown>> | null }>
  }, [pagesResponse?.data])

  const supportedPages = components?.supportedPages || ['home', 'menu', 'contact', 'custom']

  const pageLinks: StorePageLink[] = useMemo(() => {
    return rawPages
      .filter(p => {
        // Filtrer les pages non supportées par le thème actif
        const pageType = p.pageType || 'custom'
        return supportedPages.includes(pageType)
      })
      .map(p => {
        let href = basePath
        if (p.pageType === 'menu') href = `${basePath}/menu`
        else if (p.pageType === 'about') href = `${basePath}/about`
        else if (p.pageType === 'contact') href = `${basePath}/contact`
        else if (p.pageType !== 'home') href = `${basePath}/${p.slug}`

        return {
          slug: p.slug,
          title: p.title,
          pageType: p.pageType,
          href,
        }
      })
  }, [rawPages, basePath, supportedPages])

  const homePageSections = useMemo(() => {
    const homePage = rawPages.find(p => p.pageType === 'home')
    return homePage?.sections || {}
  }, [rawPages])

  const getPageSections = (pageType: string): PageSectionsData | undefined => {
    const found = rawPages.find(p => p.pageType === pageType)
    const pageSections = found?.sections || {}

    if (pageType === 'home') {
      return pageSections
    }

    const mergedSections: PageSectionsData = { ...pageSections }

    const syncableSections = ['locations']
    for (const sectionId of syncableSections) {
      const homeSectionData = homePageSections[sectionId]
      const localSectionData = pageSections[sectionId]
      if (homeSectionData?.syncWithOtherPages === true) {
        // Si la section locale n'existe pas ou enabled n'est pas défini, utiliser false par défaut
        // Chaque page doit explicitement activer la section
        const localEnabled = localSectionData?.enabled !== undefined 
          ? localSectionData.enabled 
          : false
        mergedSections[sectionId] = {
          ...homeSectionData,
          enabled: localEnabled,
        }
      }
    }

    return Object.keys(mergedSections).length > 0 ? mergedSections : undefined
  }

  const getBannersForPage = (pageId: string): StoreBannerData[] => {
    return (storeData.banners || []).filter(b => b.pages.includes('all') || b.pages.includes(pageId))
  }

  const handleProductClick = (product: StoreProduct) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const handleAddToCart = (item: CartItemInput) => {
    cartStore.addItem(item)
  }

  const handleCheckout = () => {
    setIsCartOpen(false)
    window.location.href = `/store/${subdomain}/checkout`
  }

  const itemCount = cartStore.getItemCount()

  const { data: customPageResponse } = useQuery({
    queryKey: ['store-page', subdomain, slug],
    queryFn: () => api.store.getPage(subdomain, slug!),
    enabled: page === 'custom' && !!slug,
    staleTime: 5 * 60 * 1000,
  })

  const customPageData = customPageResponse?.data as { id: string; slug: string; title: string; content: string; pageType: string | null; sections: Record<string, Record<string, unknown>> | null; metaTitle: string | null; metaDescription: string | null } | undefined

  const settings = storeData.settings as Record<string, unknown> | null
  const homePageId = settings?.homePageId as string | null | undefined

  const effectivePage = useMemo((): 'home' | 'menu' | 'contact' | 'about' | 'custom' => {
    if (page !== 'home' || !homePageId) return page
    const targetPage = rawPages.find(p => p.id === homePageId)
    if (!targetPage || targetPage.pageType === 'home') return 'home'
    if (targetPage.pageType === 'menu') return 'menu'
    if (targetPage.pageType === 'contact') return 'contact'
    if (targetPage.pageType === 'about') return 'about'
    return 'home'
  }, [page, homePageId, rawPages])

  if (!components) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin opacity-40" />
      </div>
    )
  }

  const {
    AnnouncementBar,
    Header,
    Footer,
    HomePage,
    MenuSection,
    Hero,
    RestaurantInfo,
    ProductModal,
    CartDrawer,
    ContactPage,
    CustomPage,
    AboutPage,
  } = components

  const currentPageId = effectivePage === 'custom' && customPageData ? customPageData.slug : effectivePage
  const currentPageBanners = getBannersForPage(currentPageId)
  const topBanners = currentPageBanners.filter(b => b.position === 'top')
  const hasStickyBanner = topBanners.some(b => b.sticky)
  const hasHeaderSticky = theme.headerSticky ?? true
  const bothSticky = hasStickyBanner && hasHeaderSticky

  return (
    <>
      <TrackingPixels
        facebookPixelId={settings?.facebookPixelId as string | null}
        googleAnalyticsId={settings?.googleAnalyticsId as string | null}
        googleTagManagerId={settings?.googleTagManagerId as string | null}
        tiktokPixelId={settings?.tiktokPixelId as string | null}
        snapPixelId={settings?.snapPixelId as string | null}
        customHeadScript={settings?.customHeadScript as string | null}
      />
      <AnnouncementBar theme={theme} />
      {bothSticky ? (
        <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
          <BannerCarousel banners={currentPageBanners} theme={theme} position="top" />
          <Header
            restaurant={storeData.restaurant}
            theme={theme}
            cartItemCount={itemCount}
            onCartClick={() => setIsCartOpen(true)}
            pages={pageLinks}
            currentPath={pathname}
            forceRelative
            customer={authStore.customer}
            subdomain={subdomain}
          />
        </div>
      ) : (
        <>
          {hasStickyBanner && topBanners.length > 0 && (
            <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
              <BannerCarousel banners={currentPageBanners} theme={theme} position="top" />
            </div>
          )}
          <Header
            restaurant={storeData.restaurant}
            theme={theme}
            cartItemCount={itemCount}
            onCartClick={() => setIsCartOpen(true)}
            pages={pageLinks}
            currentPath={pathname}
            customer={authStore.customer}
            subdomain={subdomain}
          />
        </>
      )}
      <div className="relative">
        {!bothSticky && !hasStickyBanner && topBanners.length > 0 && (
          <BannerCarousel banners={currentPageBanners} theme={theme} position="top" />
        )}
        <main>
        {effectivePage === 'home' && (
          <HomePage
            restaurant={storeData.restaurant}
            theme={theme}
            openingHours={storeData.openingHours}
            categories={categories}
            settings={storeData.settings}
            delivery={storeData.delivery}
            banners={getBannersForPage('home')}
            menuHref={`${basePath}/menu`}
            contactHref={`${basePath}/contact`}
            onProductClick={handleProductClick}
            sections={getPageSections('home')}
          />
        )}

        {effectivePage === 'menu' && (
          <>
            <Hero
              restaurant={storeData.restaurant}
              theme={theme}
              openingHours={storeData.openingHours}
              settings={storeData.settings}
              delivery={storeData.delivery}
              menuHref={`${basePath}/menu`}
              sections={getPageSections('menu')}
            />
            <MenuSection
              categories={categories}
              theme={theme}
              settings={storeData.settings}
              onProductClick={handleProductClick}
              sections={getPageSections('menu')}
              restaurant={storeData.restaurant}
              openingHours={storeData.openingHours}
            />
          </>
        )}

        {effectivePage === 'contact' && (
          <ContactPage
            restaurant={storeData.restaurant}
            theme={theme}
            openingHours={storeData.openingHours}
            delivery={storeData.delivery}
            banners={getBannersForPage('contact')}
            subdomain={subdomain}
            sections={getPageSections('contact')}
          />
        )}

        {effectivePage === 'about' && AboutPage && supportedPages.includes('about') && (
          <AboutPageWrapper
            AboutPage={AboutPage}
            subdomain={subdomain}
            storeData={storeData}
            theme={theme}
            basePath={basePath}
            getBannersForPage={getBannersForPage}
            getPageSections={getPageSections}
          />
        )}

        {effectivePage === 'custom' && customPageData && (
          <CustomPage
            page={{ title: customPageData.title, content: customPageData.content || '', slug: customPageData.slug }}
            restaurant={storeData.restaurant}
            theme={theme}
            banners={getBannersForPage(customPageData.slug)}
            sections={customPageData.sections ? Object.fromEntries(
              Object.entries(customPageData.sections).filter(([k]) => k !== '_order').map(([k, v]) => [k, v as Record<string, unknown>])
            ) : undefined}
            sectionOrder={(customPageData.sections as Record<string, unknown>)?._order as string[] | undefined}
          />
        )}

        {effectivePage === 'custom' && !customPageData && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin opacity-40" />
          </div>
        )}

        {effectivePage === 'about' && !supportedPages.includes('about') && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-gray-500">Page non disponible</p>
            <a href={basePath} className="mt-4 text-sm underline" style={{ color: theme.primaryColor }}>
              Retour à l&apos;accueil
            </a>
          </div>
        )}

      </main>
      </div>

      <Footer
        restaurant={storeData.restaurant}
        theme={theme}
        openingHours={storeData.openingHours}
        pages={pageLinks}
      />

      <ProductModal
        product={selectedProduct}
        theme={theme}
        settings={storeData.settings}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
      <CartDrawer
        theme={theme}
        settings={storeData.settings}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
        sectionData={storeData.theme?.globalComponents?.cart as Record<string, unknown> | undefined}
      />
    </>
  )
}

export function StorefrontShell({ page, slug }: StorefrontShellProps) {
  const params = useParams()
  const subdomain = params.subdomain as string

  const { data: storeResponse, isLoading: storeLoading, error: storeError } = useQuery({
    queryKey: ['store', subdomain],
    queryFn: () => api.store.getData(subdomain),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 500,
  })

  const { data: menuResponse, isLoading: menuLoading } = useQuery({
    queryKey: ['store-menu', subdomain],
    queryFn: () => api.store.getMenu(subdomain),
    staleTime: 5 * 60 * 1000,
  })

  const storeData = (storeResponse?.data ?? storeResponse) as StoreData | undefined
  const categories = (menuResponse?.data?.categories || []) as StoreCategory[]

  if (storeLoading || menuLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Chargement du restaurant...</p>
      </div>
    )
  }

  if (storeError || !storeData) {
    console.error('StorefrontShell error:', { storeError, storeData, storeResponse })
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-2xl text-red-400">!</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Restaurant introuvable</h1>
        <p className="text-sm text-gray-500 text-center">
          Ce restaurant n&apos;existe pas ou n&apos;est pas encore disponible.
        </p>
      </div>
    )
  }

  return (
    <StoreThemeProvider theme={storeData.theme}>
      <ShellContent page={page} slug={slug} storeData={storeData} categories={categories} />
    </StoreThemeProvider>
  )
}
