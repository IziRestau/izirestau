export interface Category {
  id: string
  name: string
  nameEn: string | null
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  parent?: { id: string; name: string; slug: string } | null
  sortOrder: number
  isActive: boolean
  isVisible: boolean
  productsCount?: number
  children?: CategoryChild[]
  products?: ProductSummary[]
  createdAt: string
  updatedAt: string
}

export interface CategoryChild {
  id: string
  name: string
  slug: string
  isActive: boolean
  sortOrder: number
}

export interface ProductSummary {
  id: string
  name: string
  slug: string
  price: number
  image: string | null
  isActive: boolean
}

export interface Product {
  id: string
  name: string
  nameEn: string | null
  slug: string
  description: string | null
  descriptionEn: string | null
  price: number
  compareAtPrice: number | null
  costPrice: number | null
  categoryId: string
  category: { id: string; name: string; slug: string }
  taxRateId: string | null
  taxRate: { id: string; name: string; rate: number } | null
  taxIncluded: boolean
  image: string | null
  images: string[]
  trackInventory: boolean
  stockQuantity: number
  lowStockAlert: number | null
  sku: string | null
  barcode: string | null
  calories: number | null
  allergens: string[]
  dietaryTags: string[]
  isActive: boolean
  isVisible: boolean
  isFeatured: boolean
  prepTime: number | null
  sortOrder: number
  variants: ProductVariant[]
  modifierGroups: ProductModifierGroup[]
  variantsCount?: number
  modifierGroupsCount?: number
  createdAt: string
  updatedAt: string
}

export interface ProductListItem {
  id: string
  name: string
  nameEn: string | null
  slug: string
  description: string | null
  price: number
  compareAtPrice: number | null
  categoryId: string
  category: { id: string; name: string; slug: string }
  image: string | null
  trackInventory: boolean
  stockQuantity: number
  isActive: boolean
  isVisible: boolean
  isFeatured: boolean
  sortOrder: number
  variantsCount: number
  modifierGroupsCount: number
  variants: Array<{
    id: string
    name: string
    price: number
    stockQuantity: number
    isActive: boolean
  }>
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  name: string
  nameEn: string | null
  price: number
  compareAtPrice: number | null
  costPrice: number | null
  sku: string | null
  barcode: string | null
  trackInventory: boolean
  stockQuantity: number
  image: string | null
  isActive: boolean
  sortOrder: number
}

export interface ModifierGroup {
  id: string
  name: string
  nameEn: string | null
  type: ModifierType
  minSelections: number
  maxSelections: number | null
  isRequired: boolean
  isActive: boolean
  productsCount?: number
  modifiers: Modifier[]
  products?: Array<{
    id: string
    name: string
    slug: string
    image: string | null
  }>
  createdAt: string
  updatedAt: string
}

export interface ProductModifierGroup {
  id: string
  name: string
  nameEn: string | null
  type: ModifierType
  minSelections: number
  maxSelections: number | null
  isRequired: boolean
  isActive: boolean
  sortOrder: number
  modifiers: Modifier[]
}

export interface Modifier {
  id: string
  name: string
  nameEn: string | null
  price: number
  isDefault: boolean
  isActive: boolean
  sortOrder: number
}

export type ModifierType = 'SINGLE' | 'MULTIPLE' | 'OPTIONAL'

export interface CreateCategoryInput {
  name: string
  nameEn?: string
  description?: string
  image?: string | null
  parentId?: string | null
  isActive?: boolean
  isVisible?: boolean
}

export interface UpdateCategoryInput {
  name?: string
  nameEn?: string
  description?: string
  image?: string | null
  parentId?: string | null
  isActive?: boolean
  isVisible?: boolean
}

