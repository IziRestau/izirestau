'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout'
import { loadThemeComponents } from '@/components/storefront/themes/_registry'
import type { ThemeComponents, CheckoutSubmitData } from '@/components/storefront/themes/_types'
import { useStorefrontCartStore } from '@/stores/storefront-cart.store'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'
import { Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const [themeComponents, setThemeComponents] = useState<ThemeComponents | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { items } = useStorefrontCartStore()
  const { customer, isAuthenticated } = useStorefrontAuthStore()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const { data: storeResponse, isLoading } = useQuery({
    queryKey: ['store', subdomain],
    queryFn: () => api.store.getData(subdomain),
    enabled: !!subdomain,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 500,
  })

  const storeData = (storeResponse?.data ?? storeResponse) as {
    theme?: Record<string, unknown> & { baseTheme?: string }
    restaurant?: Record<string, unknown>
    settings?: Record<string, unknown>
    pages?: { checkout?: { sections?: Record<string, unknown> } }
  } | undefined

  useEffect(() => {
    if (storeData?.theme?.baseTheme) {
      loadThemeComponents(storeData.theme.baseTheme).then(setThemeComponents)
    }
  }, [storeData?.theme?.baseTheme])

  useEffect(() => {
    if (isHydrated && items.length === 0 && !isLoading && !isSubmitting) {
      router.push(`/store/${subdomain}/menu`)
    }
  }, [isHydrated, items.length, isLoading, isSubmitting, router, subdomain])

  const handleSubmit = async (data: CheckoutSubmitData) => {
    const cartStore = useStorefrontCartStore.getState()
    setIsSubmitting(true)
    
    try {
      const res = await api.store.createOrder(subdomain, {
        serviceType: data.serviceType,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        customerNotes: data.notes,
        customerId: isAuthenticated && customer ? customer.id : undefined,
        items: cartStore.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
          modifiers: item.modifiers?.map(m => ({ id: m.id, name: m.name, price: m.price })),
          notes: item.notes || undefined,
        })),
      })
      if (res.success && res.data) {
        cartStore.clearCart()
        // Si paiement Mobile Money, rediriger vers l'URL de paiement Moneroo
        if (res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl
        } else {
          window.location.href = `/store/${subdomain}/thanks?orderId=${res.data.orderId}`
        }
      } else {
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error)
      setIsSubmitting(false)
    }
  }

  if (!isHydrated || isLoading || !themeComponents || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const CheckoutPageComponent = themeComponents.CheckoutPage
  if (!CheckoutPageComponent) {
    return (
      <StorefrontLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-gray-500">Page de paiement non disponible</p>
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout>
      <CheckoutPageComponent
        restaurant={storeData.restaurant as any}
        theme={storeData.theme as any}
        settings={storeData.settings as any}
        sections={storeData.pages?.checkout?.sections as any}
        subdomain={subdomain}
        onSubmit={handleSubmit}
      />
    </StorefrontLayout>
  )
}
