'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Image as ImageIcon, Loader2, Check, Minus, Tag,
  Megaphone, ArrowUpFromLine, Layout, ArrowDownToLine,
  Palette, Ticket, XCircle, ArrowLeft,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api, apiClient } from '@/lib/api-client'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/shared/ImageUpload'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StripBannerPreview, LargeBannerPreview } from '@/components/shared/BannerPreview'
import { IconPicker } from '@/components/shared/IconPicker'

interface BannerStyles {
  bgType?: 'solid' | 'gradient' | 'image'
  bgColor?: string
  bgGradientFrom?: string
  bgGradientTo?: string
  bgGradientDirection?: string
  textColor?: string
  overlayOpacity?: number
  objectFit?: 'cover' | 'contain' | 'fill'
  blur?: number
  ctaBgColor?: string
  ctaTextColor?: string
  ctaIcon?: string
}

interface CouponData {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: string
  isActive?: boolean
  endDate?: string | null
}

interface BannerFormData {
  displayType: string
  contentMode: string
  title: string
  subtitle: string
  image: string
  ctaText: string
  ctaLink: string
  couponId: string
  isActive: boolean
  pages: string[]
  position: string
  dismissable: boolean
  sticky: boolean
  styles: BannerStyles
}

const defaultStyles: BannerStyles = {
  bgType: 'solid',
  bgColor: '',
  bgGradientFrom: '',
  bgGradientTo: '',
  bgGradientDirection: 'to right',
  textColor: '#ffffff',
  overlayOpacity: 50,
  objectFit: 'cover',
}

const defaultFormData: BannerFormData = {
  displayType: 'strip',
  contentMode: 'simple',
  title: '',
  subtitle: '',
  image: '',
  ctaText: '',
  ctaLink: '',
  couponId: '',
  isActive: true,
  pages: ['home'],
  position: 'top',
  dismissable: false,
  sticky: false,
  styles: { ...defaultStyles },
}

const PAGE_OPTIONS = [
  { value: 'home', label: 'Accueil' },
  { value: 'menu', label: 'Menu' },
  { value: 'contact', label: 'Contact' },
  { value: 'all', label: 'Toutes les pages' },
] as const

const POSITION_OPTIONS = [
  { value: 'top', label: 'Bandeau en haut', icon: ArrowUpFromLine, desc: 'Bande fine au-dessus du header' },
  { value: 'hero', label: 'Section hero', icon: Layout, desc: 'Grande bannière sous le header' },
  { value: 'between', label: 'Entre les sections', icon: Minus, desc: 'Insérée entre les blocs de contenu' },
  { value: 'bottom', label: 'Bas de page', icon: ArrowDownToLine, desc: 'Avant le footer' },
]

interface BannerTemplate {
  id: string
  label: string
  icon: typeof Megaphone
  displayType: string
  contentMode: string
  position: string
  title: string
  subtitle: string
  ctaText: string
  styles: BannerStyles
}

