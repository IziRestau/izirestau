import type { ThemeSectionDef } from '../../../_types'

export const loginHeaderSection: ThemeSectionDef = {
  id: 'header',
  label: 'En-tête de page',
  description: 'Titre et introduction de la page de connexion',
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
      description: 'Image affichée en fond de l\'en-tête',
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
      placeholder: 'Connexion',
      defaultValue: 'Connexion',
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Accédez à votre espace client',
      defaultValue: 'Accédez à votre espace client',
    },
  ],
}
