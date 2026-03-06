import type { ThemeSectionDef } from '../../../_types'

export const contactInfoSection: ThemeSectionDef = {
  id: 'contactInfo',
  label: 'Informations de contact',
  description: 'Coordonnées affichées sur la page',
  fields: [
    {
      key: 'layout',
      label: 'Disposition',
      type: 'select',
      defaultValue: 'list',
      options: [
        { value: 'list', label: 'Liste verticale' },
        { value: 'cards', label: 'Cartes en grille' },
      ],
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
      key: 'showEmail',
      label: 'Afficher l\'email',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'emailIcon',
      label: 'Icone email',
      type: 'icon',
      description: 'Par défaut : Mail',
      showWhen: { field: 'showEmail', value: true },
    },
    {
      key: 'showWebsite',
      label: 'Afficher le site web',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'websiteIcon',
      label: 'Icone site web',
      type: 'icon',
      description: 'Par défaut : Globe',
      showWhen: { field: 'showWebsite', value: true },
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
    {
      key: 'showOpeningHours',
      label: 'Afficher les horaires d\'ouverture',
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
  ],
}
