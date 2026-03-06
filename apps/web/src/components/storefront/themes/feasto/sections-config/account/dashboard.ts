import type { ThemeSectionDef } from '../../../_types'

export const dashboardSection: ThemeSectionDef = {
  id: 'dashboard',
  label: 'Tableau de bord',
  description: 'Contenu principal de l\'espace compte',
  fields: [
    {
      key: 'showProfileCard',
      label: 'Carte profil',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showLoyaltyPoints',
      label: 'Points fidélité',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showRecentOrders',
      label: 'Commandes récentes',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'recentOrdersCount',
      label: 'Nombre de commandes à afficher',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 10,
      showWhen: { field: 'showRecentOrders', value: true },
    },
    {
      key: 'showAddresses',
      label: 'Adresses enregistrées',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showEditProfileBtn',
      label: 'Bouton modifier profil',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showLogoutBtn',
      label: 'Bouton déconnexion',
      type: 'switch',
      defaultValue: true,
    },
  ],
}
