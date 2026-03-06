'use client'

import { Link2, ExternalLink, Globe, FileText, Home } from 'lucide-react'

interface PageOption {
  id: string
  title: string
  slug: string
  pageType: string | null
  isDefault: boolean
}

interface PermalinksSettingsProps {
  pages: PageOption[]
  subdomain: string | null
  customDomain: string | null
  primaryColor?: string
}

export function PermalinksSettings({
  pages,
  subdomain,
  customDomain,
  primaryColor = '#10b981',
}: PermalinksSettingsProps) {
  const baseUrl = customDomain
    ? `https://${customDomain}`
    : subdomain
    ? `https://${subdomain}.iziresto.com`
    : 'https://votre-site.iziresto.com'

  const getPageUrl = (page: PageOption) => {
    if (page.pageType === 'home') return baseUrl
    if (page.pageType === 'menu') return `${baseUrl}/menu`
    if (page.pageType === 'contact') return `${baseUrl}/contact`
    return `${baseUrl}/${page.slug}`
  }

  const getPageIcon = (pageType: string | null) => {
    if (pageType === 'home') return Home
    return FileText
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Permaliens</h3>
        <p className="text-sm text-gray-500">Structure des URLs de votre site</p>
      </div>

      {/* Structure */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Link2 size={16} style={{ color: primaryColor }} />
          <span>Structure des URLs</span>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <Globe size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Domaine de base</p>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">{baseUrl}</p>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500 mb-2">Format des pages :</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 w-20">Accueil</span>
                <code className="px-2 py-0.5 bg-white rounded border border-gray-200 text-gray-700 font-mono">/</code>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 w-20">Menu</span>
                <code className="px-2 py-0.5 bg-white rounded border border-gray-200 text-gray-700 font-mono">/menu</code>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 w-20">Contact</span>
                <code className="px-2 py-0.5 bg-white rounded border border-gray-200 text-gray-700 font-mono">/contact</code>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 w-20">Custom</span>
                <code className="px-2 py-0.5 bg-white rounded border border-gray-200 text-gray-700 font-mono">/{'{'}<span className="text-emerald-600">slug</span>{'}'}</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des pages */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText size={16} style={{ color: primaryColor }} />
          <span>Vos pages ({pages.length})</span>
        </div>
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Page</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Slug</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pages.map((page) => {
                  const Icon = getPageIcon(page.pageType)
                  return (
                    <tr key={page.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900">{page.title}</span>
                          {page.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">défaut</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-gray-500">{page.slug}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono text-gray-700 truncate max-w-[250px]">
                            {getPageUrl(page)}
                          </code>
                          <a
                            href={getPageUrl(page)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
