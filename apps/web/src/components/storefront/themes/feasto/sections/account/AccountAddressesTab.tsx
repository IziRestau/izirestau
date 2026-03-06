'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MapPin, Trash2, Edit2, Loader2, Star, X, Home, Building2 } from 'lucide-react'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'
import type { StoreThemeData } from '../../../_types'

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
  subdomain: string
}

export function AccountAddressesTab({
  theme,
  subdomain,
}: AccountAddressesTabProps) {
  const { accessToken, customer } = useStorefrontAuthStore()
  const queryClient = useQueryClient()
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
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

  const createMutation = useMutation({
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

  const resetForm = () => {
    setIsAddingAddress(false)
    setEditingAddress(null)
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
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      label: address.label || '',
      street: address.street,
      streetLine2: address.streetLine2 || '',
      city: address.city,
      postalCode: address.postalCode || '',
      country: address.country || 'FR',
      instructions: address.instructions || '',
      isDefault: address.isDefault,
    })
    setIsAddingAddress(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin" style={{ color: theme.primaryColor }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add/Edit Form */}
      {isAddingAddress && (
        <div 
          className={`p-6 ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}04`, border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-lg font-semibold"
              style={{ color: theme.textColor }}
            >
              {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: theme.textColor }}
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                Nom de l'adresse
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ex: Maison, Bureau..."
                required
                className={`w-full px-4 py-3 border-2 focus:outline-none ${btnClass}`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                Adresse
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                required
                className={`w-full px-4 py-3 border-2 focus:outline-none ${btnClass}`}
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className={`w-full px-4 py-3 border-2 focus:outline-none ${btnClass}`}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                  Code postal
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className={`w-full px-4 py-3 border-2 focus:outline-none ${btnClass}`}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
                Instructions de livraison
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={2}
                placeholder="Ex: Sonner 2 fois, code porte 1234..."
                className={`w-full px-4 py-3 border-2 focus:outline-none resize-none ${btnClass}`}
                style={inputStyle}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm" style={{ color: theme.textColor }}>
                Définir comme adresse par défaut
              </span>
            </label>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className={`w-full py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 ${btnClass}`}
              style={{ backgroundColor: theme.primaryColor }}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 size={18} className="animate-spin mx-auto" />
              ) : (
                editingAddress ? 'Enregistrer' : 'Ajouter'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Add button */}
      {!isAddingAddress && (
        <button
          onClick={() => setIsAddingAddress(true)}
          className={`w-full p-4 flex items-center justify-center gap-2 border-2 border-dashed transition-all hover:opacity-80 ${btnClass}`}
          style={{ 
            borderColor: `${theme.primaryColor}40`,
            color: theme.primaryColor 
          }}
        >
          <Plus size={20} />
          Ajouter une adresse
        </button>
      )}

      {/* Addresses list */}
      {addresses.length === 0 && !isAddingAddress ? (
        <div className="text-center py-8">
          <MapPin size={32} className="mx-auto mb-3 opacity-30" style={{ color: theme.textColor }} />
          <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
            Aucune adresse enregistrée
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address: Address) => (
            <div
              key={address.id}
              className={`p-4 flex items-start justify-between ${btnClass}`}
              style={{ 
                backgroundColor: `${theme.textColor}04`,
                border: address.isDefault ? `2px solid ${theme.primaryColor}` : '1px solid rgba(255,255,255,0.12)'
              }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.primaryColor}15` }}
                >
                  <MapPin size={18} style={{ color: theme.primaryColor }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: theme.textColor }}>
                      {address.label}
                    </span>
                    {address.isDefault && (
                      <span 
                        className={`px-2 py-0.5 text-xs font-medium ${btnClass}`}
                        style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
                      >
                        Par défaut
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
                    {address.street}
                  </p>
                  <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
                    {address.postalCode && `${address.postalCode} `}{address.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(address)}
                  className="p-2 opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: theme.textColor }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(address.id)}
                  disabled={deleteMutation.isPending}
                  className="p-2 opacity-40 hover:opacity-100 transition-opacity text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
