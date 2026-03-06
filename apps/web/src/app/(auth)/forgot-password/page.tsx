'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await api.auth.forgotPassword(email)
      setIsSubmitted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-[480px] bg-[#1e2128] flex-col p-10">
        <Logo size="md" theme="dark" />
        
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Mot de passe oublie ?
          </h2>
          <p className="text-gray-400 mb-10">
            Pas de panique ! Entrez votre adresse email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-medium">Verification par email</div>
                <div className="text-sm text-gray-400">Lien securise envoye a votre adresse</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          2024 IziResto. Tous droits reserves.
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8f9fb]">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8 lg:hidden">
            <Logo size="md" theme="light" className="justify-center mb-6" />
          </div>

          {isSubmitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email envoye !</h1>
              <p className="text-gray-500 mb-8">
                Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un email avec les instructions pour reinitialiser votre mot de passe.
              </p>
              <p className="text-gray-400 text-sm mb-8">
                Verifiez votre boite de reception et vos spams.
              </p>
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 text-emerald-500 font-semibold hover:text-emerald-600"
              >
                <ArrowLeft size={18} />
                Retour a la connexion
              </Link>
            </div>
          ) : (
            <>
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8"
              >
                <ArrowLeft size={18} />
                Retour
              </Link>
              
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Reinitialiser le mot de passe</h1>
                <p className="mt-2 text-gray-500">Entrez votre email pour recevoir un lien de reinitialisation</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Adresse email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nom@entreprise.com"
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
              </form>

              <p className="mt-8 text-center text-gray-500 text-sm">
                Vous vous souvenez de votre mot de passe ?{' '}
                <Link href="/login" className="text-emerald-500 font-semibold hover:text-emerald-600">
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
