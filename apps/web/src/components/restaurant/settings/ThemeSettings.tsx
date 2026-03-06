'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  Palette,
  Type,
  Layout,
  Globe,
  Loader2,
  MessageSquare,
  Eye,
  Megaphone,
  Image,
  MousePointer,
  Monitor,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ThemeData {
  id?: string
  baseTheme: string
  primaryColor: string
  secondaryColor: string | null
  accentColor: string | null
  backgroundColor: string | null
  textColor: string | null
  headingFont: string | null
  bodyFont: string | null
  layoutStyle: string | null
  headerStyle: string | null
  customCss: string | null
  socialLinks: Record<string, string> | null
  heroTitle?: string | null
  heroSubtitle?: string | null
  heroCtaText?: string | null
  aboutTitle?: string | null
  aboutText?: string | null
  footerText?: string | null
  announcementText?: string | null
  announcementActive?: boolean
  announcementBgColor?: string | null
  logoPosition?: string
  showRatings?: boolean
  showPrepTime?: boolean
  showAllergens?: boolean
  showCuisineTypes?: boolean
  heroStyle?: string
  heroOverlayOpacity?: number
  menuStyle?: string
  productCardStyle?: string
  showProductImages?: boolean
  buttonStyle?: string
  buttonSize?: string
}

interface ThemeSettingsProps {
  theme: ThemeData | null
  restaurantId: string
  onUpdate: () => void
  primaryColor?: string
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Nunito', label: 'Nunito' },
]

const HERO_STYLE_OPTIONS = [
  { value: 'banner', label: 'Bannière plein écran' },
  { value: 'minimal', label: 'Minimal (texte seul)' },
  { value: 'split', label: 'Image + texte côte à côte' },
]

const MENU_STYLE_OPTIONS = [
  { value: 'grid', label: 'Grille' },
  { value: 'list', label: 'Liste' },
  { value: 'compact', label: 'Compact' },
]

const PRODUCT_CARD_OPTIONS = [
  { value: 'standard', label: 'Standard (carte avec image)' },
  { value: 'horizontal', label: 'Horizontal (image à gauche)' },
  { value: 'minimal', label: 'Minimal (texte seul)' },
]

const BUTTON_STYLE_OPTIONS = [
  { value: 'rounded', label: 'Arrondi' },
  { value: 'pill', label: 'Pilule' },
  { value: 'square', label: 'Carré' },
]

const BUTTON_SIZE_OPTIONS = [
  { value: 'sm', label: 'Petit' },
  { value: 'md', label: 'Moyen' },
  { value: 'lg', label: 'Grand' },
]

const LOGO_POSITION_OPTIONS = [
  { value: 'left', label: 'Gauche' },
  { value: 'center', label: 'Centre' },
]

const HEADER_STYLE_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'transparent', label: 'Transparent' },
  { value: 'minimal', label: 'Minimal' },
]

interface FormData {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  headingFont: string
  bodyFont: string
  layoutStyle: string
  headerStyle: string
  heroTitle: string
  heroSubtitle: string
  heroCtaText: string
  aboutTitle: string
  aboutText: string
  footerText: string
  announcementText: string
  announcementActive: boolean
  announcementBgColor: string
  logoPosition: string
  showRatings: boolean
  showPrepTime: boolean
  showAllergens: boolean
  showCuisineTypes: boolean
  heroStyle: string
  heroOverlayOpacity: number
  menuStyle: string
  productCardStyle: string
  showProductImages: boolean
  buttonStyle: string
  buttonSize: string
  customCss: string
  socialLinks: Record<string, string>
}

function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {isOpen && <div className="px-4 py-4 space-y-4">{children}</div>}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
  accentColor,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  accentColor: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 rounded-xl flex-1 text-xs focus:ring-2"
          style={{ '--tw-ring-color': `${accentColor}80` } as React.CSSProperties}
          maxLength={7}
        />
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  accentColor,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  accentColor: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': accentColor } as React.CSSProperties}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent accentColor={accentColor}>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function SwitchField({
  label,
  description,
  checked,
  onChange,
  accentColor,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  accentColor: string
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        accentColor={accentColor}
      />
    </div>
  )
}

