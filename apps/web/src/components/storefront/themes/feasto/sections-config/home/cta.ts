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
      key: 'backgroundColor',
      label: 'Couleur de fond',
      type: 'color',
      defaultValue: '#0a0c10',
      showWhen: { field: 'enabled', value: true },
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
      placeholder: 'Laissez-nous donner vie à votre événement dans notre café !',
      defaultValue: 'Laissez-nous donner vie à votre événement dans notre café !',
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
      key: 'buttonLink',
      label: 'Lien du bouton',
      type: 'select',
      options: [
        { value: 'contact', label: 'Page contact' },
        { value: 'menu', label: 'Page menu' },
        { value: 'external', label: 'Lien externe' },
      ],
      defaultValue: 'contact',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'externalUrl',
      label: 'URL externe',
      type: 'text',
      placeholder: 'https://...',
      showWhen: { field: 'buttonLink', value: 'external' },
    },
    {
      key: 'backgroundImage',
      label: 'Image de fond',
      type: 'image',
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
