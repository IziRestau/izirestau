export interface TenantInfo {
  subdomain: string | null
  isMainDomain: boolean
  isRestaurant: boolean
}

export function getTenantFromHeaders(hostname: string): TenantInfo {
  const mainDomains = [
    'localhost:3000',
    'localhost',
    '127.0.0.1:3000',
    '127.0.0.1',
    'app.iziresto.com',
    'iziresto.com',
    'www.iziresto.com',
  ]

  const isMainDomain = mainDomains.some(domain => hostname.includes(domain))
  const subdomain = hostname.split('.')[0]
  
  const isRestaurant = !isMainDomain && 
                       subdomain !== 'app' && 
                       subdomain !== 'www' &&
                       subdomain !== 'localhost' &&
                       !subdomain.startsWith('127')

  return {
    subdomain: isRestaurant ? subdomain : null,
    isMainDomain: !isRestaurant,
    isRestaurant,
  }
}
