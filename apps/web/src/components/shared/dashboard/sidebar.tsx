'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { ChevronDown, ChevronLeft, ChevronRight, LucideIcon, Menu, X } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar.store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { RestaurantSwitcher } from '@/components/shared/RestaurantSwitcher'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string | number
  children?: { label: string; href: string }[]
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

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

export interface SidebarProps {
  navigation: NavGroup[]
  basePath: string
  logoText?: string
  primaryColor?: string
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

export function Sidebar({ 
  navigation, 
  basePath, 
  logoText, 
  primaryColor, 
  restaurants = [],
  currentRestaurantId,
  onSwitchRestaurant,
  promoCard 
}: SidebarProps) {
  const accentColor = primaryColor || '#10b981' // emerald-500 par defaut
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['customers'])
  const [isHovered, setIsHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isCollapsed, toggleCollapsed } = useSidebarStore()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Auto-expand parent menu when on a child page
  useEffect(() => {
    navigation.forEach(group => {
      group.items.forEach(item => {
        if (item.children && item.children.length > 0) {
          const isOnChildPage = item.children.some(child => 
            pathname === child.href || pathname.startsWith(child.href + '/')
          )
          if (isOnChildPage) {
            const itemKey = item.href.split('/').pop() || item.href
            setExpandedItems(prev => 
              prev.includes(itemKey) ? prev : [...prev, itemKey]
            )
          }
        }
      })
    })
  }, [pathname, navigation])

