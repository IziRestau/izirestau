import { Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from './error.middleware'

// Types pour les roles restaurant
type RestaurantRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'CASHIER' | 'KITCHEN'

interface RestaurantStaffData {
  id: string
  restaurantId: string
  userId: string
  role: RestaurantRole
  permissions: string[]
  isActive: boolean
}

// Etendre le type Request pour inclure les donnees du staff
declare global {
  namespace Express {
    interface Request {
      restaurantStaff?: RestaurantStaffData
    }
  }
}

/**
 * Récupère les données du staff restaurant pour l'utilisateur connecté
 * Supporte le multi-restaurant via query param ou body
 */
async function getStaffFromRequest(req: Request): Promise<RestaurantStaffData | null> {
  const userId = req.user?.userId
  if (!userId) return null

  // Récupérer le restaurantId depuis query ou body
  const restaurantId = (req.query.restaurantId || req.body?.restaurantId) as string | undefined

  const staff = await prisma.restaurantStaff.findFirst({
    where: restaurantId 
      ? { userId, restaurantId, isActive: true }
      : { userId, isActive: true },
    select: {
      id: true,
      restaurantId: true,
      userId: true,
      role: true,
      permissions: true,
      isActive: true,
    },
  })

  if (!staff) return null

  return staff as RestaurantStaffData
}

/**
 * Middleware qui verifie que l'utilisateur a l'un des roles autorises
 * Usage: requireRole('OWNER', 'MANAGER')
 */
export function requireRole(...allowedRoles: RestaurantRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staff = await getStaffFromRequest(req)
      
      if (!staff) {
        return next(new AppError('Acces non autorise', 403, 'FORBIDDEN'))
      }

      if (!allowedRoles.includes(staff.role)) {
        return next(new AppError('Permission insuffisante pour cette action', 403, 'INSUFFICIENT_PERMISSIONS'))
      }

      req.restaurantStaff = staff
      next()
    } catch (error) {
      return next(new AppError('Erreur de verification des permissions', 500, 'PERMISSION_CHECK_ERROR'))
    }
  }
}

/**
 * Middleware qui verifie une permission specifique
 * OWNER et MANAGER ont toutes les permissions par defaut
 * Usage: requirePermission('cancel_orders')
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staff = await getStaffFromRequest(req)
      
      if (!staff) {
        return next(new AppError('Acces non autorise', 403, 'FORBIDDEN'))
      }

      // OWNER et MANAGER ont toutes les permissions
      if (['OWNER', 'MANAGER'].includes(staff.role)) {
        req.restaurantStaff = staff
        return next()
      }

      // Verifier la permission specifique
      if (!staff.permissions.includes(permission)) {
        return next(new AppError('Permission insuffisante pour cette action', 403, 'INSUFFICIENT_PERMISSIONS'))
      }

      req.restaurantStaff = staff
      next()
    } catch (error) {
      return next(new AppError('Erreur de verification des permissions', 500, 'PERMISSION_CHECK_ERROR'))
    }
  }
}

/**
 * Middleware qui charge les donnees du staff sans verifier de role specifique
 * Utile pour les routes accessibles a tous les membres du staff
 * Usage: loadStaff
 */
export async function loadStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await getStaffFromRequest(req)
    
    if (!staff) {
      return next(new AppError('Acces non autorise - Vous devez etre membre du staff', 403, 'FORBIDDEN'))
    }

    req.restaurantStaff = staff
    next()
  } catch (error) {
    return next(new AppError('Erreur de verification du staff', 500, 'STAFF_CHECK_ERROR'))
  }
}

/**
 * Helper pour verifier si un role peut effectuer une action
 * Utilise dans les routes pour des verifications conditionnelles
 */
export function canRolePerform(role: RestaurantRole, action: string): boolean {
  const rolePermissions: Record<RestaurantRole, string[]> = {
    OWNER: ['*'], // Toutes les permissions
    MANAGER: [
      'view_revenue',
      'manage_orders',
      'cancel_orders',
      'manage_menu',
      'manage_settings',
      'view_customers',
      'view_team',
      'mark_paid',
    ],
    STAFF: [
      'view_orders',
      'update_order_status',
      'view_products',
      'mark_paid',
    ],
    CASHIER: [
      'view_orders',
      'update_order_status',
      'view_products',
      'mark_paid',
      'view_payments',
    ],
    KITCHEN: [
      'view_orders',
      'update_order_status',
      'view_products',
    ],
  }

  const permissions = rolePermissions[role]
  return permissions.includes('*') || permissions.includes(action)
}

/**
 * Constantes des permissions disponibles
 */
export const PERMISSIONS = {
  // Commandes
  VIEW_ORDERS: 'view_orders',
  UPDATE_ORDER_STATUS: 'update_order_status',
  CANCEL_ORDERS: 'cancel_orders',
  REFUND_ORDERS: 'refund_orders',
  MARK_PAID: 'mark_paid',
  
  // Menu
  VIEW_PRODUCTS: 'view_products',
  MANAGE_MENU: 'manage_menu',
  
  // Clients
  VIEW_CUSTOMERS: 'view_customers',
  EXPORT_CUSTOMERS: 'export_customers',
  
  // Stats
  VIEW_REVENUE: 'view_revenue',
  VIEW_STATS: 'view_stats',
  EXPORT_DATA: 'export_data',
  
  // Parametres
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_PAYMENTS: 'manage_payments',
  
  // Equipe
  VIEW_TEAM: 'view_team',
  MANAGE_TEAM: 'manage_team',
} as const
