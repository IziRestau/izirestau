import type { ThemeSectionDef } from '../../../_types'

export const contentSection: ThemeSectionDef = {
  id: 'content',
  label: 'Contenu',
  description: 'Bloc de texte riche HTML',
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
      key: 'content',
      label: 'Contenu HTML',
      type: 'textarea',
      placeholder: 'Votre contenu ici...',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'maxWidth',
      label: 'Largeur maximale',
      type: 'select',
      options: [
        { value: 'narrow', label: 'Étroite (640px)' },
        { value: 'medium', label: 'Moyenne (768px)' },
        { value: 'wide', label: 'Large (1024px)' },
        { value: 'full', label: 'Pleine largeur' },
      ],
      defaultValue: 'wide',
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
