'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Image as ImageIcon, Loader2, X, Check, Minus, Tag,
  Megaphone, ArrowUpFromLine, Layout, ArrowDownToLine,
  Palette, Pipette, Eye, EyeOff, Pin, XCircle, Ticket,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { api, apiClient } from '@/lib/api-client'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-media-query'

export interface BannerStyles {
  bgType?: 'solid' | 'gradient' | 'image'
  bgColor?: string
  bgGradientFrom?: string
  bgGradientTo?: string
  bgGradientDirection?: string
  textColor?: string
  overlayOpacity?: number
  objectFit?: 'cover' | 'contain' | 'fill'
  ctaBgColor?: string
  ctaTextColor?: string
  ctaIcon?: string
}

export interface CouponData {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: string
  isActive?: boolean
  endDate?: string | null
}

export interface BannerData {
  id: string
  displayType: string
  contentMode: string
  title: string | null
  subtitle: string | null
  image: string | null
  ctaText: string | null
  ctaLink: string | null
  couponId: string | null
  coupon: CouponData | null
  isActive: boolean
  sortOrder: number
  pages: string[]
  position: string
  dismissable: boolean
  sticky: boolean
  styles: BannerStyles | null
  startDate: string | null
  endDate: string | null
  createdAt: string
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
    title: 'Livraison gratuite dès 25\u20ac de commande', subtitle: '',
    ctaText: 'Commander', styles: { bgType: 'solid', textColor: '#ffffff' },
  },
  {
    id: 'promo-code', label: 'Code promo', icon: Ticket,
    displayType: 'strip', contentMode: 'promo', position: 'top',
    title: 'Profitez de notre offre sp\u00e9ciale !', subtitle: 'Utilisez le code ci-dessous lors de votre commande',
    ctaText: 'En profiter', styles: { bgType: 'gradient', bgGradientFrom: '#7c3aed', bgGradientTo: '#db2777', bgGradientDirection: 'to right', textColor: '#ffffff' },
  },
  {
    id: 'new-dish', label: 'Nouveau plat', icon: Megaphone,
    displayType: 'banner', contentMode: 'simple', position: 'hero',
    title: 'D\u00e9couvrez notre nouveau plat', subtitle: 'Une cr\u00e9ation exclusive de notre chef',
    ctaText: 'Voir le menu', styles: { bgType: 'solid', bgColor: '#1e293b', textColor: '#ffffff', overlayOpacity: 40 },
  },
  {
    id: 'happy-hour', label: 'Happy Hour', icon: Megaphone,
    displayType: 'strip', contentMode: 'simple', position: 'top',
    title: 'Happy Hour : -30% sur les boissons de 17h \u00e0 19h', subtitle: '',
    ctaText: '', styles: { bgType: 'gradient', bgGradientFrom: '#f59e0b', bgGradientTo: '#ef4444', bgGradientDirection: 'to right', textColor: '#ffffff' },
  },
  {
    id: 'closure', label: 'Fermeture exceptionnelle', icon: XCircle,
    displayType: 'strip', contentMode: 'simple', position: 'top',
    title: 'Ferm\u00e9 exceptionnellement le [date]', subtitle: 'Nous vous retrouvons d\u00e8s le lendemain !',
    ctaText: '', styles: { bgType: 'solid', bgColor: '#dc2626', textColor: '#ffffff' },
  },
]

interface BannerFormModalProps {
  isOpen: boolean
  onClose: () => void
  banner?: BannerData | null
  primaryColor?: string
}

