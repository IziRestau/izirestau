import type { ThemeSectionDef } from '../../../_types'

export const checkoutFormSection: ThemeSectionDef = {
  id: 'checkout-form',
  label: 'Formulaire de commande',
  description: 'Zone principale du checkout avec récapitulatif et formulaire',
  fields: [
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
    },
    {
      key: 'showLoginPrompt',
      label: 'Proposer la connexion',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'separatorDelivery',
      label: 'Options de service',
      type: 'separator',
    },
    {
      key: 'showServiceTypeSelector',
      label: 'Afficher le sélecteur de service',
      type: 'switch',
      defaultValue: true,
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
      key: 'allowQuantityEdit',
      label: 'Permettre la modification des quantités',
      type: 'switch',
      defaultValue: true,
    },
  ],
}
