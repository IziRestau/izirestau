'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { Loader2 } from 'lucide-react'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated, checkAuth, user } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (_hasHydrated) {
      checkAuth()
    }
  }, [_hasHydrated, checkAuth])

  useEffect(() => {
    if (_hasHydrated) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (!user?.isSuperAdmin) {
        router.replace('/login')
      } else {
        setIsReady(true)
      }
    }
  }, [_hasHydrated, isAuthenticated, user, router])

  if (!_hasHydrated || !isReady) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
