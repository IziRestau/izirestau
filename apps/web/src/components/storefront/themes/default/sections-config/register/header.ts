import type { ThemeSectionDef } from '../../../_types'

export const registerHeaderSection: ThemeSectionDef = {
  id: 'header',
  label: 'En-tête de page',
  description: 'Titre et introduction de la page d\'inscription',
  fields: [
    {
      key: 'bgType',
      label: 'Type d\'arrière-plan',
      type: 'select',
      defaultValue: 'color',
      options: [
        { value: 'color', label: 'Couleur unie' },
        { value: 'image', label: 'Image de couverture' },
        { value: 'gradient', label: 'Dégradé' },
      ],
    },
    {
      key: 'bgImage',
      label: 'Image d\'arrière-plan',
      type: 'image',
      showWhen: { field: 'bgType', value: 'image' },
    },
    {
      key: 'overlayOpacity',
      label: 'Opacité de l\'overlay',
      type: 'slider',
      defaultValue: 50,
      min: 0,
      max: 100,
      step: 5,
      showWhen: { field: 'bgType', value: 'image' },
    },
    {
      key: 'title',
      label: 'Titre',
      type: 'text',
      placeholder: 'Créer un compte',
      defaultValue: 'Créer un compte',
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Rejoignez-nous pour profiter de tous les avantages',
      defaultValue: 'Rejoignez-nous pour profiter de tous les avantages',
    },
  ],
}
