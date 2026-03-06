import type { ThemeSectionDef } from '../../../_types'

export const infoSection: ThemeSectionDef = {
  id: 'info',
  label: 'Informations',
  description: 'Informations sur le service et le paiement',
  fields: [
    {
      key: 'enabled',
      label: 'Activer',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showServiceType',
      label: 'Afficher le type de service',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showPaymentStatus',
      label: 'Afficher le statut du paiement',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
