import type { ThemeSectionDef } from '../../../_types'

export const formSection: ThemeSectionDef = {
  id: 'forgot-password-form',
  label: 'Formulaire',
  description: 'Formulaire de récupération de mot de passe',
  fields: [
    {
      key: 'enabled',
      label: 'Activer',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'emailLabel',
      label: "Label de l'email",
      type: 'text',
      defaultValue: 'Email',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'emailPlaceholder',
      label: "Placeholder de l'email",
      type: 'text',
      defaultValue: 'votre@email.com',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'submitBtnText',
      label: 'Texte du bouton',
      type: 'text',
      defaultValue: 'Envoyer le lien',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'successTitle',
      label: 'Titre de succès',
      type: 'text',
      defaultValue: 'Email envoyé !',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'successMessage',
      label: 'Message de succès',
      type: 'textarea',
      defaultValue: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'backToLoginText',
      label: 'Texte retour connexion',
      type: 'text',
      defaultValue: 'Retour à la connexion',
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
