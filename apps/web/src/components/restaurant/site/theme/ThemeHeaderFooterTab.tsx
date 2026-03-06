'use client'

import { Check } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { SaveButton } from './SaveButton'
import type { ThemeTabProps } from './types'

interface DesignOption {
  id: string
  label: string
  description: string
}

const HEADER_DESIGNS: DesignOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Logo à gauche, navigation à droite, fond plein',
  },
  {
    id: 'floating',
    label: 'Détaché',
    description: 'Flottant et transparent, superposé au hero',
  },
  {
    id: 'centered',
    label: 'Centré',
    description: 'Logo centré avec navigation en dessous',
  },
]

const FOOTER_DESIGNS: DesignOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Colonnes avec contact, horaires et réseaux',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Une seule ligne compacte',
  },
  {
    id: 'centered',
    label: 'Centré',
    description: 'Logo centré, infos et réseaux en ligne',
  },
]

function HeaderPreview({ design, primaryColor }: { design: string; primaryColor: string }) {
  if (design === 'floating') {
    return (
      <div className="p-2 relative">
        <div className="absolute inset-x-2 top-2 z-10">
          <div
            className="rounded-xl px-3 py-2 flex items-center justify-between backdrop-blur-sm"
            style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}20` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md" style={{ backgroundColor: primaryColor }} />
              <div className="w-12 h-1.5 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-1.5 rounded-full bg-gray-300" />
              <div className="w-8 h-1.5 rounded-full bg-gray-300" />
            </div>
          </div>
        </div>
        <div className="h-16 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }} />
      </div>
    )
  }

  if (design === 'centered') {
    return (
      <div className="p-2">
        <div className="border-b border-gray-200 pb-2 flex flex-col items-center gap-1">
          <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: primaryColor }} />
          <div className="w-14 h-1.5 rounded-full bg-gray-300" />
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-8 h-1 rounded-full bg-gray-200" />
            <div className="w-8 h-1 rounded-full bg-gray-200" />
            <div className="w-8 h-1 rounded-full bg-gray-200" />
          </div>
        </div>
        <div className="mt-1.5 h-8 bg-gray-50 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="p-2">
      <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md" style={{ backgroundColor: primaryColor }} />
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-1.5 rounded-full bg-gray-300" />
          <div className="w-8 h-1.5 rounded-full bg-gray-300" />
          <div className="w-8 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
      <div className="mt-1.5 h-8 bg-gray-50 rounded-lg" />
    </div>
  )
}

function FooterPreview({ design, primaryColor }: { design: string; primaryColor: string }) {
  if (design === 'minimal') {
    return (
      <div className="p-2">
        <div className="h-6 bg-gray-50 rounded-lg mb-1.5" />
        <div
          className="rounded-lg px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: `${primaryColor}08` }}
        >
          <div className="w-16 h-1.5 rounded-full bg-gray-300" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-1 rounded-full bg-gray-200" />
            <div className="w-6 h-1 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  if (design === 'centered') {
    return (
      <div className="p-2">
        <div className="h-6 bg-gray-50 rounded-lg mb-1.5" />
        <div
          className="rounded-lg px-3 py-2.5 flex flex-col items-center gap-1"
          style={{ backgroundColor: `${primaryColor}08` }}
        >
          <div className="w-5 h-5 rounded-md" style={{ backgroundColor: primaryColor }} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 rounded-full bg-gray-200" />
            <div className="w-6 h-1 rounded-full bg-gray-200" />
            <div className="w-6 h-1 rounded-full bg-gray-200" />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <div className="w-3 h-3 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2">
      <div className="h-6 bg-gray-50 rounded-lg mb-1.5" />
      <div
        className="rounded-lg px-3 py-2.5 grid grid-cols-3 gap-2"
        style={{ backgroundColor: `${primaryColor}08` }}
      >
        <div className="space-y-1">
          <div className="w-8 h-1.5 rounded-full bg-gray-300" />
          <div className="w-10 h-1 rounded-full bg-gray-200" />
          <div className="w-8 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="space-y-1">
          <div className="w-8 h-1.5 rounded-full bg-gray-300" />
          <div className="w-10 h-1 rounded-full bg-gray-200" />
          <div className="w-8 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="space-y-1">
          <div className="w-8 h-1.5 rounded-full bg-gray-300" />
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <div className="w-3 h-3 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}

function DesignCard({
  design,
  isSelected,
  primaryColor,
  onClick,
  preview,
}: {
  design: DesignOption
  isSelected: boolean
  primaryColor: string
  onClick: () => void
  preview: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 p-0 text-left transition-all overflow-hidden',
        isSelected ? 'ring-1' : 'border-gray-200 hover:border-gray-300'
      )}
      style={isSelected ? { borderColor: primaryColor, boxShadow: `0 0 0 3px ${primaryColor}20` } : undefined}
    >
      <div className="bg-white rounded-t-[10px] overflow-hidden">
        {preview}
      </div>
      <div className="px-3 py-2.5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{design.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{design.description}</p>
          </div>
          {isSelected && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Check size={12} className="text-white" />
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

function ToggleRow({
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
    <div className="flex items-center justify-between py-2">
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

export function ThemeHeaderFooterTab({ formData, onChange, primaryColor, isSaving, onSave }: ThemeTabProps) {
  const selectedHeader = formData.headerDesign || 'standard'
  const selectedFooter = formData.footerDesign || 'standard'
  const opacityHex = Math.round((formData.headerBgOpacity / 100) * 255).toString(16).padStart(2, '0')

  return (
    <div className="space-y-8">
      {/* ===== HEADER DESIGN ===== */}
      <div>
        <h3 className="text-base font-semibold text-gray-900">Design du header</h3>
        <p className="text-sm text-gray-500 mt-1">Choisissez le style de l&apos;en-tête de votre site</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {HEADER_DESIGNS.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              isSelected={selectedHeader === design.id}
              primaryColor={primaryColor}
              onClick={() => onChange({ headerDesign: design.id })}
              preview={<HeaderPreview design={design.id} primaryColor={primaryColor} />}
            />
          ))}
        </div>
      </div>

      {/* ===== HEADER OPTIONS ===== */}
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Options du header</p>

        <ToggleRow
          label="Header fixe (sticky)"
          description={selectedHeader === 'floating'
            ? 'Le header détaché reste fixe en haut lors du défilement (sinon il se superpose uniquement au hero)'
            : 'Le header reste visible en haut lors du défilement'}
          checked={formData.headerSticky}
          onChange={(v) => onChange({ headerSticky: v })}
          accentColor={primaryColor}
        />

        {selectedHeader === 'floating' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-700">
                Le header détaché se superpose au hero avec un fond semi-transparent et un flou d&apos;arrière-plan.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Opacité du fond ({formData.headerBgOpacity}%)</Label>
              <Slider
                value={[formData.headerBgOpacity]}
                onValueChange={([v]) => onChange({ headerBgOpacity: v })}
                min={0}
                max={100}
                step={5}
                accentColor={primaryColor}
              />
              <p className="text-xs text-gray-400">0% = totalement transparent, 100% = opaque</p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Couleur des textes du header</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.headerTextColor}
              onChange={(e) => onChange({ headerTextColor: e.target.value })}
              className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
            />
            <Input
              value={formData.headerTextColor}
              onChange={(e) => onChange({ headerTextColor: e.target.value })}
              className="h-10 rounded-xl text-sm font-mono focus:ring-2 flex-1"
              style={{ '--tw-ring-color': primaryColor, color: formData.headerTextColor } as React.CSSProperties}
              maxLength={7}
            />
          </div>
          <p className="text-xs text-gray-400">Couleur du logo, navigation et icônes dans le header</p>
        </div>

        {selectedHeader !== 'centered' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Position du logo</Label>
            <Select value={formData.logoPosition} onValueChange={(v) => onChange({ logoPosition: v })}>
              <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                <SelectItem value="left">Gauche</SelectItem>
                <SelectItem value="center">Centre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Aperçu header */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aperçu</p>
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{
              backgroundColor: selectedHeader === 'floating'
                ? `${formData.backgroundColor || '#FFFFFF'}${opacityHex}`
                : formData.backgroundColor || '#FFFFFF',
              border: `1px solid ${formData.headerTextColor}15`,
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: formData.primaryColor }} />
              <span className="text-xs font-semibold" style={{ color: formData.headerTextColor }}>Mon Restaurant</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: formData.headerTextColor, opacity: 0.7 }}>Accueil</span>
              <span className="text-xs" style={{ color: formData.headerTextColor, opacity: 0.7 }}>Menu</span>
              <span className="text-xs" style={{ color: formData.headerTextColor, opacity: 0.7 }}>Contact</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BANDEAU D'ANNONCE ===== */}
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bandeau d&apos;annonce</p>

        <ToggleRow
          label="Bandeau actif"
          description="Afficher un bandeau promotionnel au-dessus du header"
          checked={formData.announcementActive}
          onChange={(v) => onChange({ announcementActive: v })}
          accentColor={primaryColor}
        />

        {formData.announcementActive && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Texte du bandeau</Label>
              <Input
                value={formData.announcementText}
                onChange={(e) => onChange({ announcementText: e.target.value })}
                placeholder="Ex: Livraison gratuite ce week-end !"
                className="h-11 rounded-xl text-sm focus:ring-2"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Lien (optionnel)</Label>
              <Input
                value={formData.announcementLink}
                onChange={(e) => onChange({ announcementLink: e.target.value })}
                placeholder="https://exemple.com/promo"
                className="h-11 rounded-xl text-sm focus:ring-2"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Couleur de fond</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.announcementBgColor || formData.primaryColor}
                  onChange={(e) => onChange({ announcementBgColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
                />
                <Input
                  value={formData.announcementBgColor || formData.primaryColor}
                  onChange={(e) => onChange({ announcementBgColor: e.target.value })}
                  className="h-10 rounded-xl text-sm font-mono focus:ring-2 flex-1"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  maxLength={7}
                />
              </div>
            </div>

            <div
              className="p-3 text-center text-sm font-medium text-white rounded-xl"
              style={{ backgroundColor: formData.announcementBgColor || formData.primaryColor }}
            >
              {formData.announcementText || 'Texte du bandeau d\'annonce'}
            </div>
          </>
        )}
      </div>

      {/* ===== SECTION À PROPOS ===== */}
      <div className="border-t border-gray-100 pt-8 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Section À propos</h3>
          <p className="text-sm text-gray-500 mt-1">Textes affichés dans la section À propos de votre site</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Titre</Label>
          <Input
            value={formData.aboutTitle}
            onChange={(e) => onChange({ aboutTitle: e.target.value })}
            placeholder="Notre histoire"
            className="h-11 rounded-xl text-sm focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Texte</Label>
          <Textarea
            value={formData.aboutText}
            onChange={(e) => onChange({ aboutText: e.target.value })}
            placeholder="Décrivez votre restaurant, votre philosophie culinaire..."
            className="min-h-[100px] rounded-xl text-sm focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>
      </div>

      {/* ===== FOOTER DESIGN ===== */}
      <div className="border-t border-gray-100 pt-8">
        <h3 className="text-base font-semibold text-gray-900">Design du footer</h3>
        <p className="text-sm text-gray-500 mt-1">Choisissez le style du pied de page de votre site</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {FOOTER_DESIGNS.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              isSelected={selectedFooter === design.id}
              primaryColor={primaryColor}
              onClick={() => onChange({ footerDesign: design.id })}
              preview={<FooterPreview design={design.id} primaryColor={primaryColor} />}
            />
          ))}
        </div>
      </div>

      {/* ===== FOOTER OPTIONS ===== */}
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Options du footer</p>

        <div className="space-y-1.5">
          <Label className="text-xs">Texte du footer</Label>
          <Textarea
            value={formData.footerText}
            onChange={(e) => onChange({ footerText: e.target.value })}
            placeholder="Ex: Restaurant familial depuis 2010..."
            className="rounded-xl text-sm resize-none focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            rows={2}
          />
          <p className="text-xs text-gray-400">
            {selectedFooter === 'minimal'
              ? 'Affiché à côté du nom du restaurant'
              : selectedFooter === 'centered'
              ? 'Affiché sous le logo, centré'
              : 'Affiché sous le logo dans la première colonne'}
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs text-blue-700">
            Les réseaux sociaux affichés dans le footer sont configurables dans l&apos;onglet <strong>Réseaux Sociaux</strong>.
          </p>
        </div>
      </div>

      <SaveButton onSave={onSave} isSaving={isSaving} primaryColor={primaryColor} />
    </div>
  )
}
