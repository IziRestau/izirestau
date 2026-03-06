'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Info,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  UserCog,
  Settings,
  Star,
  BarChart3,
  Menu,
  ChevronRight,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export type TabId = 
  | 'overview'
  | 'info'
  | 'menu'
  | 'orders'
  | 'customers'
  | 'staff'
  | 'settings'
  | 'reviews'
  | 'analytics'

interface Tab {
  id: TabId
  label: string
  icon: React.ElementType
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { id: 'info', label: 'Informations', icon: Info },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag },
  { id: 'customers', label: 'Clients', icon: Users },
  { id: 'staff', label: 'Equipe', icon: UserCog },
  { id: 'settings', label: 'Configuration', icon: Settings },
  { id: 'reviews', label: 'Avis', icon: Star },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

interface RestaurantTabsProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function RestaurantTabs({ activeTab, onTabChange }: RestaurantTabsProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const currentTab = tabs.find(t => t.id === activeTab)
  const CurrentIcon = currentTab?.icon || LayoutDashboard

  return (
    <>
      <div className="hidden lg:block w-56 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-2 sticky top-24">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="lg:hidden mb-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <CurrentIcon size={18} className="text-white" />
                </div>
                <span className="font-medium text-gray-900">{currentTab?.label}</span>
              </div>
              <Menu size={18} className="text-gray-400" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all w-full',
                      isActive
                        ? 'bg-emerald-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className="flex-shrink-0" />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </div>
                    {isActive && <ChevronRight size={16} />}
                  </button>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
