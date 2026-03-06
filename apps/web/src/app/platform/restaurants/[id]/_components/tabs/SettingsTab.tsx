'use client'

import { useState } from 'react'
import {
  Clock,
  CreditCard,
  Settings,
  Globe,
  Edit3,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RestaurantDetails } from '../types'
import { dayLabels } from '../types'
import { EditSettingsModal } from '../modals/EditSettingsModal'

interface SettingsTabProps {
  restaurant: RestaurantDetails
}

export function SettingsTab({ restaurant }: SettingsTabProps) {
  const [editModal, setEditModal] = useState<'general' | 'payment' | null>(null)

  const settings = restaurant.settings

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Horaires d'ouverture</h3>
        </div>
        <div className="p-4">
          {restaurant.openingHours.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucun horaire configure</p>
          ) : (
            <div className="space-y-2">
              {restaurant.openingHours.map((day) => (
                <div key={day.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-medium text-gray-700 w-28">
                    {dayLabels[day.dayOfWeek]}
                  </span>
                  {day.isOpen ? (
                    <div className="flex flex-wrap gap-2">
                      {day.slots.map((slot, i) => (
                        <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-sm">
                          {slot.openTime} - {slot.closeTime}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm">Ferme</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {restaurant.specialHours && restaurant.specialHours.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-900">Horaires speciaux</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {restaurant.specialHours.map((special) => (
                <div key={special.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(special.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    {special.reason && (
                      <p className="text-xs text-gray-500">{special.reason}</p>
                    )}
                  </div>
                  {special.isClosed ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">Ferme</span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-sm">
                      {special.openTime} - {special.closeTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Configuration generale</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditModal('general')} className="gap-2">
            <Edit3 size={14} />
            Modifier
          </Button>
        </div>
        <div className="p-4">
          {settings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Devise</p>
                <p className="text-sm font-medium text-gray-900">{settings.currency}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Langue</p>
                <p className="text-sm font-medium text-gray-900">{settings.language}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Fuseau horaire</p>
                <p className="text-sm font-medium text-gray-900">{settings.timezone}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Prefixe commande</p>
                <p className="text-sm font-medium text-gray-900">{settings.orderPrefix}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Temps de preparation</p>
                <p className="text-sm font-medium text-gray-900">{settings.avgPrepTime} min</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Auto-acceptation</p>
                <div className="flex items-center gap-2">
                  {settings.autoAcceptOrders ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {settings.autoAcceptOrders ? 'Active' : 'Desactive'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Aucune configuration</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Paiements</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditModal('payment')} className="gap-2">
            <Edit3 size={14} />
            Modifier
          </Button>
        </div>
        <div className="p-4">
          {settings ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Moyens de paiement acceptes</p>
                <div className="flex flex-wrap gap-2">
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border',
                    settings.acceptCash ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                  )}>
                    {settings.acceptCash ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span className="text-sm font-medium">Especes</span>
                  </div>
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border',
                    settings.acceptCard ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                  )}>
                    {settings.acceptCard ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span className="text-sm font-medium">Carte</span>
                  </div>
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border',
                    settings.acceptOnlinePayment ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                  )}>
                    {settings.acceptOnlinePayment ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span className="text-sm font-medium">En ligne</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Pourboires</p>
                <div className="flex items-center gap-2">
                  {settings.tipsEnabled ? (
                    <>
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm text-gray-900">Active</span>
                      {settings.suggestedTips && settings.suggestedTips.length > 0 && (
                        <span className="text-sm text-gray-500">
                          (Suggestions: {settings.suggestedTips.join('%, ')}%)
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500">Desactive</span>
                    </>
                  )}
                </div>
              </div>

              {(settings.stripeAccountId || settings.monerooConfigured) && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Passerelles de paiement</p>
                  <div className="flex flex-wrap gap-2">
                    {settings.stripeAccountId && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                        <CreditCard size={16} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Stripe</span>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-xs',
                          settings.stripeAccountStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        )}>
                          {settings.stripeAccountStatus || 'pending'}
                        </span>
                      </div>
                    )}
                    {settings.monerooConfigured && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <CreditCard size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Moneroo</span>
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">active</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Aucune configuration</p>
          )}
        </div>
      </div>

      {settings && (settings.metaTitle || settings.metaDescription) && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-900">SEO</h3>
          </div>
          <div className="p-4 space-y-3">
            {settings.metaTitle && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Meta Title</p>
                <p className="text-sm text-gray-900">{settings.metaTitle}</p>
              </div>
            )}
            {settings.metaDescription && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Meta Description</p>
                <p className="text-sm text-gray-600">{settings.metaDescription}</p>
              </div>
            )}
            {settings.metaKeywords && settings.metaKeywords.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {settings.metaKeywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <EditSettingsModal
        isOpen={editModal === 'general'}
        onClose={() => setEditModal(null)}
        restaurant={restaurant}
        type="general"
      />

      <EditSettingsModal
        isOpen={editModal === 'payment'}
        onClose={() => setEditModal(null)}
        restaurant={restaurant}
        type="payment"
      />
    </div>
  )
}
