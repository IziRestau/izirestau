import type { ThemeSectionDef } from '../../../_types'

export const detailsSection: ThemeSectionDef = {
  id: 'details',
  label: 'Détails de la commande',
  description: 'Liste des articles commandés',
  fields: [
    {
      key: 'enabled',
      label: 'Activer',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'defaultExpanded',
      label: 'Déplié par défaut',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showSubtotal',
      label: 'Afficher le sous-total',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showTaxes',
      label: 'Afficher les taxes',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
