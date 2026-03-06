'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SaveButton } from './SaveButton'
import type { ThemeTabProps } from './types'
import type { CartConfig } from './types'

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

export function ThemeCartTab({ formData, onChange, primaryColor, isSaving, onSave }: ThemeTabProps) {
  const cartConfig = formData.cartConfig

  const updateCartConfig = (partial: Partial<CartConfig>) => {
    onChange({ cartConfig: { ...cartConfig, ...partial } })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Panier</h3>
        <p className="text-sm text-gray-500 mt-1">Personnalisez l&apos;apparence et le comportement du panier</p>
      </div>

      {/* Type et position */}
      <div className="space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type et position</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Type de panier</Label>
            <Select value={cartConfig.cartType} onValueChange={(v) => updateCartConfig({ cartType: v })}>
              <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                <SelectItem value="drawer">Panneau latéral</SelectItem>
                <SelectItem value="modal">Modal centré</SelectItem>
                <SelectItem value="mini">Mini panier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {cartConfig.cartType === 'drawer' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Position</Label>
                <Select value={cartConfig.drawerPosition} onValueChange={(v) => updateCartConfig({ drawerPosition: v })}>
                  <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    <SelectItem value="left">Gauche</SelectItem>
                    <SelectItem value="right">Droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Largeur</Label>
                <Select value={cartConfig.drawerWidth} onValueChange={(v) => updateCartConfig({ drawerWidth: v })}>
                  <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    <SelectItem value="sm">Étroit (320px)</SelectItem>
                    <SelectItem value="md">Normal (400px)</SelectItem>
                    <SelectItem value="lg">Large (480px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Affichage des articles */}
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Affichage des articles</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Style des articles</Label>
            <Select value={cartConfig.itemLayout} onValueChange={(v) => updateCartConfig({ itemLayout: v })}>
              <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                <SelectItem value="detailed">Détaillé (avec images)</SelectItem>
                <SelectItem value="compact">Compact (sans images)</SelectItem>
                <SelectItem value="minimal">Minimal (liste simple)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {cartConfig.itemLayout === 'detailed' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Taille des images</Label>
              <Select value={cartConfig.imageSize} onValueChange={(v) => updateCartConfig({ imageSize: v })}>
                <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent accentColor={primaryColor}>
                  <SelectItem value="sm">Petite</SelectItem>
                  <SelectItem value="md">Moyenne</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Contrôle quantité</Label>
            <Select value={cartConfig.quantityControlStyle} onValueChange={(v) => updateCartConfig({ quantityControlStyle: v })}>
              <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                <SelectItem value="inline">En ligne (- 1 +)</SelectItem>
                <SelectItem value="stepper">Stepper vertical</SelectItem>
                <SelectItem value="input">Champ de saisie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          {cartConfig.itemLayout === 'detailed' && (
            <ToggleRow
              label="Afficher les images"
              checked={cartConfig.showItemImages}
              onChange={(v) => updateCartConfig({ showItemImages: v })}
              accentColor={primaryColor}
            />
          )}
          <ToggleRow
            label="Afficher les variantes"
            description="Ex: Taille M, Sauce piquante"
            checked={cartConfig.showVariants}
            onChange={(v) => updateCartConfig({ showVariants: v })}
            accentColor={primaryColor}
          />
          <ToggleRow
            label="Afficher les suppléments"
            description="Ex: Extra fromage, Sans oignon"
            checked={cartConfig.showModifiers}
            onChange={(v) => updateCartConfig({ showModifiers: v })}
            accentColor={primaryColor}
          />
          <ToggleRow
            label="Afficher le prix unitaire"
            description="Affiche le prix par unité quand quantité > 1"
            checked={cartConfig.showUnitPrice}
            onChange={(v) => updateCartConfig({ showUnitPrice: v })}
            accentColor={primaryColor}
          />
        </div>
      </div>

      {/* Contrôles */}
      <div className="border-t border-gray-100 pt-4 space-y-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Contrôles</p>
        <ToggleRow
          label="Permettre la suppression"
          checked={cartConfig.allowRemoveFromCart}
          onChange={(v) => updateCartConfig({ allowRemoveFromCart: v })}
          accentColor={primaryColor}
        />
        <ToggleRow
          label="Bouton 'Vider le panier'"
          checked={cartConfig.showClearCartButton}
          onChange={(v) => updateCartConfig({ showClearCartButton: v })}
          accentColor={primaryColor}
        />
      </div>

      {/* Pied du panier */}
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pied du panier</p>
        <div className="space-y-1">
          <ToggleRow
            label="Afficher le sous-total"
            checked={cartConfig.showSubtotal}
            onChange={(v) => updateCartConfig({ showSubtotal: v })}
            accentColor={primaryColor}
          />
          <ToggleRow
            label="Afficher le nombre d'articles"
            checked={cartConfig.showItemCount}
            onChange={(v) => updateCartConfig({ showItemCount: v })}
            accentColor={primaryColor}
          />
          <ToggleRow
            label="Afficher le prix dans le bouton"
            checked={cartConfig.showCheckoutButtonPrice}
            onChange={(v) => updateCartConfig({ showCheckoutButtonPrice: v })}
            accentColor={primaryColor}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Texte du bouton de commande</Label>
          <Input
            value={cartConfig.checkoutButtonText}
            onChange={(e) => updateCartConfig({ checkoutButtonText: e.target.value })}
            placeholder="Commander"
            className="h-11 rounded-xl text-sm focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Panier vide */}
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Panier vide</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Titre</Label>
            <Input
              value={cartConfig.emptyCartTitle}
              onChange={(e) => updateCartConfig({ emptyCartTitle: e.target.value })}
              placeholder="Votre panier est vide"
              className="h-11 rounded-xl text-sm focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Input
              value={cartConfig.emptyCartMessage}
              onChange={(e) => updateCartConfig({ emptyCartMessage: e.target.value })}
              placeholder="Ajoutez des articles depuis le menu"
              className="h-11 rounded-xl text-sm focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>
        <ToggleRow
          label="Bouton 'Continuer mes achats'"
          checked={cartConfig.showContinueShoppingButton}
          onChange={(v) => updateCartConfig({ showContinueShoppingButton: v })}
          accentColor={primaryColor}
        />
      </div>

      {/* Animations */}
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Animations et fond</p>
        <div className="space-y-1">
          <ToggleRow
            label="Activer les animations"
            checked={cartConfig.enableAnimations}
            onChange={(v) => updateCartConfig({ enableAnimations: v })}
            accentColor={primaryColor}
          />
          {cartConfig.enableAnimations && (
            <div className="pl-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Vitesse des animations</Label>
                <Select value={cartConfig.animationSpeed} onValueChange={(v) => updateCartConfig({ animationSpeed: v })}>
                  <SelectTrigger className="h-11 rounded-xl text-sm focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent accentColor={primaryColor}>
                    <SelectItem value="fast">Rapide</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="slow">Lent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <ToggleRow
            label="Fond assombri"
            checked={cartConfig.showBackdrop}
            onChange={(v) => updateCartConfig({ showBackdrop: v })}
            accentColor={primaryColor}
          />
          {cartConfig.showBackdrop && (
            <>
              <ToggleRow
                label="Effet de flou sur le fond"
                checked={cartConfig.backdropBlur}
                onChange={(v) => updateCartConfig({ backdropBlur: v })}
                accentColor={primaryColor}
              />
              <ToggleRow
                label="Fermer en cliquant sur le fond"
                checked={cartConfig.closeOnBackdropClick}
                onChange={(v) => updateCartConfig({ closeOnBackdropClick: v })}
                accentColor={primaryColor}
              />
            </>
          )}
        </div>
      </div>

      <SaveButton isSaving={isSaving} onSave={onSave} primaryColor={primaryColor} />
    </div>
  )
}
