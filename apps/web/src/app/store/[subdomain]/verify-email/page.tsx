'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout'
import { loadThemeComponents } from '@/components/storefront/themes/_registry'
import type { ThemeComponents, StoreThemeData } from '@/components/storefront/themes/_types'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  const token = searchParams.get('token')
  
  const [themeComponents, setThemeComponents] = useState<ThemeComponents | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const { data: storeData, isLoading: isLoadingStore } = useQuery({
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

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !subdomain) {
        setVerificationStatus('error')
        setErrorMessage('Lien de vérification invalide')
        return
      }

      try {
        const res = await api.store.verifyEmail(subdomain, token)
        if (res.success) {
          setVerificationStatus('success')
        } else {
          setVerificationStatus('error')
          setErrorMessage(res.message || 'Erreur lors de la vérification')
        }
      } catch {
        setVerificationStatus('error')
        setErrorMessage('Erreur lors de la vérification')
      }
    }

    if (storeData) {
      verifyEmail()
    }
  }, [token, subdomain, storeData])

  if (isLoadingStore || !themeComponents || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const theme = storeData.theme as StoreThemeData

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  return (
    <StorefrontLayout>
      <div 
        className="min-h-[60vh] flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div className="text-center max-w-md">
          {verificationStatus === 'loading' && (
            <>
              <Loader2 
                className="w-12 h-12 animate-spin mx-auto mb-6" 
                style={{ color: theme.primaryColor }} 
              />
              <h1 
                className="text-2xl font-bold mb-3"
                style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
              >
                Vérification en cours...
              </h1>
              <p 
                className="text-sm"
                style={{ color: `${theme.textColor}70` }}
              >
                Veuillez patienter
              </p>
            </>
          )}

          {verificationStatus === 'success' && (
            <>
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: theme.primaryColor }} />
              </div>
              <h1 
                className="text-2xl font-bold mb-3"
                style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
              >
                Email vérifié
              </h1>
              <p 
                className="text-sm mb-6"
                style={{ color: `${theme.textColor}70` }}
              >
                Votre adresse email a été vérifiée avec succès.
              </p>
              <Link
                href={`/store/${subdomain}/account`}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 ${btnClass}`}
                style={{ backgroundColor: theme.primaryColor }}
              >
                Accéder à mon compte
              </Link>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: '#fef2f2' }}
              >
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 
                className="text-2xl font-bold mb-3"
                style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
              >
                Erreur de vérification
              </h1>
              <p 
                className="text-sm mb-6"
                style={{ color: `${theme.textColor}70` }}
              >
                {errorMessage}
              </p>
              <Link
                href={`/store/${subdomain}/login`}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 ${btnClass}`}
                style={{ backgroundColor: theme.primaryColor }}
              >
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </StorefrontLayout>
  )
}
