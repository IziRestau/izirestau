import type { ThemeSectionDef } from '../../../_types'

export const accountHeaderSection: ThemeSectionDef = {
  id: 'header',
  label: 'En-tête de page',
  description: 'Titre et introduction de l\'espace compte',
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
      placeholder: 'Mon compte',
      defaultValue: 'Mon compte',
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Gérez vos informations et commandes',
      defaultValue: 'Gérez vos informations et commandes',
    },
  ],
}
