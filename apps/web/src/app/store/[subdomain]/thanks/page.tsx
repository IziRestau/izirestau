'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout'
import { loadThemeComponents } from '@/components/storefront/themes/_registry'
import type { ThemeComponents } from '@/components/storefront/themes/_types'
import { Loader2 } from 'lucide-react'

export default function ThanksPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  const orderId = searchParams.get('orderId')
  const [themeComponents, setThemeComponents] = useState<ThemeComponents | null>(null)

  const { data: storeData, isLoading: storeLoading } = useQuery({
    queryKey: ['store', subdomain],
    queryFn: async () => {
      const res = await api.store.getData(subdomain)
      return res.data
    },
    enabled: !!subdomain,
    staleTime: 5 * 60 * 1000,
  })

  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['storefront-order', subdomain, orderId],
    queryFn: async () => {
      if (!orderId) return null
      const res = await api.store.getOrder(subdomain, orderId)
      return res.data
    },
    enabled: !!subdomain && !!orderId,
  })

  useEffect(() => {
    if (storeData?.theme?.baseTheme) {
      loadThemeComponents(storeData.theme.baseTheme).then(setThemeComponents)
    }
  }, [storeData?.theme?.baseTheme])

  if (storeLoading || orderLoading || !themeComponents || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const ThanksPageComponent = themeComponents.ThanksPage
  if (!ThanksPageComponent) {
    return (
      <StorefrontLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-gray-500">Page de remerciement non disponible</p>
        </div>
      </StorefrontLayout>
    )
  }

  const order = orderData ? {
    id: orderData.id,
    orderNumber: orderData.orderNumber,
    status: orderData.status,
    serviceType: orderData.serviceType,
    estimatedTime: orderData.estimatedTime,
    total: orderData.total,
    items: orderData.items.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    })),
  } : {
    id: orderId || 'unknown',
    orderNumber: orderId?.slice(-6).toUpperCase() || '000000',
    status: 'PENDING',
    serviceType: 'PICKUP',
    estimatedTime: 30,
    total: 0,
    items: [],
  }

  return (
    <StorefrontLayout>
      <ThanksPageComponent
        restaurant={storeData.restaurant}
        theme={storeData.theme}
        settings={storeData.settings}
        sections={storeData.pages?.thanks?.sections}
        subdomain={subdomain}
        order={order}
      />
    </StorefrontLayout>
  )
}
