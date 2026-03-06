import type { ThemeSectionDef } from '../../../_types'

export const trackRestaurantSection: ThemeSectionDef = {
  id: 'restaurant',
  label: 'Contact restaurant',
  description: 'Informations de contact du restaurant',
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
      defaultValue: 'card',
      options: [
        { value: 'card', label: 'Carte avec fond' },
        { value: 'inline', label: 'En ligne simple' },
      ],
    },
    {
      key: 'showPhone',
      label: 'Afficher le téléphone',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showAddress',
      label: 'Afficher l\'adresse',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showCallButton',
      label: 'Bouton appeler',
      type: 'switch',
      defaultValue: true,
      description: 'Afficher un bouton cliquable pour appeler',
    },
  ],
}
