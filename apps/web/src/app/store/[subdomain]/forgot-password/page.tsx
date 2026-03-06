'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout'
import { loadThemeComponents } from '@/components/storefront/themes/_registry'
import type { ThemeComponents, StoreData } from '@/components/storefront/themes/_types'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const [themeComponents, setThemeComponents] = useState<ThemeComponents | null>(null)

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['store', subdomain],
    queryFn: async () => {
      const res = await api.store.getData(subdomain)
      return res.data as StoreData
    },
    enabled: !!subdomain,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (storeData?.theme?.baseTheme) {
      loadThemeComponents(storeData.theme.baseTheme).then(setThemeComponents)
    }
  }, [storeData?.theme?.baseTheme])

  if (isLoading || !themeComponents || !storeData || !storeData.theme) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const ForgotPasswordPageComponent = themeComponents.ForgotPasswordPage
  if (!ForgotPasswordPageComponent) {
    return (
      <StorefrontLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-gray-500">Page non disponible</p>
        </div>
      </StorefrontLayout>
    )
  }

  const pagesData = (storeData as unknown as { pages?: Record<string, { sections?: Record<string, Record<string, unknown>> }> }).pages

  return (
    <StorefrontLayout>
      <ForgotPasswordPageComponent
        restaurant={storeData.restaurant}
        theme={storeData.theme}
        sections={pagesData?.['forgot-password']?.sections}
        subdomain={subdomain}
      />
    </StorefrontLayout>
  )
}
