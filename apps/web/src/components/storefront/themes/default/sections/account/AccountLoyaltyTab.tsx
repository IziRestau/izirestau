'use client'

import { useQuery } from '@tanstack/react-query'
import { Gift, TrendingUp, TrendingDown, Clock, ShoppingBag, Award, Star } from 'lucide-react'
import type { StoreThemeData, StoreSettingsData } from '../../../_types'
import { api } from '@/lib/api-client'
import { useStorefrontAuthStore } from '@/stores/storefront-auth.store'

interface AccountLoyaltyTabProps {
  theme: StoreThemeData
  settings: StoreSettingsData
  subdomain: string
}

interface LoyaltyTransaction {
  id: string
  type: 'EARN' | 'REDEEM' | 'BONUS' | 'ADJUSTMENT' | 'EXPIRE'
  points: number
  balanceAfter: number
  description: string | null
  orderId: string | null
  createdAt: string
}

interface LoyaltyData {
  currentPoints: number
  totalEarned: number
  totalRedeemed: number
  transactions: LoyaltyTransaction[]
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  EARN: 'Points gagnés',
  REDEEM: 'Points utilisés',
  BONUS: 'Bonus',
  ADJUSTMENT: 'Ajustement',
  EXPIRE: 'Points expirés',
}

const TRANSACTION_TYPE_ICONS: Record<string, typeof TrendingUp> = {
  EARN: TrendingUp,
  REDEEM: ShoppingBag,
  BONUS: Gift,
  ADJUSTMENT: Award,
  EXPIRE: Clock,
}

export function AccountLoyaltyTab({
  theme,
  settings,
  subdomain,
}: AccountLoyaltyTabProps) {
  const { accessToken } = useStorefrontAuthStore()

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['customer-loyalty', subdomain],
    queryFn: async () => {
      if (accessToken) {
        const res = await api.store.account.getLoyalty(subdomain, accessToken)
        return res.data as LoyaltyData
      }
      return null
    },
    enabled: !!accessToken,
    staleTime: 60 * 1000,
  })

  // Normaliser les données avec des valeurs par défaut
  const data: LoyaltyData | null = rawData ? {
    currentPoints: rawData.currentPoints ?? 0,
    totalEarned: rawData.totalEarned ?? 0,
    totalRedeemed: rawData.totalRedeemed ?? 0,
    transactions: rawData.transactions ?? [],
  } : null

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-5 ${btnClass} animate-pulse`}
              style={{ backgroundColor: `${theme.textColor}08` }}
            >
              <div className="h-4 w-20 rounded mb-2" style={{ backgroundColor: `${theme.textColor}15` }} />
              <div className="h-8 w-16 rounded" style={{ backgroundColor: `${theme.textColor}15` }} />
            </div>
          ))}
        </div>
        <div
          className={`p-5 ${btnClass} animate-pulse`}
          style={{ backgroundColor: `${theme.textColor}08` }}
        >
          <div className="h-4 w-32 rounded mb-4" style={{ backgroundColor: `${theme.textColor}15` }} />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded" style={{ backgroundColor: `${theme.textColor}10` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div
        className={`p-8 text-center ${btnClass}`}
        style={{ backgroundColor: `${theme.textColor}08` }}
      >
        <Gift size={48} className="mx-auto mb-4 opacity-30" style={{ color: theme.textColor }} />
        <p style={{ color: theme.textColor }} className="opacity-60">
          Programme de fidélité non disponible
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current Points */}
        <div
          className={`p-5 ${btnClass}`}
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Star size={20} className="text-white" />
            </div>
            <p className="text-sm font-medium opacity-70" style={{ color: theme.textColor }}>
              Mes points
            </p>
          </div>
          <p className="text-3xl font-bold" style={{ color: theme.primaryColor }}>
            {data.currentPoints.toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Total Earned */}
        <div
          className={`p-5 ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}08` }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#10b98120' }}
            >
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium opacity-70" style={{ color: theme.textColor }}>
              Total gagné
            </p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            +{data.totalEarned.toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Total Redeemed */}
        <div
          className={`p-5 ${btnClass}`}
          style={{ backgroundColor: `${theme.textColor}08` }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#f9731620' }}
            >
              <ShoppingBag size={20} className="text-orange-500" />
            </div>
            <p className="text-sm font-medium opacity-70" style={{ color: theme.textColor }}>
              Total utilisé
            </p>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            -{data.totalRedeemed.toLocaleString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div
        className={`p-5 ${btnClass}`}
        style={{ backgroundColor: `${theme.primaryColor}08`, border: `1px solid ${theme.primaryColor}20` }}
      >
        <p className="font-semibold mb-3" style={{ color: theme.textColor }}>
          Comment ça marche ?
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ backgroundColor: theme.primaryColor, color: 'white' }}
            >
              1
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: theme.textColor }}>Gagnez des points</p>
              <p className="text-xs opacity-60" style={{ color: theme.textColor }}>
                Recevez 1 point pour chaque {settings?.currency || 'XOF'} dépensé
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ backgroundColor: theme.primaryColor, color: 'white' }}
            >
              2
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: theme.textColor }}>Utilisez vos points</p>
              <p className="text-xs opacity-60" style={{ color: theme.textColor }}>
                Au checkout, activez l'option "Utiliser mes points" pour réduire votre total
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ backgroundColor: theme.primaryColor, color: 'white' }}
            >
              3
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: theme.textColor }}>Économisez</p>
              <p className="text-xs opacity-60" style={{ color: theme.textColor }}>
                100 points = 1 {settings?.currency || 'XOF'} de réduction
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions History */}
      <div
        className={`p-5 ${btnClass}`}
        style={{ backgroundColor: `${theme.textColor}08` }}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
        >
          Historique des points
        </h3>

        {data.transactions.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={40} className="mx-auto mb-3 opacity-30" style={{ color: theme.textColor }} />
            <p className="opacity-60" style={{ color: theme.textColor }}>
              Aucune transaction pour le moment
            </p>
            <p className="text-sm opacity-40 mt-1" style={{ color: theme.textColor }}>
              Passez une commande pour commencer à gagner des points
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.transactions.map((transaction) => {
              const Icon = TRANSACTION_TYPE_ICONS[transaction.type] || Gift
              const isPositive = transaction.points > 0
              
              return (
                <div
                  key={transaction.id}
                  className={`flex items-center gap-4 p-3 ${btnClass}`}
                  style={{ backgroundColor: `${theme.textColor}05` }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ 
                      backgroundColor: isPositive ? '#10b98115' : '#f9731615',
                    }}
                  >
                    <Icon 
                      size={18} 
                      className={isPositive ? 'text-emerald-500' : 'text-orange-500'} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: theme.textColor }}>
                      {transaction.description || TRANSACTION_TYPE_LABELS[transaction.type]}
                    </p>
                    <p className="text-xs opacity-50" style={{ color: theme.textColor }}>
                      {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p 
                      className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-orange-600'}`}
                    >
                      {isPositive ? '+' : ''}{transaction.points.toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs opacity-50" style={{ color: theme.textColor }}>
                      Solde: {transaction.balanceAfter.toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
