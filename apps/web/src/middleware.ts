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

// Paths d'auth qui ont une page DEDIEE par dashboard.
// Sur un sous-domaine reserve (app/admin/reseller), /login est rewrite (invisible)
// vers la page de login segmentee (ex: app./login -> /restaurant/login).
const DASHBOARD_AUTH_PATHS = ['/login']

// Paths globaux (register, onboarding, etc.) - servis tels quels sur tous les sous-domaines.
const SHARED_GLOBAL_PATHS = [
  '/register',
  '/forgot-password',
  '/reset-password',
  '/setup-password',
  '/onboarding',
]

function isSharedGlobalPath(pathname: string): boolean {
  return SHARED_GLOBAL_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isDashboardAuthPath(pathname: string): boolean {
  return DASHBOARD_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

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

    // Auth path dedie (ex: /login) -> rewrite invisible vers la page segmentee
    // app./login -> /restaurant/login, admin./login -> /platform/login, etc.
    if (isDashboardAuthPath(url.pathname)) {
      const newPath = `${prefix}${url.pathname}`
      return NextResponse.rewrite(new URL(`${newPath}${url.search}`, request.url))
    }

    // Paths globaux partages (register, onboarding, etc.) : pas de rewrite
    if (isSharedGlobalPath(url.pathname)) {
      return NextResponse.next()
    }

    // Si l'URL contient le préfixe explicite (ex: app.*/restaurant/orders),
    // rediriger vers la version propre sans préfixe (ex: app.*/orders)
    if (url.pathname === prefix || url.pathname.startsWith(prefix + '/')) {
      const cleanPath = url.pathname.slice(prefix.length) || '/'
      return NextResponse.redirect(new URL(`${cleanPath}${url.search}`, request.url), 308)
    }

    // Sinon, rewrite transparent : URL propre dans le navigateur,
    // contenu de /restaurant/... (ou /reseller/..., /platform/...) servi
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
