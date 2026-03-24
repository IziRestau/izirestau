'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useNavigationStore } from '@/stores/navigation.store'
import { useRestaurantPermissions, roleLabels } from '@/hooks/use-restaurant-permissions'
import { api, apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { 
  Search, 
  Bell, 
  ChevronDown,
  User,
  Settings,
  LogOut,
  HelpCircle,
  MessageSquare,
  Calculator,
  ArrowLeft,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoutModal } from '@/components/shared/LogoutModal'
import { SearchModal } from '@/components/shared/SearchModal'
import { Switch } from '@/components/ui/switch'

interface HeaderProps {
  title?: string
  subtitle?: string
  pageTitle?: string
  primaryColor?: string
  actions?: ReactNode
}


export function Header({ title, subtitle, pageTitle, primaryColor, actions }: HeaderProps) {
  const accentColor = primaryColor || '#10b981'
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { push, goBack, canGoBack } = useNavigationStore()
  const { role, isDriver } = useRestaurantPermissions()
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchOpen, setSearchOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  // Query pour le statut du livreur
  const { data: driverStatus } = useQuery({
    queryKey: ['driver-status'],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.driver.getMe()
      return res.data
    },
    enabled: isDriver && !!accessToken,
    staleTime: 30 * 1000,
  })

  // Mutation pour changer le statut
  const toggleStatusMutation = useMutation({
    mutationFn: async (isOnline: boolean) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.driver.updateStatus({ isOnline })
    },
    onSuccess: (_, isOnline) => {
      queryClient.invalidateQueries({ queryKey: ['driver-status'] })
      toast.success(isOnline ? 'Vous etes maintenant en ligne' : 'Vous etes maintenant hors ligne')
    },
    onError: () => {
      toast.error('Erreur lors du changement de statut')
    },
  })

  useEffect(() => {
    if (pathname) {
      push(pathname)
    }
  }, [pathname, push])

  const initials = user 
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U'

  const handleLogout = () => {
    const userType = user?.userType
    logout()
    setLogoutModalOpen(false)
    
    if (userType === 'RESTAURANT' || userType === 'DRIVER') {
      window.location.href = '/restaurant/login'
    } else if (userType === 'PLATFORM') {
      window.location.href = '/platform/login'
    } else {
      window.location.href = '/login'
    }
  }

  const renderAvatar = (size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClasses = {
      sm: 'w-7 lg:w-8 h-7 lg:h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    }
    const textSizes = {
      sm: 'text-[10px] lg:text-xs',
      md: 'text-sm',
      lg: 'text-base',
    }

    if (user?.avatar) {
      return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0`}>
          <img
            src={user.avatar}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-full h-full object-cover"
          />
        </div>
      )
    }

    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: `${accentColor}20` }}
      >
        <span className={`${textSizes[size]} font-semibold`} style={{ color: accentColor }}>{initials}</span>
      </div>
    )
  }

  const handleGoBack = () => {
    const previousPath = goBack()
    if (previousPath) {
      router.push(previousPath)
    }
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  
  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 lg:py-5 bg-white border-b border-gray-100 mb-4 lg:mb-6">
        <div className="pl-14 lg:pl-0 flex items-center gap-3">
          {canGoBack() ? (
            <button
              onClick={handleGoBack}
              className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
              title="Retour"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          ) : pageTitle ? (
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{pageTitle}</h1>
          ) : null}
          {actions && <div className="ml-auto">{actions}</div>}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Toggle En ligne / Hors ligne pour livreurs */}
          {isDriver && (
            <div className="flex items-center gap-2 h-10 lg:h-11 px-3 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-1.5">
                {toggleStatusMutation.isPending ? (
                  <Loader2 size={16} className="text-gray-400 animate-spin" />
                ) : driverStatus?.isOnline ? (
                  <Wifi size={16} className="text-emerald-500" />
                ) : (
                  <WifiOff size={16} className="text-gray-400" />
                )}
                <span className={`text-xs font-medium hidden sm:block ${driverStatus?.isOnline ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {driverStatus?.isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              <Switch
                checked={driverStatus?.isOnline || false}
                onCheckedChange={(checked) => toggleStatusMutation.mutate(checked)}
                disabled={toggleStatusMutation.isPending}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          )}

          <button 
            onClick={() => setSearchOpen(true)}
            className="relative h-10 lg:h-11 hidden sm:block"
          >
            <Search className="absolute left-3 lg:left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <div className="h-10 lg:h-11 pl-9 lg:pl-10 pr-4 lg:pr-5 flex items-center bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-400 w-40 lg:w-52 text-left cursor-pointer hover:bg-gray-100 transition-colors">
              Search here
            </div>
          </button>

          <button 
            onClick={() => setSearchOpen(true)}
            className="sm:hidden w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Search size={20} className="text-gray-500" />
          </button>

          {!isDriver && (
            <>
              <button 
                onClick={() => router.push('/restaurant/pos')}
                className="hidden md:flex w-10 lg:w-11 h-10 lg:h-11 rounded-xl items-center justify-center transition-colors"
                style={pathname?.includes('/pos') ? {
                  backgroundColor: `${accentColor}15`,
                  borderColor: accentColor,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                } : {
                  backgroundColor: '#f9fafb',
                  borderColor: '#f3f4f6',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
                title="Caisse"
              >
                <Calculator size={20} style={{ color: pathname?.includes('/pos') ? accentColor : '#6b7280' }} />
              </button>
              <button className="hidden md:flex w-10 lg:w-11 h-10 lg:h-11 bg-gray-50 border border-gray-100 rounded-xl items-center justify-center hover:bg-gray-100 transition-colors">
                <MessageSquare size={20} className="text-gray-500" />
              </button>
            </>
          )}
          <button className="w-10 lg:w-11 h-10 lg:h-11 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Bell size={20} className="text-gray-500" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 lg:gap-2.5 h-10 lg:h-11 bg-gray-50 border border-gray-100 rounded-xl px-2 lg:px-2.5 hover:bg-gray-100 transition-colors">
                {renderAvatar('sm')}
                <div className="text-left hidden sm:block">
                  <div className="text-xs lg:text-sm font-medium text-gray-900 leading-tight">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-[10px] lg:text-[11px] text-gray-500 leading-tight">{roleLabels[role as keyof typeof roleLabels] || 'Staff'}</div>
                </div>
                <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50">
              <div className="px-3 py-3 border-b border-gray-100 mb-1">
                <div className="flex items-center gap-3">
                  {renderAvatar('md')}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                  </div>
                </div>
              </div>
              <DropdownMenuItem className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                <User size={16} className="mr-3 text-gray-400" />
                <span className="text-[13px] text-gray-700">Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                <Settings size={16} className="mr-3 text-gray-400" />
                <span className="text-[13px] text-gray-700">Parametres</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-50">
                <HelpCircle size={16} className="mr-3 text-gray-400" />
                <span className="text-[13px] text-gray-700">Aide & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem 
                onClick={() => setLogoutModalOpen(true)} 
                className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
              >
                <LogOut size={16} className="mr-3" />
                <span className="text-[13px]">Deconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  )
}
