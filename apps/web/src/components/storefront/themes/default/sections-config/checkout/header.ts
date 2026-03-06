import type { ThemeSectionDef } from '../../../_types'

export const checkoutHeaderSection: ThemeSectionDef = {
  id: 'header',
  label: 'En-tête de page',
  description: 'Titre et introduction de la page de commande',
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
      description: 'Assombrir l\'image pour améliorer la lisibilité',
      showWhen: { field: 'bgType', value: 'image' },
    },
    {
      key: 'overlayBlur',
      label: 'Flou de l\'arrière-plan',
      type: 'slider',
      defaultValue: 0,
      min: 0,
      max: 20,
      step: 1,
      description: 'Effet de flou sur l\'image (en pixels)',
      showWhen: { field: 'bgType', value: 'image' },
    },
    {
      key: 'title',
      label: 'Titre',
      type: 'text',
      placeholder: 'Finaliser votre commande',
      defaultValue: 'Finaliser votre commande',
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Plus que quelques étapes pour savourer vos plats',
      defaultValue: 'Plus que quelques étapes pour savourer vos plats',
    },
  ],
}
