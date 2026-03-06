'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { StoreThemeData, StoreCategory, StoreProduct, StoreSettingsData } from '../../../_types'
import { ProductCard } from '../../ProductCard'

interface LatestMenuSectionProps {
  theme: StoreThemeData
  categories: StoreCategory[]
  settings: StoreSettingsData | null
  menuHref: string
  onProductClick: (product: StoreProduct) => void
  sectionData?: Record<string, unknown>
}

export function LatestMenuSection({
  theme,
  categories,
  settings,
  menuHref,
  onProductClick,
  sectionData,
}: LatestMenuSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  if (s('enabled', true) === false) return null

  const title = (s('title', 'Notre Menu') as string)
  const subtitle = (s('subtitle', 'Découvrez nos plats signatures') as string)
  const maxProducts = (s('maxProducts', 6) as number)
  const showViewAll = s('showViewAll', true) !== false
  const viewAllText = (s('viewAllText', 'Voir tout le menu') as string)

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '')

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const activeProducts = activeCategory
    ? (categories.find(c => c.id === activeCategory)?.products || []).slice(0, maxProducts)
    : categories.flatMap(c => c.products).slice(0, maxProducts)

  return (
    <section className="py-16 sm:py-20" style={{ backgroundColor: '#0C0C0C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: `'${theme.headingFont}', serif` }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm sm:text-base text-white/50 mt-3 max-w-lg mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
                style={
                  activeCategory === cat.id
                    ? { backgroundColor: theme.primaryColor, color: '#0C0C0C' }
                    : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {activeProducts.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <p className="text-lg">Aucun produit dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {activeProducts.map((product: StoreProduct) => (
              <ProductCard
                key={product.id}
                product={product}
                theme={theme}
                settings={settings}
                onClick={() => onProductClick(product)}
              />
            ))}
          </div>
        )}

        {showViewAll && (
          <div className="text-center mt-10">
            <Link
              href={menuHref}
              className={`inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold transition-all hover:opacity-90 border ${btnClass}`}
              style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
            >
              {viewAllText}
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
