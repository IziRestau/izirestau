import type { ThemeSectionDef } from '../../../_types'

export const trustBadgesSection: ThemeSectionDef = {
  id: 'trust-badges',
  label: 'Badges de confiance',
  description: 'Éléments de réassurance pour le client (paiement sécurisé, etc.)',
  fields: [
    {
      key: 'enabled',
      label: 'Activer cette section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'separatorContent',
      label: 'Contenu',
      type: 'separator',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showSecurePayment',
      label: 'Paiement sécurisé',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showFastDelivery',
      label: 'Livraison rapide',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showFreshProducts',
      label: 'Produits frais',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showSatisfactionGuarantee',
      label: 'Satisfaction garantie',
      type: 'switch',
      defaultValue: false,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'customBadges',
      label: 'Badges personnalisés',
      type: 'array',
      itemLabel: 'Badge',
      itemFields: [
        {
          key: 'icon',
          label: 'Icône',
          type: 'icon',
          defaultValue: 'Check',
        },
        {
          key: 'title',
          label: 'Titre',
          type: 'text',
          placeholder: 'Titre du badge',
        },
        {
          key: 'description',
          label: 'Description',
          type: 'text',
          placeholder: 'Description courte',
        },
      ],
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
