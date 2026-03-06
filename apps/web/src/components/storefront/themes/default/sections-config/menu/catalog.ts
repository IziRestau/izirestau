import type { ThemeSectionDef } from '../../../_types'

export const catalogSection: ThemeSectionDef = {
  id: 'catalog',
  label: 'Catalogue de produits',
  description: 'L\'affichage des catégories et produits',
  fields: [
    {
      key: 'title',
      label: 'Titre de la section',
      type: 'text',
      placeholder: 'Notre carte',
      defaultValue: 'Notre carte',
    },
    {
      key: 'showCategoryCount',
      label: 'Nombre de produits par catégorie',
      type: 'switch',
      defaultValue: true,
    },
  ],
}
