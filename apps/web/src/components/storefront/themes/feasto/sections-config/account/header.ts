import type { ThemeSectionDef } from '../../../_types'

export const headerSection: ThemeSectionDef = {
  id: 'header',
  label: 'En-tête compte',
  description: 'Bannière en haut de l\'espace compte',
  fields: [
    {
      key: 'enabled',
      label: 'Activer la section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'label',
      label: 'Label',
      type: 'text',
      placeholder: 'Mon compte',
      defaultValue: 'Mon compte',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'title',
      label: 'Titre',
      type: 'text',
      placeholder: 'Bienvenue',
      defaultValue: 'Bienvenue',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Gérez vos informations et commandes',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'backgroundImage',
      label: 'Image de fond',
      type: 'image',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'overlayOpacity',
      label: 'Opacité de l\'overlay',
      type: 'slider',
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 60,
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
