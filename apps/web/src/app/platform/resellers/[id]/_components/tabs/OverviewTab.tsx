'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Store,
  Users,
  CreditCard,
  Calendar,
  Clock,
  Activity,
  Mail,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import type { ResellerDetails, AuditLog } from '../types'
import { auditActionLabels, siteStatusColors, siteStatusLabels, roleLabels } from '../types'
import { cn } from '@/lib/utils'

interface OverviewTabProps {
  reseller: ResellerDetails
}

export function OverviewTab({ reseller }: OverviewTabProps) {
  const { accessToken } = useAuthStore()

  const { data: activityData } = useQuery({
    queryKey: ['platform-reseller-activity', reseller.id, 'recent'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get(`/platform/resellers/${reseller.id}/activity?limit=5`)
      return res.data as AuditLog[]
    },
    enabled: !!accessToken,
  })

  const license = reseller.license
  const plan = license?.plan
  const recentSites = reseller.sites?.slice(0, 3) || []
  const recentMembers = reseller.members?.slice(0, 3) || []
  const usagePercent = plan ? Math.round((license?.sitesUsed || 0) / plan.maxSites * 100) : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: reseller.currency || 'EUR',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Main Grid - Row 1: Stats + License */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Stats Card with Donut */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Statistiques</h3>
              <p className="text-sm text-gray-400 mt-1">Vue d'ensemble du revendeur</p>
            </div>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              reseller.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
              reseller.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              reseller.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            )}>
              {reseller.status === 'ACTIVE' ? 'Actif' : reseller.status === 'PENDING' ? 'En attente' : reseller.status === 'SUSPENDED' ? 'Suspendu' : reseller.status}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Donut Chart - Sites Usage */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#f3f4f6" 
                  strokeWidth="12" 
                />
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke={usagePercent >= 90 ? '#ef4444' : usagePercent >= 70 ? '#f59e0b' : '#10b981'}
                  strokeWidth="12" 
                  strokeDasharray={`${usagePercent * 2.51} 251`}
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{usagePercent}%</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 text-center sm:text-left">
              <div className="text-3xl font-bold text-gray-900">
                {license?.sitesUsed || 0} / {plan?.maxSites || 0}
              </div>
              <div className="text-sm text-gray-500 mb-3">sites utilises</div>
              <p className="text-sm text-gray-400">
                {plan ? `${plan.maxSites - (license?.sitesUsed || 0)} sites disponibles` : 'Aucune licence'}
              </p>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{reseller._count.sites}</div>
              <div className="text-xs text-gray-500">Sites</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{reseller._count.clients}</div>
              <div className="text-xs text-gray-500">Clients</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{reseller._count.members}</div>
              <div className="text-xs text-gray-500">Membres</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{reseller._count.clientInvoices}</div>
              <div className="text-xs text-gray-500">Factures</div>
            </div>
          </div>
        </div>

        {/* License Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Licence</h3>
          
          {license && plan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Plan actuel</span>
                <span className="font-semibold text-gray-900">{plan.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  license.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                  license.status === 'TRIALING' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {license.status === 'ACTIVE' ? 'Active' : license.status === 'TRIALING' ? 'Essai' : license.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Cycle</span>
                <span className="text-sm text-gray-900">
                  {license.billingCycle === 'YEARLY' ? 'Annuel' : 'Mensuel'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Montant</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(Number(license.billingCycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly))}
                  <span className="text-sm font-normal text-gray-500">/{license.billingCycle === 'YEARLY' ? 'an' : 'mois'}</span>
                </span>
              </div>
              
              {license.currentPeriodEnd && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar size={14} />
                    Prochain renouvellement
                  </div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(license.currentPeriodEnd), 'dd MMMM yyyy', { locale: fr })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Aucune licence</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid - Row 2: Contact + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Contact Info */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Informations de contact</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mail size={14} className="text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${reseller.email}`} className="text-sm font-medium text-gray-900 hover:text-emerald-600 truncate block">
                    {reseller.email}
                  </a>
                </div>
              </div>
              
              {reseller.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Phone size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telephone</p>
                    <a href={`tel:${reseller.phone}`} className="text-sm font-medium text-gray-900 hover:text-emerald-600">
                      {reseller.phone}
                    </a>
                  </div>
                </div>
              )}
              
              {reseller.website && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Globe size={14} className="text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Site web</p>
                    <a href={reseller.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-emerald-600 truncate flex items-center gap-1">
                      {reseller.website.replace(/^https?:\/\//, '')}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {(reseller.address || reseller.city) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Adresse</p>
                    <p className="text-sm font-medium text-gray-900">
                      {[reseller.address, reseller.postalCode, reseller.city].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              
              {reseller.businessName && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Store size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Raison sociale</p>
                    <p className="text-sm font-medium text-gray-900">{reseller.businessName}</p>
                    {reseller.siret && <p className="text-xs text-gray-500">SIRET: {reseller.siret}</p>}
                  </div>
                </div>
              )}
              
              {reseller.customDomain && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Globe size={14} className="text-gray-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Domaine personnalise</p>
                      <p className="text-sm font-medium text-gray-900">{reseller.customDomain}</p>
                    </div>
                    {reseller.domainVerified ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <AlertCircle size={14} className="text-amber-500" />
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Membre depuis</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(reseller.createdAt), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Activite recente</h3>
          
          {activityData && activityData.length > 0 ? (
            <div className="space-y-3">
              {activityData.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock size={12} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {auditActionLabels[activity.action] || activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Activity size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Aucune activite</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid - Row 3: Sites + Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Recent Sites */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Store size={18} className="text-gray-500" />
              Sites recents
            </h3>
            <span className="text-xs text-gray-400">{reseller._count.sites} au total</span>
          </div>
          <div className="divide-y divide-gray-100">
            {recentSites.length > 0 ? (
              recentSites.map((site) => (
                <div key={site.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {site.restaurant?.logo ? (
                        <img src={site.restaurant.logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Store size={18} className="text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {site.restaurant?.name || site.subdomain}
                      </p>
                      <p className="text-xs text-gray-500">{site.subdomain}.iziresto.com</p>
                    </div>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0', siteStatusColors[site.status] || 'bg-gray-100 text-gray-600')}>
                    {siteStatusLabels[site.status] || site.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Store size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Aucun site</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-gray-500" />
              Equipe
            </h3>
            <span className="text-xs text-gray-400">{reseller._count.members} membre(s)</span>
          </div>
          <div className="divide-y divide-gray-100">
            {recentMembers.length > 0 ? (
              recentMembers.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.user.avatar ? (
                        <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {member.user.firstName[0]}{member.user.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex-shrink-0">
                    {roleLabels[member.role] || member.role}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Users size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Aucun membre</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
