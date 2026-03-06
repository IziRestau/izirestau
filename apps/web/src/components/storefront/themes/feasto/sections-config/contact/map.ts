import type { ThemeSectionDef } from '../../../_types'

export const mapSection: ThemeSectionDef = {
  id: 'map',
  label: 'Carte',
  description: 'Carte Google Maps intégrée',
  fields: [
    {
      key: 'enabled',
      label: 'Activer la section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'position',
      label: 'Position de la carte',
      type: 'select',
      options: [
        { value: 'top', label: 'Au-dessus du formulaire' },
        { value: 'bottom', label: 'En-dessous du formulaire' },
      ],
      defaultValue: 'bottom',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'height',
      label: 'Hauteur de la carte',
      type: 'select',
      options: [
        { value: 'small', label: 'Petite (250px)' },
        { value: 'medium', label: 'Moyenne (400px)' },
        { value: 'large', label: 'Grande (550px)' },
      ],
      defaultValue: 'medium',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'fullWidth',
      label: 'Pleine largeur',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