const TEMPLATES: BannerTemplate[] = [
  {
    id: 'free-delivery', label: 'Livraison gratuite', icon: Megaphone,
    displayType: 'strip', contentMode: 'simple', position: 'top',
    title: 'Livraison gratuite dès 25€ de commande', subtitle: '',
    ctaText: 'Commander', styles: { bgType: 'solid', textColor: '#ffffff' },
  },
  {
    id: 'promo-code', label: 'Code promo', icon: Ticket,
    displayType: 'strip', contentMode: 'promo', position: 'top',
    title: 'Profitez de notre offre spéciale !', subtitle: 'Utilisez le code ci-dessous lors de votre commande',
    ctaText: 'En profiter', styles: { bgType: 'gradient', bgGradientFrom: '#7c3aed', bgGradientTo: '#db2777', bgGradientDirection: 'to right', textColor: '#ffffff' },
  },
  {
    id: 'new-dish', label: 'Nouveau plat', icon: Megaphone,
    displayType: 'banner', contentMode: 'simple', position: 'hero',
    title: 'Découvrez notre nouveau plat', subtitle: 'Une création exclusive de notre chef',
    ctaText: 'Voir le menu', styles: { bgType: 'solid', bgColor: '#1e293b', textColor: '#ffffff', overlayOpacity: 40 },
  },
  {
    id: 'happy-hour', label: 'Happy Hour', icon: Megaphone,
    displayType: 'strip', contentMode: 'simple', position: 'top',
    title: 'Happy Hour : -30% sur les boissons de 17h à 19h', subtitle: '',
    ctaText: '', styles: { bgType: 'gradient', bgGradientFrom: '#f59e0b', bgGradientTo: '#ef4444', bgGradientDirection: 'to right', textColor: '#ffffff' },
  },
  {
    id: 'closure', label: 'Fermeture exceptionnelle', icon: XCircle,
    displayType: 'strip', contentMode: 'simple', position: 'top',
    title: 'Fermé exceptionnellement le [date]', subtitle: 'Nous vous retrouvons dès le lendemain !',
    ctaText: '', styles: { bgType: 'solid', bgColor: '#dc2626', textColor: '#ffffff' },
  },
]

