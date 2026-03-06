'use client'

import { useRouter } from 'next/navigation'
import { Building2, MessageSquare, CreditCard, Users } from 'lucide-react'

export function QuickActionsCard() {
  const router = useRouter()

  const actions = [
    {
      href: '/platform/resellers',
      icon: Building2,
      label: 'Revendeurs',
      color: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      href: '/platform/support',
      icon: MessageSquare,
      label: 'Support',
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      href: '/platform/licenses',
      icon: CreditCard,
      label: 'Licences',
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      href: '/platform/users',
      icon: Users,
      label: 'Utilisateurs',
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Actions Rapides</h3>
        <p className="text-sm text-gray-400">Acces directs</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
              <action.icon className={`w-5 h-5 ${action.iconColor}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
