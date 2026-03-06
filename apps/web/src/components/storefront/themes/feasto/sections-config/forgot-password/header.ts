import type { ThemeSectionDef } from '../../../_types'

export const headerSection: ThemeSectionDef = {
  id: 'header',
  label: 'En-tête',
  description: "En-tête de la page mot de passe oublié",
  fields: [
    {
      key: 'enabled',
      label: 'Activer',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'title',
      label: 'Titre',
      type: 'text',
      defaultValue: 'Mot de passe oublié',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'subtitle',
      label: 'Sous-titre',
      type: 'text',
      defaultValue: 'Entrez votre email pour réinitialiser votre mot de passe',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showBackLink',
      label: 'Afficher le lien retour',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'backLinkText',
      label: 'Texte du lien retour',
      type: 'text',
      defaultValue: 'Retour à la connexion',
      showWhen: { field: 'showBackLink', value: true },
    },
  ],
}
