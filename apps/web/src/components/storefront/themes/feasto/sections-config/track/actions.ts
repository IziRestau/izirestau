import type { ThemeSectionDef } from '../../../_types'

export const actionsSection: ThemeSectionDef = {
  id: 'actions',
  label: 'Actions',
  description: 'Boutons d\'action',
  fields: [
    {
      key: 'enabled',
      label: 'Activer',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showOrderDate',
      label: 'Afficher la date de commande',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showReorderButton',
      label: 'Afficher le bouton recommander',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
