import type { ThemeSectionDef } from '../../../_types'

export const ctaSection: ThemeSectionDef = {
  id: 'cta',
  label: 'Appel à l\'action',
  description: 'Bandeau d\'incitation avec titre et bouton',
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
      placeholder: 'Vous organisez un événement ?',
      defaultValue: 'Vous organisez un événement ?',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Laissez-nous donner vie à votre événement !',
      defaultValue: 'Laissez-nous donner vie à votre événement !',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'buttonText',
      label: 'Texte du bouton',
      type: 'text',
      placeholder: 'Nous contacter',
      defaultValue: 'Nous contacter',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'buttonIcon',
      label: 'Icone du bouton',
      type: 'icon',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'backgroundImage',
      label: 'Image de fond',
      type: 'image',
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
