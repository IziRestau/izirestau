'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'
import { Loader2 } from 'lucide-react'

export default function LogoutPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const logout = useStorefrontAuthStore((state) => state.logout)

  useEffect(() => {
    logout()
    router.replace(`/store/${subdomain}`)
  }, [logout, router, subdomain])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      <p className="text-sm text-gray-500">Déconnexion en cours...</p>
    </div>
  )
}
