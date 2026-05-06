'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { UtensilsCrossed, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

function RestaurantForgotPasswordPageContent() {
  const searchParams = useSearchParams()
  const subdomain = searchParams.get('subdomain') || ''
  
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await apiClient.post('/auth/forgot-password', { email })
      setIsSubmitted(true)
      toast.success('Email envoye avec succes')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifiez votre boite mail
          </h1>
          <p className="text-gray-500 mb-8">
            Nous avons envoye un lien de reinitialisation a <strong>{email}</strong>
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour a la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            {subdomain ? subdomain.charAt(0).toUpperCase() + subdomain.slice(1) : 'Restaurant'}
          </span>
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Mot de passe oublie ?
        </h1>
        <p className="text-gray-500 mb-8">
          Entrez votre email pour recevoir un lien de reinitialisation
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              placeholder="votre@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour a la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RestaurantForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <RestaurantForgotPasswordPageContent />
    </Suspense>
  )
}
