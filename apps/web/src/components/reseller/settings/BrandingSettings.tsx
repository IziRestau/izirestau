'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Palette, Upload, Trash2, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BrandingSettingsProps {
  organization: {
    id: string
    name: string
    logo: string | null
    primaryColor: string
  }
  canEdit: boolean
  onUpdate: () => void
}

const presetColors = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
]

export function BrandingSettings({ organization, canEdit, onUpdate }: BrandingSettingsProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(organization.logo)
  const [primaryColor, setPrimaryColor] = useState(organization.primaryColor)

  const updateMutation = useMutation({
    mutationFn: async (data: { logo?: string | null; primaryColor?: string }) => {
      return api.reseller.updateBranding(data)
    },
    onSuccess: () => {
      toast.success('Branding mis a jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return api.upload.uploadImage(file, 'logos')
    },
    onSuccess: (result) => {
      if (result.data?.url) {
        updateMutation.mutate({ logo: result.data.url, primaryColor })
      }
    },
    onError: () => {
      toast.error('Erreur lors de l\'upload du logo')
    },
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image trop volumineuse (max 5MB)')
        return
      }
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (logoFile) {
      uploadMutation.mutate(logoFile)
    } else if (logoPreview !== organization.logo || primaryColor !== organization.primaryColor) {
      updateMutation.mutate({ 
        logo: logoPreview, 
        primaryColor 
      })
    } else {
      toast.info('Aucune modification')
    }
  }

  const isLoading = updateMutation.isPending || uploadMutation.isPending

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Branding</h3>
          <p className="text-sm text-gray-500">Vous n'avez pas les droits pour modifier ces informations</p>
        </div>
        
        <div className="flex items-center gap-6">
          {organization.logo ? (
            <img
              src={organization.logo}
              alt="Logo"
              className="w-24 h-24 rounded-2xl object-contain border border-gray-100"
            />
          ) : (
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: organization.primaryColor }}
            >
              <span className="text-white font-bold text-2xl">
                {organization.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 mb-2">Couleur principale</p>
            <div 
              className="w-10 h-10 rounded-lg border border-gray-200"
              style={{ backgroundColor: organization.primaryColor }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Branding</h3>
        <p className="text-sm text-gray-500">Personnalisez l'apparence de votre organisation</p>
      </div>

      {/* Logo */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Upload size={14} />
          Logo
        </Label>
        
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="relative">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="w-32 h-32 rounded-2xl object-contain border border-gray-100 bg-white"
              />
            ) : (
              <div 
                className="w-32 h-32 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <Upload size={24} className="text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-800 transition-colors">
              <Upload size={16} />
              Choisir un fichier
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
            {logoPreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveLogo}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={14} className="mr-2" />
                Supprimer
              </Button>
            )}
            <p className="text-xs text-gray-500">PNG, JPG ou SVG. Max 5MB. Fond transparent recommande.</p>
          </div>
        </div>
      </div>

      {/* Couleur principale */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="flex items-center gap-2">
          <Palette size={14} />
          Couleur principale
        </Label>

        <div className="flex flex-wrap gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setPrimaryColor(color)}
              className={`w-10 h-10 rounded-lg transition-all ${
                primaryColor === color 
                  ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' 
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg border border-gray-200"
            style={{ backgroundColor: primaryColor }}
          />
          <Input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#10b981"
            className="w-32"
          />
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border-0"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4 pt-4 border-t">
        <Label>Apercu</Label>
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="w-12 h-12 rounded-xl object-contain bg-white"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <span className="text-white font-bold">
                  {organization.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{organization.name}</p>
              <p className="text-sm text-gray-500">Votre organisation</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              Bouton principal
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              Bouton secondaire
            </button>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
