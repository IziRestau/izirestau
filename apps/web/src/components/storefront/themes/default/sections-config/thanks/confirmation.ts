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
      key: 'separatorContent',
      label: 'Contenu',
      type: 'separator',
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
      key: 'showOrderSummary',
      label: 'Afficher le récapitulatif',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'layout', value: 'with-summary' },
    },
    {
      key: 'showTrackingLink',
      label: 'Afficher le lien de suivi',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'separatorActions',
      label: 'Actions',
      type: 'separator',
    },
    {
      key: 'showCreateAccountPrompt',
      label: 'Proposer de créer un compte',
      type: 'switch',
      defaultValue: true,
      description: 'Affiché uniquement pour les commandes en mode invité',
    },
    {
      key: 'createAccountTitle',
      label: 'Titre création de compte',
      type: 'text',
      placeholder: 'Créez votre compte',
      defaultValue: 'Créez votre compte',
      showWhen: { field: 'showCreateAccountPrompt', value: true },
    },
    {
      key: 'createAccountDescription',
      label: 'Description création de compte',
      type: 'text',
      placeholder: 'Suivez vos commandes et gagnez des points fidélité',
      defaultValue: 'Suivez vos commandes et gagnez des points fidélité',
      showWhen: { field: 'showCreateAccountPrompt', value: true },
    },
    {
      key: 'showContinueShoppingBtn',
      label: 'Bouton retour au menu',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'continueShoppingText',
      label: 'Texte du bouton',
      type: 'text',
      placeholder: 'Retour au menu',
      defaultValue: 'Retour au menu',
      showWhen: { field: 'showContinueShoppingBtn', value: true },
    },
  ],
}
