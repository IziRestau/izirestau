import type { ThemeSectionDef } from '../../../_types'

export const checkoutFormSection: ThemeSectionDef = {
  id: 'checkout-form',
  label: 'Formulaire de commande',
  description: 'Zone principale du checkout avec récapitulatif et formulaire',
  fields: [
    {
      key: 'layout',
      label: 'Disposition',
      type: 'select',
      defaultValue: 'classic',
      options: [
        { value: 'classic', label: 'Classique (formulaire à gauche, récap à droite)' },
        { value: 'split', label: 'Deux colonnes égales' },
      ],
    },
    {
      key: 'separatorCustomer',
      label: 'Informations client',
      type: 'separator',
    },
    {
      key: 'showGuestOption',
      label: 'Permettre commande sans compte',
      type: 'switch',
      defaultValue: true,
      description: 'Les clients peuvent commander sans créer de compte',
    },
    {
      key: 'showLoginPrompt',
      label: 'Proposer la connexion',
      type: 'switch',
      defaultValue: true,
      description: 'Afficher un lien vers la connexion pour les clients existants',
    },
    {
      key: 'separatorDelivery',
      label: 'Options de livraison',
      type: 'separator',
    },
    {
      key: 'showServiceTypeSelector',
      label: 'Sélecteur de type de service',
      type: 'switch',
      defaultValue: true,
      description: 'Permettre de choisir entre livraison, à emporter, sur place',
    },
    {
      key: 'separatorPayment',
      label: 'Paiement',
      type: 'separator',
    },
    {
      key: 'showPaymentMethods',
      label: 'Afficher les méthodes de paiement',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showTipOption',
      label: 'Proposer un pourboire',
      type: 'switch',
      defaultValue: true,
      description: 'Afficher les options de pourboire si activé dans les paramètres',
    },
    {
      key: 'separatorSummary',
      label: 'Récapitulatif',
      type: 'separator',
    },
    {
      key: 'showItemImages',
      label: 'Afficher les images des articles',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showItemModifiers',
      label: 'Afficher les modificateurs',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'allowQuantityEdit',
      label: 'Permettre la modification des quantités',
      type: 'switch',
      defaultValue: true,
    },
  ],
}