export default function BannerFormPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const primaryColor = organization?.primaryColor || '#10b981'
  const bannerId = params.id as string
  const isEditing = bannerId !== 'new'

  const [formData, setFormData] = useState<BannerFormData>(defaultFormData)
  const [showTemplates, setShowTemplates] = useState(!isEditing)

  const { data: bannerData, isLoading: bannerLoading } = useQuery({
    queryKey: ['restaurant-site-banner', bannerId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.site.banners.list()
      const all = res.data as Array<Record<string, unknown>>
      return all.find((b) => b.id === bannerId) || null
    },
    enabled: isEditing && !!accessToken && !!currentRestaurantId,
  })

  const { data: customPages } = useQuery({
    queryKey: ['restaurant-site-pages-list'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.pages.list()
    },
    enabled: !!accessToken,
    select: (res) => (res.data || []).filter((p: { pageType: string | null }) => !p.pageType || !['home', 'menu', 'contact'].includes(p.pageType)),
  })

  const { data: coupons } = useQuery({
    queryKey: ['restaurant-site-banners-coupons'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.banners.coupons()
    },
    enabled: !!accessToken,
    select: (res) => res.data || [],
  })

  useEffect(() => {
    if (bannerData && isEditing) {
      const b = bannerData as Record<string, unknown>
      setFormData({
        displayType: (b.displayType as string) || 'strip',
        contentMode: (b.contentMode as string) || 'simple',
        title: (b.title as string) || '',
        subtitle: (b.subtitle as string) || '',
        image: (b.image as string) || '',
        ctaText: (b.ctaText as string) || '',
        ctaLink: (b.ctaLink as string) || '',
        couponId: (b.couponId as string) || '',
        isActive: b.isActive as boolean ?? true,
        pages: (b.pages as string[])?.length > 0 ? (b.pages as string[]) : ['home'],
        position: (b.position as string) || 'top',
        dismissable: b.dismissable as boolean ?? false,
        sticky: b.sticky as boolean ?? false,
        styles: (() => {
          const dbStyles = (b.styles as Record<string, unknown>) || {}
          const raw = { ...defaultStyles, ...(dbStyles as BannerStyles) }
          const legacyBgType = dbStyles.bgType as string | undefined
          if (legacyBgType === 'theme' || !legacyBgType) {
            raw.bgType = (b.displayType === 'banner' && b.image) ? 'image' : 'solid'
          }
          return raw
        })(),
      })
      setShowTemplates(false)
    }
  }, [bannerData, isEditing])

  const applyTemplate = (template: BannerTemplate) => {
    setFormData(prev => ({
      ...prev,
      displayType: template.displayType,
      contentMode: template.contentMode,
      position: template.position,
      title: template.title,
      subtitle: template.subtitle,
      ctaText: template.ctaText,
      styles: { ...defaultStyles, ...template.styles },
    }))
    setShowTemplates(false)
  }

  const togglePage = (page: string) => {
    if (page === 'all') {
      const hasAll = formData.pages.includes('all')
      setFormData(prev => ({ ...prev, pages: hasAll ? ['home'] : ['all'] }))
      return
    }
    setFormData(prev => {
      const filtered = prev.pages.filter(p => p !== 'all')
      const has = filtered.includes(page)
      const newPages = has ? filtered.filter(p => p !== page) : [...filtered, page]
      return { ...prev, pages: newPages.length > 0 ? newPages : ['home'] }
    })
  }

  const updateStyle = (key: keyof BannerStyles, value: string | number) => {
    setFormData(prev => ({ ...prev, styles: { ...prev.styles, [key]: value } }))
  }

  const goBack = () => router.push('/restaurant/site/banners')

  const createMutation = useMutation({
    mutationFn: async (data: BannerFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.banners.create({
        displayType: data.displayType,
        contentMode: data.contentMode,
        title: data.title || undefined,
        subtitle: data.subtitle || undefined,
        image: data.image || undefined,
        ctaText: data.ctaText || undefined,
        ctaLink: data.ctaLink || undefined,
        couponId: data.couponId || undefined,
        isActive: data.isActive,
        pages: data.pages,
        position: data.position,
        dismissable: data.dismissable,
        sticky: data.sticky,
        styles: data.styles as Record<string, unknown>,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-banners'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-overview'] })
      toast.success('Bannière créée avec succès')
      goBack()
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: BannerFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.banners.update(bannerId, {
        displayType: data.displayType,
        contentMode: data.contentMode,
        title: data.title || undefined,
        subtitle: data.subtitle || undefined,
        image: data.image || undefined,
        ctaText: data.ctaText || undefined,
        ctaLink: data.ctaLink || undefined,
        couponId: data.couponId || undefined,
        isActive: data.isActive,
        pages: data.pages,
        position: data.position,
        dismissable: data.dismissable,
        sticky: data.sticky,
        styles: data.styles as Record<string, unknown>,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-banners'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-banner', bannerId] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-overview'] })
      toast.success('Bannière mise à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.displayType === 'banner' && formData.styles.bgType === 'image' && !formData.image) {
      toast.error('L\'image est requise quand le fond est de type image')
      return
    }
    if (formData.contentMode === 'promo' && !formData.couponId) {
      toast.error('Sélectionnez un code promo')
      return
    }
    if (isEditing) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isPromo = formData.contentMode === 'promo'
  const isBannerType = formData.displayType === 'banner'
  const selectedCoupon = coupons?.find((c: CouponData) => c.id === formData.couponId)

  if (isEditing && bannerLoading) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Modifier la bannière"
        variant="detail"
      />
    )
  }

  if (isEditing && !bannerData && !bannerLoading) {
    return (
      <DashboardLayout
        navigation={navigation}
        basePath="/restaurant"
        logoText={organization?.name || 'Restaurant'}
        primaryColor={primaryColor}
        restaurants={restaurants}
        currentRestaurantId={currentRestaurantId}
        onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
      >
        <div className="p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-500 mb-4">Bannière introuvable</p>
          <Button variant="outline" onClick={goBack} className="rounded-xl gap-2">
            <ArrowLeft size={14} />
            Retour aux bannières
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <PageHeader
        title={isEditing ? 'Modifier la bannière' : 'Nouvelle bannière'}
        subtitle={isEditing ? 'Modifiez les paramètres de votre bannière' : 'Créez une nouvelle bannière pour votre site'}
        icon={ImageIcon}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            className="h-9 rounded-xl gap-1.5 text-xs border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft size={14} />
            Retour
          </Button>
        }
      />

      {showTemplates && !isEditing ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-1">Commencer avec un template</p>
            <p className="text-xs text-gray-400">Choisissez un modèle ou partez de zéro</p>
          </div>
          <div className="p-5 sm:p-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TEMPLATES.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Icon size={18} style={{ color: primaryColor }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{t.label}</p>
                      <p className="text-[11px] text-gray-400 truncate">{t.title}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">ou</span></div>
            </div>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="w-full p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Créer depuis zéro
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne gauche : contenu */}
            <div className="lg:col-span-2 space-y-6">
              {/* Type d'affichage + contenu */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
                <div className="space-y-2">
                  <Label>Type d'affichage</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'strip', label: 'Bande', desc: 'Bandeau fin en haut' },
                      { value: 'banner', label: 'Large', desc: 'Grande bannière personnalisable' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, displayType: opt.value }))}
                        className="p-4 rounded-xl border-2 text-left transition-all"
                        style={formData.displayType === opt.value ? {
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}08`,
                        } : { borderColor: '#e5e7eb' }}
                      >
                        <p className="text-sm font-medium" style={formData.displayType === opt.value ? { color: primaryColor } : { color: '#111827' }}>{opt.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Type de contenu</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'simple', label: 'Libre', icon: Megaphone, desc: 'Annonce, info' },
                      { value: 'promo', label: 'Code promo', icon: Tag, desc: 'Mettre en avant un code' },
                    ].map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, contentMode: opt.value, couponId: opt.value === 'simple' ? '' : prev.couponId }))}
                          className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all"
                          style={formData.contentMode === opt.value ? {
                            borderColor: primaryColor,
                            backgroundColor: `${primaryColor}08`,
                          } : { borderColor: '#e5e7eb' }}
                        >
                          <Icon size={18} style={formData.contentMode === opt.value ? { color: primaryColor } : { color: '#9ca3af' }} />
                          <div>
                            <p className="text-sm font-medium" style={formData.contentMode === opt.value ? { color: primaryColor } : { color: '#111827' }}>{opt.label}</p>
                            <p className="text-[11px] text-gray-400">{opt.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {isPromo && (
                  <div className="space-y-2">
                    <Label>Code promo</Label>
                    <Select
                      value={formData.couponId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, couponId: value }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                        <SelectValue placeholder="Sélectionnez un code promo" />
                      </SelectTrigger>
                      <SelectContent accentColor={primaryColor}>
                        {coupons && coupons.length > 0 ? coupons.map((c: CouponData) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="font-mono font-medium">{c.code}</span>
                            <span className="text-gray-400 ml-2">
                              ({c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `${c.discountValue}\u20ac`})
                            </span>
                          </SelectItem>
                        )) : (
                          <SelectItem value="__none" disabled>Aucun code promo actif</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedCoupon && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs" style={{ backgroundColor: `${primaryColor}10` }}>
                        <Ticket size={14} style={{ color: primaryColor }} />
                        <span className="font-mono font-bold" style={{ color: primaryColor }}>{selectedCoupon.code}</span>
                        <span className="text-gray-500">
                          {selectedCoupon.discountType === 'PERCENTAGE' ? `-${selectedCoupon.discountValue}%` : `-${selectedCoupon.discountValue}\u20ac`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contenu */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="banner-title">
                    {isPromo ? 'Titre de l\'offre' : 'Titre'}
                  </Label>
                  <Input
                    id="banner-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={isPromo ? 'Ex: Profitez de -20% sur votre commande !' : 'Titre de la bannière'}
                    className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                  {isPromo && (
                    <p className="text-[11px] text-gray-400">Mettez en avant la réduction pour attirer l'attention</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-subtitle">
                    {isPromo ? 'Description de l\'offre' : 'Sous-titre'}
                  </Label>
                  <Input
                    id="banner-subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder={isPromo ? 'Ex: Valable jusqu\'au 28 février, sur toute la carte' : 'Sous-titre optionnel'}
                    className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banner-cta-text">Texte du bouton</Label>
                    <Input
                      id="banner-cta-text"
                      value={formData.ctaText}
                      onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                      placeholder={isPromo ? 'Ex: En profiter' : 'Ex: Commander'}
                      className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banner-cta-link">Lien du bouton</Label>
                    <Input
                      id="banner-cta-link"
                      value={formData.ctaLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
                      placeholder="Ex: /menu"
                      className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>

              {/* Personnalisation visuelle */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Palette size={16} style={{ color: primaryColor }} />
                  <Label className="text-base font-semibold">Personnalisation visuelle</Label>
                </div>

                {/* Aperçu */}
                {isBannerType ? (
                  <LargeBannerPreview
                    banner={{
                      displayType: formData.displayType,
                      contentMode: formData.contentMode,
                      title: formData.title || 'Aperçu de la bannière',
                      subtitle: formData.subtitle || null,
                      image: formData.image || null,
                      ctaText: formData.ctaText || null,
                      ctaLink: formData.ctaLink || '/menu',
                      coupon: selectedCoupon ? { code: selectedCoupon.code, discountType: selectedCoupon.discountType, discountValue: selectedCoupon.discountValue } : null,
                      dismissable: formData.dismissable,
                      styles: formData.styles,
                    }}
                    theme={{
                      primaryColor,
                      headingFont: 'Inter',
                      bodyFont: 'Inter',
                      buttonStyle: 'rounded',
                    }}
                    compact
                    isPreview
                  />
                ) : (
                  <div className="rounded-xl overflow-hidden">
                    <StripBannerPreview
                      banner={{
                        displayType: formData.displayType,
                        contentMode: formData.contentMode,
                        title: formData.title || 'Aperçu de la bande',
                        subtitle: formData.subtitle || null,
                        image: null,
                        ctaText: formData.ctaText || null,
                        ctaLink: formData.ctaLink || '/menu',
                        coupon: selectedCoupon ? { code: selectedCoupon.code, discountType: selectedCoupon.discountType, discountValue: selectedCoupon.discountValue } : null,
                        dismissable: formData.dismissable,
                        styles: formData.styles,
                      }}
                      theme={{
                        primaryColor,
                        headingFont: 'Inter',
                        bodyFont: 'Inter',
                        buttonStyle: 'rounded',
                      }}
                      isPreview
                    />
                  </div>
                )}

                {/* Type de fond */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Type de fond</Label>
                  <div className={`grid gap-2 ${isBannerType ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {[
                      { value: 'solid', label: 'Couleur' },
                      { value: 'gradient', label: 'Dégradé' },
                      ...(isBannerType ? [{ value: 'image', label: 'Image' }] : []),
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateStyle('bgType', opt.value)}
                        className="px-3 py-2 rounded-xl border text-xs font-medium transition-all"
                        style={formData.styles.bgType === opt.value ? {
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}10`,
                          color: primaryColor,
                        } : { borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options fond couleur */}
                {formData.styles.bgType === 'solid' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Couleur de fond</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.styles.bgColor || primaryColor}
                        onChange={(e) => updateStyle('bgColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <Input
                        value={formData.styles.bgColor || ''}
                        onChange={(e) => updateStyle('bgColor', e.target.value)}
                        placeholder={primaryColor}
                        className="h-10 rounded-xl border-gray-200 font-mono text-xs flex-1 focus:ring-2 focus:ring-offset-0"
                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      />
                    </div>
                  </div>
                )}

                {/* Options fond dégradé */}
                {formData.styles.bgType === 'gradient' && (
                  <div className="space-y-3">
                    <Label className="text-xs text-gray-500">Couleurs du dégradé</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.styles.bgGradientFrom || primaryColor}
                          onChange={(e) => updateStyle('bgGradientFrom', e.target.value)}
                          className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0"
                        />
                        <Input
                          value={formData.styles.bgGradientFrom || ''}
                          onChange={(e) => updateStyle('bgGradientFrom', e.target.value)}
                          placeholder="Début"
                          className="h-9 rounded-xl border-gray-200 font-mono text-xs focus:ring-2 focus:ring-offset-0"
                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.styles.bgGradientTo || '#059669'}
                          onChange={(e) => updateStyle('bgGradientTo', e.target.value)}
                          className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0"
                        />
                        <Input
                          value={formData.styles.bgGradientTo || ''}
                          onChange={(e) => updateStyle('bgGradientTo', e.target.value)}
                          placeholder="Fin"
                          className="h-9 rounded-xl border-gray-200 font-mono text-xs focus:ring-2 focus:ring-offset-0"
                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                        />
                      </div>
                    </div>
                    <Select
                      value={formData.styles.bgGradientDirection || 'to right'}
                      onValueChange={(v) => updateStyle('bgGradientDirection', v)}
                    >
                      <SelectTrigger className="h-10 rounded-xl text-xs focus:ring-2 focus:ring-offset-0" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent accentColor={primaryColor}>
                        <SelectItem value="to right">Gauche \u2192 Droite</SelectItem>
                        <SelectItem value="to left">Droite \u2192 Gauche</SelectItem>
                        <SelectItem value="to bottom">Haut \u2192 Bas</SelectItem>
                        <SelectItem value="to bottom right">Diagonale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Options fond image */}
                {isBannerType && formData.styles.bgType === 'image' && (
                  <div className="space-y-4">
                    <ImageUpload
                      value={formData.image || null}
                      onChange={(url) => setFormData(prev => ({ ...prev, image: url || '' }))}
                      folder="banners"
                      label="Image de fond"
                      placeholder="Ajouter une image de fond"
                      aspectRatio="landscape"
                      primaryColor={primaryColor}
                      showMediaLibrary
                      restaurantId={currentRestaurantId || undefined}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">Ajustement de l'image</Label>
                      <Select
                        value={formData.styles.objectFit || 'cover'}
                        onValueChange={(v) => updateStyle('objectFit', v)}
                      >
                        <SelectTrigger className="h-10 rounded-xl text-xs focus:ring-2 focus:ring-offset-0" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent accentColor={primaryColor}>
                          <SelectItem value="cover">Couvrir (recadrée)</SelectItem>
                          <SelectItem value="contain">Contenir (entière)</SelectItem>
                          <SelectItem value="fill">Étirer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">Flou ({formData.styles.blur || 0}px)</Label>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={1}
                        value={formData.styles.blur || 0}
                        onChange={(e) => updateStyle('blur', parseInt(e.target.value))}
                        className="w-full"
                        style={{ accentColor: primaryColor }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">Overlay sombre ({formData.styles.overlayOpacity || 50}%)</Label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={formData.styles.overlayOpacity || 50}
                        onChange={(e) => updateStyle('overlayOpacity', parseInt(e.target.value))}
                        className="w-full"
                        style={{ accentColor: primaryColor }}
                      />
                    </div>
                  </div>
                )}

                {/* Couleur du texte */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <Label className="text-xs text-gray-500">Couleur du texte</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.styles.textColor || '#ffffff'}
                      onChange={(e) => updateStyle('textColor', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={formData.styles.textColor || ''}
                      onChange={(e) => updateStyle('textColor', e.target.value)}
                      placeholder="#ffffff"
                      className="h-10 rounded-xl border-gray-200 font-mono text-xs flex-1 focus:ring-2 focus:ring-offset-0"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </div>
                </div>

                {/* Bouton CTA */}
                {formData.ctaText && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <Label className="text-xs text-gray-500 font-semibold">Bouton CTA</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-gray-400">Fond du bouton</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.styles.ctaBgColor || (isBannerType ? primaryColor : '#ffffff')}
                            onChange={(e) => updateStyle('ctaBgColor', e.target.value)}
                            className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0"
                          />
                          <Input
                            value={formData.styles.ctaBgColor || ''}
                            onChange={(e) => updateStyle('ctaBgColor', e.target.value)}
                            placeholder="Auto"
                            className="h-9 rounded-xl border-gray-200 font-mono text-xs focus:ring-2 focus:ring-offset-0"
                            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-gray-400">Texte du bouton</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.styles.ctaTextColor || '#ffffff'}
                            onChange={(e) => updateStyle('ctaTextColor', e.target.value)}
                            className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0"
                          />
                          <Input
                            value={formData.styles.ctaTextColor || ''}
                            onChange={(e) => updateStyle('ctaTextColor', e.target.value)}
                            placeholder="Auto"
                            className="h-9 rounded-xl border-gray-200 font-mono text-xs focus:ring-2 focus:ring-offset-0"
                            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    </div>
                    <IconPicker
                      value={formData.styles.ctaIcon || null}
                      onChange={(name) => updateStyle('ctaIcon', name || '')}
                      label="Icône du bouton"
                      primaryColor={primaryColor}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Colonne droite : paramètres */}
            <div className="space-y-6">
              {/* Position */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-4">
                <Label className="text-base font-semibold">Position</Label>
                <div className="space-y-2">
                  {POSITION_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = formData.position === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, position: opt.value }))}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                        style={isSelected ? {
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}08`,
                        } : { borderColor: '#e5e7eb' }}
                      >
                        <Icon size={16} style={isSelected ? { color: primaryColor } : { color: '#9ca3af' }} />
                        <div>
                          <p className="text-sm font-medium" style={isSelected ? { color: primaryColor } : { color: '#111827' }}>{opt.label}</p>
                          <p className="text-[10px] text-gray-400">{opt.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pages ciblées */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-3">
                <Label className="text-base font-semibold">Pages ciblées</Label>
                <p className="text-xs text-gray-400">Sélectionnez les pages où cette bannière sera affichée</p>
                <div className="flex flex-wrap gap-2">
                  {PAGE_OPTIONS.map((opt) => {
                    const isSelected = formData.pages.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => togglePage(opt.value)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all"
                        style={isSelected ? {
                          backgroundColor: `${primaryColor}15`,
                          borderColor: primaryColor,
                          color: primaryColor,
                        } : {
                          backgroundColor: 'white',
                          borderColor: '#e5e7eb',
                          color: '#6b7280',
                        }}
                      >
                        {isSelected && <Check size={12} />}
                        {opt.label}
                      </button>
                    )
                  })}
                  {customPages && customPages.length > 0 && customPages.map((page: { id: string; slug: string; title: string }) => {
                    const isSelected = formData.pages.includes(page.slug)
                    return (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => togglePage(page.slug)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all"
                        style={isSelected ? {
                          backgroundColor: `${primaryColor}15`,
                          borderColor: primaryColor,
                          color: primaryColor,
                        } : {
                          backgroundColor: 'white',
                          borderColor: '#e5e7eb',
                          color: '#6b7280',
                        }}
                      >
                        {isSelected && <Check size={12} />}
                        {page.title}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Options */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-3">
                <Label className="text-base font-semibold">Options</Label>
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Active</p>
                    <p className="text-[11px] text-gray-500">Afficher sur le site</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    style={{ backgroundColor: formData.isActive ? primaryColor : undefined } as React.CSSProperties}
                  />
                </div>
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Peut être fermée</p>
                    <p className="text-[11px] text-gray-500">Le visiteur peut fermer la bannière</p>
                  </div>
                  <Switch
                    checked={formData.dismissable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dismissable: checked }))}
                    style={{ backgroundColor: formData.dismissable ? primaryColor : undefined } as React.CSSProperties}
                  />
                </div>
                {formData.position === 'top' && (
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sticky</p>
                      <p className="text-[11px] text-gray-500">Reste visible au scroll</p>
                    </div>
                    <Switch
                      checked={formData.sticky}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sticky: checked }))}
                      style={{ backgroundColor: formData.sticky ? primaryColor : undefined } as React.CSSProperties}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={isSaving}
                  className="flex-1 h-11 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || (isBannerType && formData.styles.bgType === 'image' && !formData.image) || (isPromo && !formData.couponId)}
                  style={{ backgroundColor: primaryColor }}
                  className="flex-1 text-white h-11 rounded-xl"
                >
                  {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
                  {isEditing ? 'Enregistrer' : 'Créer'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </DashboardLayout>
  )
}
