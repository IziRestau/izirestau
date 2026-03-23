'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Save, Eye, Loader2, Menu, ChevronRight,
  Palette, Layout, List, MessageSquare,
  HelpCircle, Phone, CreditCard, Sparkles, TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { resellerNavigation } from '@/config/reseller-navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  ShowcaseConfig,
  HeroConfig,
  ProductConfig,
  HowItWorksConfig,
  BenefitsConfig,
  PricingConfig,
  TestimonialsConfig,
  FaqConfig,
  ContactConfig,
  GlobalStyles,
  SectionType,
  DEFAULT_HERO_CONFIG,
  DEFAULT_PRODUCT_CONFIG,
  DEFAULT_HOW_IT_WORKS_CONFIG,
  DEFAULT_BENEFITS_CONFIG,
  DEFAULT_PRICING_CONFIG,
  DEFAULT_TESTIMONIALS_CONFIG,
  DEFAULT_FAQ_CONFIG,
  DEFAULT_CONTACT_CONFIG,
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_SECTIONS_ORDER,
} from '@/types/showcase'

type EditorTab = SectionType | 'global'

const TABS: { id: EditorTab; label: string; description: string; icon: typeof Sparkles }[] = [
  { id: 'hero', label: 'Hero', description: 'Titre et accroche', icon: Sparkles },
  { id: 'product', label: 'Fonctionnalités', description: 'Modules de la solution', icon: Layout },
  { id: 'howItWorks', label: 'Comment ça marche', description: 'Étapes du processus', icon: List },
  { id: 'benefits', label: 'Avantages', description: 'Bénéfices clients', icon: TrendingUp },
  { id: 'pricing', label: 'Tarifs', description: 'Plans et prix', icon: CreditCard },
  { id: 'testimonials', label: 'Témoignages', description: 'Avis clients', icon: MessageSquare },
  { id: 'faq', label: 'FAQ', description: 'Questions fréquentes', icon: HelpCircle },
  { id: 'contact', label: 'Contact', description: 'Formulaire de contact', icon: Phone },
  { id: 'global', label: 'Styles', description: 'Polices et apparence', icon: Palette },
]

