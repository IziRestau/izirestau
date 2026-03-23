// Types pour la configuration de la vitrine publique

export interface HeroConfig {
  layout: 'centered' | 'split' | 'video'
  title: string
  subtitle: string
  image?: string
  video?: string
  showStats: boolean
  stats: Array<{ value: string; label: string }>
  ctaText: string
  ctaAction: 'pricing' | 'contact' | 'custom'
  ctaCustomUrl?: string
}

export interface ProductModule {
  id: string
  icon: string
  title: string
  description: string
  image?: string
  enabled: boolean
}

export interface ProductConfig {
  enabled: boolean
  title: string
  subtitle: string
  modules: ProductModule[]
  layout: 'grid' | 'list' | 'tabs' | 'accordion'
}

export interface HowItWorksStep {
  id: string
  number?: number
  icon?: string
  title: string
  description: string
  image?: string
}

export interface HowItWorksConfig {
  enabled: boolean
  title: string
  subtitle?: string
  steps: HowItWorksStep[]
  layout: 'horizontal' | 'vertical' | 'timeline' | 'numbered'
}

export interface BenefitItem {
  id: string
  icon: string
  title: string
  description: string
}

export interface BenefitsConfig {
  enabled: boolean
  title: string
  subtitle?: string
  items: BenefitItem[]
  layout: 'grid' | 'cards' | 'icons' | 'alternating'
}

export interface PricingConfig {
  enabled: boolean
  title: string
  subtitle: string
  layout: 'cards' | 'table' | 'comparison'
  highlightedPlanId?: string
  showFeatures: boolean
  ctaText: string
}

export interface TestimonialItem {
  id: string
  name: string
  company?: string
  role?: string
  quote: string
  avatar?: string
  rating?: number
}

export interface TestimonialsConfig {
  enabled: boolean
  title: string
  subtitle?: string
  items: TestimonialItem[]
  layout: 'grid' | 'carousel' | 'large'
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  category?: string
}

export interface FaqConfig {
  enabled: boolean
  title: string
  subtitle?: string
  items: FaqItem[]
  layout: 'accordion' | 'grid' | 'categorized'
}

export interface ContactConfig {
  enabled: boolean
  title: string
  subtitle: string
  showForm: boolean
  showInfo: boolean
  showMap: boolean
}

export interface FooterLink {
  label: string
  url: string
}

export interface FooterConfig {
  showBadges: boolean
  badges: Array<{ type: 'ssl' | 'secure' | 'support' | 'custom'; label?: string; icon?: string }>
  links: FooterLink[]
  socials: Array<{ type: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'whatsapp'; url: string }>
  copyrightText?: string
}

export interface GlobalStyles {
  primaryColor: string
  secondaryColor: string
  fontFamily: 'inter' | 'poppins' | 'roboto' | 'open-sans' | 'montserrat'
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full'
  cardStyle: 'flat' | 'bordered' | 'shadow' | 'elevated'
  buttonStyle: 'solid' | 'outline' | 'ghost'
  spacing: 'compact' | 'normal' | 'relaxed'
}

export type SectionType = 'hero' | 'product' | 'howItWorks' | 'benefits' | 'pricing' | 'testimonials' | 'faq' | 'contact'

export interface ShowcaseConfig {
  heroConfig: HeroConfig
  productConfig: ProductConfig
  howItWorksConfig: HowItWorksConfig
  benefitsConfig: BenefitsConfig
  pricingConfig: PricingConfig
  testimonialsConfig: TestimonialsConfig
  faqConfig: FaqConfig
  contactConfig: ContactConfig
  footerConfig: FooterConfig
  sectionsOrder: SectionType[]
  globalStyles: GlobalStyles
  template: 'modern' | 'professional' | 'dynamic' | 'minimal'
}

// Configuration par défaut
export const DEFAULT_HERO_CONFIG: HeroConfig = {
  layout: 'centered',
  title: 'Digitalisez votre restaurant',
  subtitle: 'Une solution complète pour gérer votre établissement, prendre des commandes en ligne et fidéliser vos clients.',
  showStats: true,
  stats: [
    { value: '+30%', label: 'de commandes' },
    { value: '2h', label: 'gagnées par jour' },
    { value: '24/7', label: 'disponibilité' },
  ],
  ctaText: 'Découvrir nos offres',
  ctaAction: 'pricing',
}

