'use client'

import { ShoppingBag, Menu, User, LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { HeaderCustomer } from '../_types'
import Link from 'next/link'
import type { HeaderProps } from '../_types'
import { MobileMenuPanel } from './MobileMenuPanel'

function LogoBlock({ restaurant, theme }: { restaurant: HeaderProps['restaurant']; theme: HeaderProps['theme'] }) {
  return (
    <div className="flex items-center gap-3">
      {restaurant.logo ? (
        <img
          src={restaurant.logo}
          alt={restaurant.name}
          className="h-10 w-10 rounded-xl object-cover"
        />
      ) : (
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {restaurant.name.substring(0, 2).toUpperCase()}
        </div>
      )}
      <span
        className="font-semibold text-lg truncate max-w-[120px] sm:max-w-none"
        style={{
          fontFamily: `'${theme.headingFont}', sans-serif`,
          color: theme.textColor,
        }}
      >
        {restaurant.name}
      </span>
    </div>
  )
}

function CartButton({ theme, cartItemCount, onCartClick }: {
  theme: HeaderProps['theme']
  cartItemCount: number
  onCartClick: () => void
}) {
  return (
    <button
      onClick={onCartClick}
      className="relative p-2.5 rounded-xl transition-colors hover:opacity-80"
      style={{ color: theme.textColor }}
      aria-label="Panier"
    >
      <ShoppingBag size={20} />
      {cartItemCount > 0 && (
        <span
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: theme.primaryColor }}
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
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-all hover:opacity-90 ${btnClass}`}
          style={{ backgroundColor: theme.primaryColor }}
        >
          <User size={18} />
          <span className="hidden sm:inline max-w-[100px] truncate">{customer.firstName}</span>
          <ChevronDown size={14} className={`hidden sm:block transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-lg overflow-hidden z-50"
            style={{ backgroundColor: theme.backgroundColor, borderColor: `${theme.textColor}15` }}
          >
            <Link
              href={`/store/${subdomain}/account`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:opacity-80"
              style={{ color: theme.textColor }}
            >
              <User size={16} />
              Mon compte
            </Link>
            <div className="border-t" style={{ borderColor: `${theme.textColor}10` }} />
            <Link
              href={`/store/${subdomain}/logout`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:opacity-80"
              style={{ color: theme.textColor }}
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
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 ${btnClass}`}
      style={{ backgroundColor: theme.primaryColor }}
    >
      <User size={18} />
      <span className="hidden sm:inline">Connexion</span>
    </Link>
  )
}


function NavLinks({ pages, theme, isActive }: {
  pages: HeaderProps['pages']
  theme: HeaderProps['theme']
  isActive: (href: string) => boolean
}) {
  return (
    <nav className="hidden md:flex items-center gap-1">
      {pages.map(page => (
        <Link
          key={page.slug}
          href={page.href}
          className="text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          style={{
            color: isActive(page.href) ? theme.primaryColor : theme.textColor,
            backgroundColor: isActive(page.href) ? `${theme.primaryColor}10` : 'transparent',
          }}
        >
          {page.title}
        </Link>
      ))}
    </nav>
  )
}

interface FloatingHeaderProps {
  isSticky: boolean
  bgColor: string
  txtColor: string
  mobileRow: React.ReactNode
  mobileMenu: React.ReactNode
  logoPos: string
  pages: HeaderProps['pages']
  themeOverride: HeaderProps['theme']
  theme: HeaderProps['theme']
  restaurant: HeaderProps['restaurant']
  cartItemCount: number
  onCartClick: () => void
  btnClass: string
  isActive: (href: string) => boolean
  customer?: HeaderCustomer | null
  subdomain: string
}

function FloatingHeader({
  isSticky, bgColor, txtColor, mobileRow, mobileMenu,
  logoPos, pages = [], themeOverride, theme, restaurant,
  cartItemCount, onCartClick, btnClass, isActive, customer, subdomain,
}: FloatingHeaderProps) {
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
      const threshold = el.offsetHeight + 12
      setIsFixed(window.scrollY > threshold)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isSticky])

  const posClass = isFixed
    ? 'fixed top-0 left-0 right-0'
    : 'absolute top-0 left-0 right-0'

  return (
    <div ref={wrapperRef} className={`${posClass} z-50 px-3 sm:px-6 pt-3 transition-all duration-200`}>
      <header
        className="max-w-7xl mx-auto rounded-2xl border backdrop-blur-md shadow-sm"
        style={{
          backgroundColor: bgColor,
          borderColor: `${txtColor}10`,
        }}
      >
        <div className="px-4 sm:px-6">
          {mobileRow}
          {logoPos === 'center' ? (
            <div className="hidden md:grid grid-cols-3 items-center h-16">
              <NavLinks pages={pages} theme={themeOverride} isActive={isActive} />
              <div className="flex justify-center">
                <LogoBlock restaurant={restaurant} theme={themeOverride} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <CartButton theme={theme} cartItemCount={cartItemCount} onCartClick={onCartClick} />
                <AccountButton theme={theme} customer={customer} subdomain={subdomain} btnClass={btnClass} />
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center justify-between h-16">
              <LogoBlock restaurant={restaurant} theme={themeOverride} />
              <NavLinks pages={pages} theme={themeOverride} isActive={isActive} />
              <div className="flex items-center gap-2">
                <CartButton theme={theme} cartItemCount={cartItemCount} onCartClick={onCartClick} />
                <AccountButton theme={theme} customer={customer} subdomain={subdomain} btnClass={btnClass} />
              </div>
            </div>
          )}
          {mobileMenu}
        </div>
      </header>
    </div>
  )
}

export function Header({ restaurant, theme, cartItemCount, onCartClick, pages = [], currentPath = '', forceRelative, customer, subdomain }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const design = theme.headerDesign || 'standard'
  const logoPos = theme.logoPosition || 'left'
  const isSticky = forceRelative ? false : (theme.headerSticky ?? true)
  const isFloating = design === 'floating'
  const bgOpacity = isFloating ? (theme.headerBgOpacity ?? 25) : 100
  const txtColor = theme.headerTextColor || theme.textColor

  const opacityHex = Math.round((bgOpacity / 100) * 255).toString(16).padStart(2, '0')
  const bgColor = `${theme.backgroundColor}${opacityHex}`

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const isActive = (href: string) => {
    if (href === currentPath) return true
    if (currentPath === href + '/') return true
    const page = pages.find(p => p.href === href)
    if (page?.pageType === 'home') return false
    const hrefWithSlash = href.endsWith('/') ? href : href + '/'
    if (currentPath.startsWith(hrefWithSlash)) return true
    return false
  }

  const themeOverride = { ...theme, textColor: txtColor }

  const mobileRow = (
    <div className="flex items-center justify-between h-16 md:hidden">
      <LogoBlock restaurant={restaurant} theme={themeOverride} />
      <div className="flex items-center gap-1">
        <CartButton theme={theme} cartItemCount={cartItemCount} onCartClick={onCartClick} />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: txtColor }}
        >
          <Menu size={22} />
        </button>
      </div>
    </div>
  )

  const mobileMenu = (
    <MobileMenuPanel
      isOpen={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      pages={pages}
      restaurant={restaurant}
      theme={themeOverride}
      isActive={isActive}
      cartItemCount={cartItemCount}
      onCartClick={onCartClick}
      btnClass={btnClass}
      customer={customer}
      subdomain={subdomain}
    />
  )

  if (design === 'floating') {
    return (
      <FloatingHeader
        isSticky={isSticky}
        bgColor={bgColor}
        txtColor={txtColor}
        mobileRow={mobileRow}
        mobileMenu={mobileMenu}
        logoPos={logoPos}
        pages={pages}
        themeOverride={themeOverride}
        theme={theme}
        restaurant={restaurant}
        cartItemCount={cartItemCount}
        onCartClick={onCartClick}
        btnClass={btnClass}
        isActive={isActive}
        customer={customer}
        subdomain={subdomain}
      />
    )
  }

  if (design === 'centered') {
    const posClass = isSticky ? 'sticky top-0' : 'relative'
    return (
      <header
        className={`${posClass} z-50 border-b backdrop-blur-md`}
        style={{
          backgroundColor: bgColor,
          borderColor: `${txtColor}10`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {mobileRow}
          <div className="hidden md:flex flex-col items-center py-3 gap-2">
            <div className="flex items-center gap-3">
              {restaurant.logo ? (
                <img src={restaurant.logo} alt={restaurant.name} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {restaurant.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span
                className="font-semibold text-lg"
                style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: txtColor }}
              >
                {restaurant.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {pages.map(page => (
                <Link
                  key={page.slug}
                  href={page.href}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    color: isActive(page.href) ? theme.primaryColor : txtColor,
                    backgroundColor: isActive(page.href) ? `${theme.primaryColor}10` : 'transparent',
                  }}
                >
                  {page.title}
                </Link>
              ))}
              <div className="ml-3 flex items-center gap-2">
                <CartButton theme={theme} cartItemCount={cartItemCount} onCartClick={onCartClick} />
                <AccountButton theme={theme} customer={customer} subdomain={subdomain} btnClass={btnClass} />
              </div>
            </div>
          </div>
          {mobileMenu}
        </div>
      </header>
    )
  }

  const posClass = isSticky ? 'sticky top-0' : 'relative'
  return (
    <header
      className={`${posClass} z-50 border-b backdrop-blur-md`}
      style={{
        backgroundColor: bgColor,
        borderColor: `${txtColor}10`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {mobileRow}
        {logoPos === 'center' ? (
          <div className="hidden md:grid grid-cols-3 items-center h-16">
            <NavLinks pages={pages} theme={themeOverride} isActive={isActive} />
            <div className="flex justify-center">
              <LogoBlock restaurant={restaurant} theme={themeOverride} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <CartButton theme={theme} cartItemCount={cartItemCount} onCartClick={onCartClick} />
              <AccountButton theme={theme} customer={customer} subdomain={subdomain} btnClass={btnClass} />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center justify-between h-16">
            <LogoBlock restaurant={restaurant} theme={themeOverride} />
            <NavLinks pages={pages} theme={themeOverride} isActive={isActive} />
            <div className="flex items-center gap-2">
              <CartButton theme={theme} cartItemCount={cartItemCount} onCartClick={onCartClick} />
              <AccountButton theme={theme} customer={customer} subdomain={subdomain} btnClass={btnClass} />
            </div>
          </div>
        )}
        {mobileMenu}
      </div>
    </header>
  )
}
