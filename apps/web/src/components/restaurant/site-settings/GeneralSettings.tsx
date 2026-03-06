'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Home, FileText, Info, Save, Loader2, ExternalLink } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

interface PageOption {
  id: string
  title: string
  slug: string
  pageType: string | null
  isDefault: boolean
}

interface GeneralSettingsProps {
  homePageId: string | null
  aboutPageId: string | null
  language: string
  currency: string
  pages: PageOption[]
  onUpdate: () => void
  primaryColor?: string
}

export function GeneralSettings({
  homePageId,
  aboutPageId,
  language,
  currency,
  pages,
  onUpdate,
  primaryColor = '#10b981',
}: GeneralSettingsProps) {
  const defaultHomePage = pages.find(p => p.pageType === 'home')

  const [formData, setFormData] = useState({
    homePageId: homePageId || defaultHomePage?.id || '',
    aboutPageId: aboutPageId || '',
  })

  useEffect(() => {
    const defaultHome = pages.find(p => p.pageType === 'home')
    setFormData({
      homePageId: homePageId || defaultHome?.id || '',
      aboutPageId: aboutPageId || '',
    })
  }, [homePageId, aboutPageId, pages])

  const updateMutation = useMutation({
    mutationFn: async (data: { homePageId?: string | null; aboutPageId?: string | null }) => {
      return api.restaurant.site.settings.update(data)
    },
    onSuccess: () => {
      toast.success('Réglages généraux mis à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      homePageId: formData.homePageId || null,
      aboutPageId: formData.aboutPageId || null,
    })
  }

  const selectedHomePage = pages.find(p => p.id === formData.homePageId)
  const selectedAboutPage = pages.find(p => p.id === formData.aboutPageId)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Général</h3>
        <p className="text-sm text-gray-500">Configurez les pages principales de votre site</p>
      </div>

      {/* Page d'accueil */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Home size={16} style={{ color: primaryColor }} />
          <span>Page d&apos;accueil</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="homePageId">
            Choisissez la page qui sera affichée comme page d&apos;accueil
          </Label>
          <Select
            value={formData.homePageId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, homePageId: value }))}
          >
            <SelectTrigger id="homePageId" className="w-full h-11 rounded-xl focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue placeholder="Sélectionnez une page" />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              {pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  <div className="flex items-center gap-2">
                    {page.pageType === 'home' ? <Home size={14} /> : <FileText size={14} />}
                    <span>{page.title}</span>
                    {page.isDefault && page.pageType === 'home' && (
                      <span className="text-xs text-gray-400 ml-1">(par défaut)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedHomePage && (
            <p className="text-xs text-gray-400">
              URL : /{selectedHomePage.slug === 'accueil' ? '' : selectedHomePage.slug}
            </p>
          )}
        </div>
      </div>

      {/* Page à propos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Info size={16} style={{ color: primaryColor }} />
          <span>Page à propos</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="aboutPageId">
            Choisissez la page qui sera identifiée comme votre page &quot;À propos&quot;
          </Label>
          <Select
            value={formData.aboutPageId || 'none'}
            onValueChange={(value) => setFormData(prev => ({ ...prev, aboutPageId: value === 'none' ? '' : value }))}
          >
            <SelectTrigger id="aboutPageId" className="w-full h-11 rounded-xl focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <SelectValue placeholder="Aucune page sélectionnée" />
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              <SelectItem value="none">
                <span className="text-gray-400">Aucune</span>
              </SelectItem>
              {pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  <div className="flex items-center gap-2">
                    <FileText size={14} />
                    <span>{page.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAboutPage && (
            <p className="text-xs text-gray-400">
              URL : /{selectedAboutPage.slug}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Cette page pourra être référencée automatiquement dans le footer ou les liens du site.
          </p>
        </div>
      </div>

      {/* Langue et devise (lecture seule) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText size={16} style={{ color: primaryColor }} />
          <span>Langue et devise</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Langue du site</p>
            <p className="text-sm font-medium text-gray-900">
              {language === 'fr' ? 'Français' : language === 'en' ? 'English' : language}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Devise</p>
            <p className="text-sm font-medium text-gray-900">{currency}</p>
          </div>
        </div>
        <Link
          href="/restaurant/settings?tab=restaurant"
          className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: primaryColor }}
        >
          <ExternalLink size={12} />
          Modifier dans les paramètres du restaurant
        </Link>
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
