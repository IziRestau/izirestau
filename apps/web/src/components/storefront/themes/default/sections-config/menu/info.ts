import type { ThemeSectionDef } from '../../../_types'

export const infoSection: ThemeSectionDef = {
  id: 'info',
  label: 'Informations restaurant',
  description: 'Section d\'informations en bas de page menu',
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
      defaultValue: 'horizontal',
      options: [
        { value: 'horizontal', label: 'Cartes horizontales' },
        { value: 'vertical', label: 'Liste verticale' },
      ],
    },
    {
      key: 'showOpeningHours',
      label: 'Afficher les horaires',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'hoursIcon',
      label: 'Icone horaires',
      type: 'icon',
      description: 'Par défaut : Clock',
      showWhen: { field: 'showOpeningHours', value: true },
    },
    {
      key: 'showAddress',
      label: 'Afficher l\'adresse',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'addressIcon',
      label: 'Icone adresse',
      type: 'icon',
      description: 'Par défaut : MapPin',
      showWhen: { field: 'showAddress', value: true },
    },
    {
      key: 'showPhone',
      label: 'Afficher le téléphone',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'phoneIcon',
      label: 'Icone téléphone',
      type: 'icon',
      description: 'Par défaut : Phone',
      showWhen: { field: 'showPhone', value: true },
    },
    {
      key: 'showDeliveryInfo',
      label: 'Afficher les infos de livraison',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'deliveryIcon',
      label: 'Icone livraison',
      type: 'icon',
      description: 'Par défaut : Truck',
      showWhen: { field: 'showDeliveryInfo', value: true },
    },
  ],
}
