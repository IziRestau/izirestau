import type { ThemeSectionDef } from '../../../_types'

export const ctaSection: ThemeSectionDef = {
  id: 'cta',
  label: 'Appel à l\'action',
  description: 'Bandeau d\'incitation en bas de page',
  fields: [
    {
      key: 'enabled',
      label: 'Activer cette section',
      type: 'switch',
      defaultValue: true,
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
    },
    {
      key: 'gradientFrom',
      label: 'Couleur de départ du dégradé',
      type: 'color',
      description: 'Par défaut : couleur principale du thème',
      showWhen: { field: 'style', value: 'gradient' },
    },
    {
      key: 'gradientTo',
      label: 'Couleur d\'arrivée du dégradé',
      type: 'color',
      description: 'Par défaut : couleur secondaire du thème',
      showWhen: { field: 'style', value: 'gradient' },
    },
    {
      key: 'title',
      label: 'Titre',
      type: 'text',
      placeholder: 'Prêt à commander ?',
      defaultValue: 'Prêt à commander ?',
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Parcourez notre menu et passez commande en quelques clics',
      defaultValue: 'Parcourez notre menu et passez commande en quelques clics',
    },
    {
      key: 'buttonText',
      label: 'Texte du bouton',
      type: 'text',
      placeholder: 'Commander maintenant',
      defaultValue: 'Commander maintenant',
    },
    {
      key: 'buttonIcon',
      label: 'Icone du bouton',
      type: 'icon',
      description: 'Icone affichée dans le bouton (par défaut : flèche)',
    },
    {
      key: 'buttonLink',
      label: 'Destination du bouton',
      type: 'select',
      defaultValue: 'menu',
      options: [
        { value: 'menu', label: 'Page menu' },
        { value: 'contact', label: 'Page contact' },
      ],
    },
  ],
}