export const DEFAULT_PRODUCT_MODULES: ProductModule[] = [
  {
    id: 'website',
    icon: 'Globe',
    title: 'Site web professionnel',
    description: 'Votre vitrine en ligne avec votre menu, vos horaires, votre localisation et vos informations de contact.',
    enabled: true,
  },
  {
    id: 'orders',
    icon: 'ShoppingBag',
    title: 'Commandes en ligne',
    description: 'Vos clients commandent depuis leur téléphone ou ordinateur. Livraison, à emporter ou sur place.',
    enabled: true,
  },
  {
    id: 'pos',
    icon: 'Monitor',
    title: 'Caisse (POS)',
    description: 'Gérez vos commandes sur place, encaissez vos clients et imprimez les tickets de caisse.',
    enabled: true,
  },
  {
    id: 'menu',
    icon: 'UtensilsCrossed',
    title: 'Gestion du menu',
    description: 'Ajoutez, modifiez vos plats, gérez les prix, les photos et les disponibilités en temps réel.',
    enabled: true,
  },
  {
    id: 'customers',
    icon: 'Users',
    title: 'Gestion des clients',
    description: 'Base de données clients, historique des commandes, préférences et programme de fidélité.',
    enabled: true,
  },
  {
    id: 'analytics',
    icon: 'BarChart3',
    title: 'Statistiques et rapports',
    description: 'Suivez votre chiffre d\'affaires, vos produits les plus vendus et vos heures de pointe.',
    enabled: true,
  },
  {
    id: 'inventory',
    icon: 'Package',
    title: 'Gestion de l\'inventaire',
    description: 'Suivi des stocks, alertes de rupture, gestion des fournisseurs et des approvisionnements.',
    enabled: true,
  },
  {
    id: 'marketing',
    icon: 'Megaphone',
    title: 'Marketing et fidélisation',
    description: 'Créez des promotions, des coupons de réduction et un programme de fidélité pour vos clients.',
    enabled: true,
  },
]

export const DEFAULT_PRODUCT_CONFIG: ProductConfig = {
  enabled: true,
  title: 'Tout ce dont vous avez besoin',
  subtitle: 'Une plateforme complète pour digitaliser et développer votre restaurant',
  modules: DEFAULT_PRODUCT_MODULES,
  layout: 'grid',
}

export const DEFAULT_HOW_IT_WORKS_CONFIG: HowItWorksConfig = {
  enabled: true,
  title: 'Comment ça marche ?',
  subtitle: 'Soyez opérationnel en moins de 24 heures',
  steps: [
    {
      id: '1',
      number: 1,
      icon: 'CreditCard',
      title: 'Choisissez votre plan',
      description: 'Sélectionnez l\'offre qui correspond à vos besoins et à votre budget.',
    },
    {
      id: '2',
      number: 2,
      icon: 'Settings',
      title: 'Configurez votre espace',
      description: 'Personnalisez votre restaurant : logo, couleurs, informations, horaires.',
    },
    {
      id: '3',
      number: 3,
      icon: 'UtensilsCrossed',
      title: 'Ajoutez votre menu',
      description: 'Importez ou créez vos catégories, plats, prix et photos.',
    },
    {
      id: '4',
      number: 4,
      icon: 'Rocket',
      title: 'Lancez-vous !',
      description: 'Votre site est en ligne, commencez à recevoir des commandes.',
    },
  ],
  layout: 'horizontal',
}

export const DEFAULT_BENEFITS_CONFIG: BenefitsConfig = {
  enabled: true,
  title: 'Pourquoi nous choisir ?',
  subtitle: 'Des avantages concrets pour votre établissement',
  items: [
    {
      id: '1',
      icon: 'TrendingUp',
      title: 'Augmentez vos ventes',
      description: 'Les commandes en ligne peuvent représenter jusqu\'à 30% de votre chiffre d\'affaires.',
    },
    {
      id: '2',
      icon: 'Clock',
      title: 'Gagnez du temps',
      description: 'Automatisez la prise de commandes et la gestion de votre établissement.',
    },
    {
      id: '3',
      icon: 'Heart',
      title: 'Fidélisez vos clients',
      description: 'Programme de fidélité, promotions ciblées et communication personnalisée.',
    },
    {
      id: '4',
      icon: 'Shield',
      title: 'Données sécurisées',
      description: 'Vos données et celles de vos clients sont protégées et sauvegardées.',
    },
    {
      id: '5',
      icon: 'Headphones',
      title: 'Support réactif',
      description: 'Une équipe disponible pour vous accompagner et répondre à vos questions.',
    },
    {
      id: '6',
      icon: 'Smartphone',
      title: 'Multi-appareils',
      description: 'Accessible depuis ordinateur, tablette et smartphone, où que vous soyez.',
    },
  ],
  layout: 'grid',
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  enabled: true,
  title: 'Nos offres',
  subtitle: 'Des tarifs transparents, sans surprise',
  layout: 'cards',
  showFeatures: true,
  ctaText: 'Choisir ce plan',
}

