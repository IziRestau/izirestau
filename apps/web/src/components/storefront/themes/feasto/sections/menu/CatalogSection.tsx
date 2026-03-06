'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { StoreThemeData, StoreCategory, StoreProduct, StoreSettingsData, ProductCardSectionOverrides } from '../../../_types'
import { ProductCard } from '../../ProductCard'

interface CatalogSectionProps {
  categories: StoreCategory[]
  theme: StoreThemeData
  settings: StoreSettingsData | null
  onProductClick: (product: StoreProduct) => void
  sectionData?: Record<string, unknown>
}

export function CatalogSection({
  categories,
  theme,
  settings,
  onProductClick,
  sectionData,
}: CatalogSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '')
  const tabsRef = useRef<HTMLDivElement>(null)

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' })
    }
  }

  const pc = (theme.productConfig as Record<string, unknown> | null) || {}

  const title = (s('title', 'Notre carte') as string)
  const layout = (pc.menuLayout as string) || 'grid'
  const columns = (pc.gridColumns as string) || '3'
  const gridGap = (pc.gridGap as string) || 'md'
  const showCategoryCount = s('showCategoryCount', true) !== false

  const listImagePosition = (pc.listImagePosition as string) || 'left'

  const cardOverrides: ProductCardSectionOverrides = {
    cardStyle: layout === 'list' ? 'horizontal' : undefined,
    listImagePosition: layout === 'list' ? listImagePosition : undefined,
  }

  const activeProducts = activeCategory
    ? categories.find(c => c.id === activeCategory)?.products || []
    : categories.flatMap(c => c.products)

  const gapClass = gridGap === 'sm' ? 'gap-3' : gridGap === 'lg' ? 'gap-6 sm:gap-8' : 'gap-4 sm:gap-6'

  const gridClass = layout === 'list'
    ? 'flex flex-col gap-2'
    : layout === 'compact'
    ? `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${gapClass}`
    : columns === '4'
    ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${gapClass}`
    : columns === '2'
    ? `grid grid-cols-1 sm:grid-cols-2 ${gapClass}`
    : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gapClass}`

  return (
    <section id="menu" className="py-8 sm:py-12" style={{ backgroundColor: '#0C0C0C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-white"
          style={{ fontFamily: `'${theme.headingFont}', serif` }}
        >
          {title}
        </h2>

        {categories.length > 1 && (
          <div className="relative mb-6 sm:mb-8">
            <button
              onClick={() => scrollTabs('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md border hidden sm:flex"
              style={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
            >
              <ChevronLeft size={16} />
            </button>

            <div
              ref={tabsRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide px-0 sm:px-10"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
                  style={
                    activeCategory === cat.id
                      ? { backgroundColor: theme.primaryColor, color: '#0C0C0C' }
                      : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }
                  }
                >
                  {cat.name}
                  {showCategoryCount && (
                    <span className="ml-1.5 opacity-60">({cat.products.length})</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollTabs('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md border hidden sm:flex"
              style={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {activeProducts.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <p className="text-lg">Aucun produit dans cette catégorie</p>
          </div>
        ) : (
          <div className={gridClass}>
            {activeProducts.map((product: StoreProduct) => (
              <ProductCard
                key={product.id}
                product={product}
                theme={theme}
                settings={settings}
                onClick={() => onProductClick(product)}
                sectionOverrides={cardOverrides}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
