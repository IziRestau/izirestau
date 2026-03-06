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
      key: 'separatorFields',
      label: 'Champs du formulaire',
      type: 'separator',
    },
    {
      key: 'showPhoneField',
      label: 'Champ téléphone',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'phoneRequired',
      label: 'Téléphone obligatoire',
      type: 'switch',
      defaultValue: false,
      showWhen: { field: 'showPhoneField', value: true },
    },
    {
      key: 'showMarketingOptIn',
      label: 'Case newsletter',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'marketingOptInText',
      label: 'Texte de la case newsletter',
      type: 'text',
      placeholder: 'Je souhaite recevoir les offres et actualités',
      defaultValue: 'Je souhaite recevoir les offres et actualités',
      showWhen: { field: 'showMarketingOptIn', value: true },
    },
    {
      key: 'separatorLinks',
      label: 'Liens',
      type: 'separator',
    },
    {
      key: 'showLoginLink',
      label: 'Lien vers connexion',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'loginLinkText',
      label: 'Texte du lien connexion',
      type: 'text',
      placeholder: 'Déjà un compte ? Connectez-vous',
      defaultValue: 'Déjà un compte ? Connectez-vous',
      showWhen: { field: 'showLoginLink', value: true },
    },
  ],
}
