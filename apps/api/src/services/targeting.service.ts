import { prisma, Prisma } from '@iziresto/database'

// Types pour les règles de ciblage
export interface TargetingCondition {
  field: string
  operator: string
  value: unknown
}

export interface TargetingGroup {
  operator: 'AND' | 'OR'
  conditions: TargetingCondition[]
}

export interface TargetingRules {
  operator: 'AND' | 'OR'
  groups: TargetingGroup[]
}

// Opérateurs supportés par champ
const FIELD_OPERATORS: Record<string, string[]> = {
  tags: ['hasAny', 'hasAll', 'hasNone'],
  loyaltyPoints: ['eq', 'gte', 'lte', 'between'],
  totalOrders: ['eq', 'gte', 'lte', 'between'],
  totalSpent: ['eq', 'gte', 'lte', 'between'],
  avgOrderValue: ['eq', 'gte', 'lte', 'between'],
  lastOrderAt: ['within', 'olderThan', 'before', 'after'],
  createdAt: ['within', 'olderThan', 'before', 'after'],
  purchasedProducts: ['includes', 'excludes'],
  purchasedCategories: ['includes', 'excludes'],
}

/**
 * Construit une clause WHERE Prisma à partir d'une condition de ciblage
 */
function buildConditionWhere(condition: TargetingCondition): Prisma.RestaurantCustomerWhereInput | null {
  const { field, operator, value } = condition

  switch (field) {
    // Champs tags
    case 'tags':
      if (operator === 'hasAny' && Array.isArray(value)) {
        return { tags: { hasSome: value as string[] } }
      }
      if (operator === 'hasAll' && Array.isArray(value)) {
        return { AND: (value as string[]).map(tag => ({ tags: { has: tag } })) }
      }
      if (operator === 'hasNone' && Array.isArray(value)) {
        return { NOT: { tags: { hasSome: value as string[] } } }
      }
      break

    // Champs numériques
    case 'loyaltyPoints':
    case 'totalOrders':
      if (operator === 'eq') return { [field]: { equals: Number(value) } }
      if (operator === 'gte') return { [field]: { gte: Number(value) } }
      if (operator === 'lte') return { [field]: { lte: Number(value) } }
      if (operator === 'between' && Array.isArray(value)) {
        return { [field]: { gte: Number(value[0]), lte: Number(value[1]) } }
      }
      break

    // Champs décimaux
    case 'totalSpent':
    case 'avgOrderValue':
      if (operator === 'eq') return { [field]: { equals: Number(value) } }
      if (operator === 'gte') return { [field]: { gte: Number(value) } }
      if (operator === 'lte') return { [field]: { lte: Number(value) } }
      if (operator === 'between' && Array.isArray(value)) {
        return { [field]: { gte: Number(value[0]), lte: Number(value[1]) } }
      }
      break

    // Champs date
    case 'lastOrderAt':
    case 'createdAt':
      if (operator === 'within' && typeof value === 'string') {
        const date = parseDateValue(value)
        if (date) return { [field]: { gte: date } }
      }
      if (operator === 'olderThan' && typeof value === 'string') {
        const date = parseDateValue(value)
        if (date) return { OR: [{ [field]: { lt: date } }, { [field]: null }] }
      }
      if (operator === 'before' && typeof value === 'string') {
        const date = new Date(value)
        if (!isNaN(date.getTime())) return { [field]: { lt: date } }
      }
      if (operator === 'after' && typeof value === 'string') {
        const date = new Date(value)
        if (!isNaN(date.getTime())) return { [field]: { gt: date } }
      }
      break

    // Produits achetés - recherche dans les commandes du client
    case 'purchasedProducts':
      if (Array.isArray(value) && value.length > 0) {
        const productIds = value as string[]
        if (operator === 'includes') {
          // Client qui a acheté au moins un de ces produits
          return {
            orders: {
              some: {
                items: {
                  some: {
                    productId: { in: productIds }
                  }
                }
              }
            }
          }
        }
        if (operator === 'excludes') {
          // Client qui n'a jamais acheté ces produits
          return {
            NOT: {
              orders: {
                some: {
                  items: {
                    some: {
                      productId: { in: productIds }
                    }
                  }
                }
              }
            }
          }
        }
      }
      break

    // Catégories achetées - recherche dans les commandes du client
    case 'purchasedCategories':
      if (Array.isArray(value) && value.length > 0) {
        const categoryIds = value as string[]
        if (operator === 'includes') {
          // Client qui a acheté dans au moins une de ces catégories
          return {
            orders: {
              some: {
                items: {
                  some: {
                    product: {
                      categoryId: { in: categoryIds }
                    }
                  }
                }
              }
            }
          }
        }
        if (operator === 'excludes') {
          // Client qui n'a jamais acheté dans ces catégories
          return {
            NOT: {
              orders: {
                some: {
                  items: {
                    some: {
                      product: {
                        categoryId: { in: categoryIds }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      break
  }

  return null
}

/**
 * Parse une valeur de date relative (ex: "30d", "7d", "1m")
 */
function parseDateValue(value: string): Date | null {
  const match = value.match(/^(\d+)([dmwy])$/)
  if (!match) return null

  const amount = parseInt(match[1])
  const unit = match[2]
  const date = new Date()

  switch (unit) {
    case 'd': date.setDate(date.getDate() - amount); break
    case 'w': date.setDate(date.getDate() - (amount * 7)); break
    case 'm': date.setMonth(date.getMonth() - amount); break
    case 'y': date.setFullYear(date.getFullYear() - amount); break
  }

  return date
}

/**
 * Construit une clause WHERE Prisma à partir d'un groupe de conditions
 */
function buildGroupWhere(group: TargetingGroup): Prisma.RestaurantCustomerWhereInput | null {
  const conditions = group.conditions
    .map(buildConditionWhere)
    .filter((c): c is Prisma.RestaurantCustomerWhereInput => c !== null)

  if (conditions.length === 0) return null
  if (conditions.length === 1) return conditions[0]

  return group.operator === 'AND'
    ? { AND: conditions }
    : { OR: conditions }
}

/**
 * Construit une clause WHERE Prisma complète à partir des règles de ciblage
 */
export function buildTargetingWhere(
  rules: TargetingRules,
  baseWhere: Prisma.RestaurantCustomerWhereInput = {}
): Prisma.RestaurantCustomerWhereInput {
  const groupWheres = rules.groups
    .map(buildGroupWhere)
    .filter((g): g is Prisma.RestaurantCustomerWhereInput => g !== null)

  if (groupWheres.length === 0) return baseWhere

  const targetingWhere = groupWheres.length === 1
    ? groupWheres[0]
    : rules.operator === 'AND'
      ? { AND: groupWheres }
      : { OR: groupWheres }

  return { AND: [baseWhere, targetingWhere] }
}

/**
 * Récupère les clients ciblés par une campagne
 */
export async function getTargetedCustomers(
  restaurantId: string,
  targetingRules: TargetingRules | null,
  options: {
    marketingOptInOnly?: boolean
    activeOnly?: boolean
    limit?: number
  } = {}
): Promise<{ id: string; email: string; firstName: string; lastName: string }[]> {
  const { marketingOptInOnly = true, activeOnly = false, limit } = options

  const baseWhere: Prisma.RestaurantCustomerWhereInput = {
    restaurantId,
    NOT: { email: '' },
  }

  if (marketingOptInOnly) baseWhere.marketingOptIn = true
  if (activeOnly) baseWhere.isActive = true

  const where = targetingRules
    ? buildTargetingWhere(targetingRules, baseWhere)
    : baseWhere

  return prisma.restaurantCustomer.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
    ...(limit && { take: limit }),
  })
}

/**
 * Compte les clients ciblés par des règles de ciblage
 */
export async function countTargetedCustomers(
  restaurantId: string,
  targetingRules: TargetingRules | null,
  options: {
    marketingOptInOnly?: boolean
    activeOnly?: boolean
  } = {}
): Promise<number> {
  const { marketingOptInOnly = true, activeOnly = false } = options

  const baseWhere: Prisma.RestaurantCustomerWhereInput = {
    restaurantId,
    NOT: { email: '' },
  }

  if (marketingOptInOnly) baseWhere.marketingOptIn = true
  if (activeOnly) baseWhere.isActive = true

  const where = targetingRules
    ? buildTargetingWhere(targetingRules, baseWhere)
    : baseWhere

  return prisma.restaurantCustomer.count({ where })
}

/**
 * Vérifie si un client correspond aux règles de ciblage
 */
export async function customerMatchesRules(
  customerId: string,
  targetingRules: TargetingRules
): Promise<boolean> {
  const customer = await prisma.restaurantCustomer.findUnique({
    where: { id: customerId },
    select: { restaurantId: true },
  })

  if (!customer) return false

  const where = buildTargetingWhere(targetingRules, {
    id: customerId,
    restaurantId: customer.restaurantId,
  })

  const count = await prisma.restaurantCustomer.count({ where })
  return count > 0
}

/**
 * Valide la structure des règles de ciblage
 */
export function validateTargetingRules(rules: unknown): rules is TargetingRules {
  if (!rules || typeof rules !== 'object') return false

  const r = rules as Record<string, unknown>
  if (!['AND', 'OR'].includes(r.operator as string)) return false
  if (!Array.isArray(r.groups)) return false

  for (const group of r.groups) {
    if (!group || typeof group !== 'object') return false
    if (!['AND', 'OR'].includes(group.operator)) return false
    if (!Array.isArray(group.conditions)) return false

    for (const condition of group.conditions) {
      if (!condition || typeof condition !== 'object') return false
      if (typeof condition.field !== 'string') return false
      if (typeof condition.operator !== 'string') return false
      if (condition.value === undefined) return false

      // Vérifier que l'opérateur est valide pour le champ
      const validOperators = FIELD_OPERATORS[condition.field]
      if (!validOperators || !validOperators.includes(condition.operator)) {
        return false
      }
    }
  }

  return true
}

/**
 * Convertit les anciens paramètres de ciblage en nouvelles règles
 */
export function convertLegacyTargeting(params: {
  targetAll?: boolean
  targetSegment?: string | null
  targetMinPoints?: number | null
  targetMaxPoints?: number | null
}): TargetingRules | null {
  if (params.targetAll) return null

  const conditions: TargetingCondition[] = []

  // Segment prédéfini
  if (params.targetSegment) {
    switch (params.targetSegment) {
      case 'loyal':
        conditions.push({ field: 'loyaltyPoints', operator: 'gte', value: 100 })
        break
      case 'inactive':
        conditions.push({ field: 'lastOrderAt', operator: 'within', value: '30d' })
        // Inverser - on veut ceux qui n'ont PAS commandé
        // Note: ceci nécessite une logique spéciale
        break
      case 'new':
        conditions.push({ field: 'createdAt', operator: 'within', value: '7d' })
        break
      case 'birthday':
        // Nécessite une logique spéciale pour le mois d'anniversaire
        break
    }
  }

  // Filtre par points
  if (params.targetMinPoints) {
    conditions.push({ field: 'loyaltyPoints', operator: 'gte', value: params.targetMinPoints })
  }
  if (params.targetMaxPoints) {
    conditions.push({ field: 'loyaltyPoints', operator: 'lte', value: params.targetMaxPoints })
  }

  if (conditions.length === 0) return null

  return {
    operator: 'AND',
    groups: [{
      operator: 'AND',
      conditions,
    }],
  }
}

export default {
  buildTargetingWhere,
  getTargetedCustomers,
  countTargetedCustomers,
  customerMatchesRules,
  validateTargetingRules,
  convertLegacyTargeting,
}
