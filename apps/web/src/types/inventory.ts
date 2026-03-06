// Types pour le module Inventaire

export type IngredientUnit = 'UNIT' | 'GRAM' | 'KILOGRAM' | 'MILLILITER' | 'LITER' | 'PORTION'

export type StockMovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER' | 'RETURN' | 'PRODUCTION'

export type StockAlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED'

export type InventoryCountStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

// Ingrédients
export interface Ingredient {
  id: string
  name: string
  sku: string | null
  category: string | null
  unit: IngredientUnit
  unitCost: number
  currentStock: number
  minStock: number | null
  maxStock: number | null
  reorderPoint: number | null
  supplierId: string | null
  supplier: SupplierSummary | null
  isTracked: boolean
  expirationDays: number | null
  movementsCount?: number
  recipesCount?: number
  isLowStock: boolean
  createdAt: string
  updatedAt: string
}

export interface IngredientDetail extends Ingredient {
  suppliers: IngredientSupplierInfo[]
  stockMovements: StockMovement[]
  recipes: RecipeIngredientInfo[]
  batches: IngredientBatch[]
  priceHistory: PriceHistoryEntry[]
  alerts: StockAlert[]
}

export interface IngredientSupplierInfo {
  id: string
  supplierId: string
  supplier: SupplierSummary
  unitCost: number
  isPreferred: boolean
  leadTimeDays: number | null
  minOrderQty: number | null
}

export interface RecipeIngredientInfo {
  id: string
  name: string
  quantity: number
  unit: string
}

export interface IngredientBatch {
  id: string
  batchNumber: string | null
  quantity: number
  remainingQty: number
  unitCost: number
  expirationDate: string | null
  receivedAt: string
}

export interface PriceHistoryEntry {
  id: string
  unitCost: number
  effectiveDate: string
  changedBy: string | null
  reason: string | null
}

export interface CreateIngredientInput {
  name: string
  sku?: string | null
  category?: string | null
  unit?: IngredientUnit
  unitCost?: number
  currentStock?: number
  minStock?: number | null
  maxStock?: number | null
  reorderPoint?: number | null
  supplierId?: string | null
  isTracked?: boolean
  expirationDays?: number | null
}

export interface UpdateIngredientInput extends Partial<CreateIngredientInput> {}

// Fournisseurs
export interface Supplier {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  ingredientsCount: number
  createdAt: string
  updatedAt: string
}

