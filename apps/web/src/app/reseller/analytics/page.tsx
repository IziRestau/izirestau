'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { resellerNavigation, resellerPromoCard } from '@/config/reseller-navigation'
import { useResellerDashboard, useResellerStats, useResellerRevenue } from '@/hooks/use-reseller'
import { useResellerCurrency } from '@/hooks/use-currency'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Store,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

type Period = 'day' | 'week' | 'month'
type PeriodLabel = 'Jour' | 'Semaine' | 'Mois'

const periodOptions: { label: PeriodLabel; value: Period }[] = [
  { label: 'Jour', value: 'day' },
  { label: 'Semaine', value: 'week' },
  { label: 'Mois', value: 'month' },
]

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('month')
  
  const { data: dashboardData } = useResellerDashboard()
  const { data: stats } = useResellerStats(period)
  const { data: revenueData } = useResellerRevenue(period, 'all')
  const { format: formatAmount, symbol: currencySymbol, convert } = useResellerCurrency()

  const license = dashboardData?.license
  const dashboardStats = dashboardData?.stats

  const convertedChartData = useMemo(() => {
    if (!revenueData?.chartData) return []
    return revenueData.chartData.map(item => ({
      ...item,
      value: convert(item.value, 'EUR'),
      sites: convert(item.sites || 0, 'EUR'),
      services: convert(item.services || 0, 'EUR'),
    }))
  }, [revenueData?.chartData, convert])

  // Donnees pour le pie chart des sites par statut
  const sitesStatusData = useMemo(() => {
    if (!dashboardStats) return []
    return [
      { name: 'Actifs', value: dashboardStats.sitesActive || 0, color: '#10b981' },
      { name: 'Inactifs', value: (dashboardStats.sitesCount || 0) - (dashboardStats.sitesActive || 0), color: '#94a3b8' },
    ].filter(item => item.value > 0)
  }, [dashboardStats])

  // Calcul des variations
  const revenueChange = (revenueData as { percentageChange?: number } | undefined)?.percentageChange || 0
  const sitesChange = stats?.sitesCreated || 0

  return (
    <DashboardLayout
      navigation={resellerNavigation}
      basePath="/reseller"
      pageTitle="Analytics"
      promoCard={{
        ...resellerPromoCard,
        onButtonClick: () => router.push(resellerPromoCard.href),
      }}
    >
      <PageHeader
        title="Analytics"
        subtitle="Analysez les performances de votre activite"
        icon={BarChart3}
        actions={
          <div className="inline-flex gap-1 bg-gray-100 rounded-lg p-1">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${
              revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(revenueChange).toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatAmount(revenueData?.totalRevenue || 0, 'EUR')}
          </div>
          <div className="text-sm text-gray-500">Revenus totaux</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
              +{sitesChange}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboardStats?.sitesCount || 0}
          </div>
          <div className="text-sm text-gray-500">Total restaurants</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboardStats?.clientsCount || 0}
          </div>
          <div className="text-sm text-gray-500">Clients</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboardStats?.sitesActive || 0}
          </div>
          <div className="text-sm text-gray-500">Sites actifs</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
        {/* Revenue Chart - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Evolution des revenus</h3>
              <p className="text-sm text-gray-400 mt-1">Suivi de vos revenus sur la periode</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-500">Revenus</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={convertedChartData}>
                <defs>
                  <linearGradient id="colorRevenueAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => `${currencySymbol}${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatAmount(value), 'Revenus']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#colorRevenueAnalytics)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sites Status Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900">Statut des sites</h3>
            <p className="text-sm text-gray-400 mt-1">Repartition par statut</p>
          </div>

          <div className="h-48">
            {sitesStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sitesStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sitesStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-gray-400">Aucune donnee</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taux d'activation</span>
              <span className="font-semibold text-gray-900">
                {dashboardStats?.sitesCount 
                  ? Math.round(((dashboardStats.sitesActive || 0) / dashboardStats.sitesCount) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* License Usage */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900">Utilisation de la licence</h3>
            <p className="text-sm text-gray-400 mt-1">Quota de restaurants</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Sites utilises</span>
                <span className="font-medium text-gray-900">
                  {license?.sitesUsed || 0} / {license?.plan?.maxSites || 0}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${license?.plan?.maxSites 
                      ? Math.min(((license.sitesUsed || 0) / license.plan.maxSites) * 100, 100) 
                      : 0}%` 
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">{license?.sitesUsed || 0}</div>
                <div className="text-sm text-gray-500">Utilises</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-emerald-600">
                  {(license?.plan?.maxSites || 0) - (license?.sitesUsed || 0)}
                </div>
                <div className="text-sm text-gray-500">Disponibles</div>
              </div>
            </div>

            <button 
              onClick={() => router.push('/reseller/license')}
              className="w-full mt-4 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Gerer ma licence
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900">Statistiques rapides</h3>
            <p className="text-sm text-gray-400 mt-1">Resume de la periode</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Sites crees</div>
                  <div className="font-semibold text-gray-900">{stats?.sitesCreated || 0}</div>
                </div>
              </div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Sites actives</div>
                  <div className="font-semibold text-gray-900">{stats?.sitesActivated || 0}</div>
                </div>
              </div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Nouveaux clients</div>
                  <div className="font-semibold text-gray-900">{stats?.clientsCreated || 0}</div>
                </div>
              </div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
