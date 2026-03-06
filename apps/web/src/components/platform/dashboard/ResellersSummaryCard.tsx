'use client'

import { useRouter } from 'next/navigation'

interface ResellersSummaryCardProps {
  totalResellers: number
  activeResellers: number
  totalLicenses: number
  period: 'Mensuel' | 'Semaine' | 'Jour'
  onPeriodChange: (period: 'Mensuel' | 'Semaine' | 'Jour') => void
}

export function ResellersSummaryCard({
  totalResellers,
  activeResellers,
  totalLicenses,
  period,
  onPeriodChange,
}: ResellersSummaryCardProps) {
  const router = useRouter()
  const pendingResellers = totalResellers - activeResellers
  const activePercent = totalResellers > 0 ? Math.round((activeResellers / totalResellers) * 100) : 0

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Resume des Revendeurs</h3>
          <p className="text-sm text-gray-400 mt-1">Activite de la plateforme</p>
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

      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
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
              stroke="#10b981" 
              strokeWidth="12" 
              strokeDasharray={`${(activePercent / 100) * 251} 251`}
              strokeLinecap="round" 
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{activePercent}%</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{activeResellers} / {totalResellers}</div>
          <div className="text-sm text-gray-500 mb-3">revendeurs actifs</div>
          <p className="text-sm text-gray-400 mb-4">
            {activeResellers} revendeurs sont actuellement actifs sur la plateforme.
          </p>
          <button 
            onClick={() => router.push('/platform/resellers')}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Voir les revendeurs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-gray-900">{activeResellers}</div>
          <div className="text-xs sm:text-sm text-gray-500">Actifs</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-gray-900">{pendingResellers}</div>
          <div className="text-xs sm:text-sm text-gray-500">En attente</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-gray-900">{totalLicenses}</div>
          <div className="text-xs sm:text-sm text-gray-500">Licences</div>
        </div>
      </div>
    </div>
  )
}