export interface CreateProductInput {
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  price: number
  compareAtPrice?: number | null
  costPrice?: number | null
  categoryId: string
  taxRateId?: string | null
  taxIncluded?: boolean
  image?: string | null
  images?: string[]
  trackInventory?: boolean
  stockQuantity?: number
  lowStockAlert?: number | null
  sku?: string | null
  barcode?: string | null
  calories?: number | null
  allergens?: string[]
  dietaryTags?: string[]
  isActive?: boolean
  isVisible?: boolean
  isFeatured?: boolean
  prepTime?: number | null
  modifierGroupIds?: string[]
}

export interface UpdateProductInput {
  name?: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  price?: number
  compareAtPrice?: number | null
  costPrice?: number | null
  categoryId?: string
  taxRateId?: string | null
  taxIncluded?: boolean
  image?: string | null
  images?: string[]
  trackInventory?: boolean
  stockQuantity?: number
  lowStockAlert?: number | null
  sku?: string | null
  barcode?: string | null
  calories?: number | null
  allergens?: string[]
  dietaryTags?: string[]
  isActive?: boolean
  isVisible?: boolean
  isFeatured?: boolean
  prepTime?: number | null
  modifierGroupIds?: string[]
}

export interface CreateVariantInput {
  name: string
  nameEn?: string
  price: number
  compareAtPrice?: number | null
  costPrice?: number | null
  sku?: string | null
  barcode?: string | null
  trackInventory?: boolean
  stockQuantity?: number
  image?: string | null
  isActive?: boolean
}

export interface UpdateVariantInput {
  name?: string
  nameEn?: string
  price?: number
  compareAtPrice?: number | null
  costPrice?: number | null
  sku?: string | null
  barcode?: string | null
  trackInventory?: boolean
  stockQuantity?: number
  image?: string | null
  isActive?: boolean
}

export interface CreateModifierGroupInput {
  name: string
  nameEn?: string
  type?: ModifierType
  minSelections?: number
  maxSelections?: number | null
  isRequired?: boolean
  isActive?: boolean
  modifiers?: Array<{
    name: string
    nameEn?: string
    price?: number
    isDefault?: boolean
    isActive?: boolean
  }>
}

export interface UpdateModifierGroupInput {
  name?: string
  nameEn?: string | null
  type?: ModifierType
  minSelections?: number
  maxSelections?: number | null
  isRequired?: boolean
  isActive?: boolean
}

export interface CreateModifierInput {
  name: string
  nameEn?: string
  price?: number
  isDefault?: boolean
  isActive?: boolean
}

export interface UpdateModifierInput {
  name?: string
  nameEn?: string
  price?: number
  isDefault?: boolean
  isActive?: boolean
}

export const ALLERGENS = [
  'gluten',
  'crustaces',
  'oeufs',
  'poisson',
  'arachides',
  'soja',
  'lait',
  'fruits_a_coque',
  'celeri',
  'moutarde',
  'sesame',
  'sulfites',
  'lupin',
  'mollusques',
] as const

export const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  crustaces: 'Crustaces',
  oeufs: 'Oeufs',
  poisson: 'Poisson',
  arachides: 'Arachides',
  soja: 'Soja',
  lait: 'Lait',
  fruits_a_coque: 'Fruits a coque',
  celeri: 'Celeri',
  moutarde: 'Moutarde',
  sesame: 'Sesame',
  sulfites: 'Sulfites',
  lupin: 'Lupin',
  mollusques: 'Mollusques',
}

export const DIETARY_TAGS = [
  'vegetarien',
  'vegan',
  'sans_gluten',
  'halal',
  'casher',
  'bio',
  'local',
  'fait_maison',
] as const

export const DIETARY_TAG_LABELS: Record<string, string> = {
  vegetarien: 'Vegetarien',
  vegan: 'Vegan',
  sans_gluten: 'Sans gluten',
  halal: 'Halal',
  casher: 'Casher',
  bio: 'Bio',
  local: 'Local',
  fait_maison: 'Fait maison',
}

export const MODIFIER_TYPE_LABELS: Record<ModifierType, string> = {
  SINGLE: 'Choix unique',
  MULTIPLE: 'Choix multiple',
  OPTIONAL: 'Optionnel',
}
