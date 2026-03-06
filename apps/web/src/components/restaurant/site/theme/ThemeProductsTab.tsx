'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SaveButton } from './SaveButton'
import { DEFAULT_PRODUCT_CONFIG } from './types'
import type { ThemeTabProps, ProductConfig } from './types'

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

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-t border-gray-100 pt-5 mt-1">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
  )
}

function OptionButtons({
  label,
  value,
  options,
  onChange,
  primaryColor,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  primaryColor: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className={`grid gap-1.5 grid-cols-${Math.min(options.length, 4)}`}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-3 py-2 rounded-xl border text-xs font-medium transition-all"
            style={value === opt.value ? {
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
  )
}

export function ThemeProductsTab({ formData, onChange, primaryColor, isSaving, onSave }: ThemeTabProps) {
  const pc = formData.productConfig || { ...DEFAULT_PRODUCT_CONFIG }

  const update = (partial: Partial<ProductConfig>) => {
    onChange({ productConfig: { ...pc, ...partial } })
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Produits</h3>
        <p className="text-sm text-gray-500 mt-1">Personnalisez l&apos;apparence des cartes produit et de la grille</p>
      </div>

      {/* ===== CARTE PRODUIT ===== */}
      <SectionTitle title="Carte produit" description="Style et apparence des cartes dans le menu" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Style de carte</Label>
          <Select value={pc.cardStyle} onValueChange={(v) => update({ cardStyle: v })}>
            <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="minimal">Minimaliste</SelectItem>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="detailed">Détaillé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Coins arrondis</Label>
          <Select value={pc.cardRadius} onValueChange={(v) => update({ cardRadius: v })}>
            <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="none">Aucun</SelectItem>
              <SelectItem value="sm">Petit</SelectItem>
              <SelectItem value="md">Moyen</SelectItem>
              <SelectItem value="lg">Grand</SelectItem>
              <SelectItem value="xl">Très grand</SelectItem>
              <SelectItem value="2xl">Extra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Ombre</Label>
          <Select value={pc.cardShadow} onValueChange={(v) => update({ cardShadow: v })}>
            <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="none">Aucune</SelectItem>
              <SelectItem value="sm">Légère</SelectItem>
              <SelectItem value="md">Moyenne</SelectItem>
              <SelectItem value="lg">Forte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Bouton ajouter</Label>
          <Select value={pc.addButtonStyle} onValueChange={(v) => update({ addButtonStyle: v })}>
            <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="icon">Icône seule</SelectItem>
              <SelectItem value="text">Texte seul</SelectItem>
              <SelectItem value="both">Icône + texte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ToggleRow
        label="Bordure de carte"
        description="Afficher une bordure autour des cartes"
        checked={pc.cardBorder}
        onChange={(v) => update({ cardBorder: v })}
        accentColor={primaryColor}
      />

      {/* ===== IMAGE ===== */}
      <SectionTitle title="Image produit" description="Affichage et comportement des images" />

      <ToggleRow
        label="Afficher les images"
        description="Montrer les photos des produits dans les cartes"
        checked={pc.showImages}
        onChange={(v) => update({ showImages: v })}
        accentColor={primaryColor}
      />

      {pc.showImages && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <OptionButtons
            label="Ratio de l'image"
            value={pc.imageRatio}
            options={[
              { value: '1:1', label: '1:1' },
              { value: '4:3', label: '4:3' },
              { value: '3:2', label: '3:2' },
              { value: '16:9', label: '16:9' },
            ]}
            onChange={(v) => update({ imageRatio: v })}
            primaryColor={primaryColor}
          />

          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Ajustement</Label>
            <Select value={pc.imageFit} onValueChange={(v) => update({ imageFit: v })}>
              <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                <SelectItem value="cover">Couvrir (recadrée)</SelectItem>
                <SelectItem value="contain">Contenir (entière)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <OptionButtons
            label="Effet au survol"
            value={pc.hoverEffect}
            options={[
              { value: 'none', label: 'Aucun' },
              { value: 'zoom', label: 'Zoom' },
              { value: 'shadow', label: 'Ombre' },
              { value: 'scale', label: 'Agrandir' },
            ]}
            onChange={(v) => update({ hoverEffect: v })}
            primaryColor={primaryColor}
          />
        </div>
      )}

      {/* ===== CONTENU ===== */}
      <SectionTitle title="Contenu" description="Informations affichées sur les cartes" />

      <ToggleRow
        label="Description"
        description="Afficher la description du produit"
        checked={pc.showDescription}
        onChange={(v) => update({ showDescription: v })}
        accentColor={primaryColor}
      />

      {pc.showDescription && (
        <OptionButtons
          label="Lignes de description"
          value={String(pc.descriptionLines)}
          options={[
            { value: '1', label: '1 ligne' },
            { value: '2', label: '2 lignes' },
            { value: '3', label: '3 lignes' },
          ]}
          onChange={(v) => update({ descriptionLines: parseInt(v) })}
          primaryColor={primaryColor}
        />
      )}

      <ToggleRow
        label="Badges"
        description="Afficher les badges promo, populaire, etc."
        checked={pc.showBadges}
        onChange={(v) => update({ showBadges: v })}
        accentColor={primaryColor}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OptionButtons
          label="Position du prix"
          value={pc.pricePosition}
          options={[
            { value: 'below', label: 'Sous le titre' },
            { value: 'right', label: 'À droite' },
            { value: 'badge', label: 'Badge' },
          ]}
          onChange={(v) => update({ pricePosition: v })}
          primaryColor={primaryColor}
        />

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Couleur du prix</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={pc.priceColor || primaryColor}
              onChange={(e) => update({ priceColor: e.target.value })}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <Input
              value={pc.priceColor || ''}
              onChange={(e) => update({ priceColor: e.target.value })}
              placeholder={`${primaryColor} (auto)`}
              className="h-10 rounded-xl border-gray-200 font-mono text-xs flex-1 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      {/* ===== GRILLE MENU ===== */}
      <SectionTitle title="Grille du menu" description="Mise en page de la liste des produits" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OptionButtons
          label="Disposition"
          value={pc.menuLayout}
          options={[
            { value: 'grid', label: 'Grille' },
            { value: 'list', label: 'Liste' },
            { value: 'compact', label: 'Compact' },
          ]}
          onChange={(v) => update({ menuLayout: v })}
          primaryColor={primaryColor}
        />

        {pc.menuLayout === 'grid' && (
          <OptionButtons
            label="Colonnes"
            value={pc.gridColumns}
            options={[
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
            ]}
            onChange={(v) => update({ gridColumns: v })}
            primaryColor={primaryColor}
          />
        )}

        {pc.menuLayout === 'list' && (
          <OptionButtons
            label="Position de l'image"
            value={pc.listImagePosition}
            options={[
              { value: 'left', label: 'Gauche' },
              { value: 'right', label: 'Droite' },
            ]}
            onChange={(v) => update({ listImagePosition: v })}
            primaryColor={primaryColor}
          />
        )}

        <OptionButtons
          label="Espacement"
          value={pc.gridGap}
          options={[
            { value: 'sm', label: 'Petit' },
            { value: 'md', label: 'Moyen' },
            { value: 'lg', label: 'Grand' },
          ]}
          onChange={(v) => update({ gridGap: v })}
          primaryColor={primaryColor}
        />

        <OptionButtons
          label="Style des catégories"
          value={pc.categoryStyle}
          options={[
            { value: 'pills', label: 'Pilules' },
            { value: 'underline', label: 'Souligné' },
            { value: 'buttons', label: 'Boutons' },
          ]}
          onChange={(v) => update({ categoryStyle: v })}
          primaryColor={primaryColor}
        />
      </div>

      {/* ===== PRODUITS EN VEDETTE ===== */}
      <SectionTitle title="Produits en vedette" description="Section des produits mis en avant sur la page d'accueil" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OptionButtons
          label="Disposition"
          value={pc.featuredLayout}
          options={[
            { value: 'grid', label: 'Grille' },
            { value: 'carousel', label: 'Carrousel' },
          ]}
          onChange={(v) => update({ featuredLayout: v })}
          primaryColor={primaryColor}
        />

        <OptionButtons
          label="Colonnes"
          value={pc.featuredColumns}
          options={[
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
          ]}
          onChange={(v) => update({ featuredColumns: v })}
          primaryColor={primaryColor}
        />

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Style de carte vedette</Label>
          <Select value={pc.featuredCardStyle} onValueChange={(v) => update({ featuredCardStyle: v })}>
            <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="vertical">Vertical</SelectItem>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="overlay">Overlay</SelectItem>
              <SelectItem value="minimal">Minimaliste</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Nombre max de produits</Label>
          <Select value={String(pc.featuredMaxItems)} onValueChange={(v) => update({ featuredMaxItems: parseInt(v) })}>
            <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="4">4 produits</SelectItem>
              <SelectItem value="6">6 produits</SelectItem>
              <SelectItem value="8">8 produits</SelectItem>
              <SelectItem value="12">12 produits</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <OptionButtons
          label="Ratio image vedette"
          value={pc.featuredImageRatio}
          options={[
            { value: '1:1', label: '1:1' },
            { value: '4:3', label: '4:3' },
            { value: '16:10', label: '16:10' },
            { value: '16:9', label: '16:9' },
          ]}
          onChange={(v) => update({ featuredImageRatio: v })}
          primaryColor={primaryColor}
        />
      </div>

      <ToggleRow
        label="Badge vedette"
        description="Afficher un badge sur les produits en vedette"
        checked={pc.featuredShowBadge}
        onChange={(v) => update({ featuredShowBadge: v })}
        accentColor={primaryColor}
      />

      <SaveButton isSaving={isSaving} onSave={onSave} primaryColor={primaryColor} />
    </div>
  )
}
