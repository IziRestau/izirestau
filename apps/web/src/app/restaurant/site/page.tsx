'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantStore } from '@/stores/restaurant.store'
import { DashboardLayout } from '@/components/shared/dashboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useRestaurantNavigation } from '@/hooks/use-restaurant-navigation'
import { api, apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  Globe,
  ExternalLink,
  Palette,
  Image as ImageIcon,
  FileText,
  Mail,
  Copy,
  Check,
  AlertCircle,
  ArrowUpRight,
  Link2,
  Store,
  Settings2,
} from 'lucide-react'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function SitePage() {
  const { accessToken } = useAuthStore()
  const { organization, restaurants, currentRestaurantId, switchRestaurant } = useRestaurantStore()
  const navigation = useRestaurantNavigation()

  const primaryColor = organization?.primaryColor || '#10b981'
  const primaryBgLight = hexToRgba(primaryColor, 0.1)
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant-site-overview', currentRestaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const res = await api.restaurant.site.getOverview()
      return res.data
    },
    enabled: !!accessToken && !!currentRestaurantId,
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading && !data) {
    return (
      <PageSkeleton
        navigation={navigation}
        basePath="/restaurant"
        title="Mon Site"
        variant="dashboard"
      />
    )
  }

  const siteUrl = data?.site?.subdomain
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/store/${data.site.subdomain}/menu`
    : null

  const handleCopyUrl = () => {
    if (siteUrl) {
      navigator.clipboard.writeText(siteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const quickLinks = [
    {
      label: 'Apparence',
      description: 'Couleurs, polices et style',
      href: '/restaurant/site/theme',
      icon: Palette,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
    },
    {
      label: 'Bannières',
      description: 'Carrousel de la page d\'accueil',
      href: '/restaurant/site/banners',
      icon: ImageIcon,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Pages',
      description: 'Créez et gérez vos pages',
      href: '/restaurant/site/pages',
      icon: FileText,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
    {
      label: 'SEO',
      description: 'Référencement et métadonnées',
      href: '/restaurant/site/settings?tab=seo',
      icon: Globe,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Domaine',
      description: 'Nom de domaine personnalisé',
      href: '/restaurant/site/settings?tab=domain',
      icon: Link2,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
    },
    {
      label: 'Réglages',
      description: 'Configuration générale du site',
      href: '/restaurant/site/settings',
      icon: Settings2,
      iconBg: 'bg-gray-50',
      iconColor: 'text-gray-500',
    },
    {
      label: 'Marketplace',
      description: 'Découvrez de nouveaux thèmes',
      href: '/restaurant/site/theme/marketplace',
      icon: Store,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
    },
  ]

  return (
    <DashboardLayout
      navigation={navigation}
      basePath="/restaurant"
      logoText={organization?.name || 'Restaurant'}
      primaryColor={primaryColor}
      restaurants={restaurants}
      currentRestaurantId={currentRestaurantId}
      onSwitchRestaurant={(id) => accessToken && switchRestaurant(accessToken, id)}
    >
      <PageHeader
        title="Mon Site"
        subtitle="Gérez votre site web et votre présence en ligne"
        icon={Globe}
        badge={data?.site ? { text: data.site.status === 'PUBLISHED' ? 'En ligne' : 'Brouillon', variant: data.site.status === 'PUBLISHED' ? 'success' : 'warning' } : undefined}
        actions={
          siteUrl ? (
            <Button
              size="sm"
              className="text-white h-9 rounded-xl gap-1.5 text-xs"
              style={{ backgroundColor: primaryColor }}
              asChild
            >
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
                Voir le site
              </a>
            </Button>
          ) : undefined
        }
      />

      {!data?.site ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucun site configuré</h3>
          <p className="text-sm text-gray-500 max-w-md">
            Votre site n&apos;est pas encore configuré. Contactez votre revendeur pour activer votre présence en ligne.
          </p>
        </div>
      ) : (
        <>
          {/* URL Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: primaryBgLight }}
              >
                <Globe className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Adresse de votre site</p>
                {siteUrl && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">{siteUrl}</p>
                )}
                {data.site.customDomain && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Domaine personnalisé : {data.site.customDomain}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {siteUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs rounded-xl h-9"
                    onClick={handleCopyUrl}
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copied ? 'Copié' : 'Copier'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
            <div className="group bg-white rounded-2xl p-5 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: primaryBgLight }}
              >
                <ImageIcon className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-gray-900">{data.stats.banners}</div>
                <div className="text-sm text-gray-500">Bannières</div>
              </div>
              <Link
                href="/restaurant/site/banners"
                className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <ArrowUpRight size={16} style={{ color: primaryColor }} />
              </Link>
            </div>

            <div className="group bg-white rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-gray-900">{data.stats.pages}</div>
                <div className="text-sm text-gray-500">Pages</div>
              </div>
              <Link
                href="/restaurant/site/pages"
                className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <ArrowUpRight size={16} style={{ color: primaryColor }} />
              </Link>
            </div>

            <div className="group bg-white rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-50">
                <Mail className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-gray-900">{data.stats.messages}</div>
                <div className="text-sm text-gray-500">Messages</div>
              </div>
              <Link
                href="/restaurant/site/messages"
                className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <ArrowUpRight size={16} style={{ color: primaryColor }} />
              </Link>
            </div>

            <div className="group bg-white rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-50">
                <Mail className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-gray-900">{data.stats.unreadMessages}</div>
                <div className="text-sm text-gray-500">Non lus</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Gestion du site</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${link.iconBg}`}>
                      <Icon size={18} className={link.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{link.label}</p>
                      <p className="text-xs text-gray-500 truncate">{link.description}</p>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
                    />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Theme Preview */}
          {data.theme && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Thème actif</h2>
                <Link
                  href="/restaurant/site/theme"
                  className="text-xs font-medium hover:underline"
                  style={{ color: primaryColor }}
                >
                  Modifier
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: data.theme.primaryColor }}
                >
                  {data.theme.baseTheme.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{data.theme.baseTheme}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: data.theme.primaryColor }}
                    />
                    <span className="text-xs text-gray-400">{data.theme.primaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
