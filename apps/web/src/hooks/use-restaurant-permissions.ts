import { useRestaurantStore } from '@/stores/restaurant.store'

type RestaurantRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'CASHIER' | 'KITCHEN'

interface RestaurantPermissions {
  role: RestaurantRole
  permissions: string[]
  
  // Helpers de role
  isOwner: boolean
  isManager: boolean
  isOwnerOrManager: boolean
  isStaff: boolean
  isCashier: boolean
  isKitchen: boolean
  
  // Permissions specifiques
  canViewRevenue: boolean
  canViewOrders: boolean
  canUpdateOrderStatus: boolean
  canCancelOrders: boolean
  canRefundOrders: boolean
  canMarkAsPaid: boolean
  canManageMenu: boolean
  canViewCustomers: boolean
  canExportData: boolean
  canManageSettings: boolean
  canManagePaymentSettings: boolean
  canManageTeam: boolean
  canViewTeam: boolean
  
  // Fonction generique
  can: (action: string) => boolean
}

/**
 * Hook pour verifier les permissions de l'utilisateur connecte au restaurant
 * Utilise le role et les permissions stockes dans le store
 */
export function useRestaurantPermissions(): RestaurantPermissions {
  const { staff } = useRestaurantStore()
  
  const role = (staff?.role || 'STAFF') as RestaurantRole
  const permissions = staff?.permissions || []
  
  // Helpers de role
  const isOwner = role === 'OWNER'
  const isManager = role === 'MANAGER'
  const isOwnerOrManager = isOwner || isManager
  const isStaff = role === 'STAFF'
  const isCashier = role === 'CASHIER'
  const isKitchen = role === 'KITCHEN'
  
  /**
   * Verifie si l'utilisateur peut effectuer une action
   * OWNER et MANAGER ont toutes les permissions par defaut
   */
  const can = (action: string): boolean => {
    if (isOwnerOrManager) return true
    return permissions.includes(action)
  }
  
  return {
    role,
    permissions,
    
    // Helpers de role
    isOwner,
    isManager,
    isOwnerOrManager,
    isStaff,
    isCashier,
    isKitchen,
    
    // Permissions specifiques basees sur les roles
    // Revenus: OWNER et MANAGER uniquement
    canViewRevenue: isOwnerOrManager,
    
    // Commandes: tous peuvent voir
    canViewOrders: true,
    
    // Changement de statut: tous peuvent
    canUpdateOrderStatus: true,
    
    // Annulation: OWNER et MANAGER uniquement
    canCancelOrders: isOwnerOrManager,
    
    // Remboursement: OWNER et MANAGER uniquement
    canRefundOrders: isOwnerOrManager,
    
    // Marquer comme paye: tous sauf KITCHEN
    canMarkAsPaid: isOwnerOrManager || isStaff || isCashier,
    
    // Gestion du menu: OWNER et MANAGER uniquement
    canManageMenu: isOwnerOrManager,
    
    // Clients: OWNER, MANAGER et STAFF
    canViewCustomers: isOwnerOrManager || isStaff,
    
    // Export: OWNER et MANAGER uniquement
    canExportData: isOwnerOrManager,
    
    // Parametres generaux: OWNER et MANAGER
    canManageSettings: isOwnerOrManager,
    
    // Parametres de paiement: OWNER uniquement
    canManagePaymentSettings: isOwner,
    
    // Gestion equipe: OWNER uniquement
    canManageTeam: isOwner,
    
    // Voir equipe: OWNER et MANAGER
    canViewTeam: isOwnerOrManager,
    
    // Fonction generique
    can,
  }
}

/**
 * Labels pour les roles
 */
export const roleLabels: Record<RestaurantRole, string> = {
  OWNER: 'Proprietaire',
  MANAGER: 'Manager',
  STAFF: 'Employe',
  CASHIER: 'Caissier',
  KITCHEN: 'Cuisine',
}

/**
 * Couleurs pour les badges de role
 */
export const roleColors: Record<RestaurantRole, string> = {
  OWNER: 'bg-amber-100 text-amber-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-gray-100 text-gray-700',
  CASHIER: 'bg-purple-100 text-purple-700',
  KITCHEN: 'bg-orange-100 text-orange-700',
}
