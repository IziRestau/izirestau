'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { resellerNavigation, resellerPromoCard } from '@/config/reseller-navigation'
import { StatsCard } from '@/components/reseller'
import { LayoutDashboard } from 'lucide-react'
import { useResellerDashboard, useResellerSites, useResellerClients, useResellerStats, useResellerRevenue } from '@/hooks/use-reseller'
import { useResellerCurrency } from '@/hooks/use-currency'
import { 
  Store,
  Users,
  CreditCard,
  Globe,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

// Mapping des periodes FR vers API
const periodMap: Record<'Mensuel' | 'Semaine' | 'Jour', 'month' | 'week' | 'day'> = {
  'Mensuel': 'month',
  'Semaine': 'week',
  'Jour': 'day'
}

export default function ResellerDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: dashboardData, isLoading: dashboardLoading } = useResellerDashboard()
  const { sites, isLoading: sitesLoading } = useResellerSites()
  const { clients, isLoading: clientsLoading } = useResellerClients()
  const [summaryPeriod, setSummaryPeriod] = useState<'Mensuel' | 'Semaine' | 'Jour'>('Jour')
  const [revenuePeriod, setRevenuePeriod] = useState<'Mensuel' | 'Semaine' | 'Jour'>('Mensuel')
  const [clientsPeriod, setClientsPeriod] = useState<'Mensuel' | 'Semaine' | 'Jour'>('Jour')
  
  // Hooks pour les stats par periode
  const { data: periodStats } = useResellerStats(periodMap[summaryPeriod])
  const { data: revenueData } = useResellerRevenue(periodMap[revenuePeriod], 'all')
  const { data: clientsStats } = useResellerStats(periodMap[clientsPeriod])
  const { format: formatAmount, symbol: currencySymbol, convert } = useResellerCurrency()

  const convertedChartData = useMemo(() => {
    if (!revenueData?.chartData) return []
    return revenueData.chartData.map(item => ({
      ...item,
      value: convert(item.value, 'EUR'),
      sites: convert(item.sites || 0, 'EUR'),
      services: convert(item.services || 0, 'EUR'),
    }))
  }, [revenueData?.chartData, convert])

  const stats = dashboardData?.stats
  const license = dashboardData?.license
  const sitesUsed = license?.sitesUsed || 0
  const maxSites = license?.plan?.maxSites || 20
  const usagePercent = Math.round((sitesUsed / maxSites) * 100)

  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
      pageTitle="Dashboard"
      promoCard={{
        ...resellerPromoCard,
        onButtonClick: () => router.push(resellerPromoCard.href),
      }}
    >
      <PageHeader
        title={`Bienvenue ${user?.firstName}!`}
        subtitle="Voici un apercu de votre activite"
        icon={LayoutDashboard}
      />
      {/* Stats Cards - bg blanc, icone noir */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        <StatsCard
          icon={Store}
          value={stats?.sitesCount || 0}
          label="Total Sites"
        />
        <StatsCard
          icon={CreditCard}
          value={formatAmount(license?.plan?.priceMonthly || 99, 'EUR')}
          label="Abonnement"
        />
        <StatsCard
          icon={Globe}
          value={stats?.sitesRemaining || 0}
          label="Disponibles"
        />
        <StatsCard
          icon={Users}
          value={stats?.clientsCount || 0}
          label="Invitations"
        />
      </div>

      {/* Main Grid - Sites Summary + Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-6">
        {/* Sites Summary - Style Orders Summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Resume des Restaurants</h3>
              <p className="text-sm text-gray-400 mt-1">Utilisation de votre licence</p>
            </div>
            <div className="flex gap-1 text-sm bg-gray-100 rounded-lg p-1">
              {(['Mensuel', 'Semaine', 'Jour'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSummaryPeriod(period)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    summaryPeriod === period
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Donut Chart */}
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
                  stroke="#10b981" 
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
            <div className="flex-1">
              <div className="text-3xl font-bold text-gray-900">{sitesUsed} / {maxSites}</div>
              <div className="text-sm text-gray-500 mb-3">restaurants</div>
              <p className="text-sm text-gray-400 mb-4">
                Vous avez utilise {usagePercent}% de votre quota de restaurants.
              </p>
              <button 
                onClick={() => router.push('/reseller/license')}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Plus de details
              </button>
            </div>
          </div>

          {/* Bottom Stats - Utilise periodStats selon le filtre */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{periodStats?.sitesActivated ?? stats?.sitesActive ?? 0}</div>
              <div className="text-sm text-gray-500">Actives ({summaryPeriod.toLowerCase()})</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{periodStats?.sitesCreated ?? 0}</div>
              <div className="text-sm text-gray-500">Crees ({summaryPeriod.toLowerCase()})</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{stats?.sitesRemaining || 0}</div>
              <div className="text-sm text-gray-500">Disponibles</div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Revenus</h3>
              <p className="text-sm text-gray-400 mt-1">Facturation clients</p>
            </div>
            <div className="flex gap-1 text-sm bg-gray-100 rounded-lg p-1">
              {(['Mensuel', 'Semaine', 'Jour'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setRevenuePeriod(period)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    revenuePeriod === period
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-xs">{currencySymbol.charAt(0)}</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{formatAmount(revenueData?.totalRevenue || 0, 'EUR')}</span>
          </div>

          {/* Area Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={convertedChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => [formatAmount(value), 'Revenus']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid - Clients + Recent Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Clients Summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Clients</h3>
              <p className="text-sm text-gray-400 mt-1">Gestion de vos clients</p>
            </div>
            <div className="flex gap-1 text-sm bg-gray-100 rounded-lg p-1">
              {(['Mensuel', 'Semaine', 'Jour'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setClientsPeriod(period)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    clientsPeriod === period
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-4">Aucun client pour le moment</p>
                <button 
                  onClick={() => router.push('/reseller/clients/new')}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"
                >
                  Ajouter un client
                </button>
              </div>
            ) : (
              clients.slice(0, 3).map((client) => (
                <div 
                  key={client.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => router.push(`/reseller/clients/${client.id}`)}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-semibold">
                      {client.contactFirstName[0]}{client.contactLastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{client.name}</div>
                    <div className="text-xs text-gray-500">{client._count?.sites || 0} site(s)</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.status === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {client.status === 'ACTIVE' ? 'Actif' : 'Prospect'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sites */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sites Recents</h3>
            <p className="text-sm text-gray-400">Derniers sites crees</p>
          </div>

          <div className="space-y-3">
            {sites.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Store className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-4">Aucun site pour le moment</p>
                <button 
                  onClick={() => router.push('/reseller/sites/new')}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"
                >
                  Creer un site
                </button>
              </div>
            ) : (
              sites.slice(0, 3).map((site) => (
                <div 
                  key={site.id} 
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => router.push(`/reseller/sites/${site.id}`)}
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Store className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{site.restaurant?.name || site.subdomain}</div>
                    <div className="text-sm text-gray-500">{site.subdomain}.iziresto.com</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    site.status === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {site.status === 'ACTIVE' ? 'Actif' : 'Brouillon'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
