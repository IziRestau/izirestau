'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus, Edit2, Trash2, Check, Loader2, Home, Building2 } from 'lucide-react'
import type { StoreThemeData, StoreSettingsData } from '../../../_types'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'

interface Address {
  id: string
  label: string | null
  street: string
  streetLine2: string | null
  city: string
  postalCode: string
  country: string
  instructions: string | null
  isDefault: boolean
}

interface AccountAddressesTabProps {
  theme: StoreThemeData
  settings: StoreSettingsData
  subdomain: string
  maxAddresses?: number
}

export function AccountAddressesTab({ 
  theme, 
  settings, 
  subdomain,
  maxAddresses = 5,
}: AccountAddressesTabProps) {
  const { accessToken, customer } = useStorefrontAuthStore()
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    label: '',
    street: '',
    streetLine2: '',
    city: '',
    postalCode: '',
    country: 'FR',
    instructions: '',
    isDefault: false,
  })

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['customer-addresses', subdomain, customer?.id],
    queryFn: async () => {
      if (!accessToken) return []
      const response = await fetch(`${API_URL}/store/${subdomain}/account/addresses`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      const data = await response.json()
      return data.success ? data.data : []
    },
    enabled: !!accessToken && !!customer?.id,
  })

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`${API_URL}/store/${subdomain}/account/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      })
      return response.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
        resetForm()
      } else {
        setError(data.message || 'Erreur lors de l\'ajout')
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await fetch(`${API_URL}/store/${subdomain}/account/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      })
      return response.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
        resetForm()
      } else {
        setError(data.message || 'Erreur lors de la modification')
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/store/${subdomain}/account/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
    },
  })

  const resetForm = () => {
    setFormData({
      label: '',
      street: '',
      streetLine2: '',
      city: '',
      postalCode: '',
      country: 'FR',
      instructions: '',
      isDefault: false,
    })
    setIsAdding(false)
    setEditingId(null)
    setError('')
  }

  const startEdit = (address: Address) => {
    setFormData({
      label: address.label || '',
      street: address.street,
      streetLine2: address.streetLine2 || '',
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      instructions: address.instructions || '',
      isDefault: address.isDefault,
    })
    setEditingId(address.id)
    setIsAdding(false)
  }

  const handleSubmit = () => {
    if (!formData.street || !formData.city || !formData.postalCode) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      addMutation.mutate(formData)
    }
  }

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const inputStyle = {
    borderColor: `${theme.textColor}15`,
    color: theme.textColor,
    backgroundColor: theme.backgroundColor,
  } as React.CSSProperties

  const isSaving = addMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.primaryColor }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {(isAdding || editingId) && (
        <div 
          className="rounded-2xl border p-6"
          style={{ borderColor: `${theme.textColor}10` }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            {editingId ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                Nom de l'adresse (optionnel)
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ex: Maison, Bureau..."
                className={`w-full px-4 py-3 border text-sm ${btnClass}`}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                Adresse *
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Numéro et nom de rue"
                className={`w-full px-4 py-3 border text-sm ${btnClass}`}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                Complément d'adresse
              </label>
              <input
                type="text"
                value={formData.streetLine2}
                onChange={(e) => setFormData({ ...formData, streetLine2: e.target.value })}
                placeholder="Appartement, étage, bâtiment..."
                className={`w-full px-4 py-3 border text-sm ${btnClass}`}
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                  Code postal *
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className={`w-full px-4 py-3 border text-sm ${btnClass}`}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                  Ville *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full px-4 py-3 border text-sm ${btnClass}`}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                Instructions de livraison
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Code d'entrée, sonnette..."
                rows={2}
                className={`w-full px-4 py-3 border text-sm resize-none ${btnClass}`}
                style={inputStyle}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ color: theme.textColor }}>
                Définir comme adresse par défaut
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 ${btnClass}`}
                style={{ backgroundColor: theme.primaryColor }}
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button
                onClick={resetForm}
                className={`px-5 py-2.5 text-sm font-medium border transition-colors hover:opacity-80 ${btnClass}`}
                style={{ borderColor: `${theme.textColor}20`, color: theme.textColor }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {!isAdding && !editingId && (
        <button
          onClick={() => setIsAdding(true)}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-2 border-dashed w-full justify-center transition-colors hover:border-opacity-50 ${btnClass}`}
          style={{ borderColor: `${theme.primaryColor}40`, color: theme.primaryColor }}
        >
          <Plus size={18} />
          Ajouter une adresse
        </button>
      )}

      {addresses.length === 0 && !isAdding ? (
        <div 
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: `${theme.textColor}10` }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${theme.primaryColor}15` }}
          >
            <MapPin size={28} style={{ color: theme.primaryColor }} />
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            Aucune adresse enregistrée
          </h3>
          <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
            Ajoutez une adresse pour faciliter vos prochaines commandes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address: Address) => (
            <div
              key={address.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-colors ${editingId === address.id ? 'opacity-50' : ''}`}
              style={{ borderColor: address.isDefault ? theme.primaryColor : `${theme.textColor}10` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${theme.primaryColor}15` }}
                  >
                    {address.label?.toLowerCase().includes('bureau') || address.label?.toLowerCase().includes('travail') ? (
                      <Building2 size={18} style={{ color: theme.primaryColor }} />
                    ) : (
                      <Home size={18} style={{ color: theme.primaryColor }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium" style={{ color: theme.textColor }}>
                        {address.label || 'Adresse'}
                      </p>
                      {address.isDefault && (
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
                        >
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-70 mt-1" style={{ color: theme.textColor }}>
                      {address.street}
                      {address.streetLine2 && `, ${address.streetLine2}`}
                    </p>
                    <p className="text-sm opacity-70" style={{ color: theme.textColor }}>
                      {address.postalCode} {address.city}
                    </p>
                    {address.instructions && (
                      <p className="text-xs opacity-50 mt-1" style={{ color: theme.textColor }}>
                        {address.instructions}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(address)}
                    className="p-2 rounded-lg transition-colors hover:bg-black/5"
                    title="Modifier"
                  >
                    <Edit2 size={16} style={{ color: theme.textColor }} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer cette adresse ?')) {
                        deleteMutation.mutate(address.id)
                      }
                    }}
                    className="p-2 rounded-lg transition-colors hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
