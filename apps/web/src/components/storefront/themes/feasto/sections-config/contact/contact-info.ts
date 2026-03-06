import type { ThemeSectionDef } from '../../../_types'

export const contactInfoSection: ThemeSectionDef = {
  id: 'contactInfo',
  label: 'Informations de contact',
  description: 'Horaires, localisation et coordonnées',
  fields: [
    {
      key: 'enabled',
      label: 'Activer la section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showAddress',
      label: 'Afficher l\'adresse',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showPhone',
      label: 'Afficher le téléphone',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showEmail',
      label: 'Afficher l\'email',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showWebsite',
      label: 'Afficher le site web',
      type: 'switch',
      defaultValue: false,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showOpeningHours',
      label: 'Afficher les horaires',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showDelivery',
      label: 'Afficher les infos livraison',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'addressIcon',
      label: 'Icone adresse',
      type: 'icon',
      showWhen: { field: 'showAddress', value: true },
    },
    {
      key: 'phoneIcon',
      label: 'Icone téléphone',
      type: 'icon',
      showWhen: { field: 'showPhone', value: true },
    },
    {
      key: 'emailIcon',
      label: 'Icone email',
      type: 'icon',
      showWhen: { field: 'showEmail', value: true },
    },
    {
      key: 'websiteIcon',
      label: 'Icone site web',
      type: 'icon',
      showWhen: { field: 'showWebsite', value: true },
    },
    {
      key: 'hoursIcon',
      label: 'Icone horaires',
      type: 'icon',
      showWhen: { field: 'showOpeningHours', value: true },
    },
    {
      key: 'deliveryIcon',
      label: 'Icone livraison',
      type: 'icon',
      showWhen: { field: 'showDelivery', value: true },
    },
  ],
}
