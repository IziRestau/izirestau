import type { ThemeSectionDef } from '../../../_types'

export const infoBarSection: ThemeSectionDef = {
  id: 'infoBar',
  label: 'Infos pratiques',
  description: 'Horaires, localisation, contact rapide et cartes',
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
      key: 'showQuickContact',
      label: 'Afficher le contact rapide',
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
      key: 'hoursIcon',
      label: 'Icone horaires',
      type: 'icon',
      showWhen: { field: 'showOpeningHours', value: true },
    },
    {
      key: 'locationIcon',
      label: 'Icone localisation',
      type: 'icon',
      showWhen: { field: 'showLocation', value: true },
    },
    {
      key: 'contactIcon',
      label: 'Icone contact',
      type: 'icon',
      showWhen: { field: 'showQuickContact', value: true },
    },
  ],
}