function PreviewMiniCard({ formData }: { formData: FormData }) {
  const btnRadius = formData.buttonStyle === 'pill' ? '9999px' : formData.buttonStyle === 'square' ? '0' : '12px'

  return (
    <div
      className="rounded-xl border overflow-hidden shadow-sm"
      style={{ backgroundColor: formData.backgroundColor, borderColor: `${formData.textColor}10` }}
    >
      <div className="px-3 py-2 flex items-center justify-between border-b" style={{ borderColor: `${formData.textColor}10` }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: formData.primaryColor }}>
            AB
          </div>
          <span className="text-xs font-semibold" style={{ color: formData.textColor, fontFamily: `'${formData.headingFont}', sans-serif` }}>
            Mon Restaurant
          </span>
        </div>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[8px]" style={{ backgroundColor: formData.primaryColor }}>
          0
        </div>
      </div>

      {formData.heroStyle === 'banner' && (
        <div className="relative h-20" style={{ backgroundColor: formData.secondaryColor }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white text-xs font-bold" style={{ fontFamily: `'${formData.headingFont}', sans-serif` }}>
              {formData.heroTitle || 'Bienvenue'}
            </span>
            <div
              className="mt-1.5 px-2 py-0.5 text-white text-[8px] font-medium"
              style={{ backgroundColor: formData.primaryColor, borderRadius: btnRadius }}
            >
              {formData.heroCtaText || 'Voir le menu'}
            </div>
          </div>
        </div>
      )}

      <div className="p-2 space-y-1.5">
        <div className="flex gap-1.5">
          <div className="px-2 py-0.5 rounded-full text-[7px] font-medium text-white" style={{ backgroundColor: formData.primaryColor }}>
            Entrées
          </div>
          <div className="px-2 py-0.5 rounded-full text-[7px] font-medium" style={{ backgroundColor: `${formData.textColor}08`, color: formData.textColor }}>
            Plats
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[1, 2].map(i => (
            <div key={i} className="rounded-lg border overflow-hidden" style={{ borderColor: `${formData.textColor}08` }}>
              {formData.showProductImages && (
                <div className="h-8 bg-gradient-to-br from-gray-200 to-gray-100" />
              )}
              <div className="p-1.5">
                <div className="text-[7px] font-semibold" style={{ color: formData.textColor, fontFamily: `'${formData.headingFont}', sans-serif` }}>
                  Produit {i}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[7px] font-bold" style={{ color: formData.primaryColor }}>2 500 F</span>
                  <div className="w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[6px]" style={{ backgroundColor: formData.primaryColor, borderRadius: btnRadius }}>
                    +
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-2 py-1.5 border-t text-center" style={{ borderColor: `${formData.textColor}08`, backgroundColor: `${formData.textColor}03` }}>
        <span className="text-[6px] opacity-30" style={{ color: formData.textColor }}>Commande en ligne</span>
      </div>
    </div>
  )
}

export function ThemeSettings({ theme, restaurantId, onUpdate, primaryColor = '#10b981' }: ThemeSettingsProps) {
  const [formData, setFormData] = useState<FormData>({
    primaryColor: theme?.primaryColor || '#FF6B00',
    secondaryColor: theme?.secondaryColor || '#1A1A1A',
    accentColor: theme?.accentColor || '#FFB800',
    backgroundColor: theme?.backgroundColor || '#FFFFFF',
    textColor: theme?.textColor || '#1A1A1A',
    headingFont: theme?.headingFont || 'Inter',
    bodyFont: theme?.bodyFont || 'Inter',
    layoutStyle: theme?.layoutStyle || 'grid',
    headerStyle: theme?.headerStyle || 'standard',
    heroTitle: theme?.heroTitle || '',
    heroSubtitle: theme?.heroSubtitle || '',
    heroCtaText: theme?.heroCtaText || 'Voir le menu',
    aboutTitle: theme?.aboutTitle || '',
    aboutText: theme?.aboutText || '',
    footerText: theme?.footerText || '',
    announcementText: theme?.announcementText || '',
    announcementActive: theme?.announcementActive || false,
    announcementBgColor: theme?.announcementBgColor || '#FF6B00',
    logoPosition: theme?.logoPosition || 'left',
    showRatings: theme?.showRatings ?? true,
    showPrepTime: theme?.showPrepTime ?? true,
    showAllergens: theme?.showAllergens ?? true,
    showCuisineTypes: theme?.showCuisineTypes ?? true,
    heroStyle: theme?.heroStyle || 'banner',
    heroOverlayOpacity: theme?.heroOverlayOpacity ?? 40,
    menuStyle: theme?.menuStyle || 'grid',
    productCardStyle: theme?.productCardStyle || 'standard',
    showProductImages: theme?.showProductImages ?? true,
    buttonStyle: theme?.buttonStyle || 'rounded',
    buttonSize: theme?.buttonSize || 'md',
    customCss: theme?.customCss || '',
    socialLinks: theme?.socialLinks || {},
  })

  const update = (partial: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...partial }))
  }

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.restaurant.updateTheme({
        ...data,
        heroTitle: data.heroTitle || null,
        heroSubtitle: data.heroSubtitle || null,
        heroCtaText: data.heroCtaText || null,
        aboutTitle: data.aboutTitle || null,
        aboutText: data.aboutText || null,
        footerText: data.footerText || null,
        announcementText: data.announcementText || null,
        announcementBgColor: data.announcementBgColor || null,
        customCss: data.customCss || null,
        restaurantId,
      })
    },
    onSuccess: () => {
      toast.success('Thème mis à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const updateSocialLink = (platform: string, url: string) => {
    update({
      socialLinks: { ...formData.socialLinks, [platform]: url },
    })
  }

  const isLoading = updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Personnalisation du thème</h3>
          <p className="text-sm text-gray-500">Configurez l&apos;apparence de votre boutique en ligne</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <CollapsibleSection title="Couleurs" icon={Palette} defaultOpen>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ColorField label="Principale" value={formData.primaryColor} onChange={(v) => update({ primaryColor: v })} accentColor={primaryColor} />
              <ColorField label="Secondaire" value={formData.secondaryColor} onChange={(v) => update({ secondaryColor: v })} accentColor={primaryColor} />
              <ColorField label="Accent" value={formData.accentColor} onChange={(v) => update({ accentColor: v })} accentColor={primaryColor} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Arrière-plan" value={formData.backgroundColor} onChange={(v) => update({ backgroundColor: v })} accentColor={primaryColor} />
              <ColorField label="Texte" value={formData.textColor} onChange={(v) => update({ textColor: v })} accentColor={primaryColor} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Typographie" icon={Type}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Police des titres</Label>
                <Select value={formData.headingFont} onValueChange={(v) => update({ headingFont: v })}>
                  <SelectTrigger className="h-10 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Police du corps</Label>
                <Select value={formData.bodyFont} onValueChange={(v) => update({ bodyFont: v })}>
                  <SelectTrigger className="h-10 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Textes personnalisés" icon={MessageSquare}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Titre du hero</Label>
                <Input
                  value={formData.heroTitle}
                  onChange={(e) => update({ heroTitle: e.target.value })}
                  placeholder="Nom du restaurant par défaut"
                  className="h-10 rounded-xl text-sm focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sous-titre du hero</Label>
                <Input
                  value={formData.heroSubtitle}
                  onChange={(e) => update({ heroSubtitle: e.target.value })}
                  placeholder="Description courte par défaut"
                  className="h-10 rounded-xl text-sm focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Texte du bouton CTA</Label>
                <Input
                  value={formData.heroCtaText}
                  onChange={(e) => update({ heroCtaText: e.target.value })}
                  placeholder="Voir le menu"
                  className="h-10 rounded-xl text-sm focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Titre de la section À propos</Label>
                <Input
                  value={formData.aboutTitle}
                  onChange={(e) => update({ aboutTitle: e.target.value })}
                  placeholder="À propos"
                  className="h-10 rounded-xl text-sm focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Texte À propos</Label>
                <Textarea
                  value={formData.aboutText}
                  onChange={(e) => update({ aboutText: e.target.value })}
                  placeholder="Description de votre restaurant..."
                  className="rounded-xl text-sm resize-none h-20 focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Texte du pied de page</Label>
                <Input
                  value={formData.footerText}
                  onChange={(e) => update({ footerText: e.target.value })}
                  placeholder="Texte affiché dans le footer"
                  className="h-10 rounded-xl text-sm focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Bandeau d'annonce" icon={Megaphone}>
            <SwitchField
              label="Activer le bandeau"
              description="Affiche un message en haut de la page"
              checked={formData.announcementActive}
              onChange={(v) => update({ announcementActive: v })}
              accentColor={primaryColor}
            />
            {formData.announcementActive && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Message</Label>
                  <Input
                    value={formData.announcementText}
                    onChange={(e) => update({ announcementText: e.target.value })}
                    placeholder="Livraison gratuite dès 15 000 FCFA !"
                    className="h-10 rounded-xl text-sm focus:ring-2"
                    style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  />
                </div>
                <ColorField
                  label="Couleur de fond du bandeau"
                  value={formData.announcementBgColor}
                  onChange={(v) => update({ announcementBgColor: v })}
                  accentColor={primaryColor}
                />
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Section Hero" icon={Image}>
            <SelectField
              label="Style du hero"
              value={formData.heroStyle}
              onChange={(v) => update({ heroStyle: v })}
              options={HERO_STYLE_OPTIONS}
              accentColor={primaryColor}
            />
            {formData.heroStyle === 'banner' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Opacité de l&apos;overlay ({formData.heroOverlayOpacity}%)</Label>
                <Slider
                  value={[formData.heroOverlayOpacity]}
                  onValueChange={([v]) => update({ heroOverlayOpacity: v })}
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                  accentColor={primaryColor}
                />
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Menu et produits" icon={Layout}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Style du menu"
                value={formData.menuStyle}
                onChange={(v) => update({ menuStyle: v })}
                options={MENU_STYLE_OPTIONS}
                accentColor={primaryColor}
              />
              <SelectField
                label="Style des cartes produit"
                value={formData.productCardStyle}
                onChange={(v) => update({ productCardStyle: v })}
                options={PRODUCT_CARD_OPTIONS}
                accentColor={primaryColor}
              />
            </div>
            <SwitchField
              label="Afficher les images produits"
              checked={formData.showProductImages}
              onChange={(v) => update({ showProductImages: v })}
              accentColor={primaryColor}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Options d'affichage" icon={Eye}>
            <SwitchField label="Afficher les notes/avis" checked={formData.showRatings} onChange={(v) => update({ showRatings: v })} accentColor={primaryColor} />
            <SwitchField label="Afficher le temps de préparation" checked={formData.showPrepTime} onChange={(v) => update({ showPrepTime: v })} accentColor={primaryColor} />
            <SwitchField label="Afficher les allergènes" checked={formData.showAllergens} onChange={(v) => update({ showAllergens: v })} accentColor={primaryColor} />
            <SwitchField label="Afficher les types de cuisine" checked={formData.showCuisineTypes} onChange={(v) => update({ showCuisineTypes: v })} accentColor={primaryColor} />
          </CollapsibleSection>

          <CollapsibleSection title="Boutons et header" icon={MousePointer}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label="Style des boutons" value={formData.buttonStyle} onChange={(v) => update({ buttonStyle: v })} options={BUTTON_STYLE_OPTIONS} accentColor={primaryColor} />
              <SelectField label="Taille des boutons" value={formData.buttonSize} onChange={(v) => update({ buttonSize: v })} options={BUTTON_SIZE_OPTIONS} accentColor={primaryColor} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label="Position du logo" value={formData.logoPosition} onChange={(v) => update({ logoPosition: v })} options={LOGO_POSITION_OPTIONS} accentColor={primaryColor} />
              <SelectField label="Style du header" value={formData.headerStyle} onChange={(v) => update({ headerStyle: v })} options={HEADER_STYLE_OPTIONS} accentColor={primaryColor} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Réseaux sociaux" icon={Globe}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Facebook</Label>
                <Input
                  value={formData.socialLinks.facebook || ''}
                  onChange={(e) => updateSocialLink('facebook', e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="h-10 rounded-xl text-sm focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Instagram</Label>
                <Input
                  value={formData.socialLinks.instagram || ''}
                  onChange={(e) => updateSocialLink('instagram', e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="h-10 rounded-xl text-sm focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Twitter / X</Label>
                <Input
                  value={formData.socialLinks.twitter || ''}
                  onChange={(e) => updateSocialLink('twitter', e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="h-10 rounded-xl text-sm focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">TikTok</Label>
                <Input
                  value={formData.socialLinks.tiktok || ''}
                  onChange={(e) => updateSocialLink('tiktok', e.target.value)}
                  placeholder="https://tiktok.com/..."
                  className="h-10 rounded-xl text-sm focus:ring-2"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="CSS personnalisé" icon={Monitor}>
            <div className="space-y-1.5">
              <Label className="text-xs">CSS avancé</Label>
              <Textarea
                value={formData.customCss}
                onChange={(e) => update({ customCss: e.target.value })}
                placeholder=".storefront-root { /* vos styles */ }"
                className="rounded-xl text-xs font-mono resize-none h-32 focus:ring-2"
                style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              />
              <p className="text-[10px] text-gray-400">Utilisez .storefront-root comme sélecteur racine</p>
            </div>
          </CollapsibleSection>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Eye size={14} />
              Aperçu en direct
            </div>
            <PreviewMiniCard formData={formData} />
            <p className="text-[10px] text-gray-400 text-center">
              Aperçu simplifié. Visitez votre boutique pour voir le rendu complet.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 px-6 rounded-xl text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </Button>
      </div>
    </form>
  )
}
