'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { Loader2, Check, Building2, User, MapPin, Palette, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const steps = [
  { id: 1, title: 'Informations', icon: User },
  { id: 2, title: 'Compte', icon: Building2 },
  { id: 3, title: 'Organisation', icon: MapPin },
  { id: 4, title: 'Branding', icon: Palette },
]

interface TokenValidation {
  valid: boolean
  email: string
  organizationId: string
  organizationName: string
}

function ResellerOnboardingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    siret: '',
    primaryColor: '#10b981',
  })

  const { data: validation, isLoading: isValidating, error: validationError } = useQuery({
    queryKey: ['reseller-onboarding-validate', token],
    queryFn: async () => {
      const res = await apiClient.get<TokenValidation>(`/onboarding/reseller/validate?token=${token}`)
      return res.data
    },
    enabled: !!token,
    retry: false,
  })

  useEffect(() => {
    if (validation?.organizationName) {
      setFormData(prev => ({ ...prev, organizationName: validation.organizationName }))
    }
  }, [validation])

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/reseller/complete', {
        token,
        ...formData,
      })
    },
    onSuccess: () => {
      toast.success('Compte cree avec succes !')
      router.push('/login?registered=reseller')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la creation du compte')
    },
  })

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.organizationName) {
        toast.error('Veuillez remplir tous les champs obligatoires')
        return
      }
    }
    if (currentStep === 2) {
      if (!formData.password || formData.password.length < 8) {
        toast.error('Le mot de passe doit contenir au moins 8 caracteres')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas')
        return
      }
    }
    setCurrentStep(prev => Math.min(4, prev + 1))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  const handleSubmit = () => {
    completeMutation.mutate()
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500 mb-6">Ce lien d'invitation n'est pas valide ou a expire.</p>
          <Button onClick={() => router.push('/login')}>Retour a la connexion</Button>
        </div>
      </div>
    )
  }

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!validation?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Lien expire</h1>
          <p className="text-gray-500 mb-6">Ce lien d'invitation a expire. Contactez l'administrateur pour en obtenir un nouveau.</p>
          <Button onClick={() => router.push('/login')}>Retour a la connexion</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">IziResto</h1>
              <p className="text-xs text-gray-500">Inscription revendeur</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">{validation.email}</p>
        </div>
      </div>

      <div className="flex-1 py-8 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                      isCompleted ? 'bg-emerald-500 text-white' :
                      isActive ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500' :
                      'bg-gray-100 text-gray-400'
                    )}>
                      {isCompleted ? <Check size={20} /> : <Icon size={18} />}
                    </div>
                    <span className={cn(
                      'text-xs mt-2 hidden sm:block',
                      isActive ? 'text-emerald-600 font-medium' : 'text-gray-500'
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'w-12 sm:w-20 h-0.5 mx-2',
                      isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Vos informations</h2>
                  <p className="text-sm text-gray-500">Renseignez vos informations personnelles</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prenom *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Jean"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Dupont"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Nom de l'organisation *</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                    placeholder="Mon Entreprise"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Votre compte</h2>
                  <p className="text-sm text-gray-500">Definissez votre mot de passe</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telephone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Minimum 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirmez votre mot de passe"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Votre organisation</h2>
                  <p className="text-sm text-gray-500">Informations de votre entreprise (optionnel)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 rue de la Paix"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="75001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Paris"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={formData.siret}
                    onChange={(e) => setFormData(prev => ({ ...prev, siret: e.target.value }))}
                    placeholder="123 456 789 00012"
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Personnalisation</h2>
                  <p className="text-sm text-gray-500">Personnalisez votre espace revendeur</p>
                </div>
                <div className="space-y-2">
                  <Label>Couleur principale</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-3">Apercu de votre couleur :</p>
                  <div className="flex gap-2">
                    <div
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      Bouton principal
                    </div>
                    <div
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: `${formData.primaryColor}20`, color: formData.primaryColor }}
                    >
                      Bouton secondaire
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack}>
                  Retour
                </Button>
              ) : (
                <div />
              )}
              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Continuer
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={completeMutation.isPending}>
                  {completeMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                  Creer mon compte
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResellerOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <ResellerOnboardingPageContent />
    </Suspense>
  )
}
