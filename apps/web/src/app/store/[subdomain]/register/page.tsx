'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout'
import { loadThemeComponents } from '@/components/storefront/themes/_registry'
import type { ThemeComponents } from '@/components/storefront/themes/_types'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  const redirectTo = searchParams.get('redirect') || `/store/${subdomain}/account`
  const [themeComponents, setThemeComponents] = useState<ThemeComponents | null>(null)

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['store', subdomain],
    queryFn: async () => {
      const res = await api.store.getData(subdomain)
      return res.data
    },
    enabled: !!subdomain,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (storeData?.theme?.baseTheme) {
      loadThemeComponents(storeData.theme.baseTheme).then(setThemeComponents)
    }
  }, [storeData?.theme?.baseTheme])

  const handleSuccess = () => {
    router.push(redirectTo)
  }

  if (isLoading || !themeComponents || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const RegisterPageComponent = themeComponents.RegisterPage
  if (!RegisterPageComponent) {
    return (
      <StorefrontLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-gray-500">Page d&apos;inscription non disponible</p>
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout>
      <RegisterPageComponent
        restaurant={storeData.restaurant}
        theme={storeData.theme}
        settings={storeData.settings}
        sections={storeData.pages?.register?.sections}
        subdomain={subdomain}
        redirectTo={redirectTo}
        onSuccess={handleSuccess}
      />
    </StorefrontLayout>
  )
}
