import type { ThemeSectionDef } from '../../../_types'

export const forgotPasswordFormSection: ThemeSectionDef = {
  id: 'forgot-password-form',
  label: 'Formulaire de récupération',
  description: 'Zone principale avec le formulaire de récupération de mot de passe',
  fields: [
    {
      key: 'enabled',
      label: 'Activer la section',
      type: 'switch',
      defaultValue: true,
    },
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
      description: 'Image affichée à côté du formulaire',
      showWhen: { field: 'layout', value: 'with-image' },
    },
    {
      key: 'separatorContent',
      label: 'Contenu',
      type: 'separator',
    },
    {
      key: 'title',
      label: 'Titre',
      type: 'text',
      placeholder: 'Mot de passe oublié ?',
      defaultValue: 'Mot de passe oublié ?',
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Entrez votre email pour recevoir un lien de réinitialisation',
      defaultValue: 'Entrez votre email pour recevoir un lien de réinitialisation',
    },
    {
      key: 'separatorSuccess',
      label: 'Message de succès',
      type: 'separator',
    },
    {
      key: 'successTitle',
      label: 'Titre de succès',
      type: 'text',
      placeholder: 'Email envoyé',
      defaultValue: 'Email envoyé',
    },
    {
      key: 'successMessage',
      label: 'Message de succès',
      type: 'textarea',
      placeholder: 'Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.',
      defaultValue: 'Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.',
    },
    {
      key: 'separatorButton',
      label: 'Bouton de soumission',
      type: 'separator',
    },
    {
      key: 'submitBtnText',
      label: 'Texte du bouton',
      type: 'text',
      placeholder: 'Envoyer le lien',
      defaultValue: 'Envoyer le lien',
    },
    {
      key: 'submitBtnIcon',
      label: 'Icône du bouton',
      type: 'icon',
      defaultValue: '',
    },
    {
      key: 'separatorLinks',
      label: 'Liens',
      type: 'separator',
    },
    {
      key: 'backToLoginText',
      label: 'Texte retour connexion',
      type: 'text',
      placeholder: 'Retour à la connexion',
      defaultValue: 'Retour à la connexion',
    },
  ],
}
