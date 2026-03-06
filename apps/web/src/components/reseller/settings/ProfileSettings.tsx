'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { User, Mail, Phone, Globe, Clock, Camera, Loader2, AlertCircle, Send, Download } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/shared/IconInput'
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
    language: string
    timezone: string
    emailVerified: boolean
  }
  onUpdate: () => void
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

export function ProfileSettings({ user, onUpdate }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    language: user.language,
    timezone: user.timezone,
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar)

  const { user: authUser, setUser } = useAuthStore()

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { avatar?: string | null }) => {
      return api.reseller.updateProfile(data)
    },
    onSuccess: (_, variables) => {
      toast.success('Profil mis a jour')
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
      return api.upload.uploadImage(file, 'avatars')
    },
    onSuccess: (result) => {
      if (result.data?.url) {
        updateMutation.mutate({ ...formData, avatar: result.data.url })
      }
    },
    onError: () => {
      toast.error('Erreur lors de l\'upload de l\'image')
    },
  })

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      return api.reseller.resendVerificationEmail()
    },
    onSuccess: () => {
      toast.success('Email de verification envoye')
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi de l\'email')
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image trop volumineuse (max 5MB)')
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (avatarFile) {
      uploadMutation.mutate(avatarFile)
    } else {
      updateMutation.mutate(formData)
    }
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
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 font-bold text-xl">
                {formData.firstName[0]}{formData.lastName[0]}
              </span>
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors">
            <Camera size={14} className="text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Photo de profil</p>
          <p className="text-xs text-gray-500">JPG, PNG ou GIF. Max 5MB</p>
        </div>
      </div>

      {/* Email (readonly) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <IconInput
          icon={Mail}
          type="email"
          value={user.email}
          disabled
        />
        {!user.emailVerified && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 flex-1">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">Votre email n'est pas verifie</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => resendVerificationMutation.mutate()}
              disabled={resendVerificationMutation.isPending}
              className="border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              {resendVerificationMutation.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Send size={14} className="mr-2" />
              )}
              Renvoyer
            </Button>
          </div>
        )}
        <p className="text-xs text-gray-500">L'email ne peut pas etre modifie</p>
      </div>

      {/* Nom / Prenom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prenom
          </label>
          <IconInput
            icon={User}
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            placeholder="Jean"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom
          </label>
          <IconInput
            icon={User}
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Telephone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Telephone (optionnel)
        </label>
        <IconInput
          icon={Phone}
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+33 6 12 34 56 78"
        />
      </div>

      {/* Langue / Fuseau horaire */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Langue
          </label>
          <Select
            value={formData.language}
            onValueChange={(value) => setFormData({ ...formData, language: value })}
          >
            <SelectTrigger className="w-full h-[42px] bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-gray-100">
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value} className="rounded-lg">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fuseau horaire
          </label>
          <Select
            value={formData.timezone}
            onValueChange={(value) => setFormData({ ...formData, timezone: value })}
          >
            <SelectTrigger className="w-full h-[42px] bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-gray-100">
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value} className="rounded-lg">
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
          Enregistrer
        </Button>
      </div>

      {/* RGPD Export */}
      <div className="pt-6 border-t">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-medium text-gray-900">Exporter mes donnees</p>
            <p className="text-sm text-gray-500">Telechargez une copie de toutes vos donnees personnelles (RGPD)</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/reseller/settings/export-data`, '_blank')
            }}
          >
            <Download size={16} className="mr-2" />
            Exporter
          </Button>
        </div>
      </div>
    </form>
  )
}
