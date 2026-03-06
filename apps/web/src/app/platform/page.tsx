'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { platformNavigation } from '@/config/platform-navigation'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/lib/api-client'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  MessageSquare,
  CreditCard,
} from 'lucide-react'
import { StatsCard } from '@/components/reseller'
import {
  ResellersSummaryCard,
  TicketsSummaryCard,
  RecentResellersCard,
  QuickActionsCard,
  LicensesSummaryCard,
  UsersActivityCard,
} from '@/components/platform/dashboard'

export default function PlatformDashboardPage() {
  const { user, accessToken } = useAuthStore()
  const [resellersPeriod, setResellersPeriod] = useState<'Mensuel' | 'Semaine' | 'Jour'>('Jour')
  const [ticketsPeriod, setTicketsPeriod] = useState<'Mensuel' | 'Semaine' | 'Jour'>('Jour')
  const [licensesPeriod, setLicensesPeriod] = useState<'Mensuel' | 'Semaine' | 'Jour'>('Mensuel')
  const [usersPeriod, setUsersPeriod] = useState<'Mensuel' | 'Semaine' | 'Jour'>('Jour')

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      if (accessToken) {
        apiClient.setAccessToken(accessToken)
      }
      const res = await apiClient.get<{
        totalResellers: number
        activeResellers: number
        totalUsers: number
        openTickets: number
        totalLicenses: number
        activeLicenses: number
        totalRevenue: number
        recentResellers: Array<{
          id: string
          name: string
          email: string
          status: string
          createdAt: string
        }>
        recentTickets: Array<{
          id: string
          ticketNumber: string
          subject: string
          status: string
          createdAt: string
          resellerOrg?: { name: string }
        }>
        newUsersThisMonth: number
        newUsersThisWeek: number
        newUsersToday: number
      }>('/platform/stats')
      return res.data
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000,
  })

  const getNewUsersByPeriod = () => {
    if (!stats) return 0
    switch (usersPeriod) {
      case 'Mensuel': return stats.newUsersThisMonth
      case 'Semaine': return stats.newUsersThisWeek
      case 'Jour': return stats.newUsersToday
    }
  }

  return (
    <DashboardLayout
      navigation={platformNavigation}
      basePath="/platform"
      pageTitle="Dashboard"
    >
      <PageHeader
        title={`Bienvenue ${user?.firstName}!`}
        subtitle="Voici un apercu de la plateforme"
        icon={LayoutDashboard}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
        <StatsCard
          icon={Building2}
          value={stats?.totalResellers || 0}
          label="Revendeurs"
        />
        <StatsCard
          icon={CreditCard}
          value={stats?.totalLicenses || 0}
          label="Licences"
        />
        <StatsCard
          icon={MessageSquare}
          value={stats?.openTickets || 0}
          label="Tickets ouverts"
        />
        <StatsCard
          icon={Users}
          value={stats?.totalUsers || 0}
          label="Utilisateurs"
        />
      </div>

      {/* Main Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-6">
        <ResellersSummaryCard
          totalResellers={stats?.totalResellers || 0}
          activeResellers={stats?.activeResellers || 0}
          totalLicenses={stats?.totalLicenses || 0}
          period={resellersPeriod}
          onPeriodChange={setResellersPeriod}
        />
        <TicketsSummaryCard
          openTickets={stats?.openTickets || 0}
          recentTickets={stats?.recentTickets || []}
          period={ticketsPeriod}
          onPeriodChange={setTicketsPeriod}
        />
      </div>

      {/* Main Grid - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-6">
        <LicensesSummaryCard
          totalLicenses={stats?.totalLicenses || 0}
          activeLicenses={stats?.activeLicenses || 0}
          totalRevenue={stats?.totalRevenue || 0}
          period={licensesPeriod}
          onPeriodChange={setLicensesPeriod}
        />
        <UsersActivityCard
          totalUsers={stats?.totalUsers || 0}
          newUsersThisPeriod={getNewUsersByPeriod()}
          activeUsersThisPeriod={Math.round((stats?.totalUsers || 0) * 0.7)}
          period={usersPeriod}
          onPeriodChange={setUsersPeriod}
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <RecentResellersCard resellers={stats?.recentResellers || []} />
        <QuickActionsCard />
      </div>
    </DashboardLayout>
  )
}
