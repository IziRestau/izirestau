'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { X, GripVertical } from 'lucide-react'
import { SaveButton } from './SaveButton'
import type { ThemeTabProps } from './types'

const HERO_STYLES: { value: string; label: string; description: string }[] = [
  { value: 'banner', label: 'Bannière pleine largeur', description: 'Image de fond avec texte superposé et overlay' },
  { value: 'carousel', label: 'Carousel d\'images', description: 'Défilement automatique de plusieurs images' },
  { value: 'split', label: 'Image + texte côte à côte', description: 'Mise en page divisée en deux colonnes' },
  { value: 'minimal', label: 'Minimaliste', description: 'Texte seul sur fond de couleur, sans image' },
  { value: 'video', label: 'Vidéo en arrière-plan', description: 'Vidéo en boucle avec texte superposé' },
]

export function ThemeHeroTab({ formData, onChange, primaryColor, isSaving, onSave }: ThemeTabProps) {
  const handleAddCarouselImage = (url: string | null) => {
    if (!url) return
    const current = formData.heroImages || []
    onChange({ heroImages: [...current, url] })
  }

  const handleRemoveCarouselImage = (index: number) => {
    const current = formData.heroImages || []
    onChange({ heroImages: current.filter((_, i) => i !== index) })
  }

  const needsImage = formData.heroStyle === 'banner' || formData.heroStyle === 'split'
  const needsCarousel = formData.heroStyle === 'carousel'
  const needsVideo = formData.heroStyle === 'video'
  const needsOverlay = formData.heroStyle === 'banner' || formData.heroStyle === 'carousel' || formData.heroStyle === 'video'

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Section Hero</h3>
        <p className="text-sm text-gray-500 mt-1">Personnalisez la bannière principale de votre site</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Style du hero</Label>
        <div className="grid grid-cols-1 gap-2">
          {HERO_STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => onChange({ heroStyle: style.value })}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                formData.heroStyle === style.value
                  ? 'border-2 bg-gray-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
              style={formData.heroStyle === style.value ? { borderColor: primaryColor } : undefined}
            >
              <div
                className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center"
                style={formData.heroStyle === style.value ? { borderColor: primaryColor } : { borderColor: '#d1d5db' }}
              >
                {formData.heroStyle === style.value && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{style.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{style.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {needsImage && (
        <div className="space-y-1.5">
          <Label className="text-xs">Image de fond du hero</Label>
          <ImageUpload
            value={formData.heroImageUrl || null}
            onChange={(url) => onChange({ heroImageUrl: url || '' })}
            folder="hero"
            placeholder="Ajoutez l'image de fond de votre hero"
            aspectRatio="landscape"
            primaryColor={primaryColor}
            showMediaLibrary
          />
        </div>
      )}

      {needsCarousel && (
        <div className="space-y-3">
          <Label className="text-xs">Images du carousel</Label>
          {(formData.heroImages || []).length > 0 && (
            <div className="space-y-2">
              {(formData.heroImages || []).map((img, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                  <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                  <img src={img} alt={`Slide ${i + 1}`} className="w-16 h-10 object-cover rounded-lg" />
                  <span className="text-xs text-gray-500 flex-1 truncate">Slide {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCarouselImage(i)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <ImageUpload
            value={null}
            onChange={handleAddCarouselImage}
            folder="hero"
            placeholder="Ajouter une image au carousel"
            aspectRatio="landscape"
            primaryColor={primaryColor}
            showMediaLibrary
          />
          {(formData.heroImages || []).length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
              Ajoutez au moins 2 images pour le carousel
            </p>
          )}
        </div>
      )}

      {needsVideo && (
        <div className="space-y-1.5">
          <Label className="text-xs">URL de la vidéo</Label>
          <Input
            value={formData.heroVideoUrl}
            onChange={(e) => onChange({ heroVideoUrl: e.target.value })}
            placeholder="https://exemple.com/video.mp4 ou lien YouTube"
            className="h-11 rounded-xl text-sm focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
          <p className="text-xs text-gray-400">Formats supportés : MP4, WebM, ou lien YouTube/Vimeo</p>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Textes du hero</p>

        <div className="space-y-1.5">
          <Label className="text-xs">Titre</Label>
          <Input
            value={formData.heroTitle}
            onChange={(e) => onChange({ heroTitle: e.target.value })}
            placeholder="Nom du restaurant par défaut"
            className="h-11 rounded-xl text-sm focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Sous-titre</Label>
          <Input
            value={formData.heroSubtitle}
            onChange={(e) => onChange({ heroSubtitle: e.target.value })}
            placeholder="Description courte par défaut"
            className="h-11 rounded-xl text-sm focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Texte du bouton</Label>
            <Input
              value={formData.heroCtaText}
              onChange={(e) => onChange({ heroCtaText: e.target.value })}
              placeholder="Voir le menu"
              className="h-11 rounded-xl text-sm focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Lien du bouton</Label>
            <Input
              value={formData.heroCtaLink}
              onChange={(e) => onChange({ heroCtaLink: e.target.value })}
              placeholder="#menu ou /page-personnalisee"
              className="h-11 rounded-xl text-sm focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      {needsOverlay && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Opacité de l&apos;overlay</Label>
            <span className="text-xs text-gray-400">{formData.heroOverlayOpacity}%</span>
          </div>
          <Slider
            value={[formData.heroOverlayOpacity]}
            onValueChange={([v]) => onChange({ heroOverlayOpacity: v })}
            min={0}
            max={100}
            step={5}
            className="w-full"
            accentColor={primaryColor}
          />
        </div>
      )}

      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pt-3 pb-2">Aperçu</p>
        <div
          className="relative h-36"
          style={{
            backgroundColor: formData.secondaryColor,
            backgroundImage: formData.heroImageUrl ? `url(${formData.heroImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {needsOverlay && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(0,0,0,${formData.heroOverlayOpacity / 100})` }}
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-white text-sm font-bold" style={{ fontFamily: `'${formData.headingFont}', sans-serif` }}>
              {formData.heroTitle || 'Nom du restaurant'}
            </p>
            {formData.heroSubtitle && (
              <p className="text-white/80 text-xs mt-1" style={{ fontFamily: `'${formData.bodyFont}', sans-serif` }}>
                {formData.heroSubtitle}
              </p>
            )}
            <div
              className="mt-2 px-3 py-1 text-white text-[10px] font-medium rounded-lg"
              style={{ backgroundColor: formData.primaryColor }}
            >
              {formData.heroCtaText || 'Voir le menu'}
            </div>
          </div>
        </div>
      </div>

      <SaveButton isSaving={isSaving} onSave={onSave} primaryColor={primaryColor} />
    </div>
  )
}