export function BannerFormModal({
  isOpen,
  onClose,
  banner,
  primaryColor = '#10b981',
}: BannerFormModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { currentRestaurantId } = useRestaurantStore()
  const isMobile = useIsMobile()

  const [formData, setFormData] = useState<BannerFormData>(defaultFormData)
  const [step, setStep] = useState<'template' | 'form'>('template')

  const isEditing = !!banner

  const { data: customPages } = useQuery({
    queryKey: ['restaurant-site-pages-list'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.pages.list()
    },
    enabled: isOpen && !!accessToken,
    select: (res) => (res.data || []).filter((p: { pageType: string | null }) => !p.pageType || !['home', 'menu', 'contact'].includes(p.pageType)),
  })

  const { data: coupons } = useQuery({
    queryKey: ['restaurant-site-banners-coupons'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.banners.coupons()
    },
    enabled: isOpen && !!accessToken,
    select: (res) => res.data || [],
  })

  useEffect(() => {
    if (banner) {
      setFormData({
        displayType: banner.displayType || 'strip',
        contentMode: banner.contentMode || 'simple',
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image: banner.image || '',
        ctaText: banner.ctaText || '',
        ctaLink: banner.ctaLink || '',
        couponId: banner.couponId || '',
        isActive: banner.isActive,
        pages: banner.pages?.length > 0 ? banner.pages : ['home'],
        position: banner.position || 'top',
        dismissable: banner.dismissable ?? false,
        sticky: banner.sticky ?? false,
        styles: { ...defaultStyles, ...(banner.styles as BannerStyles || {}) },
      })
      setStep('form')
    } else {
      setFormData(defaultFormData)
      setStep('template')
    }
  }, [banner, isOpen])

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
    setStep('form')
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
      onClose()
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: BannerFormData) => {
      if (!banner) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.banners.update(banner.id, {
        displayType: data.displayType,
        contentMode: data.contentMode,
        title: data.title || undefined,
        subtitle: data.subtitle || undefined,
        image: data.image || undefined,
        ctaText: data.ctaText || undefined,
        ctaLink: data.ctaLink || undefined,
        couponId: data.couponId || null,
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
      toast.success('Bannière mise à jour')
      onClose()
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.displayType === 'banner' && !formData.image) {
      toast.error('L\'image est requise pour une bannière large')
      return
    }
    if (formData.contentMode === 'promo' && !formData.couponId) {
      toast.error('Sélectionnez un code promo')
      return
    }
    if (banner) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  const isPromo = formData.contentMode === 'promo'
  const isBannerType = formData.displayType === 'banner'
  const selectedCoupon = coupons?.find((c: CouponData) => c.id === formData.couponId)

  const getPreviewBg = (): React.CSSProperties => {
    const s = formData.styles
    if (s.bgType === 'gradient' && s.bgGradientFrom && s.bgGradientTo) {
      return { background: `linear-gradient(${s.bgGradientDirection || 'to right'}, ${s.bgGradientFrom}, ${s.bgGradientTo})` }
    }
    if (s.bgType === 'solid' && s.bgColor) {
      return { backgroundColor: s.bgColor }
    }
    return { backgroundColor: primaryColor }
  }

  const templateStep = (
    <div className="flex flex-col max-h-[calc(100vh-120px)]">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900 mb-1">Commencer avec un template</p>
          <p className="text-xs text-gray-400">Choisissez un mod\u00e8le ou partez de z\u00e9ro</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATES.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Icon size={16} style={{ color: primaryColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{t.label}</p>
                  <p className="text-[11px] text-gray-400 truncate">{t.title}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">ou</span></div>
        </div>
        <button
          type="button"
          onClick={() => setStep('form')}
          className="w-full p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cr\u00e9er depuis z\u00e9ro
        </button>
      </div>
    </div>
  )

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(100vh-120px)]">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

        {/* Type visuel */}
        <div className="space-y-2">
          <Label>Type d'affichage</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'strip', label: 'Bande', desc: 'Bandeau fin' },
              { value: 'banner', label: 'Large', desc: 'Avec image' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, displayType: opt.value }))}
                className="p-3 rounded-xl border-2 text-left transition-all"
                style={formData.displayType === opt.value ? {
                  borderColor: primaryColor,
                  backgroundColor: `${primaryColor}08`,
                } : { borderColor: '#e5e7eb' }}
              >
                <p className="text-sm font-medium" style={formData.displayType === opt.value ? { color: primaryColor } : { color: '#111827' }}>{opt.label}</p>
                <p className="text-[11px] text-gray-400">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Mode contenu */}
        <div className="space-y-2">
          <Label>Type de contenu</Label>
          <div className="grid grid-cols-2 gap-2">
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
                  className="flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all"
                  style={formData.contentMode === opt.value ? {
                    borderColor: primaryColor,
                    backgroundColor: `${primaryColor}08`,
                  } : { borderColor: '#e5e7eb' }}
                >
                  <Icon size={16} style={formData.contentMode === opt.value ? { color: primaryColor } : { color: '#9ca3af' }} />
                  <div>
                    <p className="text-sm font-medium" style={formData.contentMode === opt.value ? { color: primaryColor } : { color: '#111827' }}>{opt.label}</p>
                    <p className="text-[11px] text-gray-400">{opt.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* S\u00e9lection code promo */}
        {isPromo && (
          <div className="space-y-2">
            <Label>Code promo</Label>
            <Select
              value={formData.couponId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, couponId: value }))}
            >
              <SelectTrigger className="h-11 rounded-xl focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                <SelectValue placeholder="S\u00e9lectionnez un code promo" />
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

        {/* Image (uniquement pour banner) */}
        {isBannerType && (
          <ImageUpload
            value={formData.image || null}
            onChange={(url) => setFormData(prev => ({ ...prev, image: url || '' }))}
            folder="banners"
            label="Image de la banni\u00e8re *"
            placeholder="Ajouter une image"
            aspectRatio="landscape"
            primaryColor={primaryColor}
            showMediaLibrary
            restaurantId={currentRestaurantId || undefined}
          />
        )}

        {/* Textes */}
        <div className="space-y-2">
          <Label htmlFor="banner-title">
            {isPromo ? 'Titre de l\'offre' : 'Titre'}
          </Label>
          <Input
            id="banner-title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder={isPromo ? 'Ex: Profitez de -20% sur votre commande !' : 'Titre de la banni\u00e8re'}
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
          {isPromo && (
            <p className="text-[11px] text-gray-400">Mettez en avant la r\u00e9duction pour attirer l'attention</p>
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
            placeholder={isPromo ? 'Ex: Valable jusqu\'au 28 f\u00e9vrier, sur toute la carte' : 'Sous-titre optionnel'}
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
          {isPromo && (
            <p className="text-[11px] text-gray-400">Pr\u00e9cisez les conditions ou la dur\u00e9e de validit\u00e9</p>
          )}
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

        {/* Styles visuels */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette size={14} style={{ color: primaryColor }} />
            <Label>Personnalisation visuelle</Label>
          </div>

          {/* Aper\u00e7u */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ ...getPreviewBg(), color: formData.styles.textColor || '#ffffff' }}
          >
            <div className={isBannerType ? 'p-6 sm:p-8 text-center' : 'px-4 py-2.5 flex items-center justify-center gap-3 text-center'}>
              <p className={isBannerType ? 'text-lg font-bold' : 'text-xs font-medium'}>
                {formData.title || 'Aper\u00e7u de la banni\u00e8re'}
              </p>
              {formData.subtitle && isBannerType && (
                <p className="text-sm opacity-80 mt-1">{formData.subtitle}</p>
              )}
            </div>
          </div>

          {/* Type de fond */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Fond</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'solid', label: 'Couleur' },
                { value: 'gradient', label: 'Dégradé' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateStyle('bgType', opt.value)}
                  className="px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all"
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
                  className="h-10 rounded-xl border-gray-200 font-mono text-xs flex-1"
                />
              </div>
            </div>
          )}

          {formData.styles.bgType === 'gradient' && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Couleurs du d\u00e9grad\u00e9</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={formData.styles.bgGradientFrom || primaryColor}
                    onChange={(e) => updateStyle('bgGradientFrom', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0"
                  />
                  <Input
                    value={formData.styles.bgGradientFrom || ''}
                    onChange={(e) => updateStyle('bgGradientFrom', e.target.value)}
                    placeholder="D\u00e9but"
                    className="h-8 rounded-lg border-gray-200 font-mono text-[10px]"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={formData.styles.bgGradientTo || '#059669'}
                    onChange={(e) => updateStyle('bgGradientTo', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0"
                  />
                  <Input
                    value={formData.styles.bgGradientTo || ''}
                    onChange={(e) => updateStyle('bgGradientTo', e.target.value)}
                    placeholder="Fin"
                    className="h-8 rounded-lg border-gray-200 font-mono text-[10px]"
                  />
                </div>
              </div>
              <Select
                value={formData.styles.bgGradientDirection || 'to right'}
                onValueChange={(v) => updateStyle('bgGradientDirection', v)}
              >
                <SelectTrigger className="h-9 rounded-lg text-xs">
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

          {/* Couleur du texte */}
          <div className="space-y-2">
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
                className="h-10 rounded-xl border-gray-200 font-mono text-xs flex-1"
              />
            </div>
          </div>

          {/* Object fit (banner uniquement) */}
          {isBannerType && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Ajustement de l'image</Label>
              <Select
                value={formData.styles.objectFit || 'cover'}
                onValueChange={(v) => updateStyle('objectFit', v)}
              >
                <SelectTrigger className="h-9 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent accentColor={primaryColor}>
                  <SelectItem value="cover">Couvrir (recadr\u00e9e)</SelectItem>
                  <SelectItem value="contain">Contenir (enti\u00e8re)</SelectItem>
                  <SelectItem value="fill">\u00c9tirer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Overlay (banner uniquement) */}
          {isBannerType && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Opacit\u00e9 de l'overlay ({formData.styles.overlayOpacity || 50}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={formData.styles.overlayOpacity || 50}
                onChange={(e) => updateStyle('overlayOpacity', parseInt(e.target.value))}
                className="w-full accent-current"
                style={{ accentColor: primaryColor }}
              />
            </div>
          )}
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label>Position</Label>
          <Select
            value={formData.position}
            onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
          >
            <SelectTrigger className="h-11 rounded-xl focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              {POSITION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400">
            {POSITION_OPTIONS.find(o => o.value === formData.position)?.desc}
          </p>
        </div>

        {/* Pages cibl\u00e9es */}
        <div className="space-y-2">
          <Label>Pages cibl\u00e9es</Label>
          <p className="text-xs text-gray-400">S\u00e9lectionnez les pages o\u00f9 cette banni\u00e8re sera affich\u00e9e</p>
          <div className="flex flex-wrap gap-2">
            {PAGE_OPTIONS.map((opt) => {
              const isSelected = formData.pages.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => togglePage(opt.value)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
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
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">Afficher cette banni\u00e8re sur le site</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              style={{ backgroundColor: formData.isActive ? primaryColor : undefined } as React.CSSProperties}
            />
          </div>
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900">Peut \u00eatre ferm\u00e9e</p>
              <p className="text-xs text-gray-500">Le visiteur peut fermer la banni\u00e8re</p>
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
                <p className="text-xs text-gray-500">Reste visible au scroll</p>
              </div>
              <Switch
                checked={formData.sticky}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sticky: checked }))}
                style={{ backgroundColor: formData.sticky ? primaryColor : undefined } as React.CSSProperties}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-gray-100 p-4 sm:p-6 flex gap-3">
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('template')}
            disabled={isLoading}
            className="h-11 rounded-xl px-4"
          >
            Retour
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 h-11 rounded-xl transition-colors"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${primaryColor}15`
            e.currentTarget.style.borderColor = primaryColor
            e.currentTarget.style.color = primaryColor
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ''
            e.currentTarget.style.borderColor = ''
            e.currentTarget.style.color = ''
          }}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isLoading || (isBannerType && !formData.image) || (isPromo && !formData.couponId)}
          style={{ backgroundColor: primaryColor }}
          className="flex-1 text-white h-11 rounded-xl"
        >
          {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
          {isEditing ? 'Enregistrer' : 'Cr\u00e9er'}
        </Button>
      </div>
    </form>
  )

  const content = step === 'template' && !isEditing ? templateStep : formContent

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <ImageIcon size={18} style={{ color: primaryColor }} />
              </div>
              <span>{isEditing ? 'Modifier la banni\u00e8re' : 'Nouvelle banni\u00e8re'}</span>
            </DrawerTitle>
            <DrawerDescription>
              {isEditing ? 'Modifiez les informations de la banni\u00e8re' : 'Choisissez un mod\u00e8le ou cr\u00e9ez depuis z\u00e9ro'}
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col [&>button]:hidden">
        <SheetHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <ImageIcon size={18} style={{ color: primaryColor }} />
              </div>
              <span>{isEditing ? 'Modifier la banni\u00e8re' : 'Nouvelle banni\u00e8re'}</span>
            </SheetTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <SheetDescription>
            {isEditing ? 'Modifiez les informations de la banni\u00e8re' : 'Choisissez un mod\u00e8le ou cr\u00e9ez depuis z\u00e9ro'}
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}
