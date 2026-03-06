import type { ThemeSectionDef } from '../../../_types'

export const loginFormSection: ThemeSectionDef = {
  id: 'login-form',
  label: 'Formulaire de connexion',
  description: 'Zone principale avec le formulaire de connexion',
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
      key: 'showRememberMe',
      label: 'Option "Se souvenir de moi"',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showForgotPassword',
      label: 'Lien "Mot de passe oublié"',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showRegisterLink',
      label: 'Lien vers inscription',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'showGuestCheckout',
      label: 'Lien vers commande en invité',
      type: 'switch',
      defaultValue: true,
    },
  ],
}
