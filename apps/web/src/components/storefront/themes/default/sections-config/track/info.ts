import type { ThemeSectionDef } from '../../../_types'

export const trackInfoSection: ThemeSectionDef = {
  id: 'info',
  label: 'Informations rapides',
  description: 'Cartes type de service et statut paiement',
  fields: [
    {
      key: 'enabled',
      label: 'Activer cette section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'layout',
      label: 'Disposition',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { value: 'grid', label: 'Grille (2 colonnes)' },
        { value: 'inline', label: 'En ligne' },
      ],
    },
    {
      key: 'showServiceType',
      label: 'Afficher le type de service',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showPaymentStatus',
      label: 'Afficher le statut de paiement',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showPaymentMethod',
      label: 'Afficher le mode de paiement',
      type: 'switch',
      defaultValue: false,
    },
  ],
}
