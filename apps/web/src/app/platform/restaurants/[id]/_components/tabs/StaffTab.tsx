'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import {
  Users,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RestaurantDetails, StaffMember } from '../types'
import { roleLabels } from '../types'

interface StaffTabProps {
  restaurant: RestaurantDetails
}

export function StaffTab({ restaurant }: StaffTabProps) {
  const { accessToken } = useAuthStore()

  const { data: staff, isLoading } = useQuery({
    queryKey: ['platform-restaurant-staff', restaurant.id],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await apiClient.get(`/platform/restaurants/${restaurant.id}/staff`)
      return res.data as StaffMember[]
    },
    enabled: !!accessToken,
  })

  const activeCount = staff?.filter(s => s.isActive).length || 0
  const inactiveCount = staff?.filter(s => !s.isActive).length || 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{staff?.length || 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <XCircle size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{inactiveCount}</p>
              <p className="text-xs text-gray-500">Inactifs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-medium text-gray-900">Membres de l'equipe</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : !staff || staff.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun membre dans l'equipe</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {staff.map((member) => (
              <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {member.user.avatar ? (
                      <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-medium text-emerald-700">
                        {member.user.firstName[0]}{member.user.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {member.user.firstName} {member.user.lastName}
                      </h4>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        member.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {member.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium flex items-center gap-1">
                        <Shield size={12} />
                        {roleLabels[member.role] || member.role}
                      </span>
                      {member.position && (
                        <span className="text-sm text-gray-500">{member.position}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-gray-400" />
                        {member.user.email}
                      </div>
                      {member.user.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-gray-400" />
                          {member.user.phone}
                        </div>
                      )}
                    </div>
                    {member.permissions && member.permissions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {member.permissions.slice(0, 5).map((perm, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {perm}
                          </span>
                        ))}
                        {member.permissions.length > 5 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{member.permissions.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {member.employeeId && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">ID Employe</p>
                      <p className="text-sm font-mono text-gray-900">{member.employeeId}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
