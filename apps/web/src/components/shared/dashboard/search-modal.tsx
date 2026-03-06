'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  Settings,
  FileText,
  BarChart3,
  HelpCircle,
} from 'lucide-react'

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const quickActions = [
  { label: 'Tableau de bord', href: '/reseller', icon: LayoutDashboard, group: 'Navigation' },
  { label: 'Mes sites', href: '/reseller/sites', icon: Store, group: 'Navigation' },
  { label: 'Clients', href: '/reseller/clients', icon: Users, group: 'Navigation' },
  { label: 'Facturation', href: '/reseller/billing', icon: CreditCard, group: 'Navigation' },
  { label: 'Statistiques', href: '/reseller/analytics', icon: BarChart3, group: 'Navigation' },
  { label: 'Parametres', href: '/reseller/settings', icon: Settings, group: 'Parametres' },
  { label: 'Documentation', href: '/docs', icon: FileText, group: 'Aide' },
  { label: 'Support', href: '/support', icon: HelpCircle, group: 'Aide' },
]

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const handleSelect = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  const filteredActions = quickActions.filter((action) =>
    action.label.toLowerCase().includes(search.toLowerCase())
  )

  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.group]) {
      acc[action.group] = []
    }
    acc[action.group].push(action)
    return acc
  }, {} as Record<string, typeof quickActions>)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Rechercher une page, une action..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>Aucun resultat trouve.</CommandEmpty>
          {Object.entries(groupedActions).map(([group, actions], index) => (
            <div key={group}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {actions.map((action) => {
                  const Icon = action.icon
                  return (
                    <CommandItem
                      key={action.href}
                      value={action.label}
                      onSelect={() => handleSelect(action.href)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                        <Icon size={16} className="text-gray-600" />
                      </div>
                      <span>{action.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
