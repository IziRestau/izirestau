'use client'

import { ReactNode } from 'react'
import { Sidebar, NavGroup } from './sidebar'
import { Header } from './header'
import { RestaurantTransition } from '../RestaurantTransition'
import { LucideIcon } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { cn } from '@/lib/utils'

interface RestaurantSummary {
  id: string
  name: string
  logo: string | null
  address: string
  city: string
  role: string
  organization: {
    id: string
    name: string
    primaryColor: string
  } | null
}

export interface DashboardLayoutProps {
  children: ReactNode
  navigation: NavGroup[]
  basePath: string
  title?: string
  subtitle?: string
  pageTitle?: string
  logoText?: string
  primaryColor?: string
  headerActions?: ReactNode
  restaurants?: RestaurantSummary[]
  currentRestaurantId?: string | null
  onSwitchRestaurant?: (restaurantId: string) => void
  promoCard?: {
    icon: LucideIcon
    title: string
    description: string
    buttonText: string
    onButtonClick?: () => void
  }
}

export function DashboardLayout({
  children,
  navigation,
  basePath,
  title,
  subtitle,
  pageTitle,
  logoText,
  primaryColor,
  headerActions,
  restaurants,
  currentRestaurantId,
  onSwitchRestaurant,
  promoCard,
}: DashboardLayoutProps) {
  const { isCollapsed } = useSidebarStore()
  const { isSwitching, switchingToName } = useRestaurantStore()

  return (
    <div className="min-h-screen flex bg-[#f8f9fb]">
      <RestaurantTransition 
        isTransitioning={isSwitching} 
        restaurantName={switchingToName || undefined}
        primaryColor={primaryColor}
      />
      <Sidebar 
        navigation={navigation} 
        basePath={basePath} 
        logoText={logoText} 
        primaryColor={primaryColor} 
        restaurants={restaurants}
        currentRestaurantId={currentRestaurantId}
        onSwitchRestaurant={onSwitchRestaurant}
        promoCard={promoCard} 
      />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        "lg:ml-[250px]",
        isCollapsed && "lg:ml-[72px]"
      )}>
        <Header title={title} subtitle={subtitle} pageTitle={pageTitle} primaryColor={primaryColor} actions={headerActions} />
        
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-6 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  )
}
