'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { Loader2 } from 'lucide-react'

export default function RestaurantDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const subdomain = params.subdomain as string
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/store/${subdomain}/login`)
    }
  }, [isAuthenticated, isLoading, router, subdomain])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Restaurant</h1>
        <p className="text-gray-500 mt-2">Bienvenue sur votre espace de gestion - {subdomain}</p>
      </div>
    </div>
  )
}