export interface SupplierSummary {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

export interface SupplierDetail extends Supplier {
  ingredients: SupplierIngredient[]
  recentBatches: SupplierBatch[]
}

export interface SupplierIngredient {
  id: string
  name: string
  sku: string | null
  category: string | null
  unit: IngredientUnit
  unitCost: number
  currentStock: number
  isPreferred: boolean
  leadTimeDays: number | null
  minOrderQty: number | null
}

export interface SupplierBatch {
  id: string
  batchNumber: string | null
  ingredientId: string
  ingredientName: string
  quantity: number
  remainingQty: number
  unitCost: number
  expirationDate: string | null
  receivedAt: string
}

export interface CreateSupplierInput {
  name: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  isActive?: boolean
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {}

// Mouvements de stock
export interface StockMovement {
  id: string
  ingredientId: string
  ingredient?: {
    id: string
    name: string
    sku: string | null
    unit: IngredientUnit
  }
  type: StockMovementType
  quantity: number
  unitCost: number | null
  totalCost: number | null
  reason: string | null
  notes: string | null
  reference: string | null
  referenceType: string | null
  performedBy: string | null
  createdAt: string
}

export interface CreateStockMovementInput {
  ingredientId: string
  type: StockMovementType
  quantity: number
  unitCost?: number | null
  reason?: string | null
  notes?: string | null
  reference?: string | null
  referenceType?: string | null
}

export interface BulkStockMovementInput {
  type: StockMovementType
  reason?: string | null
  notes?: string | null
  items: {
    ingredientId: string
    quantity: number
    unitCost?: number | null
  }[]
}

export interface AdjustStockInput {
  quantity: number
  type: StockMovementType
  reason?: string | null
  notes?: string | null
  unitCost?: number | null
  reference?: string | null
  referenceType?: string | null
}

// Recettes
export interface Recipe {
  id: string
  name: string
  description: string | null
  yieldQuantity: number
  yieldUnit: string
  prepTime: number | null
  cookTime: number | null
  totalCost: number | null
  costPerUnit: number | null
  ingredientsCount: number
  productsCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RecipeDetail extends Recipe {
  totalTime: number
  instructions: string | null
  ingredients: RecipeIngredientDetail[]
  products: RecipeProduct[]
  canProduce: number
}

export interface RecipeIngredientDetail {
  id: string
  ingredientId: string
  ingredient: {
    id: string
    name: string
    sku: string | null
    unit: IngredientUnit
    unitCost: number
    currentStock: number
  }
  quantity: number
  unit: string
  notes: string | null
  isOptional: boolean
  lineCost: number
}

export interface RecipeProduct {
  id: string
  name: string
  price: number
  isActive: boolean
  margin: number | null
  marginPercent: number | null
}

export interface RecipeIngredientInput {
  ingredientId: string
  quantity: number
  unit: string
  notes?: string | null
  isOptional?: boolean
}

export interface CreateRecipeInput {
  name: string
  description?: string | null
  yieldQuantity?: number
  yieldUnit?: string
  prepTime?: number | null
  cookTime?: number | null
  instructions?: string | null
  ingredients: RecipeIngredientInput[]
  isActive?: boolean
}

export interface UpdateRecipeInput extends Partial<Omit<CreateRecipeInput, 'ingredients'>> {
  ingredients?: RecipeIngredientInput[]
}

// Alertes
export interface StockAlert {
  id: string
  ingredientId: string
  ingredient?: {
    id: string
    name: string
  }
  type: StockAlertType
  threshold: number | null
  currentStock: number
  isRead: boolean
  emailSent: boolean
  resolvedAt: string | null
  createdAt: string
}

// Inventaire physique
export interface InventoryCount {
  id: string
  name: string | null
  countDate: string
  status: InventoryCountStatus
  performedBy: string | null
  notes: string | null
  itemsCount?: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InventoryCountItem {
  id: string
  ingredientId: string
  ingredient?: {
    id: string
    name: string
    unit: IngredientUnit
  }
  expectedQty: number
  countedQty: number | null
  variance: number | null
  notes: string | null
}

// Statistiques
export interface InventoryStats {
  totalIngredients: number
  trackedIngredients: number
  lowStockCount: number
  outOfStockCount: number
  movementsToday: number
  expiringBatches: number
  totalValue: number
  topCategories: { name: string; count: number }[]
}

export interface SupplierStats {
  totalSuppliers: number
  activeSuppliers: number
  inactiveSuppliers: number
  suppliersWithIngredients: number
}

export interface RecipeStats {
  totalRecipes: number
  activeRecipes: number
  inactiveRecipes: number
  recipesWithProducts: number
  recipesWithoutProducts: number
  averageCostPerUnit: number
}

export interface MovementSummary {
  period: number
  byType: Record<StockMovementType, { count: number; totalCost: number }>
  daily: { date: string; count: number; totalCost: number }[]
}

// Réponses API paginées
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface IngredientsResponse extends PaginatedResponse<Ingredient> {
  stats: {
    total: number
    lowStockCount: number
    totalValue: number
    categories: string[]
  }
}

// Labels pour l'affichage
export const INGREDIENT_UNIT_LABELS: Record<IngredientUnit, string> = {
  UNIT: 'Unité',
  GRAM: 'Gramme',
  KILOGRAM: 'Kilogramme',
  MILLILITER: 'Millilitre',
  LITER: 'Litre',
  PORTION: 'Portion',
}

export const INGREDIENT_UNIT_ABBREVIATIONS: Record<IngredientUnit, string> = {
  UNIT: 'u',
  GRAM: 'g',
  KILOGRAM: 'kg',
  MILLILITER: 'ml',
  LITER: 'L',
  PORTION: 'port.',
}

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  PURCHASE: 'Achat',
  SALE: 'Vente',
  ADJUSTMENT: 'Ajustement',
  WASTE: 'Perte',
  TRANSFER: 'Transfert',
  RETURN: 'Retour',
  PRODUCTION: 'Production',
}

export const STOCK_ALERT_TYPE_LABELS: Record<StockAlertType, string> = {
  LOW_STOCK: 'Stock bas',
  OUT_OF_STOCK: 'Rupture de stock',
  EXPIRING_SOON: 'Péremption proche',
  EXPIRED: 'Périmé',
}

export const INVENTORY_COUNT_STATUS_LABELS: Record<InventoryCountStatus, string> = {
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
}
