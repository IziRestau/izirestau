import type { ThemeSectionDef } from '../../../_types'

export const loginFormSection: ThemeSectionDef = {
  id: 'login-form',
  label: 'Formulaire de connexion',
  description: 'Zone principale avec le formulaire de connexion',
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
      placeholder: 'Connectez-vous',
      defaultValue: 'Connectez-vous',
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      placeholder: 'Accédez à votre espace client',
      defaultValue: 'Accédez à votre espace client',
    },
    {
      key: 'separatorForm',
      label: 'Options du formulaire',
      type: 'separator',
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
      key: 'separatorButton',
      label: 'Bouton de soumission',
      type: 'separator',
    },
    {
      key: 'submitBtnText',
      label: 'Texte du bouton',
      type: 'text',
      placeholder: 'Se connecter',
      defaultValue: 'Se connecter',
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
      key: 'showRegisterLink',
      label: 'Lien vers inscription',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'registerLinkText',
      label: 'Texte du lien inscription',
      type: 'text',
      placeholder: 'Pas encore de compte ? Inscrivez-vous',
      defaultValue: 'Pas encore de compte ? Inscrivez-vous',
      showWhen: { field: 'showRegisterLink', value: true },
    },
    {
      key: 'showGuestCheckout',
      label: 'Lien vers commande en invité',
      type: 'switch',
      defaultValue: false,
    },
    {
      key: 'guestCheckoutText',
      label: 'Texte du lien invité',
      type: 'text',
      placeholder: 'Commander sans compte',
      defaultValue: 'Commander sans compte',
      showWhen: { field: 'showGuestCheckout', value: true },
    },
  ],
}
