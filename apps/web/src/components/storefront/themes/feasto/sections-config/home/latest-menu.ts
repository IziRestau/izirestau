import type { ThemeSectionDef } from '../../../_types'

export const latestMenuSection: ThemeSectionDef = {
  id: 'latestMenu',
  label: 'Menu récent',
  description: 'Grille de produits avec onglets de catégories',
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
      placeholder: 'Latest Menu',
      defaultValue: 'Latest Menu',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'highlightText',
      label: 'Texte mis en avant',
      type: 'text',
      placeholder: 'Fresh & Popular Flavors',
      defaultValue: 'Fresh & Popular Flavors',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'maxProducts',
      label: 'Nombre de produits par catégorie',
      type: 'number',
      min: 2,
      max: 12,
      defaultValue: 6,
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
      key: 'showDescriptions',
      label: 'Afficher les descriptions',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'cardStyle',
      label: 'Style des cartes',
      type: 'select',
      options: [
        { value: 'horizontal', label: 'Horizontale (image + texte)' },
        { value: 'vertical', label: 'Verticale (image au-dessus)' },
      ],
      defaultValue: 'horizontal',
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
