import { prisma } from '@iziresto/database'
import { TargetingCondition } from './targeting.service'

export interface TagRuleCondition extends TargetingCondition {
  field: string
  operator: string
  value: unknown
}

export interface TagRuleConditions {
  operator: 'AND' | 'OR'
  conditions: TagRuleCondition[]
}

/**
 * Évalue si un client correspond aux conditions d'une règle
 */
async function evaluateCustomerAgainstConditions(
  customerId: string,
  restaurantId: string,
  conditions: TagRuleConditions
): Promise<boolean> {
  const customer = await prisma.restaurantCustomer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!customer || customer.restaurantId !== restaurantId) return false

  const results = await Promise.all(
    conditions.conditions.map(async (condition) => {
      return evaluateCondition(customer, condition)
    })
  )

  return conditions.operator === 'AND'
    ? results.every(Boolean)
    : results.some(Boolean)
}

/**
 * Évalue une condition individuelle pour un client
 */
function evaluateCondition(
  customer: {
    loyaltyPoints: number
    totalOrders: number
    totalSpent: unknown
    avgOrderValue: unknown
    lastOrderAt: Date | null
    createdAt: Date
    tags: string[]
    orders: Array<{
      items: Array<{
        productId: string
        product: {
          id: string
          categoryId: string | null
          category: { id: string } | null
        }
      }>
    }>
  },
  condition: TagRuleCondition
): boolean {
  const { field, operator, value } = condition

  switch (field) {
    // Champs numériques simples
    case 'loyaltyPoints':
    case 'totalOrders': {
      const fieldValue = customer[field]
      return evaluateNumericCondition(fieldValue, operator, value)
    }

    // Champs décimaux
    case 'totalSpent':
    case 'avgOrderValue': {
      const fieldValue = Number(customer[field])
      return evaluateNumericCondition(fieldValue, operator, value)
    }

    // Champs date
    case 'lastOrderAt': {
      if (!customer.lastOrderAt) return operator === 'never'
      return evaluateDateCondition(customer.lastOrderAt, operator, value)
    }

    case 'createdAt': {
      return evaluateDateCondition(customer.createdAt, operator, value)
    }

    // Tags
    case 'tags': {
      if (operator === 'hasAny' && Array.isArray(value)) {
        return value.some(tag => customer.tags.includes(tag as string))
      }
      if (operator === 'hasAll' && Array.isArray(value)) {
        return value.every(tag => customer.tags.includes(tag as string))
      }
      if (operator === 'hasNone' && Array.isArray(value)) {
        return !value.some(tag => customer.tags.includes(tag as string))
      }
      break
    }

    // Produits achetés
    case 'purchasedProducts': {
      const purchasedProductIds = new Set<string>()
      customer.orders.forEach(order => {
        order.items.forEach(item => {
          purchasedProductIds.add(item.productId)
        })
      })

      if (operator === 'includes' && Array.isArray(value)) {
        return value.some(productId => purchasedProductIds.has(productId as string))
      }
      if (operator === 'includesAll' && Array.isArray(value)) {
        return value.every(productId => purchasedProductIds.has(productId as string))
      }
      if (operator === 'excludes' && Array.isArray(value)) {
        return !value.some(productId => purchasedProductIds.has(productId as string))
      }
      break
    }

    // Catégories achetées
    case 'purchasedCategories': {
      const purchasedCategoryIds = new Set<string>()
      customer.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.product.categoryId) {
            purchasedCategoryIds.add(item.product.categoryId)
          }
        })
      })

      if (operator === 'includes' && Array.isArray(value)) {
        return value.some(categoryId => purchasedCategoryIds.has(categoryId as string))
      }
      if (operator === 'includesAll' && Array.isArray(value)) {
        return value.every(categoryId => purchasedCategoryIds.has(categoryId as string))
      }
      if (operator === 'excludes' && Array.isArray(value)) {
        return !value.some(categoryId => purchasedCategoryIds.has(categoryId as string))
      }
      break
    }

    // Nombre de commandes d'un produit spécifique
    case 'productOrderCount': {
      if (typeof value !== 'object' || !value) break
      const { productId, count: minCount } = value as { productId: string; count: number }
      
      let orderCount = 0
      customer.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.productId === productId) {
            orderCount++
          }
        })
      })

      if (operator === 'gte') return orderCount >= minCount
      if (operator === 'eq') return orderCount === minCount
      if (operator === 'lte') return orderCount <= minCount
      break
    }

    // Nombre de commandes d'une catégorie spécifique
    case 'categoryOrderCount': {
      if (typeof value !== 'object' || !value) break
      const { categoryId, count: minCount } = value as { categoryId: string; count: number }
      
      let orderCount = 0
      customer.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.product.categoryId === categoryId) {
            orderCount++
          }
        })
      })

      if (operator === 'gte') return orderCount >= minCount
      if (operator === 'eq') return orderCount === minCount
      if (operator === 'lte') return orderCount <= minCount
      break
    }
  }

  return false
}

function evaluateNumericCondition(fieldValue: number, operator: string, value: unknown): boolean {
  const numValue = Number(value)
  switch (operator) {
    case 'eq': return fieldValue === numValue
    case 'gte': return fieldValue >= numValue
    case 'lte': return fieldValue <= numValue
    case 'gt': return fieldValue > numValue
    case 'lt': return fieldValue < numValue
    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return fieldValue >= Number(value[0]) && fieldValue <= Number(value[1])
      }
      return false
    default: return false
  }
}