export const DEFAULT_TESTIMONIALS_CONFIG: TestimonialsConfig = {
  enabled: false,
  title: 'Ils nous font confiance',
  subtitle: 'Découvrez les témoignages de nos clients',
  items: [],
  layout: 'grid',
}

export const DEFAULT_FAQ_CONFIG: FaqConfig = {
  enabled: true,
  title: 'Questions fréquentes',
  subtitle: 'Tout ce que vous devez savoir',
  items: [
    {
      id: '1',
      question: 'Combien de temps faut-il pour être opérationnel ?',
      answer: 'Vous pouvez être opérationnel en moins de 24 heures. La configuration de base prend environ 15 minutes, et l\'ajout de votre menu dépend du nombre de plats.',
    },
    {
      id: '2',
      question: 'Ai-je besoin de matériel spécifique ?',
      answer: 'Non, vous pouvez utiliser n\'importe quel ordinateur, tablette ou smartphone avec un navigateur web. Pour la caisse, une tablette est recommandée.',
    },
    {
      id: '3',
      question: 'Comment fonctionne le support technique ?',
      answer: 'Notre équipe est disponible par email et chat pour répondre à toutes vos questions. Les demandes urgentes sont traitées en priorité.',
    },
    {
      id: '4',
      question: 'Puis-je changer de plan à tout moment ?',
      answer: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. La différence sera calculée au prorata.',
    },
    {
      id: '5',
      question: 'Mes données sont-elles sécurisées ?',
      answer: 'Absolument. Nous utilisons un chiffrement SSL, des sauvegardes quotidiennes et nos serveurs sont hébergés dans des datacenters sécurisés.',
    },
  ],
  layout: 'accordion',
}

export const DEFAULT_CONTACT_CONFIG: ContactConfig = {
  enabled: true,
  title: 'Une question ?',
  subtitle: 'Notre équipe est là pour vous aider',
  showForm: true,
  showInfo: true,
  showMap: false,
}

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  showBadges: true,
  badges: [
    { type: 'ssl', label: 'Connexion sécurisée' },
    { type: 'support', label: 'Support inclus' },
  ],
  links: [],
  socials: [],
}

export const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  primaryColor: '#10b981',
  secondaryColor: '#6366f1',
  fontFamily: 'inter',
  borderRadius: 'large',
  cardStyle: 'bordered',
  buttonStyle: 'solid',
  spacing: 'normal',
}

export const DEFAULT_SECTIONS_ORDER: SectionType[] = [
  'hero',
  'product',
  'howItWorks',
  'benefits',
  'pricing',
  'testimonials',
  'faq',
  'contact',
]

export const DEFAULT_SHOWCASE_CONFIG: ShowcaseConfig = {
  heroConfig: DEFAULT_HERO_CONFIG,
  productConfig: DEFAULT_PRODUCT_CONFIG,
  howItWorksConfig: DEFAULT_HOW_IT_WORKS_CONFIG,
  benefitsConfig: DEFAULT_BENEFITS_CONFIG,
  pricingConfig: DEFAULT_PRICING_CONFIG,
  testimonialsConfig: DEFAULT_TESTIMONIALS_CONFIG,
  faqConfig: DEFAULT_FAQ_CONFIG,
  contactConfig: DEFAULT_CONTACT_CONFIG,
  footerConfig: DEFAULT_FOOTER_CONFIG,
  sectionsOrder: DEFAULT_SECTIONS_ORDER,
  globalStyles: DEFAULT_GLOBAL_STYLES,
  template: 'modern',
}
