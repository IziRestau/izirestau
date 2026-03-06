'use client'

import { useState } from 'react'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit3,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ResellerDetails } from '../types'
import { EditInfoModal } from '../modals/EditInfoModal'
import { EditContactModal } from '../modals/EditContactModal'
import { EditAddressModal } from '../modals/EditAddressModal'
import { EditLegalModal } from '../modals/EditLegalModal'

interface InfoTabProps {
  reseller: ResellerDetails
}

export function InfoTab({ reseller }: InfoTabProps) {
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
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {reseller.logo ? (
                <img src={reseller.logo} alt={reseller.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={28} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{reseller.name}</h2>
              <p className="text-sm text-gray-500">{reseller.slug}</p>
            </div>
          </div>
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
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Mail size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{reseller.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Phone size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Telephone</p>
              <p className="text-sm text-gray-900">{reseller.phone || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Globe size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Site web</p>
              <p className="text-sm text-gray-900">{reseller.website || '-'}</p>
            </div>
          </div>
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
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-gray-500" />
            </div>
            <div>
              {reseller.address ? (
                <>
                  <p className="text-sm text-gray-900">{reseller.address}</p>
                  <p className="text-sm text-gray-600">
                    {reseller.postalCode} {reseller.city}
                  </p>
                  <p className="text-sm text-gray-600">{reseller.country}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Aucune adresse renseignee</p>
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
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Raison sociale</p>
              <p className="text-sm text-gray-900">{reseller.businessName || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">SIRET</p>
              <p className="text-sm text-gray-900">{reseller.siret || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">N TVA</p>
              <p className="text-sm text-gray-900">{reseller.vatNumber || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <EditInfoModal
        isOpen={editModal === 'info'}
        onClose={() => setEditModal(null)}
        reseller={reseller}
      />
      <EditContactModal
        isOpen={editModal === 'contact'}
        onClose={() => setEditModal(null)}
        reseller={reseller}
      />
      <EditAddressModal
        isOpen={editModal === 'address'}
        onClose={() => setEditModal(null)}
        reseller={reseller}
      />
      <EditLegalModal
        isOpen={editModal === 'legal'}
        onClose={() => setEditModal(null)}
        reseller={reseller}
      />
    </div>
  )
}
