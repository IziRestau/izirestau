'use client'

import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'

interface Reseller {
  id: string
  name: string
  email: string
  status: string
  createdAt: string
}

interface RecentResellersCardProps {
  resellers: Reseller[]
}

export function RecentResellersCard({ resellers }: RecentResellersCardProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Revendeurs Recents</h3>
        <p className="text-sm text-gray-400">Derniers inscrits</p>
      </div>

      <div className="space-y-3">
        {resellers.length > 0 ? (
          resellers.slice(0, 3).map((reseller) => (
            <div 
              key={reseller.id} 
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => router.push(`/platform/resellers/${reseller.id}`)}
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{reseller.name}</div>
                <div className="text-sm text-gray-500 truncate">{reseller.email}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                reseller.status === 'ACTIVE' 
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {reseller.status === 'ACTIVE' ? 'Actif' : 'En attente'}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-4">Aucun revendeur pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}
