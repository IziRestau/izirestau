import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Map des sous-domaines réservés vers leur path interne dans Next.js.
// Les rewrites sont transparents : l'URL dans le navigateur ne change pas.
const SUBDOMAIN_APP_MAP: Record<string, string> = {
  app: '/restaurant',
  reseller: '/reseller',
  admin: '/platform',
}

const RESERVED_SUBDOMAINS = new Set(['app', 'reseller', 'admin', 'www', 'api', 'cdn'])

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'iziresto.com'

  // Local dev : pas de rewrite
  if (hostname.includes('localhost') || hostname.startsWith('127.0.0.1')) {
    return NextResponse.next()
  }

  const hostNoPort = hostname.replace(/:\d+$/, '')
  const isRootDomain = hostNoPort === rootDomain || hostNoPort === `www.${rootDomain}`
  const isOurDomain = hostNoPort === rootDomain || hostNoPort.endsWith(`.${rootDomain}`)
  const subdomain = hostNoPort.split('.')[0]

  // 1) Sous-domaine réservé (app / reseller / admin) -> rewrite vers son path
  if (isOurDomain && SUBDOMAIN_APP_MAP[subdomain]) {
    const prefix = SUBDOMAIN_APP_MAP[subdomain]

    // Évite la double-application du préfixe (ex: /restaurant/orders sur app.* deviendrait /restaurant/restaurant/orders)
    if (url.pathname.startsWith(prefix + '/') || url.pathname === prefix) {
      return NextResponse.next()
    }

    const newPath = `${prefix}${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(new URL(`${newPath}${url.search}`, request.url))
  }

  // 2) Domaine racine (izirestau.online / www.izirestau.online) : passthrough
  // En production cette route n'est normalement pas hit (le DNS pointe sur le projet landing).
  if (isRootDomain) {
    return NextResponse.next()
  }

  // 3) Sous-domaine de restaurant (vitrine publique sur <resto>.izirestau.online)
  if (isOurDomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    const searchParams = new URLSearchParams(url.searchParams)
    searchParams.set('subdomain', subdomain)

    // Anciennes routes /admin/... du sous-domaine restaurant -> dashboard restaurant
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

  // 4) Domaine personnalisé (revendeur avec son propre domaine)
  if (!isOurDomain) {
    const customDomain = hostNoPort

    if (url.pathname === '/' || url.pathname === '') {
      return NextResponse.rewrite(new URL(`/showcase/${customDomain}`, request.url))
    }
    return NextResponse.rewrite(new URL(`/showcase/${customDomain}${url.pathname}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
