'use client'

import { ShoppingBag, Menu as MenuIcon, User, LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { HeaderProps, HeaderCustomer } from '../_types'
import { MobileMenuPanel } from './MobileMenuPanel'

function RestaurantName({ restaurant, theme, size = 'default' }: {
  restaurant: HeaderProps['restaurant']
  theme: HeaderProps['theme']
  size?: 'default' | 'large'
}) {
  const textSize = size === 'large' ? 'text-xl' : 'text-lg'
  return (
    <Link href="/" className="flex items-center gap-3 group">
      {restaurant.logo ? (
        <img
          src={restaurant.logo}
          alt={restaurant.name}
          className="h-9 w-9 rounded-lg object-cover"
        />
      ) : null}
      <span
        className={`font-bold ${textSize} tracking-tight text-white group-hover:opacity-90 transition-opacity`}
        style={{ fontFamily: `'${theme.headingFont}', serif` }}
      >
        {restaurant.name}
      </span>
    </Link>
  )
}

function NavLinks({ pages, theme, isActive }: {
  pages: HeaderProps['pages']
  theme: HeaderProps['theme']
  isActive: (href: string) => boolean
}) {
  return (
    <nav className="hidden lg:flex items-center gap-1">
      {pages.map(page => {
        const active = isActive(page.href)
        return (
          <Link
            key={page.slug}
            href={page.href}
            className="relative text-sm font-medium px-4 py-2 transition-colors"
            style={{
              color: active ? theme.primaryColor : 'rgba(255,255,255,0.55)',
            }}
          >
            <span className="hover:text-white/80 transition-colors">
              {page.title}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

function CtaButton({ theme, cartItemCount, onCartClick }: {
  theme: HeaderProps['theme']
  cartItemCount: number
  onCartClick: () => void
}) {
  const btnRadius = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-lg'

  return (
    <button
      onClick={onCartClick}
      className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110 ${btnRadius}`}
      style={{
        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}CC)`,
        color: '#0C0C0C',
        border: `1px solid ${theme.primaryColor}40`,
      }}
    >
      <ShoppingBag size={15} />
      <span>Panier</span>
      {cartItemCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: theme.accentColor }}
        >
          {cartItemCount}
        </span>
      )}
    </button>
  )
}

function AccountButton({ theme, customer, subdomain, btnClass }: {
  theme: HeaderProps['theme']
  customer?: HeaderCustomer | null
  subdomain: string
  btnClass: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  if (customer) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-all hover:bg-white/10 ${btnClass}`}
          style={{ color: 'white' }}
        >
          <User size={18} />
          <span className="hidden sm:inline max-w-[100px] truncate">{customer.firstName}</span>
          <ChevronDown size={14} className={`hidden sm:block transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        {menuOpen && (
          <div
            className={`absolute right-0 top-full mt-2 w-48 shadow-xl overflow-hidden z-50 ${btnClass}`}
            style={{ backgroundColor: '#1a1f21', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Link
              href={`/store/${subdomain}/account`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              <User size={16} />
              Mon compte
            </Link>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            <Link
              href={`/store/${subdomain}/logout`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut size={16} />
              Déconnexion
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={`/store/${subdomain}/login`}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/10 ${btnClass}`}
      style={{ color: 'white' }}
    >
      <User size={18} />
      <span className="hidden sm:inline">Connexion</span>
    </Link>
  )
}

function MobileRow({ restaurant, theme, cartItemCount, onCartClick, onMenuToggle }: {
  restaurant: HeaderProps['restaurant']
  theme: HeaderProps['theme']
  cartItemCount: number
  onCartClick: () => void
  onMenuToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between h-16 lg:hidden">
      <RestaurantName restaurant={restaurant} theme={theme} />
      <div className="flex items-center gap-2">
        <CtaButton theme={theme} cartItemCount={cartItemCount} onCartClick={onCartClick} />
        <button
          onClick={onMenuToggle}
          className="p-2.5 rounded-lg transition-colors text-white/60 hover:text-white hover:bg-white/5"
        >
          <MenuIcon size={22} />
        </button>
      </div>
    </div>
  )
}

function StandardHeader({ restaurant, theme, pages, cartItemCount, onCartClick, isActive, isSticky, mobileRow, mobileMenu, customer, subdomain, btnClass }: {
  restaurant: HeaderProps['restaurant']
  theme: HeaderProps['theme']
  pages: HeaderProps['pages']
  cartItemCount: number
  onCartClick: () => void
  isActive: (href: string) => boolean
  isSticky: boolean
  mobileRow: React.ReactNode
  mobileMenu: React.ReactNode
  customer?: HeaderCustomer | null
  subdomain: string
  btnClass: string
}) {
  const posClass = isSticky ? 'sticky top-0' : 'relative'
  return (
    <header
      className={`${posClass} z-50`}
      style={{ backgroundColor: '#0e1416', borderBottom: '1px solid rgba(255,255,255,0.12)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {mobileRow}
        <div className="hidden lg:flex items-center justify-between py-5">
          <div className="flex-shrink-0">
            <RestaurantName restaurant={restaurant} theme={theme} />
          </div>
          <NavLinks pages={pages} theme={theme} isActive={isActive} />
          <div className="flex-shrink-0 flex items-center gap-2">
            <AccountButton theme={theme} customer={customer} subdomain={subdomain} btnClass={btnClass} />
            <CtaButton theme={theme} cartItemCount={cartItemCount} onCartClick={onCartClick} />
          </div>
        </div>
        {mobileMenu}
      </div>
    </header>
  )
}

function FloatingHeader({ restaurant, theme, pages, cartItemCount, onCartClick, isActive, isSticky, mobileRow, mobileMenu, customer, subdomain, btnClass }: {
  restaurant: HeaderProps['restaurant']
  theme: HeaderProps['theme']
  pages: HeaderProps['pages']
  cartItemCount: number
  onCartClick: () => void
  isActive: (href: string) => boolean
  isSticky: boolean
  mobileRow: React.ReactNode
  mobileMenu: React.ReactNode
  customer?: HeaderCustomer | null
  subdomain: string
  btnClass: string
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isFixed, setIsFixed] = useState(false)

  useEffect(() => {
    if (!isSticky) {
      setIsFixed(false)
      return
    }
    const onScroll = () => {
      const el = wrapperRef.current
      if (!el) return
      setIsFixed(window.scrollY > el.offsetHeight + 16)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isSticky])

  const posClass = isFixed ? 'fixed top-0 left-0 right-0' : 'absolute top-0 left-0 right-0'

  return (
    <div ref={wrapperRef} className={`${posClass} z-50 px-3 sm:px-5 lg:px-8 pt-3 sm:pt-4 transition-all duration-300`}>
      <header
        className="max-w-7xl mx-auto rounded-2xl backdrop-blur-md shadow-xl"
        style={{
          backgroundColor: isFixed ? 'rgba(12,12,12,0.92)' : 'rgba(12,12,12,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="px-4 sm:px-6">
          {mobileRow}
          <div className="hidden lg:flex items-center justify-between py-5">
            <div className="flex-shrink-0">
              <RestaurantName restaurant={restaurant} theme={theme} />
            </div>
            <NavLinks pages={pages} theme={theme} isActive={isActive} />
            <div className="flex-shrink-0 flex items-center gap-2">
              <AccountButton theme={theme} customer={customer} subdomain={subdomain} btnClass={btnClass} />
              <CtaButton theme={theme} cartItemCount={cartItemCount} onCartClick={onCartClick} />
            </div>
          </div>
          {mobileMenu}
        </div>
      </header>
    </div>
  )
}

function CenteredHeader({ restaurant, theme, pages, cartItemCount, onCartClick, isActive, isSticky, mobileRow, mobileMenu, customer, subdomain, btnClass }: {
  restaurant: HeaderProps['restaurant']
  theme: HeaderProps['theme']
  pages: HeaderProps['pages']
  cartItemCount: number
  onCartClick: () => void
  isActive: (href: string) => boolean
  isSticky: boolean
  mobileRow: React.ReactNode
  mobileMenu: React.ReactNode
  customer?: HeaderCustomer | null
  subdomain: string
  btnClass: string
}) {
  const posClass = isSticky ? 'sticky top-0' : 'relative'
  return (
    <header
      className={`${posClass} z-50`}
      style={{ backgroundColor: '#0e1416', borderBottom: '1px solid rgba(255,255,255,0.12)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {mobileRow}
        <div className="hidden lg:flex flex-col items-center py-4 gap-3">
          <RestaurantName restaurant={restaurant} theme={theme} size="large" />
          <div className="flex items-center gap-1">
            <NavLinks pages={pages} theme={theme} isActive={isActive} />
            <div className="ml-4 flex items-center gap-2">
              <AccountButton theme={theme} customer={customer} subdomain={subdomain} btnClass={btnClass} />
              <CtaButton theme={theme} cartItemCount={cartItemCount} onCartClick={onCartClick} />
            </div>
          </div>
        </div>
        {mobileMenu}
      </div>
    </header>
  )
}

export function Header({ restaurant, theme, cartItemCount, onCartClick, pages = [], currentPath = '', forceRelative, customer, subdomain }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const design = theme.headerDesign || 'standard'
  const isSticky = forceRelative ? false : (theme.headerSticky ?? true)

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-lg'

  const isActive = (href: string) => {
    if (href === currentPath) return true
    if (currentPath === href + '/') return true
    const page = pages.find(p => p.href === href)
    if (page?.pageType === 'home') return false
    const hrefWithSlash = href.endsWith('/') ? href : href + '/'
    if (currentPath.startsWith(hrefWithSlash)) return true
    return false
  }

  const mobileRow = (
    <MobileRow
      restaurant={restaurant}
      theme={theme}
      cartItemCount={cartItemCount}
      onCartClick={onCartClick}
      onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
    />
  )

  const mobileMenu = (
    <MobileMenuPanel
      isOpen={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      pages={pages}
      restaurant={restaurant}
      theme={theme}
      isActive={isActive}
      cartItemCount={cartItemCount}
      onCartClick={onCartClick}
      btnClass={btnClass}
      customer={customer}
      subdomain={subdomain}
    />
  )

  const sharedProps = {
    restaurant,
    theme,
    pages,
    cartItemCount,
    onCartClick,
    isActive,
    isSticky,
    mobileRow,
    mobileMenu,
    customer,
    subdomain: subdomain || '',
    btnClass,
  }

  if (design === 'floating') return <FloatingHeader {...sharedProps} />
  if (design === 'centered') return <CenteredHeader {...sharedProps} />
  return <StandardHeader {...sharedProps} />
}
