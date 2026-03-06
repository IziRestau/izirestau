import type { ThemeSectionDef } from '../../../_types'

export const contactFormSection: ThemeSectionDef = {
  id: 'form',
  label: 'Formulaire de contact',
  description: 'Le formulaire que les visiteurs peuvent remplir',
  fields: [
    {
      key: 'enabled',
      label: 'Activer le formulaire',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'title',
      label: 'Titre du formulaire',
      type: 'text',
      placeholder: 'Envoyez-nous un message',
      defaultValue: 'Envoyez-nous un message',
    },
    {
      key: 'style',
      label: 'Style du formulaire',
      type: 'select',
      defaultValue: 'card',
      options: [
        { value: 'card', label: 'Dans une carte' },
        { value: 'flat', label: 'Sans bordure' },
      ],
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showPhoneField',
      label: 'Champ téléphone',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'showSubjectField',
      label: 'Champ sujet',
      type: 'switch',
      defaultValue: true,
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'submitBtnText',
      label: 'Texte du bouton d\'envoi',
      type: 'text',
      placeholder: 'Envoyer le message',
      defaultValue: 'Envoyer le message',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'submitBtnIcon',
      label: 'Icone du bouton d\'envoi',
      type: 'icon',
      description: 'Icone affichée dans le bouton (par défaut : Send)',
      showWhen: { field: 'enabled', value: true },
    },
    {
      key: 'successMessage',
      label: 'Message de confirmation',
      type: 'textarea',
      placeholder: 'Merci pour votre message. Nous vous répondrons dans les plus brefs délais.',
      defaultValue: 'Merci pour votre message. Nous vous répondrons dans les plus brefs délais.',
      showWhen: { field: 'enabled', value: true },
    },
  ],
}
