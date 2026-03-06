'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, MediaItem } from '@/lib/api-client'
import { toast } from 'sonner'
import { Store, Mail, Phone, Globe, MapPin, Building2, FileText, Camera, Loader2, FolderOpen } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { IconInput } from '@/components/shared/IconInput'
import { MediaSelectorModal } from '@/components/shared/MediaSelectorModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RestaurantInfoSettingsProps {
  restaurant: {
    id: string
    name: string
    description: string | null
    shortDescription: string | null
    email: string
    phone: string
    website: string | null
    address: string
    addressLine2: string | null
    city: string
    postalCode: string
    country: string
    latitude: number | null
    longitude: number | null
    businessName: string | null
    siret: string | null
    vatNumber: string | null
    businessType: string
    cuisineTypes: string[]
    logo: string | null
    coverImage: string | null
  }
  onUpdate: () => void
  primaryColor?: string
}

const businessTypes = [
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'FAST_FOOD', label: 'Fast Food' },
  { value: 'CAFE', label: 'Cafe' },
  { value: 'BAKERY', label: 'Boulangerie' },
  { value: 'PIZZERIA', label: 'Pizzeria' },
  { value: 'FOOD_TRUCK', label: 'Food Truck' },
  { value: 'OTHER', label: 'Autre' },
]

const cuisineOptions = [
  'Francaise', 'Italienne', 'Japonaise', 'Chinoise', 'Indienne', 
  'Mexicaine', 'Americaine', 'Africaine', 'Libanaise', 'Thai',
  'Vegetarienne', 'Vegan', 'Halal', 'Casher', 'Bio'
]

export function RestaurantInfoSettings({ restaurant, onUpdate, primaryColor = '#10b981' }: RestaurantInfoSettingsProps) {
  const [formData, setFormData] = useState({
    name: restaurant.name,
    description: restaurant.description || '',
    shortDescription: restaurant.shortDescription || '',
    email: restaurant.email,
    phone: restaurant.phone,
    website: restaurant.website || '',
    address: restaurant.address,
    addressLine2: restaurant.addressLine2 || '',
    city: restaurant.city,
    postalCode: restaurant.postalCode,
    country: restaurant.country,
    businessName: restaurant.businessName || '',
    siret: restaurant.siret || '',
    vatNumber: restaurant.vatNumber || '',
    businessType: restaurant.businessType,
    cuisineTypes: restaurant.cuisineTypes,
    logo: restaurant.logo || '',
  })

  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant.logo)
  const [showMediaSelector, setShowMediaSelector] = useState(false)

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.restaurant.updateRestaurantInfo({ ...data, restaurantId: restaurant.id })
    },
    onSuccess: () => {
      toast.success('Informations mises à jour')
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      return api.media.upload(file, 'logos', restaurant.id)
    },
    onSuccess: (result) => {
      const url = result.data?.url
      if (url) {
        setLogoPreview(url)
        setFormData(prev => ({ ...prev, logo: url }))
        toast.success('Logo mis à jour')
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
      setLogoPreview(URL.createObjectURL(file))
      uploadLogoMutation.mutate(file)
    }
  }

  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    const item = Array.isArray(media) ? media[0] : media
    if (item) {
      setLogoPreview(item.url)
      setFormData(prev => ({ ...prev, logo: item.url }))
    }
  }


  const toggleCuisineType = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const isLoading = updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Informations du restaurant</h3>
        <p className="text-sm text-gray-500">Modifiez les informations de votre etablissement</p>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Logo"
              className="w-20 h-20 rounded-2xl object-contain bg-gray-50 border border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Store size={32} className="text-gray-400" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex gap-1">
            <label className="w-7 h-7 bg-white rounded-full border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              {uploadLogoMutation.isPending ? (
                <Loader2 size={12} className="text-gray-500 animate-spin" />
              ) : (
                <Camera size={12} className="text-gray-500" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                disabled={uploadLogoMutation.isPending}
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
          <p className="text-sm font-medium text-gray-900">Logo du restaurant</p>
          <p className="text-xs text-gray-500">JPG, PNG ou GIF. Max 5MB.</p>
        </div>
      </div>

      <MediaSelectorModal
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleMediaSelect}
        multiple={false}
        folder="logos"
        primaryColor={primaryColor}
        title="Sélectionner un logo"
        restaurantId={restaurant.id}
      />

      {/* General Info */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Informations generales</h4>
        
        <div className="space-y-2">
          <Label htmlFor="name">Nom du restaurant</Label>
          <IconInput
            id="name"
            icon={Store}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nom de votre restaurant"
            required
            focusColor={primaryColor}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Description courte</Label>
          <Input
            id="shortDescription"
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            placeholder="Une phrase pour decrire votre restaurant"
            className="h-11 rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
            maxLength={150}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description complete</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Decrivez votre restaurant en detail..."
            className="min-h-[100px] rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type d'etablissement</Label>
            <Select
              value={formData.businessType}
              onValueChange={(value) => setFormData({ ...formData, businessType: value })}
            >
              <SelectTrigger className="h-11 rounded-xl focus:ring-2" style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent accentColor={primaryColor}>
                {businessTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Types de cuisine</Label>
          <div className="flex flex-wrap gap-2">
            {cuisineOptions.map((cuisine) => (
              <button
                key={cuisine}
                type="button"
                onClick={() => toggleCuisineType(cuisine)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  formData.cuisineTypes.includes(cuisine)
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={formData.cuisineTypes.includes(cuisine) ? { backgroundColor: primaryColor } : undefined}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Contact</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <IconInput
              id="email"
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@restaurant.com"
              required
              focusColor={primaryColor}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telephone</Label>
            <IconInput
              id="phone"
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+33 1 23 45 67 89"
              required
              focusColor={primaryColor}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Site web</Label>
          <IconInput
            id="website"
            icon={Globe}
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://www.monrestaurant.com"
            focusColor={primaryColor}
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Adresse</h4>
        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <IconInput
            id="address"
            icon={MapPin}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 rue de la Paix"
            required
            focusColor={primaryColor}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressLine2">Complement d'adresse</Label>
          <Input
            id="addressLine2"
            value={formData.addressLine2}
            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            placeholder="Batiment, etage..."
            className="h-11 rounded-xl focus:ring-2"
            style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="75001"
              className="h-11 rounded-xl focus:ring-2"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Paris"
              className="h-11 rounded-xl focus:ring-2"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              required
            />
          </div>
          <div className="space-y-2 col-span-2 sm:col-span-1">
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="France"
              className="h-11 rounded-xl focus:ring-2"
              style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
              required
            />
          </div>
        </div>
      </div>

      {/* Legal Info */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Informations legales</h4>
        <div className="space-y-2">
          <Label htmlFor="businessName">Raison sociale</Label>
          <IconInput
            id="businessName"
            icon={Building2}
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            placeholder="SARL Mon Restaurant"
            focusColor={primaryColor}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="siret">SIRET</Label>
            <IconInput
              id="siret"
              icon={FileText}
              value={formData.siret}
              onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
              placeholder="123 456 789 00012"
              focusColor={primaryColor}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vatNumber">Numero TVA</Label>
            <IconInput
              id="vatNumber"
              icon={FileText}
              value={formData.vatNumber}
              onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
              placeholder="FR12345678901"
              focusColor={primaryColor}
            />
          </div>
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
