import type { ThemeSectionDef } from '../../../_types'

export const aboutSection: ThemeSectionDef = {
  id: 'about',
  label: 'À propos',
  description: 'Section de présentation du restaurant',
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
      defaultValue: 'cards',
      options: [
        { value: 'cards', label: 'Cartes d\'information' },
        { value: 'split', label: 'Image + texte côte à côte' },
        { value: 'centered', label: 'Texte centré avec icône' },
      ],
    },
    {
      key: 'title',
      label: 'Titre de la section',
      type: 'text',
      placeholder: 'Notre histoire',
      description: 'Titre affiché au-dessus de la section',
    },
    {
      key: 'text',
      label: 'Texte de présentation',
      type: 'textarea',
      placeholder: 'Racontez l\'histoire de votre restaurant, votre philosophie, vos valeurs...',
      description: 'Texte principal de la section (pour les layouts "Image + texte" et "Centré")',
    },
    {
      key: 'image',
      label: 'Image de la section',
      type: 'image',
      description: 'Image affichée à côté du texte (layout "Image + texte")',
      showWhen: { field: 'layout', value: 'split' },
    },
    {
      key: 'showAddress',
      label: 'Carte adresse',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'addressIcon',
      label: 'Icone adresse',
      type: 'icon',
      description: 'Icone de la carte adresse (par défaut : MapPin)',
      showWhen: { field: 'showAddress', value: true },
    },
    {
      key: 'showOpeningHours',
      label: 'Carte horaires',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'hoursIcon',
      label: 'Icone horaires',
      type: 'icon',
      description: 'Icone de la carte horaires (par défaut : Clock)',
      showWhen: { field: 'showOpeningHours', value: true },
    },
    {
      key: 'showDeliveryInfo',
      label: 'Carte livraison',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'deliveryIcon',
      label: 'Icone livraison',
      type: 'icon',
      description: 'Icone de la carte livraison (par défaut : Truck)',
      showWhen: { field: 'showDeliveryInfo', value: true },
    },
    {
      key: 'showPhone',
      label: 'Carte téléphone',
      type: 'switch',
      defaultValue: false,
    },
    {
      key: 'phoneIcon',
      label: 'Icone téléphone',
      type: 'icon',
      description: 'Icone de la carte téléphone (par défaut : Phone)',
      showWhen: { field: 'showPhone', value: true },
    },
  ],
}