export default function ShowcaseEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  
  const sectionFromUrl = searchParams.get('section') as EditorTab | null
  const [activeTab, setActiveTab] = useState<EditorTab>(sectionFromUrl || 'hero')
  const [hasChanges, setHasChanges] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [config, setConfig] = useState<Partial<ShowcaseConfig>>({
    heroConfig: DEFAULT_HERO_CONFIG,
    productConfig: DEFAULT_PRODUCT_CONFIG,
    howItWorksConfig: DEFAULT_HOW_IT_WORKS_CONFIG,
    benefitsConfig: DEFAULT_BENEFITS_CONFIG,
    pricingConfig: DEFAULT_PRICING_CONFIG,
    testimonialsConfig: DEFAULT_TESTIMONIALS_CONFIG,
    faqConfig: DEFAULT_FAQ_CONFIG,
    contactConfig: DEFAULT_CONTACT_CONFIG,
    globalStyles: DEFAULT_GLOBAL_STYLES,
    sectionsOrder: DEFAULT_SECTIONS_ORDER,
    template: 'modern',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['reseller-showcase'],
    queryFn: api.reseller.getShowcase,
  })

  useEffect(() => {
    if (data?.data?.showcase) {
      const showcase = data.data.showcase
      setConfig({
        heroConfig: (showcase.heroConfig as unknown as HeroConfig) || DEFAULT_HERO_CONFIG,
        productConfig: (showcase.productConfig as unknown as ProductConfig) || DEFAULT_PRODUCT_CONFIG,
        howItWorksConfig: (showcase.howItWorksConfig as unknown as HowItWorksConfig) || DEFAULT_HOW_IT_WORKS_CONFIG,
        benefitsConfig: (showcase.benefitsConfig as unknown as BenefitsConfig) || DEFAULT_BENEFITS_CONFIG,
        pricingConfig: (showcase.pricingConfig as unknown as PricingConfig) || DEFAULT_PRICING_CONFIG,
        testimonialsConfig: (showcase.testimonialsConfig as unknown as TestimonialsConfig) || DEFAULT_TESTIMONIALS_CONFIG,
        faqConfig: (showcase.faqConfig as unknown as FaqConfig) || DEFAULT_FAQ_CONFIG,
        contactConfig: (showcase.contactConfig as unknown as ContactConfig) || DEFAULT_CONTACT_CONFIG,
        globalStyles: (showcase.globalStyles as unknown as GlobalStyles) || DEFAULT_GLOBAL_STYLES,
        sectionsOrder: (showcase.sectionsOrder as unknown as SectionType[]) || DEFAULT_SECTIONS_ORDER,
        template: (showcase.template as ShowcaseConfig['template']) || 'modern',
      })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (configData: Partial<ShowcaseConfig>) => api.reseller.updateShowcase(configData as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-showcase'] })
      toast.success('Configuration sauvegardée')
      setHasChanges(false)
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde')
    },
  })

  const handleSave = () => {
    saveMutation.mutate(config)
  }

  const updateConfig = <K extends keyof ShowcaseConfig>(key: K, value: ShowcaseConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleTabChange = (tab: EditorTab) => {
    setActiveTab(tab)
    router.push(`/reseller/showcase/editor?section=${tab}`, { scroll: false })
    setIsMobileMenuOpen(false)
  }

  const organization = data?.data?.organization

  const previewUrl = data?.data?.organization?.slug 
    ? `/showcase/${data.data.organization.slug}` 
    : null

  if (isLoading) {
    return (
      <PageSkeleton
        navigation={resellerNavigation}
        basePath="/reseller"
        title="Éditeur de vitrine"
        variant="detail"
      />
    )
  }

  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
    >
      <PageHeader
        title="Éditeur de vitrine"
        subtitle="Personnalisez votre page publique"
        icon={Layout}
        actions={
          <div className="flex items-center gap-3">
            {previewUrl && (
              <button
                onClick={() => window.open(previewUrl, '_blank')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Eye size={16} />
                <span className="hidden sm:inline">Prévisualiser</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>
          </div>
        }
      />

      {/* Layout avec sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Tab Selector */}
        <div className="lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentTab = TABS.find(t => t.id === activeTab)
                    const Icon = currentTab?.icon || Sparkles
                    return (
                      <>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-900">
                          <Icon size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{currentTab?.label}</p>
                          <p className="text-xs text-gray-500">{currentTab?.description}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <Menu size={18} className="text-gray-400" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-2xl">
              <SheetHeader className="pb-4">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 pb-6">
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all w-full',
                        isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{tab.label}</p>
                          <p className={cn('text-xs truncate', isActive ? 'opacity-80' : 'text-gray-400')}>
                            {tab.description}
                          </p>
                        </div>
                      </div>
                      {isActive && <ChevronRight size={16} />}
                    </button>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Sidebar Desktop */}
        <div className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-2 sticky top-24">
            <nav className="flex flex-col gap-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full",
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <tab.icon size={20} className="flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{tab.label}</p>
                      <p className={cn("text-xs", isActive ? "opacity-80" : "text-gray-400")}>
                        {tab.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            {activeTab === 'global' && (
              <GlobalStylesEditor
                styles={config.globalStyles || DEFAULT_GLOBAL_STYLES}
                onChange={(styles) => updateConfig('globalStyles', styles)}
                organizationColor={organization?.primaryColor}
              />
            )}

            {activeTab === 'hero' && (
              <HeroEditor
                config={config.heroConfig || DEFAULT_HERO_CONFIG}
                onChange={(heroConfig) => updateConfig('heroConfig', heroConfig)}
              />
            )}

            {activeTab === 'product' && (
              <ProductEditor
                config={config.productConfig || DEFAULT_PRODUCT_CONFIG}
                onChange={(productConfig) => updateConfig('productConfig', productConfig)}
              />
            )}

            {activeTab === 'howItWorks' && (
              <HowItWorksEditor
                config={config.howItWorksConfig || DEFAULT_HOW_IT_WORKS_CONFIG}
                onChange={(howItWorksConfig) => updateConfig('howItWorksConfig', howItWorksConfig)}
              />
            )}

            {activeTab === 'benefits' && (
              <BenefitsEditor
                config={config.benefitsConfig || DEFAULT_BENEFITS_CONFIG}
                onChange={(benefitsConfig) => updateConfig('benefitsConfig', benefitsConfig)}
              />
            )}

            {activeTab === 'pricing' && (
              <PricingEditor
                config={config.pricingConfig || DEFAULT_PRICING_CONFIG}
                onChange={(pricingConfig) => updateConfig('pricingConfig', pricingConfig)}
              />
            )}

            {activeTab === 'testimonials' && (
              <TestimonialsEditor
                config={config.testimonialsConfig || DEFAULT_TESTIMONIALS_CONFIG}
                onChange={(testimonialsConfig) => updateConfig('testimonialsConfig', testimonialsConfig)}
              />
            )}

            {activeTab === 'faq' && (
              <FaqEditor
                config={config.faqConfig || DEFAULT_FAQ_CONFIG}
                onChange={(faqConfig) => updateConfig('faqConfig', faqConfig)}
              />
            )}

            {activeTab === 'contact' && (
              <ContactEditor
                config={config.contactConfig || DEFAULT_CONTACT_CONFIG}
                onChange={(contactConfig) => updateConfig('contactConfig', contactConfig)}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
  )
}

function FormGroup({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      {children}
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function GlobalStylesEditor({ styles, onChange, organizationColor }: { styles: GlobalStyles; onChange: (styles: GlobalStyles) => void; organizationColor?: string }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Styles globaux" description="Personnalisez l'apparence générale de votre vitrine" />
      
      {/* Affichage de la couleur de l'organisation */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex-shrink-0"
            style={{ backgroundColor: organizationColor || '#10b981' }}
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Couleur de votre organisation</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Cette couleur est utilisée sur votre vitrine. Modifiez-la dans <span className="font-medium">Paramètres &gt; Branding</span>.
            </p>
          </div>
        </div>
      </div>

      <FormGroup label="Police de caractères">
        <Select value={styles.fontFamily} onValueChange={(value: GlobalStyles['fontFamily']) => onChange({ ...styles, fontFamily: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="inter">Inter</SelectItem>
            <SelectItem value="poppins">Poppins</SelectItem>
            <SelectItem value="roboto">Roboto</SelectItem>
            <SelectItem value="open-sans">Open Sans</SelectItem>
            <SelectItem value="montserrat">Montserrat</SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormGroup label="Arrondi des bordures">
          <Select value={styles.borderRadius} onValueChange={(value: GlobalStyles['borderRadius']) => onChange({ ...styles, borderRadius: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              <SelectItem value="small">Petit</SelectItem>
              <SelectItem value="medium">Moyen</SelectItem>
              <SelectItem value="large">Grand</SelectItem>
              <SelectItem value="full">Complet</SelectItem>
            </SelectContent>
          </Select>
        </FormGroup>
        
        <FormGroup label="Style des cartes">
          <Select value={styles.cardStyle} onValueChange={(value: GlobalStyles['cardStyle']) => onChange({ ...styles, cardStyle: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Plat</SelectItem>
              <SelectItem value="bordered">Bordure</SelectItem>
              <SelectItem value="shadow">Ombre</SelectItem>
              <SelectItem value="elevated">Élevé</SelectItem>
            </SelectContent>
          </Select>
        </FormGroup>
      </div>

      <FormGroup label="Espacement">
        <Select value={styles.spacing} onValueChange={(value: GlobalStyles['spacing']) => onChange({ ...styles, spacing: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">Compact</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="relaxed">Aéré</SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>
    </div>
  )
}

function HeroEditor({ config, onChange }: { config: HeroConfig; onChange: (config: HeroConfig) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Section Hero" description="La première section que vos visiteurs verront" />
      
      <FormGroup label="Layout">
        <Select value={config.layout} onValueChange={(value: HeroConfig['layout']) => onChange({ ...config, layout: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="centered">Centré</SelectItem>
            <SelectItem value="split">Divisé (texte + image)</SelectItem>
            <SelectItem value="video">Avec vidéo</SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>

      <FormGroup label="Titre principal">
        <Input value={config.title} onChange={(e) => onChange({ ...config, title: e.target.value })} placeholder="Digitalisez votre restaurant" />
      </FormGroup>

      <FormGroup label="Sous-titre">
        <Textarea value={config.subtitle} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} rows={3} placeholder="Une solution complète pour gérer votre établissement..." />
      </FormGroup>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormGroup label="Texte du bouton CTA">
          <Input value={config.ctaText} onChange={(e) => onChange({ ...config, ctaText: e.target.value })} placeholder="Découvrir nos offres" />
        </FormGroup>
        
        <FormGroup label="Action du bouton">
          <Select value={config.ctaAction} onValueChange={(value: HeroConfig['ctaAction']) => onChange({ ...config, ctaAction: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pricing">Aller aux tarifs</SelectItem>
              <SelectItem value="contact">Aller au contact</SelectItem>
              <SelectItem value="custom">URL personnalisée</SelectItem>
            </SelectContent>
          </Select>
        </FormGroup>
      </div>

      <ToggleRow label="Afficher les statistiques" description="Ex: +30% de commandes, 2h gagnées/jour" checked={config.showStats} onChange={(checked) => onChange({ ...config, showStats: checked })} />
    </div>
  )
}

function ProductEditor({ config, onChange }: { config: ProductConfig; onChange: (config: ProductConfig) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Fonctionnalités" description="Présentez ce que votre solution offre" />
      
      <ToggleRow label="Activer cette section" checked={config.enabled} onChange={(checked) => onChange({ ...config, enabled: checked })} />

      <FormGroup label="Titre">
        <Input value={config.title} onChange={(e) => onChange({ ...config, title: e.target.value })} />
      </FormGroup>

      <FormGroup label="Sous-titre">
        <Textarea value={config.subtitle} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} rows={2} />
      </FormGroup>

      <FormGroup label="Layout">
        <Select value={config.layout} onValueChange={(value: ProductConfig['layout']) => onChange({ ...config, layout: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grille</SelectItem>
            <SelectItem value="list">Liste</SelectItem>
            <SelectItem value="tabs">Onglets</SelectItem>
            <SelectItem value="accordion">Accordéon</SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>

      <FormGroup label="Modules à afficher">
        <div className="space-y-2">
          {config.modules.map((module) => (
            <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm font-medium text-gray-700">{module.title}</span>
              <Switch
                checked={module.enabled}
                onCheckedChange={(checked) => {
                  const newModules = config.modules.map(m => m.id === module.id ? { ...m, enabled: checked } : m)
                  onChange({ ...config, modules: newModules })
                }}
              />
            </div>
          ))}
        </div>
      </FormGroup>
    </div>
  )
}

function HowItWorksEditor({ config, onChange }: { config: HowItWorksConfig; onChange: (config: HowItWorksConfig) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Comment ça marche" description="Expliquez le processus en étapes simples" />
      
      <ToggleRow label="Activer cette section" checked={config.enabled} onChange={(checked) => onChange({ ...config, enabled: checked })} />

      <FormGroup label="Titre">
        <Input value={config.title} onChange={(e) => onChange({ ...config, title: e.target.value })} />
      </FormGroup>

      <FormGroup label="Layout">
        <Select value={config.layout} onValueChange={(value: HowItWorksConfig['layout']) => onChange({ ...config, layout: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal</SelectItem>
            <SelectItem value="vertical">Vertical</SelectItem>
            <SelectItem value="timeline">Timeline</SelectItem>
            <SelectItem value="numbered">Numéroté</SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>

      <FormGroup label={`Étapes (${config.steps.length})`}>
        <div className="space-y-3">
          {config.steps.map((step, idx) => (
            <div key={step.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                <Input value={step.title} onChange={(e) => { const newSteps = config.steps.map((s, i) => i === idx ? { ...s, title: e.target.value } : s); onChange({ ...config, steps: newSteps }) }} placeholder="Titre de l'étape" className="flex-1" />
              </div>
              <Textarea value={step.description} onChange={(e) => { const newSteps = config.steps.map((s, i) => i === idx ? { ...s, description: e.target.value } : s); onChange({ ...config, steps: newSteps }) }} placeholder="Description" rows={2} />
            </div>
          ))}
        </div>
      </FormGroup>
    </div>
  )
}

function BenefitsEditor({ config, onChange }: { config: BenefitsConfig; onChange: (config: BenefitsConfig) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Avantages" description="Mettez en avant les bénéfices de votre solution" />
      
      <ToggleRow label="Activer cette section" checked={config.enabled} onChange={(checked) => onChange({ ...config, enabled: checked })} />

      <FormGroup label="Titre">
        <Input value={config.title} onChange={(e) => onChange({ ...config, title: e.target.value })} />
      </FormGroup>

      <FormGroup label="Layout">
        <Select value={config.layout} onValueChange={(value: BenefitsConfig['layout']) => onChange({ ...config, layout: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grille</SelectItem>
            <SelectItem value="cards">Cartes</SelectItem>
            <SelectItem value="icons">Icônes</SelectItem>
            <SelectItem value="alternating">Alterné</SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>

      <FormGroup label={`Avantages (${config.items.length})`}>
        <div className="space-y-3">
          {config.items.map((item, idx) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
              <Input value={item.title} onChange={(e) => { const newItems = config.items.map((i, index) => index === idx ? { ...i, title: e.target.value } : i); onChange({ ...config, items: newItems }) }} placeholder="Titre" />
              <Textarea value={item.description} onChange={(e) => { const newItems = config.items.map((i, index) => index === idx ? { ...i, description: e.target.value } : i); onChange({ ...config, items: newItems }) }} placeholder="Description" rows={2} />
            </div>
          ))}
        </div>
      </FormGroup>
    </div>
  )
}

function PricingEditor({ config, onChange }: { config: PricingConfig; onChange: (config: PricingConfig) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Tarifs" description="Configuration de la section tarification" />
      
      <ToggleRow label="Activer cette section" checked={config.enabled} onChange={(checked) => onChange({ ...config, enabled: checked })} />

      <FormGroup label="Titre">
        <Input value={config.title} onChange={(e) => onChange({ ...config, title: e.target.value })} />
      </FormGroup>

      <FormGroup label="Sous-titre">
        <Textarea value={config.subtitle} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} rows={2} />
      </FormGroup>

      <FormGroup label="Layout">
        <Select value={config.layout} onValueChange={(value: PricingConfig['layout']) => onChange({ ...config, layout: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cards">Cartes</SelectItem>
            <SelectItem value="table">Tableau</SelectItem>
            <SelectItem value="comparison">Comparaison</SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>

      <ToggleRow label="Afficher les fonctionnalités" description="Liste des fonctionnalités incluses" checked={config.showFeatures} onChange={(checked) => onChange({ ...config, showFeatures: checked })} />

      <FormGroup label="Texte du bouton">
        <Input value={config.ctaText} onChange={(e) => onChange({ ...config, ctaText: e.target.value })} placeholder="Choisir ce plan" />
      </FormGroup>

      <div className="p-4 bg-blue-50 rounded-xl">
        <p className="text-sm text-blue-700">Les plans tarifaires sont gérés dans la section <strong>Plans tarifaires</strong> du menu.</p>
      </div>
    </div>
  )
}

function TestimonialsEditor({ config, onChange }: { config: TestimonialsConfig; onChange: (config: TestimonialsConfig) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Témoignages" description="Affichez les avis de vos clients" />
      
      <ToggleRow label="Activer cette section" checked={config.enabled} onChange={(checked) => onChange({ ...config, enabled: checked })} />

      <FormGroup label="Titre">
        <Input value={config.title} onChange={(e) => onChange({ ...config, title: e.target.value })} />
      </FormGroup>

      <FormGroup label="Layout">
        <Select value={config.layout} onValueChange={(value: TestimonialsConfig['layout']) => onChange({ ...config, layout: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grille</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
            <SelectItem value="large">Grande citation</SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>

      <FormGroup label={`Témoignages (${config.items.length})`}>
        <div className="space-y-3">
          {config.items.map((item, idx) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input value={item.name} onChange={(e) => { const newItems = config.items.map((i, index) => index === idx ? { ...i, name: e.target.value } : i); onChange({ ...config, items: newItems }) }} placeholder="Nom" />
                <Input value={item.company || ''} onChange={(e) => { const newItems = config.items.map((i, index) => index === idx ? { ...i, company: e.target.value } : i); onChange({ ...config, items: newItems }) }} placeholder="Entreprise" />
              </div>
              <Textarea value={item.quote} onChange={(e) => { const newItems = config.items.map((i, index) => index === idx ? { ...i, quote: e.target.value } : i); onChange({ ...config, items: newItems }) }} placeholder="Témoignage" rows={2} />
            </div>
          ))}
        </div>
      </FormGroup>
    </div>
  )
}

function FaqEditor({ config, onChange }: { config: FaqConfig; onChange: (config: FaqConfig) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="FAQ" description="Questions fréquemment posées" />
      
      <ToggleRow label="Activer cette section" checked={config.enabled} onChange={(checked) => onChange({ ...config, enabled: checked })} />

      <FormGroup label="Titre">
        <Input value={config.title} onChange={(e) => onChange({ ...config, title: e.target.value })} />
      </FormGroup>

      <FormGroup label="Layout">
        <Select value={config.layout} onValueChange={(value: FaqConfig['layout']) => onChange({ ...config, layout: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="accordion">Accordéon</SelectItem>
            <SelectItem value="grid">Grille</SelectItem>
            <SelectItem value="categorized">Par catégorie</SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>

      <FormGroup label={`Questions (${config.items.length})`}>
        <div className="space-y-3">
          {config.items.map((item, idx) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
              <Input value={item.question} onChange={(e) => { const newItems = config.items.map((i, index) => index === idx ? { ...i, question: e.target.value } : i); onChange({ ...config, items: newItems }) }} placeholder="Question" />
              <Textarea value={item.answer} onChange={(e) => { const newItems = config.items.map((i, index) => index === idx ? { ...i, answer: e.target.value } : i); onChange({ ...config, items: newItems }) }} placeholder="Réponse" rows={3} />
            </div>
          ))}
        </div>
      </FormGroup>
    </div>
  )
}

function ContactEditor({ config, onChange }: { config: ContactConfig; onChange: (config: ContactConfig) => void }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Contact" description="Section de contact" />
      
      <ToggleRow label="Activer cette section" checked={config.enabled} onChange={(checked) => onChange({ ...config, enabled: checked })} />

      <FormGroup label="Titre">
        <Input value={config.title} onChange={(e) => onChange({ ...config, title: e.target.value })} />
      </FormGroup>

      <FormGroup label="Sous-titre">
        <Textarea value={config.subtitle} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} rows={2} />
      </FormGroup>

      <ToggleRow label="Afficher le formulaire de contact" checked={config.showForm} onChange={(checked) => onChange({ ...config, showForm: checked })} />
      <ToggleRow label="Afficher les informations de contact" checked={config.showInfo} onChange={(checked) => onChange({ ...config, showInfo: checked })} />
    </div>
  )
}
