import type { ThemeSectionDef } from '../../../_types'

export const trackActionsSection: ThemeSectionDef = {
  id: 'actions',
  label: 'Actions',
  description: 'Boutons d\'action en bas de page',
  fields: [
    {
      key: 'enabled',
      label: 'Activer cette section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showOrderDate',
      label: 'Afficher la date de commande',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showReorderButton',
      label: 'Bouton commander à nouveau',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'reorderButtonText',
      label: 'Texte du bouton',
      type: 'text',
      placeholder: 'Commander à nouveau',
      defaultValue: 'Commander à nouveau',
      showWhen: { field: 'showReorderButton', value: true },
    },
    {
      key: 'reorderButtonIcon',
      label: 'Icône du bouton',
      type: 'icon',
      showWhen: { field: 'showReorderButton', value: true },
    },
  ],
}
