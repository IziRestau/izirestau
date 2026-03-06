'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  LayoutDashboard, 
  Store, 
  BarChart3, 
  FileText, 
  Settings, 
  User, 
  HelpCircle,
  CreditCard,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface SearchItem {
  label: string
  href: string
  icon: typeof Search
  category: string
  keywords?: string[]
}

const searchItems: SearchItem[] = [
  { label: 'Dashboard', href: '/reseller', icon: LayoutDashboard, category: 'Pages', keywords: ['accueil', 'home', 'tableau de bord'] },
  { label: 'Restaurants', href: '/reseller/restaurants', icon: Store, category: 'Pages', keywords: ['sites', 'clients', 'etablissements'] },
  { label: 'Analytics', href: '/reseller/analytics', icon: BarChart3, category: 'Pages', keywords: ['statistiques', 'stats', 'graphiques', 'revenus'] },
  { label: 'Ma Licence', href: '/reseller/license', icon: CreditCard, category: 'Facturation', keywords: ['abonnement', 'plan', 'subscription'] },
  { label: 'Factures', href: '/reseller/invoices', icon: FileText, category: 'Facturation', keywords: ['paiements', 'invoices', 'billing'] },
  { label: 'Parametres', href: '/reseller/settings', icon: Settings, category: 'Parametres', keywords: ['profil', 'compte', 'configuration'] },
  { label: 'Mon Profil', href: '/reseller/settings?tab=profile', icon: User, category: 'Parametres', keywords: ['informations', 'avatar', 'photo'] },
  { label: 'Organisation', href: '/reseller/settings?tab=organization', icon: Store, category: 'Parametres', keywords: ['entreprise', 'societe', 'business'] },
  { label: 'Securite', href: '/reseller/settings?tab=security', icon: Settings, category: 'Parametres', keywords: ['mot de passe', 'password', '2fa', 'authentification'] },
  { label: 'Paiements', href: '/reseller/settings?tab=payments', icon: CreditCard, category: 'Parametres', keywords: ['moneroo', 'api', 'cle'] },
  { label: 'Support', href: '/reseller/support', icon: HelpCircle, category: 'Aide', keywords: ['aide', 'help', 'contact', 'assistance'] },
]

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  const filteredItems = searchItems.filter(item => {
    const query = searchQuery.toLowerCase()
    if (!query) return true
    return (
      item.label.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.keywords?.some(k => k.toLowerCase().includes(query))
    )
  })

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, SearchItem[]>)

  const flatItems = Object.values(groupedItems).flat()

  const handleSelect = (href: string) => {
    onClose()
    router.push(href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % flatItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length)
    } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
      e.preventDefault()
      handleSelect(flatItems[selectedIndex].href)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden [&>button]:hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Search size={20} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher pages, parametres, aide..."
            className="flex-1 text-[15px] outline-none placeholder:text-gray-400"
            autoFocus
          />
          <kbd className="px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-500 font-medium">ESC</kbd>
        </div>
        
        <div className="max-h-[450px] overflow-y-auto p-3">
          {flatItems.length === 0 ? (
            <div className="py-12 text-center">
              <Search size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Aucun resultat trouve</p>
              <p className="text-gray-400 text-xs mt-1">Essayez une autre recherche</p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-3">
                <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                {items.map((item) => {
                  const Icon = item.icon
                  const itemIndex = flatItems.findIndex(i => i.href === item.href)
                  const isSelected = itemIndex === selectedIndex
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${
                        isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        <Icon size={18} className={isSelected ? 'text-emerald-600' : 'text-gray-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[14px] ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                          {item.label}
                        </span>
                      </div>
                      {isSelected && (
                        <kbd className="px-2 py-0.5 bg-white rounded border border-gray-200 text-[10px] text-gray-400">
                          Enter
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px]">↑↓</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px]">Enter</kbd>
              selectionner
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px]">Esc</kbd>
              fermer
            </span>
          </div>
          <span className="text-gray-400">Ctrl+K</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
