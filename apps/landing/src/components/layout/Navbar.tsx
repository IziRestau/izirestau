'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Menu, X, ArrowRight, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Comment ça marche', href: '#comment-ca-marche' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'Contact', href: '/contact' },
]

function scrollToSection(href: string) {
  const id = href.replace('#', '')
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}


function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-9 h-9" />

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
      aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      <Sun
        className={cn(
          'w-[18px] h-[18px] absolute transition-all duration-500',
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        )}
      />
      <Moon
        className={cn(
          'w-[18px] h-[18px] absolute transition-all duration-500',
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        )}
      />
    </button>
  )
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileOpen])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto mx-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
            isScrolled
              ? 'max-w-5xl mt-4 px-2'
              : 'container px-4 sm:px-6 lg:px-8 mt-0'
          )}
        >
          <nav
            className={cn(
              'relative flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
              isScrolled
                ? 'h-14 px-5 rounded-full bg-background/75 backdrop-blur-xl border border-border dark:border-white/15 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]'
                : 'h-16 lg:h-20 px-0 bg-background/5 backdrop-blur-sm border-b border-border dark:border-white/15'
            )}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div
                className={cn(
                  'rounded-xl bg-primary flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-3deg] group-hover:shadow-lg group-hover:shadow-primary/25',
                  isScrolled ? 'w-7 h-7' : 'w-9 h-9'
                )}
              >
                <span
                  className={cn(
                    'text-white font-extrabold leading-none select-none',
                    isScrolled ? 'text-sm' : 'text-lg'
                  )}
                >
                  iz
                </span>
              </div>
              <span
                className={cn(
                  'font-bold text-foreground tracking-tight transition-all duration-500',
                  isScrolled ? 'text-lg' : 'text-xl'
                )}
              >
                Izi<span className="text-primary">Restau</span>
              </span>
            </Link>

            {/* Navigation desktop — centrée */}
            <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => {
                const isHash = link.href.startsWith('#')
                const isActive = pathname === link.href

                if (isHash) {
                  return (
                    <button
                      key={link.href}
                      onClick={() => scrollToSection(link.href)}
                      className="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    >
                      {link.label}
                    </button>
                  )
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
                      isActive
                        ? 'text-foreground bg-muted/70'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>


            {/* Actions desktop */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <Link
                href="/register"
                className={cn(
                  'group/cta inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-300',
                  'bg-foreground text-background',
                  'hover:bg-foreground/85 active:scale-[0.97]',
                  isScrolled
                    ? 'px-4 py-2 text-sm'
                    : 'px-5 py-2.5 text-sm'
                )}
              >
                Commencer
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
              </Link>
            </div>

            {/* Bouton menu mobile */}
            <div className="flex items-center gap-1 lg:hidden">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
                aria-label={isMobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                <Menu
                  className={cn(
                    'w-5 h-5 absolute transition-all duration-300',
                    isMobileOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100'
                  )}
                />
                <X
                  className={cn(
                    'w-5 h-5 absolute transition-all duration-300',
                    isMobileOpen ? 'opacity-100' : 'opacity-0 -rotate-90 scale-50'
                  )}
                />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Menu mobile */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden transition-all duration-300',
          isMobileOpen ? 'visible' : 'invisible pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-sm transition-opacity duration-300',
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setIsMobileOpen(false)}
        />

        <div
          className={cn(
            'absolute top-0 right-0 h-full w-full max-w-xs bg-background shadow-2xl border-l border-border/30',
            'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            isMobileOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex flex-col h-full pt-20 px-5 pb-8">
            <div className="flex flex-col gap-0.5">
              {navLinks.map((link, index) => {
                const isHash = link.href.startsWith('#')
                const isActive = pathname === link.href
                const commonClass = cn(
                  'px-4 py-3 rounded-xl text-[15px] font-medium transition-colors text-left',
                  isActive
                    ? 'text-foreground bg-muted/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                  'opacity-0',
                  isMobileOpen && 'animate-fade-in'
                )

                if (isHash) {
                  return (
                    <button
                      key={link.href}
                      onClick={() => { scrollToSection(link.href); setIsMobileOpen(false) }}
                      className={commonClass}
                      style={{ animationDelay: `${index * 50 + 80}ms` }}
                    >
                      {link.label}
                    </button>
                  )
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={commonClass}
                    style={{ animationDelay: `${index * 50 + 80}ms` }}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>


            <div className="mt-6 border-t border-border/40" />

            <div
              className={cn(
                'mt-6 flex flex-col gap-2.5 opacity-0',
                isMobileOpen && 'animate-fade-in'
              )}
              style={{ animationDelay: '300ms' }}
            >
              <Link
                href="/register"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-semibold bg-foreground text-background hover:bg-foreground/85 transition-colors"
              >
                Commencer
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://app.izirestau.com/login"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-center px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Se connecter
              </Link>
            </div>

            <div
              className={cn('mt-auto opacity-0', isMobileOpen && 'animate-fade-in')}
              style={{ animationDelay: '400ms' }}
            >
              <p className="text-[11px] text-muted-foreground/60 text-center">
                © {new Date().getFullYear()} IziRestau
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
