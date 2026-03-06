import type { ThemeSectionDef } from '../../../_types'

export const restaurantSection: ThemeSectionDef = {
  id: 'restaurant',
  label: 'Restaurant',
  description: 'Informations du restaurant',
  fields: [
    {
      key: 'enabled',
      label: 'Activer',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showAddress',
      label: 'Afficher l\'adresse',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showPhone',
      label: 'Afficher le téléphone',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
