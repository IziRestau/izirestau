'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout'
import { loadThemeComponents } from '@/components/storefront/themes/_registry'
import type { ThemeComponents, TrackOrderData, StoreRestaurantData, StoreThemeData, StoreSettingsData } from '@/components/storefront/themes/_types'
import { Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function TrackOrderPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const orderId = params.orderId as string

  const [themeComponents, setThemeComponents] = useState<ThemeComponents | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const { data: storeResponse, isLoading: storeLoading } = useQuery({
    queryKey: ['store', subdomain],
    queryFn: () => api.store.getData(subdomain),
    enabled: !!subdomain,
    staleTime: 5 * 60 * 1000,
  })

  const storeData = (storeResponse?.data ?? storeResponse) as {
    theme?: StoreThemeData
    restaurant?: StoreRestaurantData
    settings?: StoreSettingsData
    pages?: { track?: { sections?: Record<string, unknown> } }
  } | undefined

  const { data: orderResponse, isLoading: orderLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['track-order', subdomain, orderId],
    queryFn: () => api.store.getOrder(subdomain, orderId),
    enabled: !!subdomain && !!orderId,
    refetchInterval: 15000,
  })

  const orderData = (orderResponse?.data ?? orderResponse) as TrackOrderData | undefined

  useEffect(() => {
    if (storeData?.theme?.baseTheme) {
      loadThemeComponents(storeData.theme.baseTheme).then(setThemeComponents)
    }
  }, [storeData?.theme?.baseTheme])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleMarkPickedUp = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    const response = await fetch(`${API_URL}/store/${subdomain}/account/orders/${orderId}/picked-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (response.ok) {
      await refetch()
    }
  }

  const theme = storeData?.theme
  const primaryColor = theme?.primaryColor || '#10b981'
  const backgroundColor = theme?.backgroundColor || '#ffffff'
  const textColor = theme?.textColor || '#1f2937'

  if (!mounted || storeLoading || orderLoading || !themeComponents) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor }}
      >
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
        </div>
        <p className="text-sm" style={{ color: `${textColor}60` }}>Chargement de votre commande...</p>
      </div>
    )
  }

  if (!storeData || !orderData) {
    return (
      <StorefrontLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Commande introuvable</h1>
          <p className="text-gray-500 mb-8 text-center max-w-sm">
            Cette commande n'existe pas ou le lien est invalide.
          </p>
          <Link
            href={`/store/${subdomain}/menu`}
            className="px-8 py-3 rounded-full font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: storeData?.theme?.primaryColor || '#10b981' }}
          >
            Retour au menu
          </Link>
        </div>
      </StorefrontLayout>
    )
  }

  const TrackPageComponent = themeComponents.TrackPage
  if (!TrackPageComponent) {
    return (
      <StorefrontLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-gray-500">Page de suivi non disponible</p>
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout>
      <TrackPageComponent
        restaurant={storeData.restaurant as StoreRestaurantData}
        theme={storeData.theme as StoreThemeData}
        settings={storeData.settings as StoreSettingsData}
        sections={storeData.pages?.track?.sections as Record<string, Record<string, unknown>>}
        subdomain={subdomain}
        order={orderData}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        dataUpdatedAt={dataUpdatedAt}
        onMarkPickedUp={handleMarkPickedUp}
      />
    </StorefrontLayout>
  )
}
