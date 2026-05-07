'use client'

import { useEffect, useState } from 'react'

export type SubdomainContext = 'app' | 'admin' | 'reseller' | null

const RESERVED: ReadonlyArray<SubdomainContext> = ['app', 'admin', 'reseller']

export function getSubdomainContext(): SubdomainContext {
  if (typeof window === 'undefined') return null
  const host = window.location.hostname
  if (host === 'localhost' || host.startsWith('127.0.0.1')) return null

  const sub = host.split('.')[0] as SubdomainContext
  return RESERVED.includes(sub) ? sub : null
}

export function useSubdomainContext(): SubdomainContext {
  const [ctx, setCtx] = useState<SubdomainContext>(null)
  useEffect(() => {
    setCtx(getSubdomainContext())
  }, [])
  return ctx
}

interface ContextConfig {
  title: string
  subtitle: string
  allowedTypes: ReadonlyArray<string> | null
  registerEnabled: boolean
}

export const SUBDOMAIN_CONFIG: Record<NonNullable<SubdomainContext> | 'default', ContextConfig> = {
  app: {
    title: 'Espace Restaurant',
    subtitle: 'Connectez-vous a votre dashboard restaurant',
    allowedTypes: ['RESTAURANT', 'DRIVER'],
    registerEnabled: false,
  },
  admin: {
    title: 'Administration IziResto',
    subtitle: 'Acces reserve aux super administrateurs',
    allowedTypes: ['SUPER_ADMIN'],
    registerEnabled: false,
  },
  reseller: {
    title: 'Espace Revendeur',
    subtitle: 'Connectez-vous a votre espace revendeur',
    allowedTypes: ['RESELLER'],
    registerEnabled: true,
  },
  default: {
    title: 'Bon retour parmi nous',
    subtitle: 'Connectez-vous a votre espace',
    allowedTypes: null,
    registerEnabled: true,
  },
}

export function getContextConfig(ctx: SubdomainContext): ContextConfig {
  return ctx ? SUBDOMAIN_CONFIG[ctx] : SUBDOMAIN_CONFIG.default
}
