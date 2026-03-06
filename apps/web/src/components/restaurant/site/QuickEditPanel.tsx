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
import type { StorePageData } from './PageFormModal'

interface QuickEditFormData {
  title: string
  slug: string
  isActive: boolean
  showInNav: boolean
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface QuickEditPanelProps {
  isOpen: boolean
  onClose: () => void
  page: StorePageData | null
  primaryColor?: string
}

export function QuickEditPanel({
  isOpen,
  onClose,
  page,
  primaryColor = '#10b981',
}: QuickEditPanelProps) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const isMobile = useIsMobile()

  const [formData, setFormData] = useState<QuickEditFormData>({
    title: '',
    slug: '',
    isActive: true,
    showInNav: true,
  })

  const canToggleActive = !page?.isDefault || (page?.pageType !== 'home' && page?.pageType !== 'menu')

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title,
        slug: page.slug,
        isActive: page.isActive,
        showInNav: page.showInNav,
      })
    }
  }, [page, isOpen])

  const updateMutation = useMutation({
    mutationFn: async (data: QuickEditFormData) => {
      if (!page) return
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.site.pages.update(page.id, {
        title: data.title,
        slug: page.isDefault ? undefined : data.slug,
        isActive: data.isActive,
        showInNav: data.showInNav,
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
    if (!formData.title || !formData.slug) {
      toast.error('Titre et slug sont requis')
      return
    }
    updateMutation.mutate(formData)
  }

  const isLoading = updateMutation.isPending

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="quick-edit-title">Titre</Label>
          <Input
            id="quick-edit-title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Titre de la page"
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quick-edit-slug">Slug</Label>
          <Input
            id="quick-edit-slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))}
            placeholder="url-de-la-page"
            className="h-11 rounded-xl border-gray-200 focus:ring-2 focus:ring-offset-0 font-mono text-sm"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            required
            disabled={page?.isDefault}
          />
          {page?.isDefault && (
            <p className="text-xs text-gray-400">
              Le slug des pages par défaut ne peut pas être modifié
            </p>
          )}
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
            disabled={!canToggleActive}
          />
        </div>
        {!canToggleActive && (
          <p className="text-xs text-gray-400 -mt-3 px-1">
            Les pages Accueil et Menu ne peuvent pas être désactivées
          </p>
        )}

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
          disabled={isLoading || !formData.title || !formData.slug}
          style={{ backgroundColor: primaryColor }}
          className="flex-1 text-white h-11 rounded-xl"
        >
          {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
          Enregistrer
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
              <span>Modification rapide</span>
            </DrawerTitle>
            <DrawerDescription>
              Modifiez rapidement les propriétés de la page
            </DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col [&>button]:hidden">
        <SheetHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <FileText size={18} style={{ color: primaryColor }} />
              </div>
              <span>Modification rapide</span>
            </SheetTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <SheetDescription>
            Modifiez rapidement les propriétés de la page
          </SheetDescription>
        </SheetHeader>
        {formContent}
      </SheetContent>
    </Sheet>
  )
}
