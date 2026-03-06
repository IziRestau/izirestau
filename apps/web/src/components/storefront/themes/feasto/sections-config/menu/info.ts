import type { ThemeSectionDef } from '../../../_types'

export const infoSection: ThemeSectionDef = {
  id: 'info',
  label: 'Infos pratiques',
  description: 'Horaires, localisation et contact en bas de la page menu',
  fields: [
    {
      key: 'enabled',
      label: 'Activer la section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showOpeningHours',
      label: 'Afficher les horaires',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showLocation',
      label: 'Afficher la localisation',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showContact',
      label: 'Afficher le contact',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showMaps',
      label: 'Afficher les cartes',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'addressIcon',
      label: 'Icone adresse',
      type: 'icon',
      showWhen: { field: 'showLocation', value: true },
    },
    {
      key: 'phoneIcon',
      label: 'Icone téléphone',
      type: 'icon',
      showWhen: { field: 'showContact', value: true },
    },
    {
      key: 'hoursIcon',
      label: 'Icone horaires',
      type: 'icon',
      showWhen: { field: 'showOpeningHours', value: true },
    },
  ],
}
