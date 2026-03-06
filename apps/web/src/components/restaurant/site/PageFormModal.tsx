'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileText, Loader2, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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

export interface StorePageData {
  id: string
  slug: string
  title: string
  content: string
  isDefault: boolean
  pageType: string | null
  isActive: boolean
  sortOrder: number
  showInNav: boolean
  sections: Record<string, Record<string, unknown>> | null
  metaTitle: string | null
  metaDescription: string | null
  views: number
  createdAt: string
  updatedAt: string
}

interface PageFormData {
  slug: string
  title: string
  content: string
  isActive: boolean
  showInNav: boolean
  metaTitle: string
  metaDescription: string
}

const defaultFormData: PageFormData = {
  slug: '',
  title: '',
  content: '',
  isActive: true,
  showInNav: true,
  metaTitle: '',
  metaDescription: '',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface PageFormModalProps {
  isOpen: boolean
  onClose: () => void
  page?: StorePageData | null
  primaryColor?: string
}

export function PageFormModal({
  isOpen,
  onClose,
  page,
  primaryColor = '#10b981',
}: PageFormModalProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const isMobile = useIsMobile()

  const [formData, setFormData] = useState<PageFormData>(defaultFormData)
  const [autoSlug, setAutoSlug] = useState(true)

  const isEditing = !!page

  useEffect(() => {
    if (page) {
      setFormData({
        slug: page.slug,
        title: page.title,
        content: page.content,
        isActive: page.isActive,
        showInNav: page.showInNav,
        metaTitle: page.metaTitle || '',
        metaDescription: page.metaDescription || '',
      })
      setAutoSlug(false)
    } else {
      setFormData(defaultFormData)
      setAutoSlug(true)
    }
  }, [page, isOpen])

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: autoSlug ? slugify(value) : prev.slug,
    }))
  }

  const createMutation = useMutation({
    mutationFn: async (data: PageFormData) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.pages.create({
        slug: data.slug,
        title: data.title,
        content: data.content,
        isActive: data.isActive,
        showInNav: data.showInNav,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-pages'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-overview'] })
      toast.success('Page créée avec succès')
      onClose()
    },
    onError: (error: Error) => toast.error(error.message || 'Erreur lors de la création'),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: PageFormData) => {
      if (!page) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.pages.update(page.id, {
        slug: data.slug,
        title: data.title,
        content: data.content,
        isActive: data.isActive,
        showInNav: data.showInNav,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-site-pages'] })
      toast.success('Page mise à jour')
      onClose()
    },
    onError: (error: Error) => toast.error(error.message || 'Erreur lors de la mise à jour'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Titre, slug et contenu sont requis')
      return
    }
    if (page) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(100vh-120px)]">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="page-title">Titre *</Label>
          <Input
            id="page-title"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Titre de la page"
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="page-slug">Slug *</Label>
          <div className="flex items-center gap-2">
            <Input
              id="page-slug"
              value={formData.slug}
              onChange={(e) => {
                setAutoSlug(false)
                setFormData(prev => ({ ...prev, slug: e.target.value }))
              }}
              placeholder="url-de-la-page"
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0 font-mono text-sm"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              required
              disabled={page?.isDefault}
            />
          </div>
          <p className="text-xs text-gray-400">
            {page?.isDefault
              ? 'Le slug des pages par défaut ne peut pas être modifié'
              : 'Identifiant unique dans l\'URL (lettres minuscules, chiffres, tirets)'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="page-content">Contenu *</Label>
          <Textarea
            id="page-content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Contenu de la page (HTML ou texte)"
            className="min-h-[160px] rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            required
          />
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Active</p>
            <p className="text-xs text-gray-500">Publier cette page sur le site</p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            style={{ backgroundColor: formData.isActive ? primaryColor : undefined } as React.CSSProperties}
          />
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Afficher dans la navigation</p>
            <p className="text-xs text-gray-500">Ajouter un lien dans le menu du site</p>
          </div>
          <Switch
            checked={formData.showInNav}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showInNav: checked }))}
            style={{ backgroundColor: formData.showInNav ? primaryColor : undefined } as React.CSSProperties}
          />
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">SEO</p>
          <div className="space-y-2">
            <Label htmlFor="page-meta-title">Meta titre</Label>
            <Input
              id="page-meta-title"
              value={formData.metaTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
              placeholder="Titre pour les moteurs de recherche"
              className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-meta-desc">Meta description</Label>
            <Textarea
              id="page-meta-desc"
              value={formData.metaDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
              placeholder="Description pour les moteurs de recherche"
              className="min-h-[80px] rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-gray-100 p-4 sm:p-6 flex gap-3">
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
          disabled={isLoading || !formData.title || !formData.slug || !formData.content}
          style={{ backgroundColor: primaryColor }}
          className="flex-1 text-white h-11 rounded-xl"
        >
          {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
          {isEditing ? 'Enregistrer' : 'Créer la page'}
        </Button>
      </div>
    </form>
  )

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
                <FileText size={18} style={{ color: primaryColor }} />
              </div>
              <span>{isEditing ? 'Modifier la page' : 'Nouvelle page'}</span>
            </DrawerTitle>
            <DrawerDescription>
              {isEditing ? 'Modifiez le contenu de la page' : 'Créez une nouvelle page pour votre site'}
            </DrawerDescription>
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 [&>button]:hidden">
        <SheetHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <FileText size={18} style={{ color: primaryColor }} />
              </div>
              <span>{isEditing ? 'Modifier la page' : 'Nouvelle page'}</span>
            </SheetTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <SheetDescription>
            {isEditing ? 'Modifiez le contenu de la page' : 'Créez une nouvelle page pour votre site'}
          </SheetDescription>
        </SheetHeader>
        {formContent}
      </SheetContent>
    </Sheet>
  )
}