  const isActive = (href: string) => {
    if (href === basePath) {
      return pathname === href
    }
    // Exact match or starts with href followed by / but not a deeper nested route
    if (pathname === href) return true
    if (pathname.startsWith(href + '/')) {
      // Check if there's another nav item that matches more specifically
      const allHrefs = navigation.flatMap(g => g.items.map(i => i.href))
      const moreSpecificMatch = allHrefs.some(h => h !== href && pathname.startsWith(h) && h.startsWith(href))
      return !moreSpecificMatch
    }
    return false
  }

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => 
      prev.includes(key) 
        ? prev.filter(h => h !== key)
        : [...prev, key]
    )
  }

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const active = isActive(item.href) && !item.children
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const itemKey = item.href.split('/').pop() || item.href
    const isExpanded = expandedItems.includes(itemKey)

    return (
      <li key={item.href}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleExpand(itemKey)}
              className={cn(
                'w-full flex items-center gap-3 px-4 h-11 rounded-xl text-sm transition-all',
                isExpanded || pathname.startsWith(item.href)
                  ? 'text-white bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={20} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              <ChevronDown 
                size={16} 
                className={cn(
                  'transition-transform duration-200 text-gray-500',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>
            <div 
              className="grid transition-all duration-200 ease-out"
              style={{ 
                gridTemplateRows: isExpanded ? '1fr' : '0fr',
                opacity: isExpanded ? 1 : 0 
              }}
            >
              <div className="overflow-hidden">
                <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-0.5 py-1">
                {item.children?.map(child => {
                  const isChildActive = pathname === child.href || 
                    (child.href !== item.href && pathname.startsWith(child.href + '/'))
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm transition-all',
                        isChildActive
                          ? 'text-white font-medium'
                          : 'text-gray-500 hover:text-white hover:bg-white/5'
                      )}
                      style={isChildActive ? { backgroundColor: `${accentColor}30` } : undefined}
                    >
                      {child.label}
                    </Link>
                  )
                })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 h-11 rounded-xl text-sm transition-all',
              active
                ? 'text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
            style={active ? { backgroundColor: accentColor } : undefined}
          >
            <Icon size={20} />
            <span className="flex-1 font-medium">{item.label}</span>
            {item.badge && (
              <span className="bg-rose-500 text-white text-[11px] px-2 py-0.5 rounded-full font-medium">
                {item.badge}
              </span>
            )}
          </Link>
        )}
      </li>
    )
  }

  const renderPromoCard = () => {
    if (!promoCard) return null
    return (
      <div className="p-4 border-t border-white/5">
        <div className="bg-[#282c34] rounded-2xl p-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${accentColor}20` }}>
            <promoCard.icon className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <p className="text-white text-sm text-center font-medium mb-1">
            {promoCard.title}
          </p>
          <p className="text-gray-500 text-xs text-center mb-4">
            {promoCard.description}
          </p>
          <button 
            onClick={promoCard.onButtonClick}
            className="w-full text-white py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            {promoCard.buttonText}
          </button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex fixed left-0 top-0 z-40 h-screen bg-[#1e2128] flex-col transition-all duration-300",
          isCollapsed ? "w-[72px]" : "w-[250px]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn(
          "border-b border-white/5",
          isCollapsed ? "flex items-center justify-center px-3 py-4" : "px-4 py-4"
        )}>
          {restaurants.length > 0 && onSwitchRestaurant ? (
            <RestaurantSwitcher
              restaurants={restaurants}
              currentRestaurantId={currentRestaurantId || null}
              onSwitch={onSwitchRestaurant}
              isCollapsed={isCollapsed}
              primaryColor={accentColor}
            />
          ) : isCollapsed ? (
            logoText ? (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                <span className="text-white font-bold text-sm">{logoText.substring(0, 2).toUpperCase()}</span>
              </div>
            ) : (
              <Logo size="sm" theme="dark" variant="icon" />
            )
          ) : (
            logoText ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                  <span className="text-white font-bold text-sm">{logoText.substring(0, 2).toUpperCase()}</span>
                </div>
                <span className="text-white font-semibold text-lg">{logoText}</span>
              </div>
            ) : (
              <Logo size="md" theme="dark" />
            )
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navigation.map((group, groupIndex) => (
            <div key={groupIndex} className={cn(groupIndex > 0 && "mt-6")}>
              {group.title && !isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              {isCollapsed && groupIndex > 0 && (
                <div className="mx-3 mb-2 border-t border-white/10" />
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href) && !item.children
                  const Icon = item.icon
                  const hasChildren = item.children && item.children.length > 0
                  const itemKey = item.href.split('/').pop() || item.href

                  if (isCollapsed) {
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={hasChildren ? '#' : item.href}
                              onClick={hasChildren ? (e) => { e.preventDefault(); toggleExpand(itemKey) } : undefined}
                              className={cn(
                                'flex items-center justify-center w-full h-11 rounded-xl transition-all',
                                active
                                  ? 'text-white'
                                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                              )}
                              style={active ? { backgroundColor: accentColor } : undefined}
                            >
                              <Icon size={20} />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="right" 
                            className="flex items-center gap-2 text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            {item.label}
                            {item.badge && (
                              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    )
                  }

                  return renderNavItem(item)
                })}
              </ul>
            </div>
          ))}
        </nav>

        {!isCollapsed && renderPromoCard()}

        {isCollapsed && (
          <div className="p-3 border-t border-white/5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleCollapsed}
                  className="w-full h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-white" style={{ backgroundColor: accentColor }}>Agrandir</TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-[#1e2128] rounded-xl flex items-center justify-center text-white shadow-lg"
      >
        <Menu size={22} />
      </button>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-[#1e2128] border-none">
          <div className="px-4 py-4 border-b border-white/5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {restaurants.length > 0 && onSwitchRestaurant ? (
                  <RestaurantSwitcher
                    restaurants={restaurants}
                    currentRestaurantId={currentRestaurantId || null}
                    onSwitch={onSwitchRestaurant}
                    isCollapsed={false}
                    primaryColor={accentColor}
                  />
                ) : logoText ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                      <span className="text-white font-bold text-sm">{logoText.substring(0, 2)}</span>
                    </div>
                    <span className="text-white font-semibold text-lg">{logoText}</span>
                  </div>
                ) : (
                  <Logo size="md" theme="dark" />
                )}
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {navigation.map((group, groupIndex) => (
              <div key={groupIndex} className={cn(groupIndex > 0 && "mt-6")}>
                {group.title && (
                  <div className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {group.title}
                  </div>
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => renderNavItem(item, true))}
                </ul>
              </div>
            ))}
          </nav>

          {renderPromoCard()}
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}
