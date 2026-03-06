import type { ThemeSectionDef } from '../../../_types'

export const formSection: ThemeSectionDef = {
  id: 'form',
  label: 'Formulaire de contact',
  description: 'Formulaire avec nom, email, sujet et message',
  fields: [
    {
      key: 'enabled',
      label: 'Activer la section',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'title',
      label: 'Titre du formulaire',
      type: 'text',
      placeholder: 'Envoyez-nous un message',
      defaultValue: 'Envoyez-nous un message',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'submitText',
      label: 'Texte du bouton d\'envoi',
      type: 'text',
      placeholder: 'Envoyer',
      defaultValue: 'Envoyer',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'submitBtnIcon',
      label: 'Icone du bouton',
      type: 'icon',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showSubject',
      label: 'Afficher le champ sujet',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'successMessage',
      label: 'Message de succès',
      type: 'text',
      placeholder: 'Votre message a été envoyé avec succès !',
      defaultValue: 'Votre message a été envoyé avec succès !',
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
