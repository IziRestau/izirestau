'use client'

import { createContext, useContext, useEffect, useMemo } from 'react'
import type { StoreThemeData } from '../themes/_types'

interface ThemeContextValue {
  theme: StoreThemeData
}

const DEFAULT_THEME: StoreThemeData = {
  baseTheme: 'default',
  primaryColor: '#FF6B00',
  secondaryColor: '#1A1A1A',
  accentColor: '#FFB800',
  backgroundColor: '#FFFFFF',
  textColor: '#1A1A1A',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  layoutStyle: 'grid',
  headerStyle: 'standard',
  heroTitle: null,
  heroSubtitle: null,
  heroCtaText: 'Voir le menu',
  aboutTitle: null,
  aboutText: null,
  footerText: null,
  announcementText: null,
  announcementActive: false,
  announcementBgColor: null,
  logoPosition: 'left',
  showRatings: true,
  showPrepTime: true,
  showAllergens: true,
  showCuisineTypes: true,
  heroStyle: 'banner',
  heroOverlayOpacity: 40,
  menuStyle: 'grid',
  productCardStyle: 'standard',
  showProductImages: true,
  productConfig: null,
  buttonStyle: 'rounded',
  buttonSize: 'md',
  customCss: null,
  socialLinks: null,
  headerDesign: 'standard',
  headerSticky: true,
  headerTransparent: false,
  headerBgOpacity: 100,
  headerTextColor: '#FFFFFF',
  footerDesign: 'standard',
}

const ThemeContext = createContext<ThemeContextValue>({ theme: DEFAULT_THEME })

interface ThemeProviderProps {
  theme: StoreThemeData | null
  children: React.ReactNode
}

export function StoreThemeProvider({ theme, children }: ThemeProviderProps) {
  const resolvedTheme = useMemo(() => theme ?? DEFAULT_THEME, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--store-primary', resolvedTheme.primaryColor)
    root.style.setProperty('--store-secondary', resolvedTheme.secondaryColor)
    root.style.setProperty('--store-accent', resolvedTheme.accentColor)
    root.style.setProperty('--store-bg', resolvedTheme.backgroundColor)
    root.style.setProperty('--store-text', resolvedTheme.textColor)
    root.style.setProperty('--store-heading-font', resolvedTheme.headingFont)
    root.style.setProperty('--store-body-font', resolvedTheme.bodyFont)

    return () => {
      root.style.removeProperty('--store-primary')
      root.style.removeProperty('--store-secondary')
      root.style.removeProperty('--store-accent')
      root.style.removeProperty('--store-bg')
      root.style.removeProperty('--store-text')
      root.style.removeProperty('--store-heading-font')
      root.style.removeProperty('--store-body-font')
    }
  }, [resolvedTheme])

  useEffect(() => {
    const fonts = new Set([resolvedTheme.headingFont, resolvedTheme.bodyFont])
    const existingLinks = document.querySelectorAll('link[data-store-font]')
    existingLinks.forEach(link => link.remove())

    fonts.forEach(font => {
      if (font === 'Inter') return
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
      link.setAttribute('data-store-font', font)
      document.head.appendChild(link)
    })
  }, [resolvedTheme.headingFont, resolvedTheme.bodyFont])

  useEffect(() => {
    const existingStyle = document.getElementById('store-custom-css')
    if (existingStyle) existingStyle.remove()

    if (resolvedTheme.customCss) {
      const style = document.createElement('style')
      style.id = 'store-custom-css'
      style.textContent = resolvedTheme.customCss
      document.head.appendChild(style)
    }

    return () => {
      const el = document.getElementById('store-custom-css')
      if (el) el.remove()
    }
  }, [resolvedTheme.customCss])

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme }}>
      <div
        className="storefront-root"
        style={{
          fontFamily: `'${resolvedTheme.bodyFont}', sans-serif`,
          backgroundColor: resolvedTheme.backgroundColor,
          color: resolvedTheme.textColor,
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useStoreTheme() {
  return useContext(ThemeContext)
}

export { DEFAULT_THEME }
