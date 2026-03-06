import type { ThemeSectionDef } from '../../../_types'

export const headerSection: ThemeSectionDef = {
  id: 'header',
  label: 'En-tête',
  description: 'Bannière en haut de la page personnalisée avec effet 3 panneaux',
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
      placeholder: 'Nom de la page',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'title',
      label: 'Titre',
      type: 'text',
      placeholder: 'Titre de la page',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Description courte de la page',
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
    {
      key: 'blurAmount',
      label: 'Intensité du flou',
      type: 'slider',
      min: 0,
      max: 20,
      step: 1,
      defaultValue: 8,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showScrollDown',
      label: 'Bouton de défilement',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
