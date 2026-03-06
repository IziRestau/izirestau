'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ShoppingBag, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import type { HeaderProps, HeaderCustomer } from '../_types'

interface MobileMenuPanelProps {
  isOpen: boolean
  onClose: () => void
  pages: HeaderProps['pages']
  restaurant: HeaderProps['restaurant']
  theme: HeaderProps['theme']
  isActive: (href: string) => boolean
  cartItemCount: number
  onCartClick: () => void
  btnClass: string
  customer?: HeaderCustomer | null
  subdomain: string
}

export function MobileMenuPanel({
  isOpen,
  onClose,
  pages,
  restaurant,
  theme,
  isActive,
  cartItemCount,
  onCartClick,
  btnClass,
  customer,
  subdomain,
}: MobileMenuPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (typeof window === 'undefined') return null

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[9999] w-[280px] max-w-[85vw] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: theme.backgroundColor || '#ffffff' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: `${theme.textColor}10` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="h-9 w-9 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {restaurant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span
              className="font-semibold text-sm truncate"
              style={{
                fontFamily: `'${theme.headingFont}', sans-serif`,
                color: theme.textColor,
              }}
            >
              {restaurant.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:opacity-70 flex-shrink-0"
            style={{ color: theme.textColor }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-1">
            {pages.map(page => {
              const active = isActive(page.href)
              return (
                <Link
                  key={page.slug}
                  href={page.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: active ? theme.primaryColor : theme.textColor,
                    backgroundColor: active ? `${theme.primaryColor}10` : 'transparent',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: active ? theme.primaryColor : `${theme.textColor}30`,
                    }}
                  />
                  {page.title}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-4 border-t space-y-3"
          style={{ borderColor: `${theme.textColor}10` }}
        >
          <button
            onClick={() => {
              onCartClick()
              onClose()
            }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all hover:opacity-90 border ${btnClass}`}
            style={{ borderColor: `${theme.textColor}20`, color: theme.textColor }}
          >
            <ShoppingBag size={18} />
            Panier
            {cartItemCount > 0 && (
              <span
                className="ml-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {cartItemCount}
              </span>
            )}
          </button>
          {customer ? (
            <div className="space-y-2">
              <Link
                href={`/store/${subdomain}/account`}
                onClick={onClose}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 ${btnClass}`}
                style={{ backgroundColor: theme.primaryColor }}
              >
                <User size={18} />
                Mon compte
              </Link>
              <Link
                href={`/store/${subdomain}/logout`}
                onClick={onClose}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all hover:opacity-80 ${btnClass}`}
                style={{ color: theme.textColor }}
              >
                <LogOut size={18} />
                Déconnexion
              </Link>
            </div>
          ) : (
            <Link
              href={`/store/${subdomain}/login`}
              onClick={onClose}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 ${btnClass}`}
              style={{ backgroundColor: theme.primaryColor }}
            >
              <User size={18} />
              Connexion
            </Link>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
