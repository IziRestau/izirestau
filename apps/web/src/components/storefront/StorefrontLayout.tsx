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
import type {
  StoreData,
  ThemeComponents,
  StorePageLink,
} from '@/components/storefront/themes/_types'

interface StorefrontLayoutProps {
  children: React.ReactNode
}

function LayoutContent({
  children,
  storeData,
}: {
  children: React.ReactNode
  storeData: StoreData
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const { theme } = useStoreTheme()
  const cartStore = useStorefrontCartStore()
  const authStore = useStorefrontAuthStore()
  const [components, setComponents] = useState<ThemeComponents | null>(null)
  const isCartOpen = cartStore.isCartOpen
  const setIsCartOpen = (open: boolean) => open ? cartStore.openCart() : cartStore.closeCart()

  useEffect(() => {
    if (authStore.subdomain !== subdomain) {
      authStore.setSubdomain(subdomain)
    }
  }, [subdomain, authStore.subdomain, authStore.setSubdomain])

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
    return (pagesResponse?.data || []) as Array<{ slug: string; title: string; pageType: string | null }>
  }, [pagesResponse?.data])

  const supportedPages = components?.supportedPages || ['home', 'menu', 'contact', 'custom']

  const pageLinks: StorePageLink[] = useMemo(() => {
    return rawPages
      .filter(p => {
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

  const itemCount = cartStore.getItemCount()
  const settings = storeData.settings as Record<string, unknown> | null

  if (!components) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin opacity-40" />
      </div>
    )
  }

  const { AnnouncementBar, Header, Footer, CartDrawer } = components

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
      <main style={{ backgroundColor: theme.backgroundColor }}>
        {children}
      </main>
      <Footer
        restaurant={storeData.restaurant}
        theme={theme}
        openingHours={storeData.openingHours}
        pages={pageLinks}
      />
      <CartDrawer
        theme={theme}
        settings={storeData.settings}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => { setIsCartOpen(false); window.location.href = `/store/${subdomain}/checkout` }}
        sectionData={storeData.theme?.globalComponents?.cart as Record<string, unknown> | undefined}
      />
    </>
  )
}

export function StorefrontLayout({ children }: StorefrontLayoutProps) {
  const params = useParams()
  const subdomain = params.subdomain as string

  const { data: storeResponse, isLoading, error } = useQuery({
    queryKey: ['store', subdomain],
    queryFn: () => api.store.getData(subdomain),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 500,
  })

  const storeData = (storeResponse?.data ?? storeResponse) as StoreData | undefined

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (error || !storeData) {
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
      <LayoutContent storeData={storeData}>
        {children}
      </LayoutContent>
    </StoreThemeProvider>
  )
}
