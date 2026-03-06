'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData } from '../../../_types'

interface ContactFormSectionProps {
  theme: StoreThemeData
  subdomain: string
  sectionData?: Record<string, unknown>
}

export function ContactFormSection({
  theme,
  subdomain: _subdomain,
  sectionData,
}: ContactFormSectionProps) {
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  if (s('enabled', true) === false) return null

  const formStyle = (s('style', 'card') as string)
  const title = (s('title', 'Envoyez-nous un message') as string)
  const showPhoneField = s('showPhoneField', true) !== false
  const showSubjectField = s('showSubjectField', true) !== false
  const submitBtnText = (s('submitBtnText', 'Envoyer le message') as string)
  const successMessage = (s('successMessage', 'Merci pour votre message. Nous vous répondrons dans les plus brefs délais.') as string)
  const SubmitIcon = getIconComponent(s('submitBtnIcon', '') as string) || Send

  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  const contactMutation = useMutation({
    mutationFn: async (_data: typeof formData) => {
      await new Promise(resolve => setTimeout(resolve, 800))
    },
    onSuccess: () => {
      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return
    contactMutation.mutate(formData)
  }

  const inputStyle = {
    borderColor: `${theme.textColor}15`,
    color: theme.textColor,
    backgroundColor: theme.backgroundColor,
    '--tw-ring-color': `${theme.primaryColor}40`,
  } as React.CSSProperties

  const wrapperClass = formStyle === 'card'
    ? 'rounded-2xl border p-6 sm:p-8'
    : ''

  const wrapperStyle = formStyle === 'card'
    ? { borderColor: `${theme.textColor}10` }
    : {}

  if (submitted) {
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        <div className="text-center py-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${theme.primaryColor}15` }}
          >
            <Send size={22} style={{ color: theme.primaryColor }} />
          </div>
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
          >
            Message envoyé
          </h3>
          <p className="text-sm mt-2 opacity-60" style={{ color: theme.textColor }}>
            {successMessage}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className={`mt-6 px-6 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 ${btnClass}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            Envoyer un autre message
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <h3
          className="text-lg font-semibold mb-1"
          style={{ fontFamily: `'${theme.headingFont}', sans-serif`, color: theme.textColor }}
        >
          {title}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
              Nom *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={inputStyle}
              placeholder="votre@email.com"
            />
          </div>
        </div>

        {(showPhoneField || showSubjectField) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showPhoneField && (
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder="Votre numéro"
                />
              </div>
            )}
            {showSubjectField && (
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
                  Sujet
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                  style={inputStyle}
                  placeholder="Sujet du message"
                />
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.textColor }}>
            Message *
          </label>
          <textarea
            value={formData.message}
            onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
            required
            rows={5}
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2"
            style={inputStyle}
            placeholder="Votre message..."
          />
        </div>

        <button
          type="submit"
          disabled={contactMutation.isPending}
          className={`w-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 ${btnClass}`}
          style={{ backgroundColor: theme.primaryColor }}
        >
          {contactMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <SubmitIcon size={14} />
          )}
          {submitBtnText}
        </button>
      </form>
    </div>
  )
}
