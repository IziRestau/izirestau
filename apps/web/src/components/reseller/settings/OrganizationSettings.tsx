'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Building2, Mail, Phone, Globe, MapPin, FileText, Loader2, Coins, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/shared/IconInput'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OrganizationSettingsProps {
  organization: {
    id: string
    name: string
    slug: string
    email: string
    phone: string | null
    website: string | null
    address: string | null
    city: string | null
    postalCode: string | null
    country: string
    businessName: string | null
    siret: string | null
    vatNumber: string | null
    currency?: string
  }
  canEdit: boolean
  onUpdate: () => void
}

const CURRENCIES = [
  { code: 'XOF', name: 'Franc CFA', symbol: 'FCFA' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dollar US', symbol: '$' },
]

const countries = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'SN', label: 'Senegal' },
  { value: 'CI', label: 'Cote d\'Ivoire' },
  { value: 'MA', label: 'Maroc' },
  { value: 'TN', label: 'Tunisie' },
]

export function OrganizationSettings({ organization, canEdit, onUpdate }: OrganizationSettingsProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: organization.name,
    email: organization.email,
    phone: organization.phone || '',
    website: organization.website || '',
    address: organization.address || '',
    city: organization.city || '',
    postalCode: organization.postalCode || '',
    country: organization.country,
    businessName: organization.businessName || '',
    siret: organization.siret || '',
    vatNumber: organization.vatNumber || '',
    currency: organization.currency || 'XOF',
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.reseller.updateOrganization(data)
    },
    onSuccess: () => {
      toast.success('Organisation mise a jour')
      queryClient.invalidateQueries({ queryKey: ['reseller-settings'] })
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'reseller-revenue' })
      queryClient.invalidateQueries({ queryKey: ['reseller-dashboard'] })
      onUpdate()
    },
    onError: () => {
      toast.error('Erreur lors de la mise a jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Organisation</h3>
          <p className="text-sm text-gray-500">Vous n'avez pas les droits pour modifier ces informations</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Nom</p>
            <p className="font-medium text-gray-900">{organization.name}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{organization.email}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Telephone</p>
            <p className="font-medium text-gray-900">{organization.phone || '-'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Site web</p>
            <p className="font-medium text-gray-900">{organization.website || '-'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Organisation</h3>
        <p className="text-sm text-gray-500">Informations de votre entreprise</p>
      </div>

      {/* Informations generales */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Building2 size={16} />
          Informations generales
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'organisation</label>
            <IconInput
              icon={Building2}
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Mon Organisation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Identifiant (slug)</label>
            <IconInput
              value={organization.slug}
              disabled
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <IconInput
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="contact@organisation.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telephone</label>
            <IconInput
              icon={Phone}
              type="tel"
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+33 1 23 45 67 89"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site web</label>
          <IconInput
            icon={Globe}
            type="url"
            value={formData.website}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://www.example.com"
          />
        </div>
      </div>

      {/* Adresse */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <MapPin size={16} />
          Adresse
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
          <IconInput
            icon={MapPin}
            value={formData.address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 rue Example"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
            <IconInput
              value={formData.postalCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="75001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
            <IconInput
              value={formData.city}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Paris"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
            <Select
              value={formData.country}
              onValueChange={(value) => setFormData({ ...formData, country: value })}
            >
              <SelectTrigger className="w-full h-[42px] bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-gray-100">
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="rounded-lg">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Informations legales */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FileText size={16} />
          Informations legales
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Raison sociale</label>
          <IconInput
            icon={Building2}
            value={formData.businessName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, businessName: e.target.value })}
            placeholder="Ma Societe SAS"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SIRET</label>
            <IconInput
              icon={FileText}
              value={formData.siret}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, siret: e.target.value })}
              placeholder="123 456 789 00012"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Numero TVA</label>
            <IconInput
              icon={FileText}
              value={formData.vatNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, vatNumber: e.target.value })}
              placeholder="FR12345678901"
            />
          </div>
        </div>
      </div>

      {/* Devise */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Coins size={16} />
          Devise
        </h4>
        <p className="text-sm text-gray-500">Devise pour le dashboard et les factures</p>
        <div className="flex gap-3">
          {CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              type="button"
              onClick={() => setFormData({ ...formData, currency: currency.code })}
              className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                formData.currency === currency.code
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg font-bold text-gray-900">{currency.symbol}</span>
                {formData.currency === currency.code && (
                  <Check size={16} className="text-emerald-500" />
                )}
              </div>
              <div className="text-xs text-gray-500">{currency.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
