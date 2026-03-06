'use client'

import { useState } from 'react'
import {
  Palette,
  Globe,
  CreditCard,
  CheckCircle,
  XCircle,
  Edit3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ResellerDetails } from '../types'
import { EditBrandingModal } from '../modals/EditBrandingModal'

interface SettingsTabProps {
  reseller: ResellerDetails
}

export function SettingsTab({ reseller }: SettingsTabProps) {
  const [editBranding, setEditBranding] = useState(false)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Palette size={18} className="text-gray-500" />
            Branding
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setEditBranding(true)} className="gap-2">
            <Edit3 size={14} />
            Modifier
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Couleur primaire</span>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-gray-200"
                style={{ backgroundColor: reseller.primaryColor }}
              />
              <span className="text-sm font-mono text-gray-900">{reseller.primaryColor}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Logo</span>
            <span className="text-sm text-gray-900">
              {reseller.logo ? 'Configure' : 'Non configure'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Globe size={18} className="text-gray-500" />
            Domaine personnalise
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Domaine</span>
            <span className="text-sm text-gray-900">
              {reseller.customDomain || 'Non configure'}
            </span>
          </div>
          {reseller.customDomain && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Verification</span>
              <div className="flex items-center gap-2">
                {reseller.domainVerified ? (
                  <>
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm text-green-600">Verifie</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-red-500" />
                    <span className="text-sm text-red-600">Non verifie</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <CreditCard size={18} className="text-gray-500" />
            Configuration
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Devise</span>
            <span className="text-sm font-medium text-gray-900">{reseller.currency}</span>
          </div>
        </div>
      </div>

      <EditBrandingModal
        isOpen={editBranding}
        onClose={() => setEditBranding(false)}
        resellerId={reseller.id}
        resellerName={reseller.name}
        currentColor={reseller.primaryColor}
      />
    </div>
  )
}
