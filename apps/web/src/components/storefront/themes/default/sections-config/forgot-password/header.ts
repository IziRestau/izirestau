import type { ThemeSectionDef } from '../../../_types'

export const forgotPasswordHeaderSection: ThemeSectionDef = {
  id: 'header',
  label: 'En-tête',
  description: 'Bannière en haut de la page',
  fields: [
    {
      key: 'enabled',
      label: 'Activer la section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'backgroundImage',
      label: 'Image de fond',
      type: 'image',
      description: 'Image affichée en arrière-plan',
    },
    {
      key: 'overlayOpacity',
      label: 'Opacité du voile',
      type: 'slider',
      min: 0,
      max: 100,
      defaultValue: 50,
    },
    {
      key: 'blurAmount',
      label: 'Flou de l\'image',
      type: 'slider',
      min: 0,
      max: 20,
      defaultValue: 0,
    },
  ],
}
