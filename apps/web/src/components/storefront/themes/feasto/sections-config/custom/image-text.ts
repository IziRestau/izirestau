import type { ThemeSectionDef } from '../../../_types'

export const imageTextSection: ThemeSectionDef = {
  id: 'imageText',
  label: 'Image + Texte',
  description: 'Section deux colonnes avec image et texte',
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
      placeholder: 'Titre de la section',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'text',
      label: 'Texte',
      type: 'textarea',
      placeholder: 'Description...',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'image',
      label: 'Image',
      type: 'image',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'imagePosition',
      label: 'Position de l\'image',
      type: 'select',
      options: [
        { value: 'left', label: 'Gauche' },
        { value: 'right', label: 'Droite' },
      ],
      defaultValue: 'right',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showButton',
      label: 'Afficher un bouton',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'buttonText',
      label: 'Texte du bouton',
      type: 'text',
      placeholder: 'En savoir plus',
      defaultValue: 'En savoir plus',
      showWhen: { field: 'showButton', value: true },
    },
    {
      key: 'buttonIcon',
      label: 'Icone du bouton',
      type: 'icon',
      showWhen: { field: 'showButton', value: true },
    },
    {
      key: 'buttonLink',
      label: 'Lien du bouton',
      type: 'text',
      placeholder: 'https://...',
      showWhen: { field: 'showButton', value: true },
    },
  ],
}
