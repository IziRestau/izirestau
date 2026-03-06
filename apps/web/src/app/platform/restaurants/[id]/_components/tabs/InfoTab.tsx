'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  Store,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit3,
  Building2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RestaurantDetails } from '../types'
import { businessTypeLabels } from '../types'
import { EditInfoModal } from '../modals/EditInfoModal'
import { EditContactModal } from '../modals/EditContactModal'
import { EditAddressModal } from '../modals/EditAddressModal'
import { EditLegalModal } from '../modals/EditLegalModal'

interface InfoTabProps {
  restaurant: RestaurantDetails
}

export function InfoTab({ restaurant }: InfoTabProps) {
  const [editModal, setEditModal] = useState<'info' | 'contact' | 'address' | 'legal' | null>(null)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Informations generales</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditModal('info')} className="gap-2">
            <Edit3 size={14} />
            Modifier
          </Button>
        </div>
        <div className="p-4 space-y-4">
          {restaurant.coverImage && (
            <div className="aspect-[3/1] rounded-xl overflow-hidden bg-gray-100">
              <img src={restaurant.coverImage} alt="Cover" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {restaurant.logo ? (
                <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <Store size={32} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{restaurant.name}</h2>
              <p className="text-sm text-gray-500 mb-2">
                {businessTypeLabels[restaurant.businessType] || restaurant.businessType}
              </p>
              {restaurant.cuisineTypes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {restaurant.cuisineTypes.map((type, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {restaurant.shortDescription && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Description courte</p>
              <p className="text-sm text-gray-900">{restaurant.shortDescription}</p>
            </div>
          )}

          {restaurant.description && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Description complete</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{restaurant.description}</p>
            </div>
          )}

          {restaurant.images && restaurant.images.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Galerie ({restaurant.images.length} images)</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {restaurant.images.slice(0, 6).map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Contact</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditModal('contact')} className="gap-2">
            <Edit3 size={14} />
            Modifier
          </Button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{restaurant.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Telephone</p>
              <p className="text-sm text-gray-900">{restaurant.phone}</p>
            </div>
          </div>
          {restaurant.website && (
            <div className="flex items-center gap-3 sm:col-span-2">
              <Globe size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Site web</p>
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-600 hover:underline"
                >
                  {restaurant.website}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Adresse</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditModal('address')} className="gap-2">
            <Edit3 size={14} />
            Modifier
          </Button>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-900">
                {restaurant.address}
                {restaurant.addressLine2 && <><br />{restaurant.addressLine2}</>}
              </p>
              <p className="text-sm text-gray-900">
                {restaurant.postalCode} {restaurant.city}
              </p>
              <p className="text-sm text-gray-500">{restaurant.country}</p>
              {(restaurant.latitude && restaurant.longitude) && (
                <p className="text-xs text-gray-400 mt-2">
                  GPS: {restaurant.latitude.toFixed(6)}, {restaurant.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Informations legales</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditModal('legal')} className="gap-2">
            <Edit3 size={14} />
            Modifier
          </Button>
        </div>
        <div className="p-4">
          {restaurant.businessName || restaurant.siret || restaurant.vatNumber ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {restaurant.businessName && (
                <div>
                  <p className="text-xs text-gray-500">Raison sociale</p>
                  <p className="text-sm text-gray-900">{restaurant.businessName}</p>
                </div>
              )}
              {restaurant.siret && (
                <div>
                  <p className="text-xs text-gray-500">SIRET</p>
                  <p className="text-sm text-gray-900">{restaurant.siret}</p>
                </div>
              )}
              {restaurant.vatNumber && (
                <div>
                  <p className="text-xs text-gray-500">N° TVA</p>
                  <p className="text-sm text-gray-900">{restaurant.vatNumber}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune information legale renseignee</p>
          )}
        </div>
      </div>

      <EditInfoModal
        isOpen={editModal === 'info'}
        onClose={() => setEditModal(null)}
        restaurant={restaurant}
      />

      <EditContactModal
        isOpen={editModal === 'contact'}
        onClose={() => setEditModal(null)}
        restaurant={restaurant}
      />

      <EditAddressModal
        isOpen={editModal === 'address'}
        onClose={() => setEditModal(null)}
        restaurant={restaurant}
      />

      <EditLegalModal
        isOpen={editModal === 'legal'}
        onClose={() => setEditModal(null)}
        restaurant={restaurant}
      />
    </div>
  )
}
