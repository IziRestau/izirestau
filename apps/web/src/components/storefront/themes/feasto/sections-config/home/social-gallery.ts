import type { ThemeSectionDef } from '../../../_types'

export const socialGallerySection: ThemeSectionDef = {
  id: 'socialGallery',
  label: 'Galerie sociale',
  description: 'Galerie d\'images avec lien vers les réseaux sociaux',
  fields: [
    {
      key: 'enabled',
      label: 'Activer la section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'title',
      label: 'Titre',
      type: 'text',
      placeholder: 'Suivez-nous sur',
      defaultValue: 'Suivez-nous sur',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'handle',
      label: 'Nom du compte',
      type: 'text',
      placeholder: '@MonRestaurant',
      defaultValue: '@MonRestaurant',
      description: 'Affiché en couleur accent après le titre',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'images',
      label: 'Images de la galerie',
      type: 'gallery',
      description: 'Images affichées dans la galerie (3 à 6 recommandées)',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'linkUrl',
      label: 'Lien vers le profil',
      type: 'text',
      placeholder: 'https://instagram.com/monrestaurant',
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