function evaluateDateCondition(fieldValue: Date, operator: string, value: unknown): boolean {
  const now = new Date()

  if (operator === 'within' && typeof value === 'string') {
    const match = value.match(/^(\d+)([dmwy])$/)
    if (!match) return false

    const amount = parseInt(match[1])
    const unit = match[2]
    const threshold = new Date()

    switch (unit) {
      case 'd': threshold.setDate(threshold.getDate() - amount); break
      case 'w': threshold.setDate(threshold.getDate() - (amount * 7)); break
      case 'm': threshold.setMonth(threshold.getMonth() - amount); break
      case 'y': threshold.setFullYear(threshold.getFullYear() - amount); break
    }

    return fieldValue >= threshold
  }

  if (operator === 'before' && typeof value === 'string') {
    return fieldValue < new Date(value)
  }

  if (operator === 'after' && typeof value === 'string') {
    return fieldValue > new Date(value)
  }

  if (operator === 'olderThan' && typeof value === 'string') {
    const match = value.match(/^(\d+)([dmwy])$/)
    if (!match) return false

    const amount = parseInt(match[1])
    const unit = match[2]
    const threshold = new Date()

    switch (unit) {
      case 'd': threshold.setDate(threshold.getDate() - amount); break
      case 'w': threshold.setDate(threshold.getDate() - (amount * 7)); break
      case 'm': threshold.setMonth(threshold.getMonth() - amount); break
      case 'y': threshold.setFullYear(threshold.getFullYear() - amount); break
    }

    return fieldValue < threshold
  }

  return false
}

/**
 * Évalue toutes les règles actives pour un client et attribue les tags correspondants
 */
export async function evaluateAndApplyTagRules(
  customerId: string,
  restaurantId: string
): Promise<{ tagsAdded: string[]; tagsRemoved: string[] }> {
  const tagsAdded: string[] = []
  const tagsRemoved: string[] = []

  // Récupérer toutes les règles actives du restaurant
  const rules = await prisma.customerTagRule.findMany({
    where: {
      restaurantId,
      isActive: true,
      triggerOnOrder: true,
    },
  })

  if (rules.length === 0) return { tagsAdded, tagsRemoved }

  // Récupérer le client actuel
  const customer = await prisma.restaurantCustomer.findUnique({
    where: { id: customerId },
    select: { tags: true },
  })

  if (!customer) return { tagsAdded, tagsRemoved }

  const currentTags = new Set(customer.tags)
  const newTags = new Set(customer.tags)

  // Évaluer chaque règle
  for (const rule of rules) {
    const conditions = rule.conditions as TagRuleConditions
    const matches = await evaluateCustomerAgainstConditions(customerId, restaurantId, conditions)

    if (matches && !currentTags.has(rule.tag)) {
      newTags.add(rule.tag)
      tagsAdded.push(rule.tag)
    }
  }

  // Mettre à jour les tags si nécessaire
  if (tagsAdded.length > 0) {
    await prisma.restaurantCustomer.update({
      where: { id: customerId },
      data: { tags: Array.from(newTags) },
    })

    // Mettre à jour les stats des règles
    for (const rule of rules) {
      if (tagsAdded.includes(rule.tag)) {
        await prisma.customerTagRule.update({
          where: { id: rule.id },
          data: {
            customersMatched: { increment: 1 },
            lastEvaluatedAt: new Date(),
          },
        })
      }
    }
  }

  return { tagsAdded, tagsRemoved }
}

/**
 * Évalue une règle spécifique pour tous les clients du restaurant
 */
export async function evaluateRuleForAllCustomers(
  ruleId: string
): Promise<{ matched: number; total: number }> {
  const rule = await prisma.customerTagRule.findUnique({
    where: { id: ruleId },
  })

  if (!rule) throw new Error('Règle non trouvée')

  const customers = await prisma.restaurantCustomer.findMany({
    where: {
      restaurantId: rule.restaurantId,
      isActive: true,
    },
    select: { id: true, tags: true },
  })

  let matched = 0
  const conditions = rule.conditions as TagRuleConditions

  for (const customer of customers) {
    const matches = await evaluateCustomerAgainstConditions(
      customer.id,
      rule.restaurantId,
      conditions
    )

    if (matches) {
      matched++
      
      // Ajouter le tag si pas déjà présent
      if (!customer.tags.includes(rule.tag)) {
        await prisma.restaurantCustomer.update({
          where: { id: customer.id },
          data: {
            tags: { push: rule.tag },
          },
        })
      }
    }
  }

  // Mettre à jour les stats de la règle
  await prisma.customerTagRule.update({
    where: { id: ruleId },
    data: {
      customersMatched: matched,
      lastEvaluatedAt: new Date(),
    },
  })

  return { matched, total: customers.length }
}

/**
 * Prévisualise combien de clients correspondent à une règle
 */
export async function previewRuleMatches(
  restaurantId: string,
  conditions: TagRuleConditions
): Promise<{ count: number; sample: Array<{ id: string; firstName: string; lastName: string; email: string }> }> {
  const customers = await prisma.restaurantCustomer.findMany({
    where: {
      restaurantId,
      isActive: true,
    },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  const matchingCustomers: Array<{ id: string; firstName: string; lastName: string; email: string }> = []

  for (const customer of customers) {
    const matches = await evaluateCustomerAgainstConditions(
      customer.id,
      restaurantId,
      conditions
    )

    if (matches) {
      matchingCustomers.push(customer)
    }
  }

  return {
    count: matchingCustomers.length,
    sample: matchingCustomers.slice(0, 10),
  }
}

export default {
  evaluateAndApplyTagRules,
  evaluateRuleForAllCustomers,
  previewRuleMatches,
}
