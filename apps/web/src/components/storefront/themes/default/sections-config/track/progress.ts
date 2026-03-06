import type { ThemeSectionDef } from '../../../_types'

export const trackProgressSection: ThemeSectionDef = {
  id: 'progress',
  label: 'Progression de la commande',
  description: 'Affichage des étapes de suivi',
  fields: [
    {
      key: 'enabled',
      label: 'Activer cette section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'layout',
      label: 'Disposition',
      type: 'select',
      defaultValue: 'vertical',
      options: [
        { value: 'vertical', label: 'Verticale (étapes empilées)' },
        { value: 'horizontal', label: 'Horizontale (barre de progression)' },
      ],
    },
    {
      key: 'showLastUpdated',
      label: 'Afficher l\'heure de mise à jour',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showStepDescription',
      label: 'Afficher la description des étapes',
      type: 'switch',
      defaultValue: true,
    },
  ],
}
