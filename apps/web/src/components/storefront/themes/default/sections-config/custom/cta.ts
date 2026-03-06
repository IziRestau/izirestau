import type { ThemeSectionDef } from '../../../_types'

export const customCtaSection: ThemeSectionDef = {
  id: 'cta',
  label: 'Appel à l\'action',
  description: 'Bandeau avec bouton d\'incitation',
  fields: [
    {
      key: 'enabled',
      label: 'Activer cette section',
      type: 'switch',
      defaultValue: false,
    },
    {
      key: 'style',
      label: 'Style',
      type: 'select',
      defaultValue: 'banner',
      options: [
        { value: 'banner', label: 'Bandeau coloré' },
        { value: 'outlined', label: 'Bordure avec fond transparent' },
        { value: 'gradient', label: 'Dégradé' },
      ],
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'gradientFrom',
      label: 'Couleur de départ du dégradé',
      type: 'color',
      showWhen: { field: 'style', value: 'gradient' },
    },
    {
      key: 'gradientTo',
      label: 'Couleur d\'arrivée du dégradé',
      type: 'color',
      showWhen: { field: 'style', value: 'gradient' },
    },
    {
      key: 'title',
      label: 'Titre',
      type: 'text',
      placeholder: 'Prêt à commander ?',
      defaultValue: 'Prêt à commander ?',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'text',
      label: 'Texte',
      type: 'text',
      placeholder: 'Parcourez notre menu et passez commande',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'buttonText',
      label: 'Texte du bouton',
      type: 'text',
      placeholder: 'Commander maintenant',
      defaultValue: 'Commander maintenant',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'buttonIcon',
      label: 'Icone du bouton',
      type: 'icon',
      description: 'Icone affichée dans le bouton (par défaut : flèche)',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'buttonLink',
      label: 'Lien du bouton',
      type: 'text',
      placeholder: '/menu ou https://...',
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
