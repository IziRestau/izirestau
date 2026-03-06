import type { ThemeSectionDef } from '../../../_types'

export const contactMapSection: ThemeSectionDef = {
  id: 'map',
  label: 'Carte / Localisation',
  description: 'Affichage de la carte interactive',
  fields: [
    {
      key: 'enabled',
      label: 'Afficher la carte',
      type: 'switch',
      defaultValue: false,
    },
    {
      key: 'height',
      label: 'Hauteur de la carte',
      type: 'select',
      defaultValue: '300',
      options: [
        { value: '200', label: 'Petite (200px)' },
        { value: '300', label: 'Moyenne (300px)' },
        { value: '400', label: 'Grande (400px)' },
        { value: '500', label: 'Très grande (500px)' },
      ],
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'position',
      label: 'Position de la carte',
      type: 'select',
      defaultValue: 'bottom',
      options: [
        { value: 'top', label: 'En haut de page' },
        { value: 'bottom', label: 'En bas de page' },
      ],
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
