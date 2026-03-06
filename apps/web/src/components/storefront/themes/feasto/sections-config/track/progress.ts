import type { ThemeSectionDef } from '../../../_types'

export const progressSection: ThemeSectionDef = {
  id: 'progress',
  label: 'Progression',
  description: 'Barre de progression de la commande',
  fields: [
    {
      key: 'enabled',
      label: 'Activer',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showLastUpdated',
      label: 'Afficher la dernière mise à jour',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
