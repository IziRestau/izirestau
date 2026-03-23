import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'iziresto.com'
  
  const mainDomains = [
    'localhost:3000',
    'localhost',
    '127.0.0.1:3000',
    '127.0.0.1',
    `app.${rootDomain}`,
    rootDomain,
    `www.${rootDomain}`,
  ]

  const adminDomains = [
    `admin.${rootDomain}`,
  ]

  const subdomain = hostname.split('.')[0]
  
  const isMainDomain = mainDomains.some(domain => 
    hostname === domain || hostname.startsWith(domain.split('.')[0] + ':')
  )
  
  const isAdminDomain = adminDomains.some(domain => 
    hostname === domain || hostname.startsWith('admin')
  )

  const isRestaurantSubdomain = !isMainDomain && 
                                !isAdminDomain &&
                                subdomain !== 'app' && 
                                subdomain !== 'www' &&
                                subdomain !== 'admin' &&
                                subdomain !== 'localhost' &&
                                subdomain !== '127'

  const querySubdomain = url.searchParams.get('subdomain')
  const hasQuerySubdomain = querySubdomain && querySubdomain.length > 0

  if (isAdminDomain) {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/platform', request.url))
    }
    if (url.pathname === '/login') {
      return NextResponse.rewrite(new URL('/platform/login', request.url))
    }
    return NextResponse.rewrite(new URL(`/platform${url.pathname}`, request.url))
  }

  if (isRestaurantSubdomain) {
    const searchParams = new URLSearchParams(url.searchParams)
    searchParams.set('subdomain', subdomain)
    
    if (url.pathname.startsWith('/admin')) {
      const adminPath = url.pathname.replace('/admin', '') || '/'
      
      if (adminPath === '/login') {
        return NextResponse.rewrite(new URL(`/restaurant/(auth)/login?${searchParams}`, request.url))
      }
      if (adminPath === '/forgot-password') {
        return NextResponse.rewrite(new URL(`/restaurant/(auth)/forgot-password?${searchParams}`, request.url))
      }
      if (adminPath === '/reset-password') {
        return NextResponse.rewrite(new URL(`/restaurant/(auth)/reset-password?${searchParams}`, request.url))
      }
      
      if (adminPath === '/' || adminPath === '') {
        return NextResponse.rewrite(new URL(`/restaurant?${searchParams}`, request.url))
      }
      return NextResponse.rewrite(new URL(`/restaurant${adminPath}?${searchParams}`, request.url))
    }
    
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL(`/store/${subdomain}?${searchParams}`, request.url))
    }
    
    return NextResponse.rewrite(new URL(`/store/${subdomain}${url.pathname}?${searchParams}`, request.url))
  }

  // Domaines personnalisés revendeurs (custom domains)
  // Si ce n'est pas un domaine principal, admin ou sous-domaine restaurant,
  // c'est potentiellement un domaine personnalisé de revendeur
  const isCustomDomain = !isMainDomain && 
                         !isAdminDomain && 
                         !isRestaurantSubdomain &&
                         !hostname.includes(rootDomain)

  if (isCustomDomain) {
    // Router vers la vitrine publique avec le domaine comme identifiant
    const customDomain = hostname.replace(/:\d+$/, '') // Enlever le port si présent
    
    if (url.pathname === '/' || url.pathname === '') {
      return NextResponse.rewrite(new URL(`/showcase/${customDomain}`, request.url))
    }
    
    if (url.pathname.startsWith('/checkout')) {
      return NextResponse.rewrite(new URL(`/showcase/${customDomain}${url.pathname}`, request.url))
    }
    
    if (url.pathname.startsWith('/onboarding')) {
      return NextResponse.rewrite(new URL(`/showcase/${customDomain}${url.pathname}`, request.url))
    }
    
    // Autres chemins sur domaine personnalisé
    return NextResponse.rewrite(new URL(`/showcase/${customDomain}${url.pathname}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
