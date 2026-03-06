'use client'

import { cn } from '@/lib/utils'
import {
  FileText,
  DollarSign,
  Package,
  Leaf,
  Settings2,
  Layers,
  Settings,
} from 'lucide-react'

interface ProductFormSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  primaryColor: string
  hasVariants: boolean
  hasModifiers: boolean
}

const sections = [
  { id: 'general', label: 'Informations', icon: FileText },
  { id: 'pricing', label: 'Tarification', icon: DollarSign },
  { id: 'inventory', label: 'Inventaire', icon: Package },
  { id: 'nutrition', label: 'Nutrition', icon: Leaf },
  { id: 'modifiers', label: 'Options', icon: Settings2 },
  { id: 'variants', label: 'Variantes', icon: Layers },
  { id: 'settings', label: 'Parametres', icon: Settings },
]

export function ProductFormSidebar({
  activeSection,
  onSectionChange,
  primaryColor,
  hasVariants,
  hasModifiers,
}: ProductFormSidebarProps) {
  const handleClick = (sectionId: string) => {
    onSectionChange(sectionId)
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      const headerOffset = 185
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  return (
    <nav className="bg-white rounded-2xl border border-gray-100 p-2">
      <ul className="space-y-1">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          const hasBadge = (section.id === 'variants' && hasVariants) || 
                          (section.id === 'modifiers' && hasModifiers)

          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => handleClick(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                style={isActive ? { backgroundColor: primaryColor } : undefined}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{section.label}</span>
                {hasBadge && (
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isActive ? 'bg-white/50' : ''
                    )}
                    style={!isActive ? { backgroundColor: primaryColor } : undefined}
                  />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
