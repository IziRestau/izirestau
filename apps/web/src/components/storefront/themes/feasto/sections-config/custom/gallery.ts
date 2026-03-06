import type { ThemeSectionDef } from '../../../_types'

export const gallerySection: ThemeSectionDef = {
  id: 'gallery',
  label: 'Galerie',
  description: 'Grille d\'images masonry',
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
      placeholder: 'Notre galerie',
      defaultValue: 'Notre galerie',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'images',
      label: 'Images',
      type: 'gallery',
      description: 'Images de la galerie',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'columns',
      label: 'Colonnes',
      type: 'select',
      options: [
        { value: '2', label: '2 colonnes' },
        { value: '3', label: '3 colonnes' },
        { value: '4', label: '4 colonnes' },
      ],
      defaultValue: '3',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'gap',
      label: 'Espacement',
      type: 'select',
      options: [
        { value: 'none', label: 'Aucun' },
        { value: 'small', label: 'Petit' },
        { value: 'medium', label: 'Moyen' },
        { value: 'large', label: 'Grand' },
      ],
      defaultValue: 'small',
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
