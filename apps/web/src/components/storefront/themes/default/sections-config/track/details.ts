import type { ThemeSectionDef } from '../../../_types'

export const trackDetailsSection: ThemeSectionDef = {
  id: 'details',
  label: 'Détails de la commande',
  description: 'Récapitulatif des articles commandés',
  fields: [
    {
      key: 'enabled',
      label: 'Activer cette section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'defaultExpanded',
      label: 'Déplié par défaut',
      type: 'switch',
      defaultValue: false,
      description: 'Afficher les détails ouverts par défaut',
    },
    {
      key: 'showItemImages',
      label: 'Afficher les images des produits',
      type: 'switch',
      defaultValue: false,
    },
    {
      key: 'showSubtotal',
      label: 'Afficher le sous-total',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showTaxes',
      label: 'Afficher les taxes',
      type: 'switch',
      defaultValue: true,
    },
  ],
}
