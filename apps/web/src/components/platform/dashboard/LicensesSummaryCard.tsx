'use client'

import { useRouter } from 'next/navigation'
import { CreditCard, TrendingUp } from 'lucide-react'

interface LicensesSummaryCardProps {
  totalLicenses: number
  activeLicenses: number
  totalRevenue: number
  period: 'Mensuel' | 'Semaine' | 'Jour'
  onPeriodChange: (period: 'Mensuel' | 'Semaine' | 'Jour') => void
}

export function LicensesSummaryCard({
  totalLicenses,
  activeLicenses,
  totalRevenue,
  period,
  onPeriodChange,
}: LicensesSummaryCardProps) {
  const router = useRouter()
  const activePercent = totalLicenses > 0 ? Math.round((activeLicenses / totalLicenses) * 100) : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Licences & Revenus</h3>
          <p className="text-sm text-gray-400 mt-1">Performance financiere</p>
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

      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
          <TrendingUp size={18} className="text-emerald-600" />
        </div>
        <span className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-blue-600" />
            <span className="text-sm text-gray-500">Total licences</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalLicenses}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-sm text-gray-500">Actives</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeLicenses}</div>
          <div className="text-xs text-gray-400">{activePercent}% du total</div>
        </div>
      </div>

      <button 
        onClick={() => router.push('/platform/licenses')}
        className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        Gerer les licences
      </button>
    </div>
  )
}
