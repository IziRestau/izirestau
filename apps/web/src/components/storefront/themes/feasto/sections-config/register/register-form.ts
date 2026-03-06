import type { ThemeSectionDef } from '../../../_types'

export const registerFormSection: ThemeSectionDef = {
  id: 'register-form',
  label: 'Formulaire d\'inscription',
  description: 'Zone principale avec le formulaire d\'inscription',
  fields: [
    {
      key: 'layout',
      label: 'Disposition',
      type: 'select',
      defaultValue: 'minimal',
      options: [
        { value: 'minimal', label: 'Minimal (formulaire centré)' },
        { value: 'with-image', label: 'Avec image (formulaire + illustration)' },
      ],
    },
    {
      key: 'sideImage',
      label: 'Image latérale',
      type: 'image',
      showWhen: { field: 'layout', value: 'with-image' },
    },
    {
      key: 'showPhoneField',
      label: 'Champ téléphone',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showMarketingOptIn',
      label: 'Case newsletter',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showLoginLink',
      label: 'Lien vers connexion',
      type: 'switch',
      defaultValue: true,
    },
  ],
}
