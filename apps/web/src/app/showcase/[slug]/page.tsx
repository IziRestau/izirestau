'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader2, Lock, Headphones } from 'lucide-react'
import { CheckoutModal } from '@/components/showcase/CheckoutModal'
import {
  HeroSection,
  ProductSection,
  HowItWorksSection,
  BenefitsSection,
  PricingSection,
  TestimonialsSection,
  FaqSection,
  ContactSection,
} from '@/components/showcase/sections'
import {
  HeroConfig,
  ProductConfig,
  HowItWorksConfig,
  BenefitsConfig,
  PricingConfig,
  TestimonialsConfig,
  FaqConfig,
  ContactConfig,
  FooterConfig,
  GlobalStyles,
  SectionType,
  DEFAULT_SECTIONS_ORDER,
} from '@/types/showcase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface ShowcaseData {
  organization: {
    name: string
    slug: string
    logo: string | null
    primaryColor: string
    email: string | null
    phone: string | null
    website: string | null
  }
  showcase: {
    heroConfig: HeroConfig | null
    productConfig: ProductConfig | null
    howItWorksConfig: HowItWorksConfig | null
    benefitsConfig: BenefitsConfig | null
    pricingConfig: PricingConfig | null
    testimonialsConfig: TestimonialsConfig | null
    faqConfig: FaqConfig | null
    contactConfig: ContactConfig | null
    footerConfig: FooterConfig | null
    sectionsOrder: SectionType[] | null
    globalStyles: GlobalStyles | null
    template: string
    metaTitle: string | null
    metaDescription: string | null
  }
}

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  currency: string
  billingCycle: number
  billingCycleLabel: string | null
  isCustom: boolean
  isPopular: boolean
}

export default function PublicShowcasePage() {
  const params = useParams()
  const slug = params.slug as string
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  const { data: showcaseData, isLoading: showcaseLoading, error: showcaseError } = useQuery({
    queryKey: ['public-showcase', slug],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/public/showcase/${slug}`)
      if (!res.ok) throw new Error('Showcase not found')
      const data = await res.json()
      return data.data as ShowcaseData
    },
    enabled: !!slug,
  })

  const { data: plansData } = useQuery({
    queryKey: ['public-showcase-plans', slug],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/public/showcase/${slug}/plans`)
      if (!res.ok) throw new Error('Plans not found')
      const data = await res.json()
      return data.data as Plan[]
    },
    enabled: !!slug,
  })

  if (showcaseLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (showcaseError || !showcaseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page non trouvée</h1>
          <p className="text-gray-500">Cette vitrine n'existe pas ou n'est pas disponible.</p>
        </div>
      </div>
    )
  }

  const { organization, showcase } = showcaseData
  const plans = plansData || []
  const primaryColor = organization.primaryColor || '#10b981'
  const sectionsOrder = showcase.sectionsOrder || DEFAULT_SECTIONS_ORDER

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowCheckoutModal(true)
  }

  const renderSection = (sectionType: SectionType) => {
    switch (sectionType) {
      case 'hero':
        return (
          <HeroSection
            key="hero"
            config={showcase.heroConfig}
            organizationName={organization.name}
            primaryColor={primaryColor}
          />
        )
      case 'product':
        return (
          <ProductSection
            key="product"
            config={showcase.productConfig}
            primaryColor={primaryColor}
          />
        )
      case 'howItWorks':
        return (
          <HowItWorksSection
            key="howItWorks"
            config={showcase.howItWorksConfig}
            primaryColor={primaryColor}
          />
        )
      case 'benefits':
        return (
          <BenefitsSection
            key="benefits"
            config={showcase.benefitsConfig}
            primaryColor={primaryColor}
          />
        )
      case 'pricing':
        return (
          <PricingSection
            key="pricing"
            config={showcase.pricingConfig}
            plans={plans}
            primaryColor={primaryColor}
            onSelectPlan={handleSelectPlan}
          />
        )
      case 'testimonials':
        return (
          <TestimonialsSection
            key="testimonials"
            config={showcase.testimonialsConfig}
            primaryColor={primaryColor}
          />
        )
      case 'faq':
        return (
          <FaqSection
            key="faq"
            config={showcase.faqConfig}
            primaryColor={primaryColor}
          />
        )
      case 'contact':
        return (
          <ContactSection
            key="contact"
            config={showcase.contactConfig}
            organization={organization}
            slug={slug}
            primaryColor={primaryColor}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {organization.logo ? (
                <img src={organization.logo} alt={organization.name} className="h-8 w-auto" />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {organization.name[0]}
                </div>
              )}
              <span className="font-semibold text-gray-900">{organization.name}</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#product" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Tarifs
              </a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                FAQ
              </a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Contact
              </a>
            </nav>
            {plans.length > 0 && (
              <a
                href="#pricing"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor, color: 'white' }}
              >
                Commencer
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Sections */}
      <main>
        {sectionsOrder.map(renderSection)}
      </main>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {organization.logo ? (
                  <img src={organization.logo} alt={organization.name} className="h-8 w-auto brightness-0 invert" />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {organization.name[0]}
                  </div>
                )}
                <span className="font-semibold">{organization.name}</span>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                Votre partenaire pour digitaliser et développer votre restaurant avec une solution complète et moderne.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#product" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Garanties</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Lock size={16} style={{ color: primaryColor }} />
                  Données sécurisées
                </li>
                <li className="flex items-center gap-2">
                  <Headphones size={16} style={{ color: primaryColor }} />
                  Support inclus
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} {organization.name}. Tous droits réservés.
            </p>
            <p className="text-xs text-gray-500">
              Propulsé par IziResto
            </p>
          </div>
        </div>
      </footer>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => {
            setShowCheckoutModal(false)
            setSelectedPlan(null)
          }}
          plan={selectedPlan}
          organizationSlug={slug}
          organizationName={organization.name}
          primaryColor={primaryColor}
        />
      )}
    </div>
  )
}
