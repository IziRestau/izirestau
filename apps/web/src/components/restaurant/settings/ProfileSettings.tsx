'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, MediaItem } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { User, Mail, Phone, Globe, Clock, Camera, Loader2, FolderOpen } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/shared/IconInput'
import { MediaSelectorModal } from '@/components/shared/MediaSelectorModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProfileSettingsProps {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string | null
    avatar: string | null
    language: string | null
    timezone: string | null
    emailVerified: boolean
  }
  onUpdate: () => void
  primaryColor?: string
  restaurantId?: string
}

const languages = [
  { value: 'fr', label: 'Francais' },
  { value: 'en', label: 'English' },
]

const timezones = [
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Europe/London', label: 'Londres (UTC+0)' },
  { value: 'Africa/Dakar', label: 'Dakar (UTC+0)' },
  { value: 'Africa/Casablanca', label: 'Casablanca (UTC+0)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
]

export function ProfileSettings({ user, onUpdate, primaryColor = '#10b981', restaurantId }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    language: user.language || 'fr',
    timezone: user.timezone || 'Europe/Paris',
    avatar: user.avatar || '',
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar)
  const [showMediaSelector, setShowMediaSelector] = useState(false)

  const { user: authUser, setUser } = useAuthStore()

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.restaurant.updateProfile(data)
    },
    onSuccess: (_, variables) => {
      toast.success('Profil mis à jour')
      if (authUser) {
        setUser({
          ...authUser,
          firstName: variables.firstName,
          lastName: variables.lastName,
          phone: variables.phone || undefined,
          avatar: variables.avatar || undefined,
        })
      }
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (restaurantId) {
        return api.media.upload(file, 'avatars', restaurantId)
      }
      return api.upload.uploadImage(file, 'avatars')
    },
    onSuccess: (result) => {
      const url = result.data?.url
      if (url) {
        setAvatarPreview(url)
        setFormData(prev => ({ ...prev, avatar: url }))
        toast.success('Avatar mis à jour')
      }
    },
    onError: () => {
      toast.error('Erreur lors de l\'upload de l\'image')
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image trop volumineuse (max 5MB)')
        return
      }
      setAvatarPreview(URL.createObjectURL(file))
      uploadMutation.mutate(file)
    }
  }

  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    const item = Array.isArray(media) ? media[0] : media
    if (item) {
      setAvatarPreview(item.url)
      setFormData(prev => ({ ...prev, avatar: item.url }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const isLoading = updateMutation.isPending || uploadMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Mon Profil</h3>
        <p className="text-sm text-gray-500">Modifiez vos informations personnelles</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
              <User size={32} className="text-gray-400" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex gap-1">
            <label className="w-7 h-7 bg-white rounded-full border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              {uploadMutation.isPending ? (
                <Loader2 size={12} className="text-gray-500 animate-spin" />
              ) : (
                <Camera size={12} className="text-gray-500" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploadMutation.isPending}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowMediaSelector(true)}
              className="w-7 h-7 bg-white rounded-full border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <FolderOpen size={12} className="text-gray-500" />
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Photo de profil</p>
          <p className="text-xs text-gray-500">JPG, PNG ou GIF. Max 5MB.</p>
        </div>
      </div>

      <MediaSelectorModal
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleMediaSelect}
        multiple={false}
        folder="avatars"
        primaryColor={primaryColor}
        title="Sélectionner une photo"
        restaurantId={restaurantId}
      />

      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prenom</Label>
          <IconInput
            id="firstName"
            icon={User}
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Votre prenom"
            required
            focusColor={primaryColor}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <IconInput
            id="lastName"
            icon={User}
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Votre nom"
            required
            focusColor={primaryColor}
          />
        </div>
      </div>

      {/* Email (readonly) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <IconInput
          id="email"
          icon={Mail}
          value={user.email}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500">L'email ne peut pas etre modifie</p>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Telephone</Label>
        <IconInput
          id="phone"
          icon={Phone}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+33 6 12 34 56 78"
          focusColor={primaryColor}
        />
      </div>

      {/* Language & Timezone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Langue</Label>
          <Select
            value={formData.language}
            onValueChange={(value) => setFormData({ ...formData, language: value })}
          >
            <SelectTrigger className="h-11 rounded-xl focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-gray-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fuseau horaire</Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) => setFormData({ ...formData, timezone: value })}
          >
            <SelectTrigger className="h-11 rounded-xl focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent accentColor={primaryColor}>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit */}
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
            'Enregistrer'
          )}
        </Button>
      </div>
    </form>
  )
}
