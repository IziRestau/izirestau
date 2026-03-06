'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  History,
  User,
  Plus,
  Pencil,
  Play,
  Pause,
  XCircle,
  Mail,
  CheckCircle,
  CreditCard,
  Globe,
  Trash2,
  UserPlus,
  UserMinus,
} from 'lucide-react'
import type { ResellerDetails, AuditLog } from '../types'
import { auditActionLabels, auditActionColors } from '../types'

interface ActivityTabProps {
  reseller: ResellerDetails
}

const actionIcons: Record<string, React.ElementType> = {
  CREATED: Plus,
  UPDATED: Pencil,
  ACTIVATED: Play,
  SUSPENDED: Pause,
  CANCELLED: XCircle,
  INVITE_RESENT: Mail,
  INVITE_ACCEPTED: CheckCircle,
  LICENSE_CHANGED: CreditCard,
  SITE_CREATED: Globe,
  SITE_DELETED: Trash2,
  MEMBER_ADDED: UserPlus,
  MEMBER_REMOVED: UserMinus,
}

export function ActivityTab({ reseller }: ActivityTabProps) {
  const { accessToken } = useAuthStore()

  const { data: activities, isLoading } = useQuery({
    queryKey: ['platform-reseller-activity', reseller.id],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get(`/platform/resellers/${reseller.id}/activity`)
      return res.data as AuditLog[]
    },
    enabled: !!accessToken,
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <History size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune activite</h3>
        <p className="text-gray-500">Aucune action enregistree pour ce revendeur.</p>
      </div>
    )
  }

  const getActionIcon = (action: string) => {
    return actionIcons[action] || History
  }

  const getActionColors = (action: string) => {
    return auditActionColors[action] || { bg: 'bg-gray-100', icon: 'text-gray-600' }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <History size={18} className="text-gray-500" />
          Historique des actions
        </h3>
        <span className="text-sm text-gray-500">{activities.length} actions</span>
      </div>
      <div className="divide-y divide-gray-100">
        {activities.map((activity) => {
          const IconComponent = getActionIcon(activity.action)
          const colors = getActionColors(activity.action)
          
          return (
            <div key={activity.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
              <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <IconComponent size={18} className={colors.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {auditActionLabels[activity.action] || activity.action}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                  <span>
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                  {activity.performedByUser && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {activity.performedByUser.firstName} {activity.performedByUser.lastName}
                      </span>
                    </>
                  )}
                </div>
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                    {(activity.metadata as Record<string, unknown>).reason ? (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Raison:</span> {String((activity.metadata as Record<string, unknown>).reason)}
                      </p>
                    ) : (
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(activity.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                {format(new Date(activity.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
