'use client'

import { useQuery } from '@tanstack/react-query'
import { Gift, TrendingUp, TrendingDown, Clock, ShoppingBag, Award, Star, Sparkles } from 'lucide-react'
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
    : 'rounded-2xl'

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <div
          className={`p-8 ${btnClass} animate-pulse`}
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full" style={{ backgroundColor: `${theme.textColor}15` }} />
            <div className="text-center sm:text-left">
              <div className="h-4 w-24 rounded mb-2 mx-auto sm:mx-0" style={{ backgroundColor: `${theme.textColor}15` }} />
              <div className="h-10 w-32 rounded mx-auto sm:mx-0" style={{ backgroundColor: `${theme.textColor}15` }} />
            </div>
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={`p-5 ${btnClass} animate-pulse`}
              style={{ backgroundColor: `${theme.textColor}05` }}
            >
              <div className="h-4 w-20 rounded mb-2" style={{ backgroundColor: `${theme.textColor}10` }} />
              <div className="h-7 w-16 rounded" style={{ backgroundColor: `${theme.textColor}10` }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div
        className={`p-12 text-center ${btnClass}`}
        style={{ backgroundColor: `${theme.textColor}05` }}
      >
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <Gift size={32} style={{ color: theme.primaryColor }} />
        </div>
        <p className="text-lg font-medium mb-2" style={{ color: theme.textColor }}>
          Programme de fidélité
        </p>
        <p className="opacity-60" style={{ color: theme.textColor }}>
          Non disponible pour le moment
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Card - Points actuels */}
      <div
        className={`relative overflow-hidden p-6 sm:p-8 ${btnClass}`}
        style={{ 
          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.primaryColor}dd 100%)`,
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Sparkles size={128} className="text-white" />
        </div>
        
        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm"
          >
            <Star size={36} className="text-white" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-white/80 text-sm font-medium mb-1">
              Mes points de fidélité
            </p>
            <p className="text-4xl sm:text-5xl font-bold text-white">
              {data.currentPoints.toLocaleString('fr-FR')}
            </p>
            <p className="text-white/70 text-sm mt-1">
              points disponibles
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-5 ${btnClass} border`}
          style={{ backgroundColor: theme.backgroundColor, borderColor: `${theme.textColor}25` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#10b98115' }}
            >
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            +{data.totalEarned.toLocaleString('fr-FR')}
          </p>
          <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
            Total gagné
          </p>
        </div>

        <div
          className={`p-5 ${btnClass} border`}
          style={{ backgroundColor: theme.backgroundColor, borderColor: `${theme.textColor}25` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#f9731615' }}
            >
              <ShoppingBag size={18} className="text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            -{data.totalRedeemed.toLocaleString('fr-FR')}
          </p>
          <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
            Total utilisé
          </p>
        </div>
      </div>

      {/* How it works */}
      <div
        className={`p-5 ${btnClass} border`}
        style={{ 
          backgroundColor: theme.backgroundColor,
          borderColor: `${theme.textColor}25`,
        }}
      >
        <p className="font-semibold mb-3" style={{ color: theme.textColor }}>
          Comment ça marche ?
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
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
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
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
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
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
      <div>
        <h3
          className="text-lg font-semibold mb-4"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
        >
          Historique des points
        </h3>

        {data.transactions.length === 0 ? (
          <div
            className={`p-8 text-center ${btnClass} border`}
            style={{ backgroundColor: theme.backgroundColor, borderColor: `${theme.textColor}25` }}
          >
            <Clock size={40} className="mx-auto mb-3 opacity-30" style={{ color: theme.textColor }} />
            <p className="font-medium opacity-60" style={{ color: theme.textColor }}>
              Aucune transaction
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
                  className={`flex items-center gap-4 p-4 ${btnClass} border transition-all hover:shadow-sm`}
                  style={{ 
                    backgroundColor: theme.backgroundColor,
                    borderColor: `${theme.textColor}08`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ 
                      backgroundColor: isPositive ? '#10b98112' : '#f9731612',
                    }}
                  >
                    <Icon 
                      size={20} 
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
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p 
                      className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-orange-600'}`}
                    >
                      {isPositive ? '+' : ''}{transaction.points.toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs opacity-40" style={{ color: theme.textColor }}>
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
