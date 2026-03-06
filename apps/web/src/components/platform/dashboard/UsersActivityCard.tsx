'use client'

import { useRouter } from 'next/navigation'
import { Users, UserPlus, UserCheck, Clock } from 'lucide-react'

interface UsersActivityCardProps {
  totalUsers: number
  newUsersThisPeriod: number
  activeUsersThisPeriod: number
  period: 'Mensuel' | 'Semaine' | 'Jour'
  onPeriodChange: (period: 'Mensuel' | 'Semaine' | 'Jour') => void
}

export function UsersActivityCard({
  totalUsers,
  newUsersThisPeriod,
  activeUsersThisPeriod,
  period,
  onPeriodChange,
}: UsersActivityCardProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Activite Utilisateurs</h3>
          <p className="text-sm text-gray-400 mt-1">Engagement sur la plateforme</p>
        </div>
        <div className="flex gap-1 text-sm bg-gray-100 rounded-lg p-1">
          {(['Mensuel', 'Semaine', 'Jour'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                period === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Users size={20} className="text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalUsers}</div>
          <div className="text-xs sm:text-sm text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <UserPlus size={20} className="text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{newUsersThisPeriod}</div>
          <div className="text-xs sm:text-sm text-gray-500">Nouveaux</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <UserCheck size={20} className="text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{activeUsersThisPeriod}</div>
          <div className="text-xs sm:text-sm text-gray-500">Actifs</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} className="text-gray-400" />
          <span className="text-sm text-gray-500">Periode: {period.toLowerCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${totalUsers > 0 ? (activeUsersThisPeriod / totalUsers) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {totalUsers > 0 ? Math.round((activeUsersThisPeriod / totalUsers) * 100) : 0}%
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Taux d'activite</p>
      </div>

      <button 
        onClick={() => router.push('/platform/users')}
        className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        Voir tous les utilisateurs
      </button>
    </div>
  )
}
