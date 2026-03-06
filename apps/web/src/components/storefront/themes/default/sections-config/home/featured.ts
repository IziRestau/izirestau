import type { ThemeSectionDef } from '../../../_types'

export const featuredSection: ThemeSectionDef = {
  id: 'featured',
  label: 'Produits en vedette',
  description: 'Affiche les produits populaires ou mis en avant',
  fields: [
    {
      key: 'enabled',
      label: 'Activer cette section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'title',
      label: 'Titre de la section',
      type: 'text',
      placeholder: 'Nos spécialités',
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Découvrez nos plats les plus appréciés',
    },
    {
      key: 'source',
      label: 'Source des produits',
      type: 'select',
      defaultValue: 'featured',
      options: [
        { value: 'featured', label: 'Produits mis en avant' },
        { value: 'popular', label: 'Les plus populaires' },
        { value: 'recent', label: 'Ajoutés récemment' },
      ],
    },
    {
      key: 'showOrderBtn',
      label: 'Bouton "Commander"',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'orderBtnText',
      label: 'Texte du bouton',
      type: 'text',
      placeholder: 'Commander',
      defaultValue: 'Commander',
      showWhen: { field: 'showOrderBtn', value: true },
    },
    {
      key: 'orderBtnIcon',
      label: 'Ic\u00f4ne du bouton',
      type: 'icon',
      description: 'Ic\u00f4ne affich\u00e9e dans le bouton de commande',
      showWhen: { field: 'showOrderBtn', value: true },
    },
    {
      key: 'showViewAllLink',
      label: 'Lien "Voir tout le menu"',
      type: 'switch',
      defaultValue: true,
    },
  ],
}
