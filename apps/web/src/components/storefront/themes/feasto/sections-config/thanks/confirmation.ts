import type { ThemeSectionDef } from '../../../_types'

export const confirmationSection: ThemeSectionDef = {
  id: 'confirmation',
  label: 'Confirmation de commande',
  description: 'Affichage du récapitulatif et des informations de suivi',
  fields: [
    {
      key: 'layout',
      label: 'Disposition',
      type: 'select',
      defaultValue: 'centered',
      options: [
        { value: 'centered', label: 'Centré (message + numéro de commande)' },
        { value: 'with-summary', label: 'Avec récapitulatif détaillé' },
      ],
    },
    {
      key: 'showOrderNumber',
      label: 'Afficher le numéro de commande',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showEstimatedTime',
      label: 'Afficher le temps estimé',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showTrackingLink',
      label: 'Afficher le lien de suivi',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showCreateAccountPrompt',
      label: 'Proposer de créer un compte',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showContinueShoppingBtn',
      label: 'Bouton retour au menu',
      type: 'switch',
      defaultValue: true,
    },
  ],
}
