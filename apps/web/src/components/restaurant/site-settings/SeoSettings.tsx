'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Search, FileText, Image, Tag, Eye, Save, Loader2, X, Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/shared/ImageUpload'

interface SeoSettingsProps {
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string[]
  favicon: string | null
  ogImage: string | null
  subdomain: string | null
  onUpdate: () => void
  primaryColor?: string
  restaurantId?: string
}

export function SeoSettings({
  metaTitle,
  metaDescription,
  metaKeywords,
  favicon,
  ogImage,
  subdomain,
  onUpdate,
  primaryColor = '#10b981',
  restaurantId,
}: SeoSettingsProps) {
  const [formData, setFormData] = useState({
    metaTitle: metaTitle || '',
    metaDescription: metaDescription || '',
    metaKeywords: metaKeywords || [],
    favicon: favicon || '',
    ogImage: ogImage || '',
  })
  const [keywordInput, setKeywordInput] = useState('')

  useEffect(() => {
    setFormData({
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      metaKeywords: metaKeywords || [],
      favicon: favicon || '',
      ogImage: ogImage || '',
    })
  }, [metaTitle, metaDescription, metaKeywords, favicon, ogImage])

  const updateMutation = useMutation({
    mutationFn: async (data: {
      metaTitle?: string | null
      metaDescription?: string | null
      metaKeywords?: string[]
      favicon?: string | null
      ogImage?: string | null
    }) => {
      return api.restaurant.site.settings.update(data)
    },
    onSuccess: () => {
      toast.success('Paramètres SEO mis à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      metaTitle: formData.metaTitle || null,
      metaDescription: formData.metaDescription || null,
      metaKeywords: formData.metaKeywords,
      favicon: formData.favicon || null,
      ogImage: formData.ogImage || null,
    })
  }

  const addKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase()
    if (keyword && !formData.metaKeywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        metaKeywords: [...prev.metaKeywords, keyword],
      }))
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      metaKeywords: prev.metaKeywords.filter(k => k !== keyword),
    }))
  }

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }
  }

  const previewTitle = formData.metaTitle || `${subdomain || 'Mon Restaurant'} - Commandez en ligne`
  const previewDescription = formData.metaDescription || 'Découvrez notre menu et commandez en ligne. Livraison et à emporter disponibles.'
  const previewUrl = subdomain ? `https://${subdomain}.iziresto.com` : 'https://votre-site.iziresto.com'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">SEO</h3>
        <p className="text-sm text-gray-500">Optimisez le référencement de votre site</p>
      </div>

      {/* Meta titre */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText size={16} style={{ color: primaryColor }} />
          <span>Métadonnées</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaTitle">Titre (meta title)</Label>
            <span className={`text-xs ${formData.metaTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
              {formData.metaTitle.length}/60
            </span>
          </div>
          <Input
            id="metaTitle"
            value={formData.metaTitle}
            onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
            placeholder="Titre affiché dans les résultats de recherche"
            maxLength={70}
            className="h-11 rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaDescription">Description (meta description)</Label>
            <span className={`text-xs ${formData.metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
              {formData.metaDescription.length}/160
            </span>
          </div>
          <Textarea
            id="metaDescription"
            value={formData.metaDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
            placeholder="Description affichée dans les résultats de recherche"
            rows={3}
            maxLength={200}
            className="rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Mots-clés */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Tag size={16} style={{ color: primaryColor }} />
          <span>Mots-clés</span>
        </div>
        <div className="space-y-2">
          <Label>Mots-clés de référencement</Label>
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
              placeholder="Ajouter un mot-clé..."
              className="flex-1 h-11 rounded-xl focus:ring-2"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addKeyword}
              disabled={!keywordInput.trim()}
              className="h-11 rounded-xl border-gray-200 hover:border-gray-300"
              style={keywordInput.trim() ? { borderColor: primaryColor, color: primaryColor } : undefined}
            >
              <Plus size={14} />
            </Button>
          </div>
          {formData.metaKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.metaKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Image size={16} style={{ color: primaryColor }} />
          <span>Images</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ImageUpload
            value={formData.favicon || null}
            onChange={(url) => setFormData(prev => ({ ...prev, favicon: url || '' }))}
            folder="favicons"
            label="Favicon"
            placeholder="Choisir un favicon"
            aspectRatio="square"
            primaryColor={primaryColor}
            showMediaLibrary
            restaurantId={restaurantId}
          />
          <ImageUpload
            value={formData.ogImage || null}
            onChange={(url) => setFormData(prev => ({ ...prev, ogImage: url || '' }))}
            folder="og-images"
            label="Image de partage (OG Image)"
            placeholder="Choisir une image"
            aspectRatio="landscape"
            primaryColor={primaryColor}
            showMediaLibrary
            restaurantId={restaurantId}
          />
        </div>
      </div>

      {/* Aperçu Google */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Eye size={16} style={{ color: primaryColor }} />
          <span>Aperçu Google</span>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <div className="space-y-1">
            <p className="text-sm text-emerald-700 font-mono truncate">{previewUrl}</p>
            <p className="text-lg text-blue-700 font-medium truncate hover:underline cursor-default">
              {previewTitle}
            </p>
            <p className="text-sm text-gray-600 line-clamp-2">{previewDescription}</p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          style={{ backgroundColor: primaryColor }}
          className="text-white"
        >
          {updateMutation.isPending ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

    </form>
  )
}
