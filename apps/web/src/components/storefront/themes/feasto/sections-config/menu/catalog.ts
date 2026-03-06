import type { ThemeSectionDef } from '../../../_types'

export const catalogSection: ThemeSectionDef = {
  id: 'catalog',
  label: 'Catalogue',
  description: 'Grille de produits avec onglets de catégories',
  fields: [
    {
      key: 'enabled',
      label: 'Activer la section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'cardStyle',
      label: 'Style des cartes',
      type: 'select',
      options: [
        { value: 'horizontal', label: 'Horizontale (image + texte)' },
        { value: 'vertical', label: 'Verticale (image au-dessus)' },
        { value: 'compact', label: 'Compacte (liste)' },
      ],
      defaultValue: 'horizontal',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'columns',
      label: 'Colonnes (desktop)',
      type: 'select',
      options: [
        { value: '1', label: '1 colonne' },
        { value: '2', label: '2 colonnes' },
        { value: '3', label: '3 colonnes' },
      ],
      defaultValue: '2',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showImages',
      label: 'Afficher les images',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showDescriptions',
      label: 'Afficher les descriptions',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showPrices',
      label: 'Afficher les prix',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showBadges',
      label: 'Afficher les badges',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'imageRatio',
      label: 'Ratio des images',
      type: 'select',
      options: [
        { value: 'square', label: 'Carré (1:1)' },
        { value: 'landscape', label: 'Paysage (4:3)' },
        { value: 'portrait', label: 'Portrait (3:4)' },
      ],
      defaultValue: 'square',
      showWhen: { field: 'showImages', value: true },
    },
  ],
}
